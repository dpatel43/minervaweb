import { TestBed } from '@angular/core/testing';

import { StaffUserService } from './staff-user.service';

describe('StaffUserService', () => {
  let service: StaffUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaffUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
