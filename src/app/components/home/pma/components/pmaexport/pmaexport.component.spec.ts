import {ComponentFixture, TestBed} from '@angular/core/testing';

import {of} from 'rxjs';
import {PmaExportService} from '../../services/pmaexport/pma-export.service';
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

  describe('benchmark', () => {
    const fill = (benchmarkId?: number) => component.exportForm.patchValue({
      account: {id: 100010, displayValue: 'Growth Equity'}, profile: {id: 3, displayValue: 'Gics'}, end: new Date(2026, 10, 20),
      benchmark: benchmarkId ? {id: benchmarkId, displayValue: 'S&P 500'} : null
    });
    const response = {
      exportRows: [{id: 0, parentId: -1, name: 'Total',
        accountValues: {YTD: {BaseTotalRor: 2.5}}, benchmarkValues: {YTD: {BaseTotalRor: -1.5}}}]
    };

    it('sends no benchmark unless one is chosen, and never the account itself', () => {
      const spy = spyOn(TestBed.inject(PmaExportService), 'runPmaSummaryExport').and.returnValue(of(response as any));
      fill();
      component.onSubmit();
      expect(spy.calls.mostRecent().args[0].benchmarkId).toBe(0);
      expect(component.showBenchmark).toBeFalse();
      expect(component.displayedColumns.length).toBe(1 + component.periods.length);

      fill(100010);
      expect(component.exportForm.hasError('sameAccount')).toBeTrue();
      component.onSubmit();
      expect(spy.calls.count()).toBe(1);
    });

    it('pairs each period\'s portfolio return with the benchmark\'s', () => {
      spyOn(TestBed.inject(PmaExportService), 'runPmaSummaryExport').and.returnValue(of(response as any));
      fill(100009);
      component.onSubmit();
      fixture.detectChanges();

      expect(component.showBenchmark).toBeTrue();
      expect(component.displayedColumns.slice(0, 3)).toEqual(['name', '1D', 'bench-1D']);
      const ytd = component.displayedColumns.indexOf('YTD');
      const cells = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row td'))
        .map((td: HTMLElement) => td.textContent.trim());
      expect(cells.slice(ytd, ytd + 2)).toEqual(['2.5000', '(1.5000)']);
      expect(fixture.nativeElement.querySelectorAll('tr.group-header-row').length).toBe(1);

      const table = component.buildExport({scope: 'all', format: 'csv'} as any);
      expect(table.columns.slice(1, 3).map(c => [c.group, c.header])).toEqual([['1 Day', 'Portfolio'], ['1 Day', 'Benchmark']]);
      expect(table.details).toContain(['Benchmark', 'S&P 500']);
    });
  });
});
