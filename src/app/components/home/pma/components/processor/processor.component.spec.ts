import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ProcessorComponent} from './processor.component';
import {provideRouter} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {MineraCommonModule} from '../../../../common/minera-common.module';
import {HomeModule} from '../../../home.module';
import {apiTestingProviders} from '../../../../../testing/test-providers';

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
});
