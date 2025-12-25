/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Input, OnInit} from '@angular/core';
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
    this.onChange(value);
  }

  @Input() colors: CacheResult<T>[] = [];

  private onChange: (value: CacheResult<T>) => void;

  writeValue(value: CacheResult<T>) {
    this.searchResultCtrl.setValue(value);
  }

  registerOnChange(onChange: (value: CacheResult<T>) => void) {
    this.onChange = onChange;
  }

  registerOnTouched() {
  }

  ngOnInit() {
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
