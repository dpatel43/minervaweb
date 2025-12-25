/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {CacheResult} from "../../../../models/cache-result";
import {CacheService} from "../../../../services/cache.service";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {noop} from "rxjs";


export const MINERVA_CACHE_SELECT_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MinervaCacheSelectComponent),
  multi: true
};

@Component({
  selector: 'app-minerva-cache-select',
  templateUrl: './minerva-cache-select.component.html',
  styleUrls: ['./minerva-cache-select.component.css'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: MinervaCacheSelectComponent, multi: true},
  ],
  standalone: false
})
export class MinervaCacheSelectComponent implements OnInit, ControlValueAccessor {
  _selectedValue: string;
  _cacheResults: CacheResult<string>[];

  _cacheGroup: string;
  //Placeholders for the callbacks which are later provided
  //by the Control Value Accessor
  private onTouchedCallback: () => void = noop;
  private onChangeCallback: (_: any) => void = noop;

  constructor(private cacheService: CacheService) {
  }

  ngOnInit(): void {
  }

  get cacheGroup() {
    return this._cacheGroup;
  }

  @Input('cacheGroup') set cacheGroup(cacheGroup: string) {
    this._cacheGroup = cacheGroup;
    this.cacheService.findStaticCodes(this.cacheGroup).subscribe((data: CacheResult<string>[]) => {
      this.cacheResults = data;
    });
  }

  get selectedValue() {
    return this._selectedValue;
  }

  set selectedValue(value: string) {
    if (value !== this.selectedValue) {
      this._selectedValue = value;
      if (this.cacheResults) {
        let temp: CacheResult<string>[] = this.cacheResults.filter(d => d.id === this.selectedValue)
        if (temp.length > 0) {
          this.onChangeCallback(temp[0].id)
        }
      }
    }
  }

  get cacheResults() {
    return this._cacheResults;
  }

  set cacheResults(cacheResults: CacheResult<string>[]) {
    this._cacheResults = cacheResults
  }

  //From ControlValueAccessor interface
  writeValue(value: string) {
    if (value != null && value !== this.selectedValue) {
      this.selectedValue = value;
    }
  }

  //From ControlValueAccessor interface
  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  //From ControlValueAccessor interface
  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  //Set touched on blur
  onBlur() {
    this.onTouchedCallback();
  }
}
