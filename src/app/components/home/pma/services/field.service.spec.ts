import {TestBed} from '@angular/core/testing';

import {FieldService} from './field.service';
import {apiTestingProviders} from '../../../../testing/test-providers';

describe('FieldService', () => {
  let service: FieldService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: apiTestingProviders});
    service = TestBed.inject(FieldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
