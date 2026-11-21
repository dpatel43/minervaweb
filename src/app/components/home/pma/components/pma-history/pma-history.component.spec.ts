/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PmaHistoryComponent} from './pma-history.component';
import {provideRouter} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {MineraCommonModule} from '../../../../common/minera-common.module';
import {HomeModule} from '../../../home.module';
import {apiTestingProviders} from '../../../../../testing/test-providers';

describe('PmaHistoryComponent', () => {
  let component: PmaHistoryComponent;
  let fixture: ComponentFixture<PmaHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Not standalone: declared here with the modules PmaModule gives it
      declarations: [PmaHistoryComponent],
      imports: [MineraCommonModule, HomeModule],
      providers: [...apiTestingProviders, provideRouter([]), provideNoopAnimations()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PmaHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
