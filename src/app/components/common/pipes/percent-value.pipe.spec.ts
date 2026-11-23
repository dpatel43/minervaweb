/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {formatPercent, PercentValuePipe} from './percent-value.pipe';

describe('PercentValuePipe', () => {
  const pipe = new PercentValuePipe('en-US');

  it('adds a % sign to percentage points', () => {
    expect(pipe.transform(1.23456, '.3-5')).toBe('1.23456%');
    expect(pipe.transform(-0.5)).toBe('-0.500%');
  });

  it('does not scale the value', () => {
    expect(pipe.transform(25, '.3-3')).toBe('25.000%');
    expect(pipe.transform(0.25, '.3-3')).toBe('0.250%');
  });

  it('is empty for missing values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(formatPercent(NaN, 'en-US')).toBe('');
    expect(formatPercent(Infinity, 'en-US')).toBe('');
  });
});
