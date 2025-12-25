/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnInit, ViewChild} from '@angular/core';
import {select, Store} from "@ngrx/store";
import {FieldState} from "../../store/states/field.state";
import {NewFieldAction, RetrieveFieldsAction} from "../../store/actions/field.actions";
import {selectDetailFlag} from "../../store/selectors/field.selectors";
import {FieldDetailComponent} from "./field-detail.component";

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.css'],
  standalone: false
})
export class FieldComponent implements OnInit {
  @ViewChild(FieldDetailComponent)
  private fieldDetailComponent: FieldDetailComponent;

  private _detail: boolean;

  constructor(public store: Store<FieldState>) {
  }

  ngOnInit(): void {
    this.store.pipe(select(selectDetailFlag)).subscribe(detail => this._detail = detail);
    this.store.dispatch(new RetrieveFieldsAction(''));
  }

  get detail() {
    return this._detail;
  }

  retrieve() {
    this.store.dispatch(new RetrieveFieldsAction(''));
  }

  createNew() {
    this.store.dispatch(new NewFieldAction());
  }

  list() {
    this.retrieve()
  }

  reload() {

  }

  save() {
    this.fieldDetailComponent.save();
  }
}
