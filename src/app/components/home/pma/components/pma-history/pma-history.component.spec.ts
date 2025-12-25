/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PmaHistoryComponent} from './pma-history.component';

describe('PmaHistoryComponent', () => {
  let component: PmaHistoryComponent;
  let fixture: ComponentFixture<PmaHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PmaHistoryComponent]
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
