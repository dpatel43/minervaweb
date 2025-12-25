/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */
import {createFeatureSelector, createSelector} from '@ngrx/store';
import {FieldState} from "../states/field.state";
import {SearchField} from "../../data/search-field";
import {Field} from "../../data/field";


export const selectFieldState = createFeatureSelector<FieldState>('field');


export const selectFields = createSelector(
  selectFieldState,
  (state: FieldState): SearchField[] => state.page.content
);

export const selectField = createSelector(
  selectFieldState,
  (state: FieldState): Field => state.field
);

export const selectDetailFlag = createSelector(
  selectFieldState,
  (state: FieldState): boolean => state.detail
);
