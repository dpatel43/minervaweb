/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {DecimalsControlComponent, fixedDigits, loadDecimals, saveDecimals} from './decimals-control.component';

describe('DecimalsControlComponent', () => {
  const key = 'minerva.test.percentDecimals';

  afterEach(() => localStorage.removeItem(key));

  it('builds fixed DecimalPipe digits', () => {
    expect(fixedDigits(4)).toBe('.4-4');
    expect(fixedDigits(0)).toBe('.0-0');
  });

  it('loads saved decimals, falling back to 4 when missing or out of range', () => {
    expect(loadDecimals(key)).toBe(4);
    saveDecimals(key, 7);
    expect(loadDecimals(key)).toBe(7);
    localStorage.setItem(key, '42');
    expect(loadDecimals(key)).toBe(4);
    localStorage.setItem(key, 'abc');
    expect(loadDecimals(key)).toBe(4);
  });

  it('steps within 0..8 and emits each change', () => {
    const control = new DecimalsControlComponent();
    const emitted: number[] = [];
    control.decimalsChange.subscribe(d => emitted.push(d));
    control.decimals = 7;
    control.change(1);
    control.change(1);
    control.decimals = 1;
    control.change(-1);
    control.change(-1);
    expect(emitted).toEqual([8, 0]);
  });
});
