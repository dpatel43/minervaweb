/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Input, OnInit} from '@angular/core';
import {Field} from "../../../data/field";

@Component({
  selector: 'app-time-field',
  templateUrl: './time-field.component.html',
  styleUrls: ['./time-field.component.css'],
  standalone: false
})
export class TimeFieldComponent implements OnInit {

  _field: Field;
  _selectedDomain: string = '';

  constructor() {
  }

  ngOnInit(): void {
  }

  get field() {
    return this._field;
  }

  @Input('field') set field(field: Field) {
    this._field = field;
    this.selectedDomain = this.field.fieldProperties['DOMAIN']
  }

  get selectedDomain() {
    return this._selectedDomain
  }

  set selectedDomain(value: string) {
    this._selectedDomain = value
  }

  onDomainChange(domain: string) {
    this._selectedDomain = domain
  }

  updateBegin(checked: boolean) {
    console.log(checked)
    this.field.fieldProperties['BEGIN'] = checked ? "Y" : "N"
  }
}
