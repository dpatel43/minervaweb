/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {TableColumnInfo} from './table-column-info';
import {MinervaDataSource} from '../minerva-data-source';
import {Page} from '../../../models/page';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';

@Component({
  selector: 'app-minerva-table',
  templateUrl: './minerva-table.component.html',
  styleUrls: ['./minerva-table.component.scss'],
  standalone: false
})
export class MinervaTableComponent<T> implements OnInit, AfterViewInit {

  @Output('onRowClicked') onRowClickedEvent: EventEmitter<T> = new EventEmitter<T>();
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  _tableColumns: TableColumnInfo[];
  _loadFunction: Function;
  _dataSource: MinervaDataSource<Page<T>>;

  constructor() { }

  ngAfterViewInit(): void {

  }

  ngOnInit(): void {
    this._dataSource = new MinervaDataSource<Page<T>>(this.paginator, this.sort, this.loadFunction);
  }

  get displayedColumns() {
    const displayColumns = [];
    this.tableColumns.forEach(element => displayColumns.push(element.valueProperty));
    return displayColumns;
  }

  @Input('tableColumns') set tableColumns(tableColumnInfo: TableColumnInfo[]) {
    this._tableColumns = tableColumnInfo;
  }

  get tableColumns() {
    return this._tableColumns;
  }

  get dataSource() {
    return this._dataSource;
  }

  @Input('loadFunction') set loadFunction(loadFunction: Function) {
    this._loadFunction = loadFunction;
  }

  get loadFunction() {
    return this._loadFunction;
  }

  rowClicked(row: T) {
    this.onRowClickedEvent.emit(row);
  }
}
