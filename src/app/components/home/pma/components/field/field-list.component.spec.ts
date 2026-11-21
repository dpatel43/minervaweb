/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FieldListComponent} from './field-list.component';
import {AgGridAngular} from '@ag-grid-community/angular';
import {ModuleRegistry} from '@ag-grid-community/core';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {MineraCommonModule} from '../../../../common/minera-common.module';
import {provideStore} from '@ngrx/store';
import {field} from '../../store/reducers/field.reducers';

// Registered globally in app.module.ts for the app; specs need it too
ModuleRegistry.registerModules([ClientSideRowModelModule]);

describe('FieldListComponent', () => {
  let component: FieldListComponent;
  let fixture: ComponentFixture<FieldListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldListComponent],
      imports: [AgGridAngular, MineraCommonModule],
      providers: [provideStore({field})]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
