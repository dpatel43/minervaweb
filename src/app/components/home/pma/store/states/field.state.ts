/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */


import {Page} from "../../../../../models/page";
import {Field} from "../../data/field";
import {SearchField} from "../../data/search-field";

export interface FieldState {
  page: Page<SearchField>,
  field: Field,
  loading: boolean,
  detail: false
}
