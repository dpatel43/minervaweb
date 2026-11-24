/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Inject, LOCALE_ID} from '@angular/core';
import {formatDate} from '@angular/common';
import {formatValue} from '../../../../common/pipes/number-format';
import {AMOUNT_DIGITS, fixedDigits, loadDecimals, saveDecimals} from '../../../../common/decimals-control/decimals-control.component';
import {FormBuilder, FormGroup, UntypedFormControl} from '@angular/forms';
import {PmaHistoryRequest} from '../../data/pma-history/pma-history-request';
import {PmaExportService} from '../../services/pmaexport/pma-export.service';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {PmaHistoryRow} from '../../data/pma-history/pma-history-row';
import {PmaHistoryResponse} from '../../data/pma-history/pma-history-response';
import {FlatTreeControl} from '@angular/cdk/tree';
import {finalize} from 'rxjs/operators';
import {ColumnWidths} from '../../../../common/column-resize.directive';
import {Sort} from '@angular/material/sort';
import {ChartPeriod, findWithParent, ReturnNode} from '../return-charts/pma-return-charts.component';
import {buildRowFilter, compareValues, countTree, FilterContext, filterTreeMatches, sortTree} from '../../../../common/tree-table.utils';
import {
  buildExportFile, downloadBlob, ExportColumn, exportFileName, ExportRequest, exportValues, flattenForExport, isoDate,
  TableExport
} from '../../../../common/table-export/table-export';

const COLUMN_WIDTHS_KEY = 'minerva.pmaHistory.columnWidths';
const SHOW_FILTERS_KEY = 'minerva.pmaHistory.showColumnFilters';
const PERCENT_DECIMALS_KEY = 'minerva.pmaHistory.percentDecimals';


interface PmaHistoryRowView extends FilterContext {
  /** Unique across periods: row ids repeat in each period's tree */
  key: string;
  name: string;
  pmaExportRow?: PmaHistoryRow;
  children?: PmaHistoryRowView[];
}


interface ExampleFlatNode {
  key: string;
  /** Shown only because a descendant matches the column filters */
  filterContext?: boolean;
  expandable: boolean;
  name: string;
  pmaExportRow?: PmaHistoryRow;
  level: number;
}


interface Metric {
  key: string;
  label: string;
  field: string;
  /**
   * Sent in percent by the API; the header says "(%)", the values have no unit. Percent columns
   * show the toolbar's number of decimals, the others AMOUNT_DIGITS.
   */
  percent?: boolean;
}

@Component({
  selector: 'app-pma-history',
  templateUrl: './pma-history.component.html',
  styleUrl: './pma-history.component.css',
  standalone: false
})
export class PmaHistoryComponent {

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level, node => node.expandable);
  dataSource: MatTreeFlatDataSource<any, any>;

  /** Tree as returned by the API; sorting and filtering always start from this */
  private sourceTree: PmaHistoryRowView[] = [];
  /** Tree as shown: source with the current filter and sort applied (what "Current view" exports) */
  private viewTree: PmaHistoryRowView[] = [];
  /** Rows the user collapsed by hand (by row key); kept across sort/filter */
  private collapsedKeys = new Set<string>();

  /**
   * Charts beside the table. Each period has its own tree in the API response;
   * the charts use one tree (shaped like the latest period's) holding every
   * period's portfolio return per row.
   */
  chartTree: ReturnNode[] = [];
  chartPeriods: ChartPeriod[] = [];
  /** Period shown in the segment chart; the latest by default */
  chartPeriod: string = null;
  /** Table row being charted (row key, so one period's copy is highlighted) */
  selectedKey: string = null;
  selectedRow: ReturnNode = null;
  selectedParent: ReturnNode = null;

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


  /** Metrics shown once for the portfolio and once for the benchmark; `percent` ones arrive in percent and say "(%)" in the header */
  readonly metrics: Metric[] = [
    {key: 'bmv', label: 'BMV', field: 'CompositeBeginMV'},
    {key: 'emv', label: 'EMV', field: 'CompositeEndMV'},
    {key: 'bodInflow', label: 'BOD Inflow', field: 'CompositeBODInflow'},
    {key: 'bodOutflow', label: 'BOD Outflow', field: 'CompositeBODOutflow'},
    {key: 'weight', label: 'Weight', field: 'CompositeBeginWeight', percent: true},
    {key: 'return', label: 'Return', field: 'BaseTotalRor', percent: true},
    {key: 'contribution', label: 'Contribution', field: 'CompositeBaseContribution', percent: true}
  ];

  /** Decimals in percent columns and the charts; the toolbar changes it, remembered per browser */
  percentDecimals = loadDecimals(PERCENT_DECIMALS_KEY);

  get percentDigits(): string {
    return fixedDigits(this.percentDecimals);
  }

  /** DecimalPipe digits info of a metric column */
  digitsFor(metric: Metric): string {
    return metric.percent ? this.percentDigits : AMOUNT_DIGITS;
  }

  onPercentDecimalsChange(decimals: number) {
    this.percentDecimals = decimals;
    saveDecimals(PERCENT_DECIMALS_KEY, decimals);
    // Text filters match the displayed numbers, which just changed
    if (this.hasFilters) {
      this.applyView();
    }
  }

  readonly groupColumns = ['group-info', 'group-account', 'group-benchmark'];

  /** Non-metric columns, filtered by text */
  readonly textFilterColumns = [
    {key: 'name', label: 'Name'},
    {key: 'startDate', label: 'Start Date'},
    {key: 'endDate', label: 'End Date'}
  ];

  readonly displayedColumns: string[] = [
    'name', 'startDate', 'endDate',
    ...this.metrics.map(m => 'account-' + m.key),
    ...this.metrics.map(m => 'benchmark-' + m.key)
  ];

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
    const widths: ColumnWidths = {name: 200, startDate: 100, endDate: 100};
    for (const m of this.metrics) {
      const width = m.key === 'weight' || m.key === 'return' ? 84 : m.key === 'contribution' ? 96 : 125;
      widths['account-' + m.key] = width;
      widths['benchmark-' + m.key] = width;
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

  exportForm: FormGroup;

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

  constructor(private pmaExportService: PmaExportService, private formBuilder: FormBuilder,
              @Inject(LOCALE_ID) private locale: string) {
    this.exportForm = this.formBuilder.group({
      account: new UntypedFormControl(),
      profile: new UntypedFormControl(),
      start: new UntypedFormControl(),
      end: new UntypedFormControl(),
      filterSecurities: [false],
      period: new UntypedFormControl()// Initial state of the checkbox
    });
  }

  ngOnInit(): void {
    // this.onSubmit();
  }


  get canRetrieve(): boolean {
    const {account, profile, start, end} = this.exportForm.value;
    return !!account?.id && !!profile?.id && !!start && !!end;
  }

  onSubmit() {
    if (!this.canRetrieve || this.loading) {
      return;
    }
    let calculationRequest = new PmaHistoryRequest();
    calculationRequest.accountId = this.exportForm.value.account.id;
    calculationRequest.profileId = this.exportForm.value.profile.id;
    calculationRequest.benchmarkId = 100009;
    calculationRequest.startDate = this.exportForm.value.start;////new Date("2024-10-10");
    calculationRequest.endDate = this.exportForm.value.end;////new Date("2024-10-10");
    calculationRequest.filterSecurities = this.exportForm.value.filterSecurities;
    calculationRequest.period = this.exportForm.value.period;
    console.log(calculationRequest.endDate);
    this.loading = true;
    this.pmaExportService.runPmaHistory(calculationRequest)
      .pipe(finalize(() => this.loading = false))
      .subscribe((data: PmaHistoryResponse) => {
        this.convertResponse(data);
      }
    );
  }


  private transformer = (node: PmaHistoryRowView, level: number) => {
    return {
      key: node.key,
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

  private convertResponse(pmaExportResponse: PmaHistoryResponse) {
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    let rootTreeView = [];
    const byKey = new Map<string, PmaHistoryRowView>();
    let rowsMap: Map<string, PmaHistoryRow[]> = new Map(Object.entries(pmaExportResponse.exportRows));
    for (const [key, value] of rowsMap.entries()) {
      let map = new Map<number, PmaHistoryRowView>();
      let exportRows = value;
      for (let i = 0; i < exportRows.length; i++) {
        let exportRow = exportRows[i];
        let exportRowView = {
          key: `${key}|${exportRow.id}`,
          name: exportRow.name,
          pmaExportRow: exportRow,
          children: []
        }
        map.set(exportRow.id, exportRowView);
        byKey.set(exportRowView.key, exportRowView);
        if (exportRow.id == 0) {
          rootTreeView.push(exportRowView);
        }
      }
      for (let i = 0; i < exportRows.length; i++) {
        let exportRow = exportRows[i];
        let parentExportRowView = map.get(exportRow.parentId);
        let exportRowView = map.get(exportRow.id);
        if (parentExportRowView != null) {
          parentExportRowView.children.push(exportRowView);
        }
      }
    }
    this.sourceTree = rootTreeView;
    this.totalRows = countTree(this.sourceTree);
    this.collapsedKeys.clear();
    this.buildCharts([...rowsMap.keys()], byKey, rowsMap);
    this.applyView();
  }

  /** Clicking a table row charts that row, with its period selected */
  selectRow(node: ExampleFlatNode) {
    const period = node.key.slice(0, node.key.lastIndexOf('|'));
    this.chartPeriod = period;
    this.selectRowById(node.pmaExportRow?.id, period);
  }

  /** A period picked in the charts moves the table highlight to that period's row */
  onChartPeriodChange(period: string) {
    this.chartPeriod = period;
    this.selectRowById(this.selectedRow?.pmaExportRow?.id, period);
  }

  private selectRowById(id: number, period: string) {
    const found = id == null ? null : findWithParent(this.chartTree, id);
    this.selectedRow = found?.node ?? null;
    this.selectedParent = found?.parent ?? null;
    this.selectedKey = found ? `${period}|${id}` : null;
  }

  private buildCharts(periodKeys: string[], byKey: Map<string, PmaHistoryRowView>,
                      rowsMap: Map<string, PmaHistoryRow[]>) {
    const latest = periodKeys[periodKeys.length - 1];
    const shape = this.sourceTree.find(n => n.key.startsWith(latest + '|')) ?? this.sourceTree[0];
    const build = (n: PmaHistoryRowView): ReturnNode => {
      const id = n.pmaExportRow?.id;
      const accountValues: Record<string, { BaseTotalRor: number }> = {};
      for (const p of periodKeys) {
        accountValues[p] = {BaseTotalRor: (byKey.get(`${p}|${id}`)?.pmaExportRow?.accountValues as any)?.BaseTotalRor};
      }
      return {name: n.name, pmaExportRow: {id, accountValues}, children: (n.children ?? []).map(build)};
    };
    this.chartTree = shape ? [build(shape)] : [];
    this.chartPeriods = this.periodLabels(periodKeys, rowsMap);
    this.chartPeriod = latest ?? null;
    this.selectRowById(shape?.pmaExportRow?.id, latest);
  }

  /**
   * Each period is labelled with its start and end date, taken from its rows (tooltip, segment chart
   * title); the axis shows only the end date. A period whose rows carry no dates is shown by its key.
   */
  private periodLabels(keys: string[], rowsMap: Map<string, PmaHistoryRow[]>): ChartPeriod[] {
    const dates = keys.map(key => {
      const row = (rowsMap.get(key) ?? []).find(r => r.startDate && r.endDate);
      return row ? {start: String(row.startDate), end: String(row.endDate)} : null;
    });
    // Leave the year off the axis when every date is in the same year; the tooltip always has it
    const years = new Set(dates.filter(d => d).map(d => d.end.slice(0, 4)));
    const axisFormat = years.size <= 1 ? 'MMM d' : 'MM/dd/yy';
    const fmt = (d: string, f: string) => formatDate(d, f, this.locale);
    return keys.map((key, i) => {
      const d = dates[i];
      return d
        ? {
          key,
          label: `${fmt(d.start, 'mediumDate')} – ${fmt(d.end, 'mediumDate')}`,
          short: fmt(d.end, axisFormat)
        }
        : {key, label: key};
    });
  }

  toggle(node: ExampleFlatNode) {
    this.treeControl.toggle(node);
    if (this.treeControl.isExpanded(node)) {
      this.collapsedKeys.delete(node.key);
    } else {
      this.collapsedKeys.add(node.key);
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

    const rowFilter = buildRowFilter<PmaHistoryRowView>(this.columnFilters, (n, c) => this.cell(n, c));
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
      if (filter || !this.collapsedKeys.has(node.key)) {
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
      const {account, start, end} = this.exportForm.value;
      const name = exportFileName(
        [table.title, account?.displayValue, `${isoDate(start)} to ${isoDate(end)}`, request.scope === 'view' && this.hasFilters ? 'filtered' : ''],
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
      ...this.textFilterColumns.map(c => ({key: c.key, header: c.label, widthPx: this.columnWidths[c.key]})),
      ...this.metrics.map(m => ({
        key: 'account-' + m.key, header: m.label, group: 'Portfolio', digits: this.digitsFor(m), percent: m.percent, widthPx: this.columnWidths['account-' + m.key]
      })),
      ...this.metrics.map(m => ({
        key: 'benchmark-' + m.key, header: m.label, group: 'Benchmark', digits: this.digitsFor(m), percent: m.percent, widthPx: this.columnWidths['benchmark-' + m.key]
      }))
    ];
    const view = scope === 'view';
    const rows = flattenForExport(
      view ? this.viewTree : this.sourceTree,
      node => exportValues(columns, key => this.cell(node, key).value),
      node => view && !!node.filterContext);

    const {account, profile, start, end, period} = this.exportForm.value;
    const details: [string, string][] = [
      ['Account', account?.displayValue ?? ''],
      ['Profile', profile?.displayValue ?? ''],
      ['Dates', `${isoDate(start)} to ${isoDate(end)}`]
    ];
    if (period) {
      details.push(['Period', period?.displayValue ?? String(period)]);
    }
    details.push(['Rows', view ? this.describeView() : `All data, ${this.totalRows} rows`]);
    details.push(['Exported', formatDate(new Date(), 'yyyy-MM-dd HH:mm', this.locale)]);
    return {title: 'Performance History', details, columns, rows, treeColumn: 'name'};
  }

  /** "Current view, 12 of 132 rows; filters: Name "tech", Portfolio Return ">0"; sorted by Return, descending" */
  private describeView(): string {
    const parts = [`Current view, ${this.visibleRows} of ${this.totalRows} rows`];
    const filters = Object.entries(this.columnFilters)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${this.columnLabel(k)} "${v.trim()}"`);
    if (filters.length) {
      parts.push('filters: ' + filters.join(', '));
    }
    if (this.sort.active && this.sort.direction) {
      parts.push(`sorted by ${this.columnLabel(this.sort.active)}, ${this.sort.direction === 'asc' ? 'ascending' : 'descending'}`);
    }
    return parts.join('; ');
  }

  private columnLabel(column: string): string {
    const text = this.textFilterColumns.find(c => c.key === column);
    if (text) {
      return text.label;
    }
    const [group, key] = column.split('-');
    const metric = this.metrics.find(m => m.key === key);
    return `${group === 'account' ? 'Portfolio' : 'Benchmark'} ${metric?.label ?? key}`;
  }

  private sortValue(node: PmaHistoryRowView, column: string): string | number {
    return this.cell(node, column).value as string | number;
  }

  /**
   * Value (for sorting, numeric filters and export) and the text shown in the cell. Percent
   * metrics are in percentage points, as shown, so a filter of >25 means above 25%.
   */
  private cell(node: PmaHistoryRowView, column: string): { value: unknown; display: string } {
    const row = node.pmaExportRow as any;
    switch (column) {
      case 'name':
        return {value: node.name, display: node.name ?? ''};
      case 'startDate':
      case 'endDate': {
        // ISO date strings sort correctly as text
        const value = row?.[column] == null ? null : String(row[column]);
        return {value, display: value ?? ''};
      }
    }
    // Metric columns are 'account-<key>' / 'benchmark-<key>'
    const [group, key] = column.split('-');
    const metric = this.metrics.find(m => m.key === key);
    const values = group === 'account' ? row?.accountValues : row?.benchmarkValues;
    const value = metric ? values?.[metric.field] : null;
    if (typeof value !== 'number') {
      return {value, display: ''};
    }
    return {value, display: formatValue(value, this.locale, this.digitsFor(metric))};
  }



}
