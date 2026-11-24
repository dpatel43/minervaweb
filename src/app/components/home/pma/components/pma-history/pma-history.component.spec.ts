/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PmaHistoryComponent} from './pma-history.component';
import {provideRouter} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {MineraCommonModule} from '../../../../common/minera-common.module';
import {HomeModule} from '../../../home.module';
import {apiTestingProviders} from '../../../../../testing/test-providers';
import {PmaReturnChartsComponent} from '../return-charts/pma-return-charts.component';

describe('PmaHistoryComponent', () => {
  let component: PmaHistoryComponent;
  let fixture: ComponentFixture<PmaHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Not standalone: declared here with the modules PmaModule gives it
      declarations: [PmaHistoryComponent, PmaReturnChartsComponent],
      imports: [MineraCommonModule, HomeModule],
      providers: [...apiTestingProviders, provideRouter([]), provideNoopAnimations()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PmaHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('charts', () => {
    const row = (id: number, parentId: number, name: string, ror: number, endDate: string) =>
      ({id, parentId, name, startDate: '2026-08-01', endDate, accountValues: {BaseTotalRor: ror}, benchmarkValues: {}});
    const periodTree = (end: string, total: number, equities: number, cash: number) =>
      [row(0, -1, 'Total', total, end), row(1, 0, 'Equities', equities, end), row(2, 0, 'Cash', cash, end)];

    beforeEach(() => {
      (component as any).convertResponse({
        exportRows: {
          '2026-08-31': periodTree('2026-08-31', 0.01, 0.02, -0.001),
          '2026-09-30': periodTree('2026-09-30', -0.02, -0.03, 0.002)
        }
      });
      fixture.detectChanges();
    });

    it('charts the latest period\'s root by default, with every period\'s return', () => {
      expect(component.chartPeriods.map(p => p.key)).toEqual(['2026-08-31', '2026-09-30']);
      expect(component.chartPeriods[0].short).toBe('Aug 31');
      expect(component.chartPeriods[0].axisLines).toBeUndefined();
      expect(component.chartPeriods[0].label).toBe('Aug 1, 2026 – Aug 31, 2026');
      expect(component.chartPeriod).toBe('2026-09-30');
      expect(component.selectedKey).toBe('2026-09-30|0');
      expect(component.selectedRow.pmaExportRow.accountValues['2026-08-31'].BaseTotalRor).toBe(0.01);
      expect(component.selectedRow.children.map(c => c.name)).toEqual(['Equities', 'Cash']);
      expect(fixture.nativeElement.querySelector('app-pma-return-charts')).toBeTruthy();
    });

    it('charts a clicked row with its period, and follows the chart\'s period', () => {
      component.selectRow({key: '2026-08-31|2', name: 'Cash', level: 1, expandable: false,
        pmaExportRow: {id: 2} as any});
      expect(component.selectedRow.name).toBe('Cash');
      expect(component.selectedParent.name).toBe('Total');
      expect(component.chartPeriod).toBe('2026-08-31');

      component.onChartPeriodChange('2026-09-30');
      expect(component.selectedKey).toBe('2026-09-30|2');
    });
  });

  describe('export', () => {
    const row = (id: number, parentId: number, name: string, ror: number, endDate: string) =>
      ({id, parentId, name, startDate: endDate.slice(0, 8) + '01', endDate,
        accountValues: {BaseTotalRor: ror, CompositeBeginWeight: id === 0 ? 100 : 50, CompositeBaseContribution: ror / 4},
        benchmarkValues: {BaseTotalRor: ror / 2, CompositeBaseContribution: ror / 8}});
    const periodTree = (end: string, total: number, equities: number, cash: number) =>
      [row(0, -1, 'Total', total, end), row(1, 0, 'Equities', equities, end), row(2, 0, 'Cash', cash, end)];

    beforeEach(() => {
      (component as any).convertResponse({
        exportRows: {
          '2026-08-31': periodTree('2026-08-31', 0.01, 0.02, -0.001),
          '2026-09-30': periodTree('2026-09-30', -0.02, -0.03, 0.002)
        }
      });
    });

    it('exports every column, with Portfolio and Benchmark groups', () => {
      const t = component.buildExport({scope: 'all', format: 'csv'});
      expect(t.title).toBe('Performance History');
      expect(t.columns.length).toBe(component.displayedColumns.length);
      expect(t.columns.find(c => c.key === 'account-return')).toEqual(jasmine.objectContaining(
        {header: 'Return', group: 'Portfolio', digits: '.3-5'}));
      expect(t.columns.find(c => c.key === 'benchmark-return')?.group).toBe('Benchmark');
    });

    it('labels weight and return with (%) and shows their values as sent', () => {
      const t = component.buildExport({scope: 'all', format: 'xlsx'});
      expect(t.columns.find(c => c.key === 'account-weight')?.percent).toBeTrue();
      expect(t.columns.find(c => c.key === 'account-return')?.percent).toBeTrue();
      expect(t.columns.find(c => c.key === 'account-bmv')?.percent).toBeFalsy();
      const cash = t.rows.find(r => r.values['name'] === 'Cash');
      expect(cash.values['account-weight']).toBe(50);

      fixture.detectChanges();
      const text = fixture.nativeElement.querySelector('.mat-mdc-table')?.textContent ?? '';
      expect(text).toContain('Weight (%)');
      expect(text).toContain('Return (%)');
      expect(text).toContain('50.000');
      expect(text).not.toContain('50.000%');
    });

    it('shows contribution for the portfolio and benchmark, in percent', () => {
      const t = component.buildExport({scope: 'all', format: 'csv'});
      expect(t.columns.find(c => c.key === 'account-contribution')).toEqual(jasmine.objectContaining(
        {header: 'Contribution', group: 'Portfolio', digits: '.3-5', percent: true}));
      expect(t.columns.find(c => c.key === 'benchmark-contribution')?.group).toBe('Benchmark');
      const equities = t.rows.find(r => r.values['name'] === 'Equities' && r.values['endDate'] === '2026-08-31');
      expect(equities.values['account-contribution']).toBe(0.005);
      expect(equities.values['benchmark-contribution']).toBe(0.0025);

      fixture.detectChanges();
      const text = fixture.nativeElement.querySelector('.mat-mdc-table')?.textContent ?? '';
      expect(text).toContain('Contribution (%)');
    });

    it('shows negative numbers in red brackets', () => {
      fixture.detectChanges();
      const negatives = [...fixture.nativeElement.querySelectorAll('td.negative')].map((td: HTMLElement) => td.textContent.trim());
      expect(negatives).toContain('(0.020)');   // Total return for 2026-09-30
      expect(negatives.every(t => /^\(.*\)$/.test(t))).toBeTrue();
    });

    it('filters weight in percentage points, as shown', () => {
      component.onFilterChange('account-weight', '>60');
      const view = component.buildExport({scope: 'view', format: 'csv'});
      expect(view.rows.every(r => r.values['name'] === 'Total')).toBeTrue();
    });

    it('exports the current view with filters and sort, or all data without them', () => {
      component.onFilterChange('name', 'cash');
      component.onSortChange({active: 'endDate', direction: 'desc'});

      const view = component.buildExport({scope: 'view', format: 'xlsx'});
      expect(view.rows.map(r => [r.values['endDate'], r.values['name'], r.level, !!r.context])).toEqual([
        ['2026-09-30', 'Total', 0, true],
        ['2026-09-30', 'Cash', 1, false],
        ['2026-08-31', 'Total', 0, true],
        ['2026-08-31', 'Cash', 1, false]
      ]);
      expect(view.rows[1].values['account-return']).toBe(0.002);
      expect(view.rows[1].values['benchmark-return']).toBe(0.001);
      expect(view.details.find(d => d[0] === 'Rows')[1])
        .toBe('Current view, 4 of 6 rows; filters: Name "cash"; sorted by End Date, descending');

      const all = component.buildExport({scope: 'all', format: 'xlsx'});
      expect(all.rows.length).toBe(6);
      expect(all.rows[0].values['endDate']).toBe('2026-08-31');
      expect(all.rows.some(r => r.context)).toBeFalse();
      expect(all.details.find(d => d[0] === 'Rows')[1]).toBe('All data, 6 rows');
    });
  });
});
