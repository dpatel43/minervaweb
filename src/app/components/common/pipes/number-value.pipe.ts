/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Inject, LOCALE_ID, Pipe, PipeTransform} from '@angular/core';
import {formatValue} from './number-format';

/** `{{ v | numberValue:'.3-5' }}` shows 1.23456, or (1.23456) when negative; add .negative for red */
@Pipe({name: 'numberValue', standalone: false})
export class NumberValuePipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private locale: string) {
  }

  transform(value: unknown, digits = '.3-3'): string {
    return formatValue(value, this.locale, digits);
  }
}
