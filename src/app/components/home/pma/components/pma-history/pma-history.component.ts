/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component} from '@angular/core';
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
import {compareValues, countTree, filterTree, sortTree} from '../../../../common/tree-table.utils';

const COLUMN_WIDTHS_KEY = 'minerva.pmaHistory.columnWidths';


interface PmaHistoryRowView {
  /** Unique across periods: row ids repeat in each period's tree */
  key: string;
  name: string;
  pmaExportRow?: PmaHistoryRow;
  children?: PmaHistoryRowView[];
}


interface ExampleFlatNode {
  key: string;
  expandable: boolean;
  name: string;
  pmaExportRow?: PmaHistoryRow;
  level: number;
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
  /** Rows the user collapsed by hand (by row key); kept across sort/filter */
  private collapsedKeys = new Set<string>();

  filterText = '';
  sort: Sort = {active: '', direction: ''};
  totalRows = 0;
  visibleRows = 0;


  /** Metrics shown once for the portfolio and once for the benchmark */
  readonly metrics = [
    {key: 'bmv', label: 'BMV', field: 'CompositeBeginMV', format: '.3-3', signed: false},
    {key: 'emv', label: 'EMV', field: 'CompositeEndMV', format: '.3-3', signed: false},
    {key: 'bodInflow', label: 'BOD Inflow', field: 'CompositeBODInflow', format: '.3-3', signed: false},
    {key: 'bodOutflow', label: 'BOD Outflow', field: 'CompositeBODOutflow', format: '.3-3', signed: false},
    {key: 'weight', label: 'Weight', field: 'CompositeBeginWeight', format: '.3-3', signed: false},
    {key: 'return', label: 'Return', field: 'BaseTotalRor', format: '.3-5', signed: true}
  ];

  readonly groupColumns = ['group-info', 'group-account', 'group-benchmark'];

  readonly displayedColumns: string[] = [
    'name', 'startDate', 'endDate',
    ...this.metrics.map(m => 'account-' + m.key),
    ...this.metrics.map(m => 'benchmark-' + m.key)
  ];

  loading = false;

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
      const width = m.key === 'weight' ? 70 : m.key === 'return' ? 84 : 125;
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

  constructor(private pmaExportService: PmaExportService, private formBuilder: FormBuilder) {
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
    this.applyView();
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

  onFilterChange(text: string) {
    this.filterText = text;
    this.applyView();
  }

  clearFilter() {
    this.onFilterChange('');
  }

  /** Rebuilds the visible tree from the source using the current filter and sort. */
  private applyView() {
    if (!this.dataSource) {
      return;
    }
    let tree = this.sourceTree;

    const filter = this.filterText.trim().toLowerCase();
    if (filter) {
      tree = filterTree(tree, n => (n.name ?? '').toLowerCase().includes(filter));
    }

    const {active, direction} = this.sort;
    if (active && direction) {
      tree = sortTree(tree, (a, b) => compareValues(this.sortValue(a, active), this.sortValue(b, active), direction));
    }

    this.visibleRows = countTree(tree);
    this.dataSource.data = tree;
    // Setting data fills treeControl.dataNodes. Expand everything except rows
    // the user collapsed; while filtering, expand all so matches are visible.
    for (const node of this.treeControl.dataNodes) {
      if (filter || !this.collapsedKeys.has(node.key)) {
        this.treeControl.expand(node);
      }
    }
  }

  private sortValue(node: PmaHistoryRowView, column: string): string | number {
    const row = node.pmaExportRow as any;
    switch (column) {
      case 'name':
        return node.name;
      case 'startDate':
      case 'endDate':
        // ISO date strings sort correctly as text
        return row?.[column] == null ? null : String(row[column]);
    }
    // Metric columns are 'account-<key>' / 'benchmark-<key>'
    const [group, key] = column.split('-');
    const metric = this.metrics.find(m => m.key === key);
    const values = group === 'account' ? row?.accountValues : row?.benchmarkValues;
    return metric ? values?.[metric.field] : null;
  }


}
