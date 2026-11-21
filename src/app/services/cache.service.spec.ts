import { TestBed } from '@angular/core/testing';

import { CacheService } from './cache.service';
import {apiTestingProviders} from '../testing/test-providers';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: apiTestingProviders});
    service = TestBed.inject(CacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
