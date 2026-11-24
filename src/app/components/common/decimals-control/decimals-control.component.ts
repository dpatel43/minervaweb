/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';

/** Decimals shown in percentage columns unless the user changes them */
export const DEFAULT_PERCENT_DECIMALS = 4;
/** Decimals shown in amount columns */
export const AMOUNT_DIGITS = '.2-2';
export const MIN_DECIMALS = 0;
export const MAX_DECIMALS = 8;

/** DecimalPipe digits info for exactly n decimals, e.g. 4 -> '.4-4' */
export function fixedDigits(decimals: number): string {
  return `.${decimals}-${decimals}`;
}

/** Saved decimals for a screen, or the default when none is saved or the value is unreadable */
export function loadDecimals(storageKey: string, fallback = DEFAULT_PERCENT_DECIMALS): number {
  try {
    const saved = Number(localStorage.getItem(storageKey));
    if (localStorage.getItem(storageKey) !== null && Number.isInteger(saved) && saved >= MIN_DECIMALS && saved <= MAX_DECIMALS) {
      return saved;
    }
  } catch {
    // storage unavailable
  }
  return fallback;
}

export function saveDecimals(storageKey: string, decimals: number) {
  try {
    localStorage.setItem(storageKey, String(decimals));
  } catch {
    // storage unavailable
  }
}

/**
 * Excel-style "fewer / more decimals" icon buttons for a table toolbar. The screen owns the
 * number and applies it to its percentage columns, charts and export.
 */
@Component({
  selector: 'app-decimals-control',
  template: `
    <div [attr.aria-label]="label + ': ' + decimals + ' decimals'" class="decimals-control" role="group">
      <button (click)="change(-1)" [disabled]="decimals <= min" [title]="'Fewer decimals in ' + label.toLowerCase() + ' (now ' + decimals + ')'"
              [attr.aria-label]="'Fewer decimals, now ' + decimals" class="btn btn-sm toolbar-icon-btn decimals-btn" type="button">
        <span aria-hidden="true" class="decimals-glyph"><i class="bi bi-arrow-left-short"></i>.0</span>
      </button>
      <button (click)="change(1)" [disabled]="decimals >= max" [title]="'More decimals in ' + label.toLowerCase() + ' (now ' + decimals + ')'"
              [attr.aria-label]="'More decimals, now ' + decimals" class="btn btn-sm toolbar-icon-btn decimals-btn" type="button">
        <span aria-hidden="true" class="decimals-glyph">.00<i class="bi bi-arrow-right-short"></i></span>
      </button>
    </div>`,
  standalone: false
})
export class DecimalsControlComponent {
  @Input() decimals = DEFAULT_PERCENT_DECIMALS;
  @Input() min = MIN_DECIMALS;
  @Input() max = MAX_DECIMALS;
  /** What the decimals apply to, for the tooltips */
  @Input() label = 'Percentages';
  @Output() decimalsChange = new EventEmitter<number>();

  change(step: number) {
    const next = Math.min(this.max, Math.max(this.min, this.decimals + step));
    if (next !== this.decimals) {
      this.decimals = next;
      this.decimalsChange.emit(next);
    }
  }
}
