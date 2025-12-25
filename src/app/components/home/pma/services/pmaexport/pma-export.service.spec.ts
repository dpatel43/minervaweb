/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {TestBed} from '@angular/core/testing';

import {PmaExportService} from './pma-export.service';

describe('PmaExportService', () => {
  let service: PmaExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PmaExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
