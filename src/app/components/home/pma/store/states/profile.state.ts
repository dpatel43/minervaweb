/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */


import {Page} from "../../../../../models/page";
import {Field} from "../../data/field";
import {SearchProfile} from "../../data/search-profile";

export interface ProfileState {
  page: Page<SearchProfile>,
  field: Field,
  loading: boolean,
  detail: false
}
