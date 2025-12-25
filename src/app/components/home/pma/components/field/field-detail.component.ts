/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnInit} from '@angular/core';
import {select, Store} from "@ngrx/store";
import {FieldState} from "../../store/states/field.state";
import {Field} from "../../data/field";
import {selectField} from "../../store/selectors/field.selectors";
import {SaveFieldAction} from "../../store/actions/field.actions";

@Component({
  selector: 'app-field-detail',
  templateUrl: './field-detail.component.html',
  styleUrls: ['./field-detail.component.css'],
  standalone: false
})
export class FieldDetailComponent implements OnInit {

  private _field: Field;

  constructor(public store: Store<FieldState>) {
  }

  ngOnInit(): void {
    this.store.pipe(select(selectField)).subscribe(field => {
      this.field = JSON.parse(JSON.stringify(field))
    });
  }

  get field() {
    return this._field
  }

  set field(value: Field) {
    if (value != null) {
      this._field = value;
    }
  }

  save() {
    console.log(this.field)
    this.store.dispatch(new SaveFieldAction(this.field));
  }
}
