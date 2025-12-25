/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {AfterViewInit, Component, OnInit} from '@angular/core';
import {select, Store} from "@ngrx/store";
import {SearchField} from "../../data/search-field";
import {FieldState} from "../../store/states/field.state";
import {selectFields} from "../../store/selectors/field.selectors";
import {EditFieldAction} from "../../store/actions/field.actions";
import {ColDef} from "@ag-grid-community/core";

@Component({
  selector: 'app-field-list',
  templateUrl: './field-list.component.html',
  styleUrls: ['./field-list.component.css'],
  standalone: false
})
export class FieldListComponent implements OnInit, AfterViewInit {
  // @ViewChild(MatSort, {static: false}) sort: MatSort;
  // @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  rowData: SearchField[] = [];

  // rowData = [
  //   {make: 'Tesla', model: 'Model Y', price: 64950, electric: true},
  //   {make: 'Ford', model: 'F-Series', price: 33850, electric: false},
  //   {make: 'Toyota', model: 'Corolla', price: 29600, electric: false},
  //   {make: 'Mercedes', model: 'EQA', price: 48890, electric: true},
  //   {make: 'Fiat', model: '500', price: 15774, electric: false},
  //   {make: 'Nissan', model: 'Leaf', price: 28100, electric: true},
  // ];

  // Define your column definitions
  colDefs: ColDef[] = [
    {field: 'fieldId', headerName: 'Id'},
    {field: 'name', headerName: 'Name'},
    {field: 'fieldType', headerName: 'Type'},
  ]

  defaultColDef = {
    flex: 1,
    sortable: true,
    filter: true,
    resizable: true
  };

  constructor(public store: Store<FieldState>) {
  }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.store.pipe(select(selectFields)).subscribe(fields => this.initializeData(fields));
  }

  private initializeData(page: SearchField[]): void {
    this.rowData = page;
  }

  onEdit(row: SearchField) {
    this.store.dispatch(new EditFieldAction(row.fieldId));
  }
}
