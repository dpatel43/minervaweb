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

  it('drops the earlier pick when the text is changed or cleared', () => {
    const changes: unknown[] = [];
    component.registerOnChange(v => changes.push(v));
    component.writeValue({id: 1, displayValue: 'Growth Equity'} as any);
    expect(changes).toEqual([]);
    component.searchResultCtrl.setValue('Growth Eq');
    component.searchResultCtrl.setValue('  ');
    expect(changes).toEqual(['Growth Eq', null]);
  });

  it('reports touched when the input is left with no suggestions open', () => {
    const touched = jasmine.createSpy('touched');
    component.registerOnTouched(touched);
    fixture.nativeElement.querySelector('input').dispatchEvent(new Event('blur'));
    expect(touched).toHaveBeenCalled();
  });
});
