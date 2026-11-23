/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Inject, LOCALE_ID, Pipe, PipeTransform} from '@angular/core';
import {formatNumber} from '@angular/common';

/**
 * Formats a value that is already in percent with a % sign: `{{ ror | percentValue:'.3-5' }}`
 * shows 1.23456%. No scaling: the API sends percentages. Empty for null, NaN and infinities.
 */
export function formatPercent(value: unknown, locale: string, digits = '.3-3'): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return '';
  }
  return formatNumber(value, locale, digits) + '%';
}

@Pipe({name: 'percentValue', standalone: false})
export class PercentValuePipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private locale: string) {
  }

  transform(value: unknown, digits = '.3-3'): string {
    return formatPercent(value, this.locale, digits);
  }
}
