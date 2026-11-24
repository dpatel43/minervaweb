/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Inject, LOCALE_ID} from '@angular/core';
import {formatDate} from '@angular/common';
import {FormBuilder, FormGroup, UntypedFormControl} from '@angular/forms';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {FlatTreeControl} from '@angular/cdk/tree';
import {Sort} from '@angular/material/sort';
import {finalize} from 'rxjs/operators';
import {formatValue} from '../../../../common/pipes/number-format';
import {fixedDigits, loadDecimals, saveDecimals} from '../../../../common/decimals-control/decimals-control.component';
import {ColumnWidths} from '../../../../common/column-resize.directive';
import {buildRowFilter, compareValues, countTree, FilterContext, filterTreeMatches, sortTree} from '../../../../common/tree-table.utils';
import {
  buildExportFile, downloadBlob, ExportColumn, exportFileName, ExportRequest, exportValues, flattenForExport, isoDate,
  TableExport
} from '../../../../common/table-export/table-export';
import {PmaExportService} from '../../services/pmaexport/pma-export.service';
import {PmaHistoryRequest} from '../../data/pma-history/pma-history-request';
import {PmaHistoryResponse} from '../../data/pma-history/pma-history-response';
import {PmaHistoryRow} from '../../data/pma-history/pma-history-row';

const COLUMN_WIDTHS_KEY = 'minerva.attribution.columnWidths';
const SHOW_FILTERS_KEY = 'minerva.attribution.showColumnFilters';
const PERCENT_DECIMALS_KEY = 'minerva.attribution.percentDecimals';
/** The PERIOD codes the Period select offers (TBLS_STATICCODE) */
const PERIOD_LABELS: Record<string, string> = {C: 'Cumulative', D: 'Daily', M: 'Monthly', Q: 'Quarterly', Y: 'Yearly'};

interface AttributionRowView extends FilterContext {
  /** Unique across periods: row ids repeat in each period's tree */
  key: string;
  name: string;
  row?: PmaHistoryRow;
  children?: AttributionRowView[];
}

interface FlatNode {
  key: string;
  filterContext?: boolean;
  expandable: boolean;
  name: string;
  row?: PmaHistoryRow;
  level: number;
}

/** A value column: which account's values it reads (the attribution fields are on the portfolio's) and which field */
interface ValueColumn {
  key: string;
  label: string;
  group: string;
  source: 'account' | 'benchmark';
  field: string;
}

/**
 * Brinson-Fachler attribution of an account against a benchmark, by profile segment. The API calculates it at run
 * time when the export request names a benchmark, and sends it on the account's values in percent. Each segment's
 * effects are measured against its parent's benchmark return, so a segment's children add up to its selection +
 * interaction, and the top level to the excess return. Active weight is the average over the period.
 */
@Component({
  selector: 'app-attribution',
  templateUrl: './attribution.component.html',
  styleUrl: './attribution.component.css',
  standalone: false
})
export class AttributionComponent {

  readonly textColumns = [
    {key: 'name', label: 'Name'},
    {key: 'startDate', label: 'Start Date'},
    {key: 'endDate', label: 'End Date'}
  ];

  readonly valueColumns: ValueColumn[] = [
    {key: 'accountReturn', label: 'Portfolio', group: 'Return', source: 'account', field: 'BaseTotalRor'},
    {key: 'benchmarkReturn', label: 'Benchmark', group: 'Return', source: 'benchmark', field: 'BaseTotalRor'},
    {key: 'excessReturn', label: 'Excess', group: 'Return', source: 'account', field: 'ExcessReturn'},
    {key: 'activeWeight', label: 'Active Weight', group: 'Attribution', source: 'account', field: 'ActiveWeight'},
    {key: 'allocation', label: 'Allocation', group: 'Attribution', source: 'account', field: 'AllocationEffect'},
    {key: 'selection', label: 'Selection', group: 'Attribution', source: 'account', field: 'SelectionEffect'},
    {key: 'interaction', label: 'Interaction', group: 'Attribution', source: 'account', field: 'InteractionEffect'},
    {key: 'totalEffect', label: 'Total', group: 'Attribution', source: 'account', field: 'TotalEffect'}
  ];

  /** Column groups of the header row above the titles, in table order */
  readonly groups = [...new Set(this.valueColumns.map(c => c.group))];

  /** Start and End Date only when the report has more than one period; a cumulative one has the same dates on every row */
  showDates = false;
  displayedColumns: string[] = [];
  filterColumns: string[] = [];
  readonly groupColumns = ['group-info', ...this.groups.map(g => 'group-' + g)];

  /** Shown non-value columns: Name, plus the dates when there are several periods */
  get infoColumns() {
    return this.textColumns.filter(c => c.key === 'name' || this.showDates);
  }

  private updateColumns() {
    this.displayedColumns = [...this.infoColumns.map(c => c.key), ...this.valueColumns.map(c => c.key)];
    this.filterColumns = this.displayedColumns.map(c => 'filter-' + c);
  }

  exportForm: FormGroup;

  treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);
  dataSource: MatTreeFlatDataSource<any, any>;

  /** Tree as returned by the API; sorting and filtering always start from this */
  private sourceTree: AttributionRowView[] = [];
  /** Tree as shown (what "Current view" exports) */
  private viewTree: AttributionRowView[] = [];
  /** Rows the user collapsed by hand (by row key); kept across sort/filter */
  private collapsedKeys = new Set<string>();
  /** Every row of the source tree by key, with its parent (null for a period's Total) */
  private nodesByKey = new Map<string, { node: AttributionRowView; parent: AttributionRowView | null }>();

  /** Row charted above the table (by key); the latest period's Total by default */
  selectedKey: string = null;
  selectedNode: AttributionRowView = null;
  selectedParent: AttributionRowView = null;

  columnFilters: Record<string, string> = {};
  readonly columnFiltersEnabled = true;
  readonly columnFiltersVisibleByDefault = false;
  filtersVisible = this.columnFiltersEnabled && this.loadFiltersVisible();
  sort: Sort = {active: '', direction: ''};
  totalRows = 0;
  visibleRows = 0;

  loading = false;
  exporting = false;
  exportError = '';

  percentDecimals = loadDecimals(PERCENT_DECIMALS_KEY);
  columnWidths: ColumnWidths = this.loadColumnWidths();

  constructor(private pmaExportService: PmaExportService, private formBuilder: FormBuilder,
              @Inject(LOCALE_ID) private locale: string) {
    this.exportForm = this.formBuilder.group({
      account: new UntypedFormControl(),
      benchmark: new UntypedFormControl(),
      profile: new UntypedFormControl(),
      start: new UntypedFormControl(),
      end: new UntypedFormControl(),
      period: new UntypedFormControl('C'),
      filterSecurities: [false]
    });
    this.updateColumns();
  }

  get percentDigits(): string {
    return fixedDigits(this.percentDecimals);
  }

  onPercentDecimalsChange(decimals: number) {
    this.percentDecimals = decimals;
    saveDecimals(PERCENT_DECIMALS_KEY, decimals);
    if (this.hasFilters) {
      this.applyView();
    }
  }

  get totalWidth(): number {
    return this.displayedColumns.reduce((sum, c) => sum + (this.columnWidths[c] ?? 0), 0);
  }

  /** The first column of a group draws the group's left border */
  isGroupStart(column: ValueColumn): boolean {
    return this.valueColumns.find(c => c.group === column.group) === column;
  }

  groupSize(group: string): number {
    return this.valueColumns.filter(c => c.group === group).length;
  }

  get hasFilters(): boolean {
    return Object.values(this.columnFilters).some(v => !!v?.trim());
  }

  get activeFilterCount(): number {
    return Object.values(this.columnFilters).filter(v => !!v?.trim()).length;
  }

  get canRetrieve(): boolean {
    const {account, benchmark, profile, start, end} = this.exportForm.value;
    return !!account?.id && !!benchmark?.id && !!profile?.id && !!start && !!end;
  }

  /** The same account on both sides has no attribution to show */
  get sameAccount(): boolean {
    const {account, benchmark} = this.exportForm.value;
    return !!account?.id && account.id === benchmark?.id;
  }

  onSubmit() {
    if (!this.canRetrieve || this.sameAccount || this.loading) {
      return;
    }
    const {account, benchmark, profile, start, end, period, filterSecurities} = this.exportForm.value;
    const request = new PmaHistoryRequest();
    request.accountId = account.id;
    request.benchmarkId = benchmark.id;
    request.profileId = profile.id;
    request.startDate = start;
    request.endDate = end;
    // Cumulative over the dates unless a period is chosen (the API's default too)
    request.period = period || 'C';
    request.filterSecurities = !!filterSecurities;
    this.loading = true;
    this.pmaExportService.runPmaHistory(request)
      .pipe(finalize(() => this.loading = false))
      .subscribe((data: PmaHistoryResponse) => this.convertResponse(data));
  }

  private transformer = (node: AttributionRowView, level: number): FlatNode => ({
    key: node.key,
    filterContext: !!node.filterContext,
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    row: node.row,
    level
  });

  treeFlattener = new MatTreeFlattener(this.transformer, node => node.level, node => node.expandable, node => node.children);

  /** One tree per period end date; the roots (id 0) are listed in period order */
  private convertResponse(response: PmaHistoryResponse) {
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    const roots: AttributionRowView[] = [];
    for (const [period, rows] of Object.entries(response.exportRows ?? {}) as [string, PmaHistoryRow[]][]) {
      const byId = new Map<number, AttributionRowView>();
      for (const row of rows) {
        const view: AttributionRowView = {key: `${period}|${row.id}`, name: row.name, row, children: []};
        byId.set(row.id, view);
        if (row.id == 0) {
          roots.push(view);
        }
      }
      for (const row of rows) {
        byId.get(row.parentId)?.children.push(byId.get(row.id));
      }
    }
    this.sourceTree = roots;
    this.totalRows = countTree(roots);
    this.nodesByKey.clear();
    const index = (node: AttributionRowView, parent: AttributionRowView | null) => {
      this.nodesByKey.set(node.key, {node, parent});
      node.children?.forEach(child => index(child, node));
    };
    roots.forEach(root => index(root, null));
    this.selectByKey(roots[roots.length - 1]?.key ?? null);
    this.showDates = roots.length > 1;
    if (!this.showDates) {
      // Filters and sort on the date columns would act on columns no longer shown
      delete this.columnFilters['startDate'];
      delete this.columnFilters['endDate'];
      if (this.sort.active === 'startDate' || this.sort.active === 'endDate') {
        this.sort = {active: '', direction: ''};
      }
    }
    this.updateColumns();
    this.collapsedKeys.clear();
    this.applyView();
  }

  /** Clicking a table row charts it */
  selectRow(node: FlatNode) {
    this.selectByKey(node.key);
  }

  /** A segment picked in the charts becomes the charted row, highlighted in the table */
  selectByKey(key: string | null) {
    const found = key == null ? null : this.nodesByKey.get(key);
    this.selectedKey = found ? key : null;
    this.selectedNode = found?.node ?? null;
    this.selectedParent = found?.parent ?? null;
  }

  /** The charted row's period, for the chart titles; empty when the report has a single period */
  get chartPeriodLabel(): string {
    const row = this.selectedNode?.row;
    return this.showDates && row?.startDate && row?.endDate ? `${row.startDate} – ${row.endDate}` : '';
  }

  toggle(node: FlatNode) {
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
      this.clearFilters();
    }
    try {
      localStorage.setItem(SHOW_FILTERS_KEY, String(this.filtersVisible));
    } catch {
      // storage unavailable: the choice just won't be remembered
    }
  }

  saveColumnWidths() {
    try {
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(this.columnWidths));
    } catch {
      // storage unavailable: widths just won't persist
    }
  }

  private loadColumnWidths(): ColumnWidths {
    const widths: ColumnWidths = {name: 220, startDate: 100, endDate: 100};
    for (const c of this.valueColumns) {
      widths[c.key] = c.key === 'activeWeight' ? 104 : 92;
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

  private loadFiltersVisible(): boolean {
    try {
      const saved = localStorage.getItem(SHOW_FILTERS_KEY);
      return saved === null ? this.columnFiltersVisibleByDefault : saved === 'true';
    } catch {
      return this.columnFiltersVisibleByDefault;
    }
  }

  private applyView() {
    if (!this.dataSource) {
      return;
    }
    let tree = this.sourceTree;
    const rowFilter = buildRowFilter<AttributionRowView>(this.columnFilters, (n, c) => this.cell(n, c));
    if (rowFilter) {
      tree = filterTreeMatches(tree, rowFilter);
    }
    const {active, direction} = this.sort;
    if (active && direction) {
      tree = sortTree(tree, (a, b) => compareValues(this.cell(a, active).value as any, this.cell(b, active).value as any, direction));
    }
    this.visibleRows = countTree(tree);
    this.viewTree = tree;
    this.dataSource.data = tree;
    for (const node of this.treeControl.dataNodes) {
      if (rowFilter || !this.collapsedKeys.has(node.key)) {
        this.treeControl.expand(node);
      }
    }
  }

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

  buildExport({scope}: ExportRequest): TableExport {
    const columns: ExportColumn[] = [
      ...this.infoColumns.map(c => ({key: c.key, header: c.label, widthPx: this.columnWidths[c.key]})),
      ...this.valueColumns.map(c => ({
        key: c.key, header: c.label, group: c.group, digits: this.percentDigits, percent: true, widthPx: this.columnWidths[c.key]
      }))
    ];
    const view = scope === 'view';
    const rows = flattenForExport(
      view ? this.viewTree : this.sourceTree,
      node => exportValues(columns, key => this.cell(node, key).value),
      node => view && !!node.filterContext);
    const {account, benchmark, profile, start, end, period} = this.exportForm.value;
    const details: [string, string][] = [
      ['Account', account?.displayValue ?? ''],
      ['Benchmark', benchmark?.displayValue ?? ''],
      ['Profile', profile?.displayValue ?? ''],
      ['Dates', `${isoDate(start)} to ${isoDate(end)}`],
      ['Period', PERIOD_LABELS[period || 'C'] ?? String(period)],
      ['Method', 'Brinson-Fachler, each segment against its parent\'s benchmark return; Carino-linked'],
      ['Rows', view ? this.describeView() : `All data, ${this.totalRows} rows`],
      ['Exported', formatDate(new Date(), 'yyyy-MM-dd HH:mm', this.locale)]
    ];
    return {title: 'Performance Attribution', details, columns, rows, treeColumn: 'name'};
  }

  private describeView(): string {
    const label = (key: string) => {
      const text = this.textColumns.find(c => c.key === key);
      const value = this.valueColumns.find(c => c.key === key);
      return text?.label ?? (value ? `${value.group} ${value.label}` : key);
    };
    const parts = [`Current view, ${this.visibleRows} of ${this.totalRows} rows`];
    const filters = Object.entries(this.columnFilters).filter(([, v]) => v?.trim()).map(([k, v]) => `${label(k)} "${v.trim()}"`);
    if (filters.length) {
      parts.push('filters: ' + filters.join(', '));
    }
    if (this.sort.active && this.sort.direction) {
      parts.push(`sorted by ${label(this.sort.active)}, ${this.sort.direction === 'asc' ? 'ascending' : 'descending'}`);
    }
    return parts.join('; ');
  }

  /** A value column's number (in percent, as sent), or null */
  value(row: PmaHistoryRow, column: ValueColumn): number {
    const values = (column.source === 'account' ? row?.accountValues : row?.benchmarkValues) as any;
    const value = values?.[column.field];
    return typeof value === 'number' ? snapZero(value) : null;
  }

  /** Value (for sorting, filters and export) and the text shown in the cell */
  private cell(node: AttributionRowView, column: string): { value: unknown; display: string } {
    const row = node.row as any;
    switch (column) {
      case 'name':
        return {value: node.name, display: node.name ?? ''};
      case 'startDate':
      case 'endDate': {
        const value = row?.[column] == null ? null : String(row[column]);
        return {value, display: value ?? ''};
      }
    }
    const valueColumn = this.valueColumns.find(c => c.key === column);
    const value = valueColumn ? this.value(node.row, valueColumn) : null;
    return {value, display: value == null ? '' : formatValue(value, this.locale, this.percentDigits)};
  }
}

/**
 * A stock held on both sides has the same return in each, so its excess return and selection effect are 0, but
 * arrive as floating-point leftovers (compounding a year of daily returns leaves up to about 1e-8 percentage
 * points), which would show as a red (0.0000). Anything under a millionth of a percentage point is 0.
 */
export function snapZero(v: number): number {
  return Math.abs(v) < 1e-6 ? 0 : v;
}
