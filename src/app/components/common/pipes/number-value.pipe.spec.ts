/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {NumberValuePipe} from './number-value.pipe';
import {formatValue} from './number-format';

describe('NumberValuePipe', () => {
  const pipe = new NumberValuePipe('en-US');

  it('formats with the given decimals and no unit', () => {
    expect(pipe.transform(1.23456, '.3-5')).toBe('1.23456');
    expect(pipe.transform(1234.5)).toBe('1,234.500');
  });

  it('puts negatives in brackets', () => {
    expect(pipe.transform(-0.5)).toBe('(0.500)');
    expect(pipe.transform(-1234.5)).toBe('(1,234.500)');
  });

  it('is empty for missing values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(formatValue(NaN, 'en-US')).toBe('');
    expect(formatValue(Infinity, 'en-US')).toBe('');
  });
});
