/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {select, Store} from "@ngrx/store";
import {MatTableDataSource} from "@angular/material/table";
import {SearchField} from "../../data/search-field";
import {MatSort} from "@angular/material/sort";
import {MatPaginator} from "@angular/material/paginator";
import {FieldState} from "../../store/states/field.state";
import {selectFields} from "../../store/selectors/field.selectors";
import {EditFieldAction} from "../../store/actions/field.actions";

@Component({
  selector: 'app-field-list',
  templateUrl: './field-list.component.html',
  styleUrls: ['./field-list.component.css'],
  standalone: false
})
export class FieldListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;

  private _tableColumns = [
    {
      columnLabel: 'Field ID',
      valueProperty: 'fieldId',
      width: ''
    },
    {
      columnLabel: 'Name',
      valueProperty: 'name'
    },
    {
      columnLabel: 'Type',
      valueProperty: 'fieldType'
    },
  ];

  public dataSource: MatTableDataSource<SearchField>;

  constructor(public store: Store<FieldState>) {
  }

  ngAfterViewInit(): void {

    this.paginator.page.subscribe()
  }

  ngOnInit(): void {
    this.store.pipe(select(selectFields)).subscribe(fields => this.initializeData(fields));
  }


  get tableColumns() {
    return this._tableColumns;
  }

  get displayedColumns() {
    const displayColumns = [];
    this.tableColumns.forEach(element => displayColumns.push(element.valueProperty));
    return displayColumns;
  }

  private initializeData(page: SearchField[]): void {
    this.dataSource = new MatTableDataSource(page);
  }

  onEdit(row: SearchField) {
    this.store.dispatch(new EditFieldAction(row.fieldId));
  }
}
