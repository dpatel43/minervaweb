import { TestBed } from '@angular/core/testing';

import { StaffUserService } from './staff-user.service';
import {apiTestingProviders} from '../../../../testing/test-providers';

describe('StaffUserService', () => {
  let service: StaffUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: apiTestingProviders});
    service = TestBed.inject(StaffUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
