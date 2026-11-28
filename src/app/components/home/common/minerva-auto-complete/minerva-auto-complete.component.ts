/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormControl} from "@angular/forms";
import {CacheResult} from "../../../../models/cache-result";
import {debounceTime, finalize, switchMap, tap} from "rxjs/operators";
import {CacheService} from "../../../../services/cache.service";

@Component({
  selector: 'app-minerva-auto-complete',
  templateUrl: './minerva-auto-complete.component.html',
  styleUrls: ['./minerva-auto-complete.component.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: MinervaAutoCompleteComponent, multi: true},
  ],
  standalone: false
})
export class MinervaAutoCompleteComponent<T> implements OnInit, ControlValueAccessor {
  filteredResults: CacheResult<T>[] = [];
  _cacheName: string;
  isLoading = false;
  searchResultCtrl = new UntypedFormControl();
  errorMsg: string;

  constructor(
    private cacheService: CacheService
  ) {
  }

  displayFn(cacheResult: CacheResult<T>): string {
    if (typeof cacheResult === 'string') {
      return cacheResult;
    }
    if (cacheResult != undefined) {
      return cacheResult.displayValue;
    }
    return '';
  }

  @Input('cacheName') set cacheName(cacheName: string) {
    this._cacheName = cacheName;
  }

  get cacheName() {
    return this._cacheName;
  }

  onSelect(value: CacheResult<T>) {
    this.searchResultCtrl.setValue(value);
  }

  @Input() colors: CacheResult<T>[] = [];

  /** id for the inner input, so a <label for=...> can target it */
  @Input() inputId: string;

  @Input() placeholder = 'Search';

  /** Shows the input with the invalid style; the form decides when */
  @Input() invalid = false;

  @ViewChild(MatAutocompleteTrigger) private trigger: MatAutocompleteTrigger;

  /**
   * Gets the picked item, null when the text is cleared, or the typed text while nothing is picked, so the form
   * never keeps an earlier pick the input no longer shows
   */
  private onChange: (value: CacheResult<T> | string | null) => void = () => {
  };
  private onTouched: () => void = () => {
  };

  writeValue(value: CacheResult<T>) {
    this.searchResultCtrl.setValue(value, {emitEvent: false});
  }

  registerOnChange(onChange: (value: CacheResult<T> | string | null) => void) {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void) {
    this.onTouched = onTouched;
  }

  /** Leaving the input for the suggestions isn't leaving the field: that counts when the panel closes */
  onBlur() {
    if (!this.trigger?.panelOpen) {
      this.onTouched();
    }
  }

  onPanelClosed() {
    this.onTouched();
  }

  ngOnInit() {
    this.searchResultCtrl.valueChanges.subscribe(value =>
      this.onChange(typeof value === 'string' && !value.trim() ? null : value));
    this.searchResultCtrl.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => {
          this.errorMsg = "";
          this.filteredResults = [];
          this.isLoading = true;
        }),
        switchMap(value => this.cacheService.findResults(this.cacheName, value)
          .pipe(
            finalize(() => {
              this.isLoading = false
            }),
          )
        )
      )
      .subscribe((data: CacheResult<T>[]) => {
        this.filteredResults = data;
      });
  }
}
