/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */


import {Action} from "@ngrx/store";
import {SearchField} from "../../data/search-field";
import {Page} from "../../../../../models/page";
import {Field} from "../../data/field";

export const RETRIEVE_FIELDS_ACTION = '[FIELD] Retrieve'
export const RETRIEVE_FIELDS_SUCCESS_ACTION = '[FIELD] Retrieve Success'
export const RETRIEVE_FIELDS_FAILED_ACTION = '[FIELD] Retrieve Failed'

export const NEW_FIELD_ACTION = '[FIELD] New'

export const EDIT_FIELD_ACTION = '[FIELD] Edit'
export const EDIT_FIELD_SUCCESS_ACTION = '[FIELD] Edit Success'
export const EDIT_FIELD_FAILED_ACTION = '[FIELD] Edit Failed'

export const SAVE_FIELD_ACTION = '[FIELD] Save'
export const SAVE_FIELD_SUCESS_ACTION = '[FIELD] Save Success'
export const SAVE_FIELD_FAILED_ACTION = '[FIELD] Save Failed'


export class NewFieldAction implements Action {
  readonly type = NEW_FIELD_ACTION

  constructor() {
  }
}

export class RetrieveFieldsAction implements Action {
  readonly type = RETRIEVE_FIELDS_ACTION

  constructor(public name: string) {
  }
}

export class RetrieveFieldSuccessAction implements Action {
  readonly type = RETRIEVE_FIELDS_SUCCESS_ACTION

  constructor(public payload: Page<SearchField>) {
  }
}

export class RetrieveFieldFailedAction implements Action {
  readonly type = RETRIEVE_FIELDS_FAILED_ACTION

  constructor(public error: string) {
  }
}

export class EditFieldAction implements Action {
  readonly type = EDIT_FIELD_ACTION

  constructor(public id: number) {
  }
}

export class EditFieldSuccessAction implements Action {
  readonly type = EDIT_FIELD_SUCCESS_ACTION

  constructor(public payload: Field) {
  }
}

export class EditFieldFailedAction implements Action {
  readonly type = EDIT_FIELD_FAILED_ACTION

  constructor(public error: string) {
  }
}

export class SaveFieldAction implements Action {
  readonly type = SAVE_FIELD_ACTION

  constructor(public field: Field) {
  }
}

export class SaveFieldSuccessAction implements Action {
  readonly type = SAVE_FIELD_SUCESS_ACTION

  constructor(public field: Field) {
  }
}

export class SaveFieldFailedAction implements Action {
  readonly type = SAVE_FIELD_FAILED_ACTION

  constructor(public message: string, public field: Field) {
  }
}

export type FieldActions = RetrieveFieldsAction | RetrieveFieldSuccessAction | RetrieveFieldFailedAction |
  EditFieldAction | EditFieldSuccessAction | EditFieldFailedAction |
  NewFieldAction | SaveFieldAction | SaveFieldSuccessAction | SaveFieldFailedAction
