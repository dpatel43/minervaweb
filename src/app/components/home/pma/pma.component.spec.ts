/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PmaComponent} from './pma.component';

describe('PmaComponent', () => {
  let component: PmaComponent;
  let fixture: ComponentFixture<PmaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PmaComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PmaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
