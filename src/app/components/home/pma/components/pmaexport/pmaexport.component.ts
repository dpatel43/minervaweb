/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnInit} from '@angular/core';
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
import {compareValues, countTree, filterTree, sortTree} from "../../../../common/tree-table.utils";

const COLUMN_WIDTHS_KEY = 'minerva.pmaExport.columnWidths';

interface PmaExportRowView {
  name: string;
  pmaExportRow?: PmaSummaryExportRow;
  children?: PmaExportRowView[];
}


interface ExampleFlatNode {
  id: number;
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
  /** Rows the user collapsed by hand (by row id); kept across sort/filter */
  private collapsedIds = new Set<number>();

  filterText = '';
  sort: Sort = {active: '', direction: ''};
  totalRows = 0;
  visibleRows = 0;

  constructor(private pmaExportService: PmaExportService) {
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
    this.applyView();
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
      if (filter || !this.collapsedIds.has(node.id)) {
        this.treeControl.expand(node);
      }
    }
  }

  private sortValue(node: PmaExportRowView, column: string): string | number {
    if (column === 'name') {
      return node.name;
    }
    // accountValues is typed as a Map but arrives as a plain JSON object
    return (node.pmaExportRow?.accountValues as any)?.[column]?.BaseTotalRor;
  }


}
