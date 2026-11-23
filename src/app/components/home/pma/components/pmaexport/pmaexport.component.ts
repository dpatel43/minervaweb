/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Inject, LOCALE_ID, OnInit} from '@angular/core';
import {formatDate} from '@angular/common';
import {formatPercent} from '../../../../common/pipes/percent-value.pipe';
import {MatTreeFlatDataSource, MatTreeFlattener} from "@angular/material/tree";
import {FlatTreeControl} from "@angular/cdk/tree";
import {PmaSummaryExportRequest} from "../../data/pmaexport/pma-summary-export-request";
import {PmaExportService} from "../../services/pmaexport/pma-export.service";
import {PmaSummaryExportRow} from "../../data/pmaexport/pma-summary-export-row";
import {PmaSummaryExportResponse} from "../../data/pmaexport/pma-summary-export-response";
import {UntypedFormControl, UntypedFormGroup} from "@angular/forms";
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
    profile: new UntypedFormControl(),
    end: new UntypedFormControl()
  });


  readonly periods = [
    {key: '1D', label: '1 Day'},
    {key: 'MTD', label: 'Month to Date'},
    {key: '1M', label: 'Last Month'},
    {key: '3M', label: 'Last 3 Months'},
    {key: 'YTD', label: 'Year to Date'},
    {key: 'ITD', label: 'Inception to Date'}
  ];

  displayedColumns: string[] = ['name', ...this.periods.map(p => p.key)];
  loading = false;
  exporting = false;
  exportError = '';

  /** Column widths in px; updated by the resize handles and remembered per browser */
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

  constructor(private pmaExportService: PmaExportService, @Inject(LOCALE_ID) private locale: string) {
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  ngOnInit(): void {
    // this.onSubmit();
  }

  get canRetrieve(): boolean {
    const {account, profile, end} = this.exportForm.value;
    return !!account?.id && !!profile?.id && !!end;
  }

  onSubmit() {
    if (!this.canRetrieve || this.loading) {
      return;
    }
    let calculationRequest = new PmaSummaryExportRequest();
    calculationRequest.accountId = this.exportForm.value.account.id;
    calculationRequest.profileId = this.exportForm.value.profile.id;
    calculationRequest.benchmarkId = this.exportForm.value.account.id;
    calculationRequest.endDate = this.exportForm.value.end;////new Date("2024-10-10");
    console.log(calculationRequest.endDate);
    //calculationRequest.endDate.setHours(0, 0, 0, 0);
    calculationRequest.periods = this.periods.map(p => p.key);

    this.loading = true;
    this.pmaExportService.runPmaSummaryExport(calculationRequest)
      .pipe(finalize(() => this.loading = false))
      .subscribe((data: PmaSummaryExportResponse) => {
        this.convertResponse(data);
        console.log(this.dataSource.data);
      }
    );
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
    const columns: ExportColumn[] = [
      {key: 'name', header: 'Name', widthPx: this.columnWidths['name']},
      ...this.periods.map(p => ({key: p.key, header: p.label, group: 'Return', digits: '.3-3', percent: true, widthPx: this.columnWidths[p.key]}))
    ];
    const view = scope === 'view';
    const rows = flattenForExport(
      view ? this.viewTree : this.sourceTree,
      node => exportValues(columns, key => this.cell(node, key).value),
      node => view && !!node.filterContext);

    const {account, profile, end} = this.exportForm.value;
    const details: [string, string][] = [
      ['Account', account?.displayValue ?? ''],
      ['Profile', profile?.displayValue ?? ''],
      ['As of', isoDate(end)],
      ['Rows', view ? this.describeView() : `All data, ${this.totalRows} rows`],
      ['Exported', formatDate(new Date(), 'yyyy-MM-dd HH:mm', this.locale)]
    ];
    return {title: 'Performance Summary', details, columns, rows, treeColumn: 'name'};
  }

  /** "Current view, 12 of 40 rows; filters: Name "tech"; sorted by Year to Date, descending" */
  private describeView(): string {
    const label = (key: string) => key === 'name' ? 'Name' : this.periods.find(p => p.key === key)?.label ?? key;
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
    // accountValues is typed as a Map but arrives as a plain JSON object
    const value = (node.pmaExportRow?.accountValues as any)?.[column]?.BaseTotalRor;
    return {value, display: formatPercent(value, this.locale, '.3-3')};
  }



}
