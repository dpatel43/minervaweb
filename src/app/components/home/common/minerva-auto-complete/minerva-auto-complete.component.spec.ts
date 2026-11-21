import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MinervaAutoCompleteComponent } from './minerva-auto-complete.component';
import {MineraCommonModule} from '../../../common/minera-common.module';
import {apiTestingProviders} from '../../../../testing/test-providers';

describe('MinervaAutoCompleteComponent', () => {
  let component: MinervaAutoCompleteComponent<unknown>;
  let fixture: ComponentFixture<MinervaAutoCompleteComponent<unknown>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MinervaAutoCompleteComponent ],
      imports: [MineraCommonModule],
      providers: apiTestingProviders
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinervaAutoCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
