/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {formatNumber} from '@angular/common';

/**
 * Accounting style used across the app: 1,234.500, negatives in brackets, (1,234.500), and
 * shown in red with the .negative class. Percentages are formatted the same way; the column
 * label carries the unit, e.g. "Return (%)". Empty for null, NaN and infinities.
 */
export function formatValue(value: unknown, locale: string, digits = '.3-3'): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return '';
  }
  const text = formatNumber(Math.abs(value), locale, digits);
  return value < 0 ? `(${text})` : text;
}
