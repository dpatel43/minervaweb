/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {DashboardComponent} from './dashboard.component';
import {DivergingBarsComponent} from './diverging-bars.component';
import {CumulativeReturnChartComponent} from './cumulative-return-chart.component';
import {MineraCommonModule} from '../../../../common/minera-common.module';
import {HomeModule} from '../../../home.module';
import {apiTestingProviders} from '../../../../../testing/test-providers';
import {PmaExportService} from '../../services/pmaexport/pma-export.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const summary = {
    exportRows: [
      {id: 0, parentId: -1, name: 'Total',
        accountValues: {'1D': {BaseTotalRor: -4.1076, ExcessReturn: -0.4085}, ITD: {BaseTotalRor: 2.7554, ExcessReturn: -3.8393}},
        benchmarkValues: {'1D': {BaseTotalRor: -3.6991}, ITD: {BaseTotalRor: 6.5947}}},
      {id: 1, parentId: 0, name: 'Energy',
        accountValues: {'1D': {CompositeBeginWeight: 1.0295}}, benchmarkValues: {'1D': {CompositeBeginWeight: 3.5648}}},
      {id: 2, parentId: 0, name: 'Information Technology',
        accountValues: {'1D': {CompositeBeginWeight: 40.61}}, benchmarkValues: {'1D': {CompositeBeginWeight: 34.72}}},
      {id: 3, parentId: 0, name: 'Other', accountValues: {}, benchmarkValues: {}}
    ]
  };
  const day = (end: string, p: number, b: number | null) =>
    [{id: 0, parentId: -1, name: 'Total', endDate: end, accountValues: {BaseTotalRor: p}, benchmarkValues: b === null ? {} : {BaseTotalRor: b}}];
  const daily = {exportRows: {d1: day('2025-11-20', 0, null), d3: day('2025-11-24', -1, 1), d2: day('2025-11-21', 10, 10)}};
  const fx = (a: number, s: number, i: number) => ({AllocationEffect: a, SelectionEffect: s, InteractionEffect: i, TotalEffect: a + s + i});
  const cumulative = {
    exportRows: {
      C: [
        {id: 0, parentId: -1, name: 'Total', accountValues: {BaseTotalRor: 2.7554, ExcessReturn: -3.8393, ...fx(-1.32, -1.73, -0.78)},
          benchmarkValues: {BaseTotalRor: 6.5947}},
        {id: 1, parentId: 0, name: 'Health Care', accountValues: fx(-0.11, 0.88, -0.04)},
        {id: 2, parentId: 0, name: 'Information Technology', accountValues: fx(-0.03, -2.92, -0.54)},
        {id: 3, parentId: 0, name: 'Energy', accountValues: fx(-0.62, 0.03, -0.02)},
        {id: 4, parentId: 1, name: 'United States Of America', accountValues: fx(1, 1, 1)}
      ]
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent, DivergingBarsComponent, CumulativeReturnChartComponent],
      imports: [MineraCommonModule, HomeModule],
      providers: [...apiTestingProviders, provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const fill = (benchmarkId: number) => component.exportForm.patchValue({
    account: {id: 100010, displayValue: 'Growth Equity'}, benchmark: {id: benchmarkId, displayValue: 'S&P 500'},
    profile: {id: 3, displayValue: 'Gics with Country'}, start: new Date(2025, 10, 20), end: new Date(2026, 10, 20)
  });

  it('asks for everything, and a benchmark other than the account', () => {
    expect(component.exportForm.valid).toBeFalse();
    fill(100010);
    expect(component.exportForm.hasError('sameAccount')).toBeTrue();
    fill(100009);
    expect(component.exportForm.valid).toBeTrue();
  });

  it('refuses an as-of date in the future', () => {
    fill(100009);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    component.exportForm.patchValue({end: tomorrow});
    expect(component.check.submit()).toBeFalse();
    expect(component.check.error('end')).toBe('Can\'t be in the future');
  });

  it('loads the summary, the daily history and the cumulative history for the same account and benchmark', () => {
    const service = TestBed.inject(PmaExportService);
    const summarySpy = spyOn(service, 'runPmaSummaryExport').and.returnValue(of(summary as any));
    const historySpy = spyOn(service, 'runPmaHistory').and.callFake((r: any) => of((r.period === 'D' ? daily : cumulative) as any));
    fill(100009);
    component.onSubmit();
    fixture.detectChanges();

    expect(summarySpy.calls.mostRecent().args[0].benchmarkId).toBe(100009);
    expect(summarySpy.calls.mostRecent().args[0].periods).toEqual(['1D', 'MTD', 'QTD', 'YTD', 'ITD']);
    expect(historySpy.calls.allArgs().map(a => a[0].period).sort()).toEqual(['C', 'D']);
    expect(historySpy.calls.allArgs().every(a => a[0].filterSecurities && a[0].benchmarkId === 100009)).toBeTrue();
    expect(component.hasData).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('.tile').length).toBe(5);
    expect(fixture.nativeElement.querySelector('app-cumulative-return-chart')).toBeTruthy();
  });

  it('fills the tiles from the Total row, excess from the API', () => {
    component.buildTiles(summary as any);
    const itd = component.tiles.find(t => t.key === 'ITD');
    expect(itd).toEqual({key: 'ITD', label: 'Since Inception', portfolio: 2.7554, benchmark: 6.5947, excess: -3.8393});
    expect(component.tiles.find(t => t.key === 'MTD').portfolio).toBeNull();
  });

  it('ranks the segments by active weight, leaving out ones neither side holds', () => {
    component.buildWeights(summary as any);
    expect(component.weights.map(w => [w.label, +w.value.toFixed(4)])).toEqual(
      [['Information Technology', 5.89], ['Energy', -2.5353]]);
    expect(component.weights[0].detail).toBe('Portfolio 40.61 · Benchmark 34.72');
  });

  it('links each day\'s Total return into a cumulative return, in date order', () => {
    component.buildChart(daily as any);
    expect(component.points.map(p => p.date)).toEqual(['2025-11-20', '2025-11-21', '2025-11-24']);
    expect(component.points[0]).toEqual({date: '2025-11-20', portfolio: 0, benchmark: 0});
    expect(component.points[2].portfolio).toBeCloseTo((1.1 * 0.99 - 1) * 100, 10);
    expect(component.points[2].benchmark).toBeCloseTo((1.1 * 1.01 - 1) * 100, 10);
  });

  it('shows the period\'s effects and its top contributing and detracting segments', () => {
    component.buildAttribution(cumulative as any);
    expect(component.periodReturns).toEqual({portfolio: 2.7554, benchmark: 6.5947, excess: -3.8393});
    expect(component.effects.map(e => e.label)).toEqual(['Allocation', 'Selection', 'Interaction', 'Total']);
    expect(component.effects[3].value).toBeCloseTo(-3.83, 10);
    expect(component.contributors.map(c => c.label)).toEqual(['Health Care']);
    expect(component.detractors.map(c => c.label)).toEqual(['Information Technology', 'Energy']);
    expect(component.detractors[0].detail).toBe('Allocation (0.03) · Selection (2.92) · Interaction (0.54)');
  });
});
