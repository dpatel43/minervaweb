/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */


import {Action} from "@ngrx/store";
import {SearchProfile} from "../../data/search-profile";
import {Page} from "../../../../../models/page";
import {Profile} from "../../data/profile";

export const RETRIEVE_PROFILES_ACTION = '[PROFILE] Retrieve'
export const RETRIEVE_PROFILES_SUCCESS_ACTION = '[PROFILE] Retrieve Success'
export const RETRIEVE_PROFILES_FAILED_ACTION = '[PROFILE] Retrieve Failed'

export const NEW_PROFILE_ACTION = '[PROFILE] New'

export const EDIT_PROFILE_ACTION = '[PROFILE] Edit'
export const EDIT_PROFILE_SUCCESS_ACTION = '[PROFILE] Edit Success'
export const EDIT_PROFILE_FAILED_ACTION = '[PROFILE] Edit Failed'

export const SAVE_PROFILE_ACTION = '[PROFILE] Save'
export const SAVE_PROFILE_SUCESS_ACTION = '[PROFILE] Save Success'
export const SAVE_PROFILE_FAILED_ACTION = '[PROFILE] Save Failed'


export class NewProfileAction implements Action {
  readonly type = NEW_PROFILE_ACTION

  constructor() {
  }
}

export class RetrieveProfilesAction implements Action {
  readonly type = RETRIEVE_PROFILES_ACTION

  constructor(public name: string) {
  }
}

export class RetrieveProfileSuccessAction implements Action {
  readonly type = RETRIEVE_PROFILES_SUCCESS_ACTION

  constructor(public payload: Page<SearchProfile>) {
  }
}

export class RetrieveProfileFailedAction implements Action {
  readonly type = RETRIEVE_PROFILES_FAILED_ACTION

  constructor(public error: string) {
  }
}

export class EditProfileAction implements Action {
  readonly type = EDIT_PROFILE_ACTION

  constructor(public id: number) {
  }
}

export class EditProfileSuccessAction implements Action {
  readonly type = EDIT_PROFILE_SUCCESS_ACTION

  constructor(public payload: Profile) {
  }
}

export class EditProfileFailedAction implements Action {
  readonly type = EDIT_PROFILE_FAILED_ACTION

  constructor(public error: string) {
  }
}

export class SaveProfileAction implements Action {
  readonly type = SAVE_PROFILE_ACTION

  constructor(public field: Profile) {
  }
}

export class SaveProfileSuccessAction implements Action {
  readonly type = SAVE_PROFILE_SUCESS_ACTION

  constructor(public field: Profile) {
  }
}

export class SaveProfileFailedAction implements Action {
  readonly type = SAVE_PROFILE_FAILED_ACTION

  constructor(public message: string, public field: Profile) {
  }
}

export type ProfileActions = RetrieveProfilesAction | RetrieveProfileSuccessAction | RetrieveProfileFailedAction |
  EditProfileAction | EditProfileSuccessAction | EditProfileFailedAction |
  NewProfileAction | SaveProfileAction | SaveProfileSuccessAction | SaveProfileFailedAction
