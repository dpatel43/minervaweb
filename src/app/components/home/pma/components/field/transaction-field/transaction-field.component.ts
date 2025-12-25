/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Input, OnInit} from '@angular/core';
import {Field} from "../../../data/field";
import {DataSource} from "@angular/cdk/collections";
import {BehaviorSubject, Observable} from "rxjs";

@Component({
  selector: 'app-transaction-field',
  templateUrl: './transaction-field.component.html',
  styleUrls: ['./transaction-field.component.css'],
  standalone: false
})
export class TransactionFieldComponent implements OnInit {
  displayedColumns = ['parameter', 'operator'];
  dataSource = new ExampleDataSource(initialData);
  _field: Field;

  constructor() {
  }

  ngOnInit(): void {
  }

  get field() {
    return this._field;
  }

  @Input('field') set field(field: Field) {
    this._field = field;
  }
}


export interface Element {
  parameter: string;
  operator: string;
  comment?: string;
}

const initialData: Element[] = [
  {parameter: 'Hydrogen', operator: 'H'},
  {parameter: 'Helium', operator: 'He'},
  {parameter: 'Lithium', operator: 'Li'},
  {parameter: 'Beryllium', operator: 'Be'},
  {parameter: 'Boron', operator: 'B'},
  {parameter: 'Carbon', operator: 'C'},
  {parameter: 'Nitrogen', operator: 'N'},
  {parameter: 'Oxygen', operator: 'O'},
  {parameter: 'Fluorine', operator: 'F'},
  {parameter: 'Neon', operator: 'Ne'},
  {parameter: 'Sodium', operator: 'Na'},
  {parameter: 'Magnesium', operator: 'Mg'},
  {parameter: 'Aluminum', operator: 'Al'},
  {parameter: 'Silicon', operator: 'Si'},
  {parameter: 'Phosphorus', operator: 'P'},
  {parameter: 'Sulfur', operator: 'S'},
  {parameter: 'Chlorine', operator: 'Cl'},
  {parameter: 'Argon', operator: 'Ar'},
  {parameter: 'Potassium', operator: 'K'},
  {parameter: 'Calcium', operator: 'Ca'},
];

/**
 * Data source to provide what data should be rendered in the table. The observable provided
 * in connect should emit exactly the data that should be rendered by the table. If the data is
 * altered, the observable should emit that new set of data on the stream. In our case here,
 * we return a stream that contains only one set of data that doesn't change.
 */
export class ExampleDataSource extends DataSource<any> {

  private dataSubject = new BehaviorSubject<Element[]>([]);

  data() {
    return this.dataSubject.value;
  }

  update(data) {
    this.dataSubject.next(data);
  }

  constructor(data: any[]) {
    super();
    this.dataSubject.next(data);
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Element[]> {
    return this.dataSubject;
  }

  disconnect() {
  }
}
