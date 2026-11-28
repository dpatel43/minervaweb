/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {FormControl, FormGroup, Validators} from '@angular/forms';
import {FormCheck, FormValidators, today} from './form-validation';

describe('FormValidators', () => {
  it('accepts a picked item or nothing, not text that matched nothing', () => {
    expect(FormValidators.picked(new FormControl({id: 1, displayValue: 'Growth Equity'}))).toBeNull();
    expect(FormValidators.picked(new FormControl(null))).toBeNull();
    expect(FormValidators.picked(new FormControl('Growth'))).toEqual({notPicked: true});
  });

  it('allows today but not tomorrow', () => {
    const tomorrow = new Date(today());
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(FormValidators.notFuture(new FormControl(today()))).toBeNull();
    expect(FormValidators.notFuture(new FormControl(tomorrow))).toEqual({future: true});
    expect(FormValidators.notFuture(new FormControl(null))).toBeNull();
  });

  it('wants the end on or after the start', () => {
    const group = (start: Date, end: Date) =>
      FormValidators.dateOrder()(new FormGroup({start: new FormControl(start), end: new FormControl(end)}));
    expect(group(new Date(2025, 0, 2), new Date(2025, 0, 1))).toEqual({dateOrder: true});
    expect(group(new Date(2025, 0, 1), new Date(2025, 0, 1))).toBeNull();
    expect(group(null, new Date(2025, 0, 1))).toBeNull();
  });

  it('wants a benchmark other than the account', () => {
    const group = (benchmark: unknown) => FormValidators.differentAccounts()(
      new FormGroup({account: new FormControl({id: 7}), benchmark: new FormControl(benchmark)}));
    expect(group({id: 7})).toEqual({sameAccount: true});
    expect(group({id: 8})).toBeNull();
    expect(group(null)).toBeNull();
  });
});

describe('FormCheck', () => {
  const build = () => new FormCheck(new FormGroup({
    account: new FormControl(null, [Validators.required, FormValidators.picked]),
    benchmark: new FormControl(null, FormValidators.picked),
    start: new FormControl(null, Validators.required),
    end: new FormControl(null, Validators.required)
  }, {validators: [FormValidators.dateOrder(), FormValidators.differentAccounts()]}));

  it('shows nothing until a field is left or the form is submitted', () => {
    const check = build();
    expect(check.error('account')).toBeNull();
    check.form.get('account').markAsTouched();
    expect(check.error('account')).toBe('Required');
    expect(check.error('start')).toBeNull();
    expect(check.submit()).toBeFalse();
    expect(check.error('start')).toBe('Required');
  });

  it('shows a two-field error beside the second field only', () => {
    const check = build();
    check.form.patchValue({account: {id: 7}, benchmark: {id: 7}, start: new Date(2025, 0, 2), end: new Date(2025, 0, 1)});
    expect(check.submit()).toBeFalse();
    expect(check.error('end')).toBe('Before the start date');
    expect(check.error('start')).toBeNull();
    expect(check.error('benchmark')).toBe('Same as the account');
    expect(check.error('account')).toBeNull();
  });

  it('asks for a pick from the list when text was typed', () => {
    const check = build();
    check.form.patchValue({account: 'Grow'});
    check.submit();
    expect(check.error('account')).toBe('Pick one from the list');
  });
});
