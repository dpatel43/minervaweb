import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ProcessorComponent} from './processor.component';
import {provideRouter} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {MineraCommonModule} from '../../../../common/minera-common.module';
import {HomeModule} from '../../../home.module';
import {apiTestingProviders} from '../../../../../testing/test-providers';
import {CalculationService} from '../../services/calculation.service';
import {of} from 'rxjs';

describe('ProcessorComponent', () => {
  let component: ProcessorComponent;
  let fixture: ComponentFixture<ProcessorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Not standalone: declared here with the modules PmaModule gives it
      declarations: [ProcessorComponent],
      imports: [MineraCommonModule, HomeModule],
      providers: [...apiTestingProviders, provideRouter([]), provideNoopAnimations()]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('runs only with an account and dates in order', () => {
    const spy = spyOn(TestBed.inject(CalculationService), 'runPerformance').and.returnValue(of(null));
    component.onSubmit();
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBe(3);

    component.userForm.patchValue({account: {id: 100010}, range: {start: new Date(2026, 0, 2), end: new Date(2026, 0, 1)}});
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
    expect(component.check.error('range.end')).toBe('Before the start date');

    component.userForm.patchValue({range: {start: new Date(2026, 0, 1), end: new Date(2026, 0, 1)}});
    component.onSubmit();
    expect(spy).toHaveBeenCalled();
  });
});
