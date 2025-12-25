/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */


import * as FieldActions from './../actions/field.actions'
import {FieldState} from "../states/field.state";
import {Field} from "../../data/field";

const initialFieldState: FieldState = {
  page: {
    content: [],
    totalPages: 0,
    totalElements: 0,
    last: true,
    size: 0,
    first: true,
    sort: '',
    numberOfElements: 0
  },
  field: newField(),
  loading: false,
  detail: false
}

function newField() {
  return new Field()
}

export function field(field: FieldState = initialFieldState, action: FieldActions.FieldActions) {
  switch (action.type) {
    case FieldActions.RETRIEVE_FIELDS_SUCCESS_ACTION:
      return {
        ...field,
        page: action.payload,
        loading: false,
        detail: false
      }
    case FieldActions.EDIT_FIELD_SUCCESS_ACTION:
      return {
        ...field,
        detail: true,
        field: action.payload
      }
    case FieldActions.NEW_FIELD_ACTION:
      return {
        ...field,
        field: newField(),
        detail: true
      }
    case FieldActions.SAVE_FIELD_SUCESS_ACTION:
      return {
        ...field,
        field: action.field,
        detail: true
      }
    case FieldActions.SAVE_FIELD_FAILED_ACTION:
      return {
        ...field,
        field: action.field,
        detail: true
      }
    default:
      return field;
  }
}
