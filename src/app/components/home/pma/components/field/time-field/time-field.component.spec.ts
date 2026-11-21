/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TimeFieldComponent} from './time-field.component';
import {FormsModule} from '@angular/forms';
import {provideRouter} from '@angular/router';
import {HomeModule} from '../../../../home.module';
import {Field} from '../../../data/field';
import {apiTestingProviders} from '../../../../../../testing/test-providers';

describe('TimeFieldComponent', () => {
  let component: TimeFieldComponent;
  let fixture: ComponentFixture<TimeFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimeFieldComponent],
      imports: [FormsModule, HomeModule],
      providers: [...apiTestingProviders, provideRouter([])]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeFieldComponent);
    component = fixture.componentInstance;
    // Required input, normally passed in by FieldDetailComponent
    component.field = new Field();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
