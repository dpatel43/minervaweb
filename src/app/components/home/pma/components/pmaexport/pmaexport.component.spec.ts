import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PMAExportComponent} from './pmaexport.component';
import {PmaReturnChartsComponent} from './pma-return-charts.component';
import {provideRouter} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {MineraCommonModule} from '../../../../common/minera-common.module';
import {HomeModule} from '../../../home.module';
import {apiTestingProviders} from '../../../../../testing/test-providers';

describe('PMAExportComponent', () => {
  let component: PMAExportComponent;
  let fixture: ComponentFixture<PMAExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Not standalone: declared here with the modules PmaModule gives it
      declarations: [PMAExportComponent, PmaReturnChartsComponent],
      imports: [MineraCommonModule, HomeModule],
      providers: [...apiTestingProviders, provideRouter([]), provideNoopAnimations()]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PMAExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
