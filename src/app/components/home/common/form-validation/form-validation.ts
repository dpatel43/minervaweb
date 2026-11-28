/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';

/** Midnight at the start of today, local time: the latest date a report can ask for */
export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function asDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

export const FormValidators = {
  /** An account or profile picker holds an item picked from the list, not text that matched nothing */
  picked: (control: AbstractControl): ValidationErrors | null =>
    typeof control.value === 'string' && control.value.trim() ? {notPicked: true} : null,

  /** No data exists after today */
  notFuture: (control: AbstractControl): ValidationErrors | null => {
    const date = asDate(control.value);
    return date && date > today() ? {future: true} : null;
  },

  /** On a group: the end date is on or after the start date */
  dateOrder: (startKey = 'start', endKey = 'end'): ValidatorFn => (group: AbstractControl) => {
    const start = asDate(group.get(startKey)?.value);
    const end = asDate(group.get(endKey)?.value);
    return start && end && end < start ? {dateOrder: true} : null;
  },

  /** On a group: the benchmark, when there is one, isn't the account itself */
  differentAccounts: (accountKey = 'account', benchmarkKey = 'benchmark'): ValidatorFn => (group: AbstractControl) => {
    const account = group.get(accountKey)?.value;
    const benchmark = group.get(benchmarkKey)?.value;
    return account?.id && account.id === benchmark?.id ? {sameAccount: true} : null;
  }
};

/** A group-level error and the field it's shown beside */
const CROSS_FIELD: Record<string, string> = {dateOrder: 'end', sameAccount: 'benchmark'};

/** Messages in the order they're checked; the first that applies is shown. Unreadable typed dates come before
    Required, since the datepicker sends null for them */
const MESSAGES: [string, string][] = [
  ['matDatepickerParse', 'Enter as MM/DD/YYYY'],
  ['required', 'Required'],
  ['notPicked', 'Pick one from the list'],
  ['future', 'Can\'t be in the future'],
  ['matDatepickerMax', 'Can\'t be in the future'],
  ['matDatepickerMin', 'Before the start date'],
  ['dateOrder', 'Before the start date'],
  ['sameAccount', 'Same as the account']
];

/**
 * A report's input form with its error messages. A field shows its error once the user has left it or tried to
 * submit; errors that involve two fields (date order, benchmark = account) show beside the second one.
 */
export class FormCheck {
  submitted = false;

  constructor(readonly form: FormGroup) {
  }

  /** The message for a field, by path (e.g. 'account' or 'range.end'), or null when it has none to show */
  error(path: string): string | null {
    const control = this.form.get(path);
    if (!control || !(control.touched || this.submitted)) {
      return null;
    }
    const field = path.split('.').pop();
    const errors: ValidationErrors = {...(control.errors ?? {})};
    for (const [key, value] of Object.entries(control.parent?.errors ?? {})) {
      if (CROSS_FIELD[key] === field) {
        errors[key] = value;
      }
    }
    return MESSAGES.find(([key]) => errors[key])?.[1] ?? null;
  }

  invalid(path: string): boolean {
    return this.error(path) !== null;
  }

  /** Shows every field's error and says whether the form can be sent */
  submit(): boolean {
    this.submitted = true;
    this.form.markAllAsTouched();
    return this.form.valid;
  }
}
