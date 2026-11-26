/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Inject, LOCALE_ID, OnInit} from '@angular/core';
import {formatDate} from '@angular/common';
import {formatValue} from '../../../../common/pipes/number-format';
import {fixedDigits, loadDecimals, saveDecimals} from '../../../../common/decimals-control/decimals-control.component';
import {MatTreeFlatDataSource, MatTreeFlattener} from "@angular/material/tree";
import {FlatTreeControl} from "@angular/cdk/tree";
import {PmaSummaryExportRequest} from "../../data/pmaexport/pma-summary-export-request";
import {PmaExportService} from "../../services/pmaexport/pma-export.service";
import {PmaSummaryExportRow} from "../../data/pmaexport/pma-summary-export-row";
import {PmaSummaryExportResponse} from "../../data/pmaexport/pma-summary-export-response";
import {UntypedFormControl, UntypedFormGroup} from "@angular/forms";
import {AssistantContextService} from '../../../../../services/ai/assistant-context.service';
import {ActivatedRoute} from '@angular/router';

import {finalize} from "rxjs/operators";
import {ColumnWidths} from "../../../../common/column-resize.directive";
import {Sort} from "@angular/material/sort";
import {findWithParent} from '../return-charts/pma-return-charts.component';
import {buildRowFilter, compareValues, countTree, FilterContext, filterTreeMatches, sortTree} from "../../../../common/tree-table.utils";
import {
  buildExportFile, downloadBlob, ExportColumn, exportFileName, ExportRequest, exportValues, flattenForExport, isoDate,
  TableExport
} from '../../../../common/table-export/table-export';

const COLUMN_WIDTHS_KEY = 'minerva.pmaExport.columnWidths';
const SHOW_FILTERS_KEY = 'minerva.pmaExport.showColumnFilters';
const PERCENT_DECIMALS_KEY = 'minerva.pmaExport.percentDecimals';

export interface PmaExportRowView extends FilterContext {
  name: string;
  pmaExportRow?: PmaSummaryExportRow;
  children?: PmaExportRowView[];
}


interface ExampleFlatNode {
  id: number;
  /** Shown only because a descendant matches the column filters */
  filterContext?: boolean;
  expandable: boolean;
  name: string;
  pmaExportRow?: PmaSummaryExportRow;
  level: number;
}


@Component({
  selector: 'app-pmaexport',
  templateUrl: './pmaexport.component.html',
  styleUrls: ['./pmaexport.component.css'],
  standalone: false
})
export class PMAExportComponent implements OnInit {

  exportForm = new UntypedFormGroup({
    account: new UntypedFormControl(),
    /** Optional: with one, each period shows the portfolio's and the benchmark's return */
    benchmark: new UntypedFormControl(),
    profile: new UntypedFormControl(),
    end: new UntypedFormControl(),
    /** Leave out the security rows, so only the segments come back */
    filterSecurities: new UntypedFormControl(false)
  });


  readonly periods = [
    {key: '1D', label: '1 Day'},
    {key: 'MTD', label: 'Month to Date'},
    {key: '1M', label: 'Last Month'},
    {key: '1MP', label: 'Previous Month'},
    {key: 'QTD', label: 'Quarter to Date'},
    {key: '3M', label: 'Last 3 Months'},
    {key: 'YTD', label: 'Year to Date'},
    {key: 'ITD', label: 'Inception to Date'}
  ];

  /** Whether the retrieved data has a benchmark: each period then has a Portfolio and a Benchmark column */
  showBenchmark = false;
  displayedColumns: string[] = this.columnsFor(false);
  /** Period headers above the Portfolio/Benchmark pairs, shown with a benchmark */
  readonly groupColumns = ['group-name', ...this.periods.map(p => 'group-' + p.key)];

  /** A period's benchmark column id */
  benchmarkColumn(periodKey: string): string {
    return 'bench-' + periodKey;
  }

  private columnsFor(benchmark: boolean): string[] {
    const columns = ['name'];
    for (const p of this.periods) {
      columns.push(p.key, ...(benchmark ? [this.benchmarkColumn(p.key)] : []));
    }
    return columns;
  }
  loading = false;
  /** The response's data warnings, shown above the results (app-data-warnings) */
  warnings: string[] = [];
  exporting = false;
  exportError = '';

  /** Column widths in px; updated by the resize handles and remembered per browser */
  /** Decimals in the return columns and the charts; the toolbar changes it, remembered per browser */
  percentDecimals = loadDecimals(PERCENT_DECIMALS_KEY);

  get percentDigits(): string {
    return fixedDigits(this.percentDecimals);
  }

  onPercentDecimalsChange(decimals: number) {
    this.percentDecimals = decimals;
    saveDecimals(PERCENT_DECIMALS_KEY, decimals);
    // Text filters match the displayed numbers, which just changed
    if (this.hasFilters) {
      this.applyView();
    }
  }

  columnWidths: ColumnWidths = this.loadColumnWidths();

  get totalWidth(): number {
    return this.displayedColumns.reduce((sum, c) => sum + (this.columnWidths[c] ?? 0), 0);
  }

  saveColumnWidths() {
    try {
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(this.columnWidths));
    } catch {
      // storage unavailable (private mode etc.): widths just won't persist
    }
  }

  private loadColumnWidths(): ColumnWidths {
    const widths: ColumnWidths = {name: 240};
    for (const p of this.periods) {
      widths[p.key] = 120;
      widths[this.benchmarkColumn(p.key)] = 100;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(COLUMN_WIDTHS_KEY) ?? '{}');
      for (const key of Object.keys(widths)) {
        if (typeof saved[key] === 'number' && saved[key] > 0) {
          widths[key] = saved[key];
        }
      }
    } catch {
      // ignore unreadable saved widths
    }
    return widths;
  }
  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level, node => node.expandable);
  dataSource: MatTreeFlatDataSource<any, any>;

  /** Tree as returned by the API; sorting and filtering always start from this */
  private sourceTree: PmaExportRowView[] = [];
  /** Tree as shown: source with the current filter and sort applied (what "Current view" exports) */
  private viewTree: PmaExportRowView[] = [];
  /** Rows the user collapsed by hand (by row id); kept across sort/filter */
  private collapsedIds = new Set<number>();

  /** Row charted beside the table (by row id; the root by default) */
  selectedRowId: number = null;
  selectedRow: PmaExportRowView = null;
  selectedParent: PmaExportRowView = null;
  /** Period shown in the segment chart */
  chartPeriod = 'YTD';

  /** Text of each column's filter box, by column id */
  columnFilters: Record<string, string> = {};

  /** Code flag: false removes the Filters button and the filter row entirely */
  readonly columnFiltersEnabled = true;
  /** Whether the filter row shows on a user's first visit (afterwards their choice is remembered) */
  readonly columnFiltersVisibleByDefault = false;
  /** Filter row currently shown; toggled by the Filters button */
  filtersVisible = this.columnFiltersEnabled && this.loadFiltersVisible();
  sort: Sort = {active: '', direction: ''};
  totalRows = 0;
  visibleRows = 0;

  /** Ids of the filter row's cells, one per displayed column */
  get filterColumns(): string[] {
    return this.displayedColumns.map(c => 'filter-' + c);
  }

  get hasFilters(): boolean {
    return Object.values(this.columnFilters).some(v => !!v?.trim());
  }

  get activeFilterCount(): number {
    return Object.values(this.columnFilters).filter(v => !!v?.trim()).length;
  }

  /** This screen's tab, for sharing its selection with the app-level AI assistant */
  private readonly tabUrl: string;

  constructor(private pmaExportService: PmaExportService, @Inject(LOCALE_ID) private locale: string,
              private assistant: AssistantContextService, route: ActivatedRoute) {
    this.tabUrl = AssistantContextService.tabUrlOf(route);
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  ngOnInit(): void {
    // this.onSubmit();
  }

  get canRetrieve(): boolean {
    const {account, profile, end} = this.exportForm.value;
    return !!account?.id && !!profile?.id && !!end;
  }

  /** The account can't be its own benchmark */
  get sameAccount(): boolean {
    const {account, benchmark} = this.exportForm.value;
    return !!account?.id && account.id === benchmark?.id;
  }

  onSubmit() {
    if (!this.canRetrieve || this.sameAccount || this.loading) {
      return;
    }
    let calculationRequest = new PmaSummaryExportRequest();
    calculationRequest.accountId = this.exportForm.value.account.id;
    calculationRequest.profileId = this.exportForm.value.profile.id;
    const benchmark = this.exportForm.value.benchmark;
    calculationRequest.benchmarkId = benchmark?.id ?? 0;
    calculationRequest.endDate = this.exportForm.value.end;////new Date("2024-10-10");
    console.log(calculationRequest.endDate);
    //calculationRequest.endDate.setHours(0, 0, 0, 0);
    calculationRequest.periods = this.periods.map(p => p.key);
    calculationRequest.filterSecurities = !!this.exportForm.value.filterSecurities;

    this.loading = true;
    this.warnings = [];
    this.pmaExportService.runPmaSummaryExport(calculationRequest)
      .pipe(finalize(() => this.loading = false))
      .subscribe((data: PmaSummaryExportResponse) => {
        this.warnings = data.warnings ?? [];
        this.setBenchmarkShown(!!benchmark?.id);
        this.convertResponse(data);
        this.assistant.publish('summary', {
          accountId: this.exportForm.value.account.id, benchmarkId: benchmark?.id, profileId: this.exportForm.value.profile.id,
          endDate: formatDate(this.exportForm.value.end, 'yyyy-MM-dd', this.locale)
        }, this.tabUrl);
        console.log(this.dataSource.data);
      }
    );
  }

  /** Shows or hides the Benchmark columns; their filters and sort go with them */
  setBenchmarkShown(shown: boolean) {
    this.showBenchmark = shown;
    this.displayedColumns = this.columnsFor(shown);
    if (!shown) {
      const filters = {...this.columnFilters};
      this.periods.forEach(p => delete filters[this.benchmarkColumn(p.key)]);
      this.columnFilters = filters;
      if (this.sort.active.startsWith('bench-')) {
        this.sort = {active: '', direction: ''};
      }
    }
  }

  private transformer = (node: PmaExportRowView, level: number) => {
    return {
      id: node.pmaExportRow?.id,
      filterContext: !!node.filterContext,
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      pmaExportRow: node.pmaExportRow,
      level: level,
    };
  }

  treeFlattener = new MatTreeFlattener(
    this.transformer, node => node.level,
    node => node.expandable, node => node.children);

  private convertResponse(pmaExportResponse: PmaSummaryExportResponse) {
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    let map = new Map<number, PmaExportRowView>();
    let rootTreeView = null;
    for (let i = 0; i < pmaExportResponse.exportRows.length; i++) {
      let exportRow = pmaExportResponse.exportRows[i];
      let exportRowView = {
        name: exportRow.name,
        pmaExportRow: exportRow,
        children: []
      }
      map.set(exportRow.id, exportRowView);
      if (exportRow.id == 0) {
        rootTreeView = exportRowView;
      }
    }

    for (let i = 0; i < pmaExportResponse.exportRows.length; i++) {
      let exportRow = pmaExportResponse.exportRows[i];
      let parentExportRowView = map.get(exportRow.parentId);
      let exportRowView = map.get(exportRow.id);
      if (parentExportRowView != null) {
        parentExportRowView.children.push(exportRowView);
      }
    }

    this.sourceTree = rootTreeView ? [rootTreeView] : [];
    this.totalRows = countTree(this.sourceTree);
    this.collapsedIds.clear();
    this.selectRowById(this.sourceTree[0]?.pmaExportRow?.id ?? null);
    this.applyView();
  }

  /** Clicking a table row charts it */
  selectRow(node: ExampleFlatNode) {
    this.selectRowById(node.id);
  }

  private selectRowById(id: number) {
    const found = findWithParent(this.sourceTree, id);
    this.selectedRowId = found ? id : null;
    this.selectedRow = found?.node ?? null;
    this.selectedParent = found?.parent ?? null;
  }

  toggle(node: ExampleFlatNode) {
    this.treeControl.toggle(node);
    if (this.treeControl.isExpanded(node)) {
      this.collapsedIds.delete(node.id);
    } else {
      this.collapsedIds.add(node.id);
    }
  }

  onSortChange(sort: Sort) {
    this.sort = sort;
    this.applyView();
  }

  onFilterChange(column: string, text: string) {
    this.columnFilters = {...this.columnFilters, [column]: text};
    this.applyView();
  }

  clearFilters() {
    this.columnFilters = {};
    this.applyView();
  }

  toggleFilters() {
    this.filtersVisible = !this.filtersVisible;
    if (!this.filtersVisible && this.hasFilters) {
      // Don't leave rows hidden by filters the user can no longer see
      this.clearFilters();
    }
    try {
      localStorage.setItem(SHOW_FILTERS_KEY, String(this.filtersVisible));
    } catch {
      // storage unavailable: the choice just won't be remembered
    }
  }

  private loadFiltersVisible(): boolean {
    try {
      const saved = localStorage.getItem(SHOW_FILTERS_KEY);
      return saved === null ? this.columnFiltersVisibleByDefault : saved === 'true';
    } catch {
      return this.columnFiltersVisibleByDefault;
    }
  }

  /** Rebuilds the visible tree from the source using the current filter and sort. */
  private applyView() {
    if (!this.dataSource) {
      return;
    }
    let tree = this.sourceTree;

    const rowFilter = buildRowFilter<PmaExportRowView>(this.columnFilters, (n, c) => this.cell(n, c));
    const filter = !!rowFilter;
    if (rowFilter) {
      tree = filterTreeMatches(tree, rowFilter);
    }

    const {active, direction} = this.sort;
    if (active && direction) {
      tree = sortTree(tree, (a, b) => compareValues(this.sortValue(a, active), this.sortValue(b, active), direction));
    }

    this.visibleRows = countTree(tree);
    this.viewTree = tree;
    this.dataSource.data = tree;
    // Setting data fills treeControl.dataNodes. Expand everything except rows
    // the user collapsed; while filtering, expand all so matches are visible.
    for (const node of this.treeControl.dataNodes) {
      if (filter || !this.collapsedIds.has(node.id)) {
        this.treeControl.expand(node);
      }
    }
  }

  /** Note under "Current view" in the export menu */
  get exportViewNote(): string {
    return this.hasFilters ? `${this.visibleRows} of ${this.totalRows} rows, sorted as shown` : '';
  }

  async onExport(request: ExportRequest) {
    if (!this.dataSource || this.exporting) {
      return;
    }
    this.exporting = true;
    this.exportError = '';
    try {
      const table = this.buildExport(request);
      const {account, end} = this.exportForm.value;
      const name = exportFileName(
        [table.title, account?.displayValue, isoDate(end), request.scope === 'view' && this.hasFilters ? 'filtered' : ''],
        request.format);
      downloadBlob(await buildExportFile(table, request.format), name);
    } catch (e) {
      console.error('Export failed', e);
      this.exportError = 'Export failed. Please try again.';
    } finally {
      this.exporting = false;
    }
  }

  /** The table as an export: all columns, with rows from the current view or from everything retrieved. */
  buildExport({scope}: ExportRequest): TableExport {
    const percentColumn = (key: string, header: string, group: string): ExportColumn =>
      ({key, header, group, digits: this.percentDigits, percent: true, widthPx: this.columnWidths[key]});
    const columns: ExportColumn[] = [
      {key: 'name', header: 'Name', widthPx: this.columnWidths['name']},
      // (no flatMap: the app's TypeScript lib predates ES2019)
      ...([] as ExportColumn[]).concat(...this.periods.map(p => this.showBenchmark
        ? [percentColumn(p.key, 'Portfolio', p.label), percentColumn(this.benchmarkColumn(p.key), 'Benchmark', p.label)]
        : [percentColumn(p.key, p.label, 'Return')]))
    ];
    const view = scope === 'view';
    const rows = flattenForExport(
      view ? this.viewTree : this.sourceTree,
      node => exportValues(columns, key => this.cell(node, key).value),
      node => view && !!node.filterContext);

    const {account, benchmark, profile, end} = this.exportForm.value;
    const details: [string, string][] = [
      ['Account', account?.displayValue ?? ''],
      ['Benchmark', this.showBenchmark ? benchmark?.displayValue ?? '' : 'None'],
      ['Profile', profile?.displayValue ?? ''],
      ['As of', isoDate(end)],
      ['Rows', view ? this.describeView() : `All data, ${this.totalRows} rows`],
      ['Exported', formatDate(new Date(), 'yyyy-MM-dd HH:mm', this.locale)]
    ];
    return {title: 'Performance Summary', details, columns, rows, treeColumn: 'name'};
  }

  /** "Current view, 12 of 40 rows; filters: Name "tech"; sorted by Year to Date, descending" */
  private describeView(): string {
    const label = (key: string) => {
      if (key === 'name') {
        return 'Name';
      }
      const benchmark = key.startsWith('bench-');
      const period = this.periods.find(p => p.key === (benchmark ? key.slice('bench-'.length) : key))?.label ?? key;
      return this.showBenchmark ? `${period} ${benchmark ? 'Benchmark' : 'Portfolio'}` : period;
    };
    const parts = [`Current view, ${this.visibleRows} of ${this.totalRows} rows`];
    const filters = Object.entries(this.columnFilters)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${label(k)} "${v.trim()}"`);
    if (filters.length) {
      parts.push('filters: ' + filters.join(', '));
    }
    if (this.sort.active && this.sort.direction) {
      parts.push(`sorted by ${label(this.sort.active)}, ${this.sort.direction === 'asc' ? 'ascending' : 'descending'}`);
    }
    return parts.join('; ');
  }

  private sortValue(node: PmaExportRowView, column: string): string | number {
    return this.cell(node, column).value as string | number;
  }

  /** Value in percentage points (for sorting, numeric filters and export) and the text shown in the cell. */
  private cell(node: PmaExportRowView, column: string): { value: unknown; display: string } {
    if (column === 'name') {
      return {value: node.name, display: node.name ?? ''};
    }
    // The values are typed as Maps but arrive as plain JSON objects, keyed by period
    const benchmark = column.startsWith('bench-');
    const values = (benchmark ? node.pmaExportRow?.benchmarkValues : node.pmaExportRow?.accountValues) as any;
    const value = values?.[benchmark ? column.slice('bench-'.length) : column]?.BaseTotalRor;
    return {value, display: formatValue(value, this.locale, this.percentDigits)};
  }



}
