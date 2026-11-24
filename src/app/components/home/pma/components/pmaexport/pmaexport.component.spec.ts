import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PMAExportComponent} from './pmaexport.component';
import {PmaReturnChartsComponent} from '../return-charts/pma-return-charts.component';
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
    localStorage.removeItem('minerva.pmaExport.percentDecimals');
    fixture = TestBed.createComponent(PMAExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows returns with 4 decimals by default, and remembers a change', () => {
    expect(component.percentDigits).toBe('.4-4');
    component.onPercentDecimalsChange(6);
    expect(component.percentDigits).toBe('.6-6');
    expect(localStorage.getItem('minerva.pmaExport.percentDecimals')).toBe('6');

    const next = TestBed.createComponent(PMAExportComponent).componentInstance;
    expect(next.percentDecimals).toBe(6);
  });
});
