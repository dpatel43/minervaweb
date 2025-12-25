/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Actions, createEffect, ofType} from '@ngrx/effects';
import {FieldService} from "../../services/field.service";
import {Page} from "../../../../../models/page";
import {SearchField} from "../../data/search-field";
import {Injectable} from "@angular/core";
import {of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {
  EDIT_FIELD_ACTION,
  EditFieldAction,
  EditFieldFailedAction,
  EditFieldSuccessAction,
  RETRIEVE_FIELDS_ACTION,
  RetrieveFieldFailedAction,
  RetrieveFieldsAction,
  RetrieveFieldSuccessAction,
  SAVE_FIELD_ACTION,
  SaveFieldAction,
  SaveFieldFailedAction,
  SaveFieldSuccessAction
} from "../actions/field.actions";
import {Field} from "../../data/field";

@Injectable()
export class FieldEffects {
  constructor(private service: FieldService, private actions$: Actions) {
  }

  retrieveFields$ = createEffect(() =>
    this.actions$
      .pipe(ofType<RetrieveFieldsAction>(RETRIEVE_FIELDS_ACTION),
        map(action => action.name),
        switchMap((params: string) =>
          this.service.findFieldsBySearchParameters(params, '', '', 0, 20).pipe(
            map((response: Page<SearchField>) => new RetrieveFieldSuccessAction(response)),
            catchError((error) => of(new RetrieveFieldFailedAction(error)))
          )
        )
      )
  );

  editFields$ = createEffect(() =>
    this.actions$
      .pipe(ofType<EditFieldAction>(EDIT_FIELD_ACTION),
        map(action => action.id),
        switchMap((params: number) =>
          this.service.findFieldById(params).pipe(
            map((response: Field) => new EditFieldSuccessAction(response)),
            catchError((error) => of(new EditFieldFailedAction(error)))
          )
        )
      )
  );

  saveField$ = createEffect(() =>
    this.actions$
      .pipe(ofType<SaveFieldAction>(SAVE_FIELD_ACTION),
        map(action => action.field),
        switchMap((field: Field) =>
          this.service.saveField(field).pipe(
            map((response: Field) => new SaveFieldSuccessAction(response)),
            catchError((error) => of(new SaveFieldFailedAction(error, field)))
          )
        )
      )
  );
}
