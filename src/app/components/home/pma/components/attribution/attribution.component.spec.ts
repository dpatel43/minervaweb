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
import {AttributionComponent} from './attribution.component';
import {AttributionChartsComponent} from './attribution-charts.component';
import {MineraCommonModule} from '../../../../common/minera-common.module';
import {HomeModule} from '../../../home.module';
import {apiTestingProviders} from '../../../../../testing/test-providers';
import {PmaExportService} from '../../services/pmaexport/pma-export.service';

describe('AttributionComponent', () => {
  let component: AttributionComponent;
  let fixture: ComponentFixture<AttributionComponent>;

  const effects = (alloc: number, sel: number, inter: number) =>
    ({AllocationEffect: alloc, SelectionEffect: sel, InteractionEffect: inter, TotalEffect: alloc + sel + inter});
  const response = {
    exportRows: {
      'C_2025-11-20_2026-11-20': [
        {id: 0, parentId: -1, name: 'Total', startDate: '2025-11-20', endDate: '2026-11-20',
          accountValues: {BaseTotalRor: 2.7554, CompositeBeginWeight: 100, ExcessReturn: -3.8393, ActiveWeight: 0, ...effects(-1.324, -1.732, -0.783)},
          benchmarkValues: {BaseTotalRor: 6.5947, CompositeBeginWeight: 100}},
        {id: 1, parentId: 0, name: 'Information Technology', startDate: '2025-11-20', endDate: '2026-11-20',
          accountValues: {BaseTotalRor: 5.1, CompositeBeginWeight: 40.61, ExcessReturn: -8.2, ActiveWeight: 5.89, ...effects(-0.033, -2.917, -0.542)},
          benchmarkValues: {BaseTotalRor: 13.3, CompositeBeginWeight: 34.72}},
        {id: 2, parentId: 0, name: 'Energy', startDate: '2025-11-20', endDate: '2026-11-20',
          accountValues: {BaseTotalRor: 9.0, ExcessReturn: 1.0, ActiveWeight: -2.39, ...effects(-0.623, 0.025, -0.019)},
          benchmarkValues: {BaseTotalRor: 8.0}}
      ]
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttributionComponent, AttributionChartsComponent],
      imports: [MineraCommonModule, HomeModule],
      providers: [...apiTestingProviders, provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    localStorage.removeItem('minerva.attribution.percentDecimals');
    fixture = TestBed.createComponent(AttributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const fill = (accountId: number, benchmarkId: number) => component.exportForm.patchValue({
    account: {id: accountId, displayValue: 'Growth Equity'}, benchmark: {id: benchmarkId, displayValue: 'S&P 500'},
    profile: {id: 3, displayValue: 'Gics with Country'}, start: new Date(2025, 10, 20), end: new Date(2026, 10, 20)
  });

  it('asks for a benchmark that is not the account', () => {
    const spy = spyOn(TestBed.inject(PmaExportService), 'runPmaHistory');
    fill(100010, 100010);
    component.onSubmit();
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
    expect(component.check.error('benchmark')).toBe('Same as the account');
    expect(fixture.nativeElement.textContent).toContain('Same as the account');
  });

  it('marks what is missing when Retrieve is pressed on an empty form', () => {
    const spy = spyOn(TestBed.inject(PmaExportService), 'runPmaHistory');
    component.onSubmit();
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.field-error').length).toBe(5);
    expect(fixture.nativeElement.querySelectorAll('.is-invalid').length).toBe(5);
  });

  it('wants the end date on or after the start date', () => {
    const spy = spyOn(TestBed.inject(PmaExportService), 'runPmaHistory');
    fill(100010, 100009);
    component.exportForm.patchValue({start: new Date(2026, 0, 2), end: new Date(2026, 0, 1)});
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
    expect(component.check.error('end')).toBe('Before the start date');
  });

  it('requests the account against the chosen benchmark, cumulative by default', () => {
    const service = TestBed.inject(PmaExportService);
    const spy = spyOn(service, 'runPmaHistory').and.returnValue(of(response as any));
    fill(100010, 100009);
    component.onSubmit();

    const request = spy.calls.mostRecent().args[0];
    expect(request.accountId).toBe(100010);
    expect(request.benchmarkId).toBe(100009);
    expect(request.profileId).toBe(3);
    expect(request.period).toBe('C');
  });

  it('shows returns and effects, the benchmark return from the benchmark values', () => {
    (component as any).convertResponse(response);
    fixture.detectChanges();

    const rows = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row')) as HTMLElement[];
    expect(rows.length).toBe(3);
    const cells = (row: HTMLElement) => Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
    const it = cells(rows[1]);
    expect(it[0]).toBe('Information Technology');
    // Weight: Portfolio, Benchmark, Active | Return: Portfolio, Benchmark, Excess | Allocation, Selection, Interaction, Total
    expect(component.showDates).toBeFalse();
    expect(it.slice(1)).toEqual(['40.6100', '34.7200', '5.8900', '5.1000', '13.3000', '(8.2000)',
      '(0.0330)', '(2.9170)', '(0.5420)', '(3.4920)']);
    expect(rows[1].querySelectorAll('td.negative').length).toBe(5);
    expect(component.groups).toEqual(['Weight', 'Return', 'Attribution']);
  });

  it('shows the dates when the report has several periods', () => {
    const month = (end: string) => response.exportRows['C_2025-11-20_2026-11-20'].map(r => ({...r, endDate: end}));
    (component as any).convertResponse({exportRows: {'M_1': month('2025-11-30'), 'M_2': month('2025-12-31')}});
    fixture.detectChanges();

    expect(component.showDates).toBeTrue();
    expect(component.displayedColumns.slice(0, 3)).toEqual(['name', 'startDate', 'endDate']);
    expect(component.totalRows).toBe(6);
  });

  it('charts the Total by default, and a clicked row or a segment picked in the charts', () => {
    (component as any).convertResponse(response);
    fixture.detectChanges();
    expect(component.selectedNode.name).toBe('Total');
    expect(fixture.nativeElement.querySelector('app-attribution-charts')).toBeTruthy();
    expect(component.chartPeriodLabel).toBe('');

    const energy = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'))[2] as HTMLElement;
    energy.click();
    fixture.detectChanges();
    expect(component.selectedNode.name).toBe('Energy');
    expect(component.selectedParent.name).toBe('Total');
    expect(energy.classList).toContain('row-selected');

    component.selectByKey('C_2025-11-20_2026-11-20|1');
    expect(component.selectedNode.name).toBe('Information Technology');
  });

  it('shows floating-point leftovers as 0, not a red (0.0000)', () => {
    const rows = response.exportRows['C_2025-11-20_2026-11-20'].map(r => r.id === 2
      ? {...r, accountValues: {...r.accountValues, ExcessReturn: -1.05e-8, SelectionEffect: -2e-17}} : r);
    (component as any).convertResponse({exportRows: {'C': rows}});
    fixture.detectChanges();
    const energy = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'))[2] as HTMLElement;
    const cells = Array.from(energy.querySelectorAll('td')).map(td => td.textContent.trim());
    expect(cells[6]).toBe('0.0000');   // Excess
    expect(cells[8]).toBe('0.0000');   // Selection
    // active weight, allocation, interaction and total; not the zeroed excess and selection
    expect(energy.querySelectorAll('td.negative').length).toBe(4);
  });

  it('sorts segments by total effect among siblings', () => {
    (component as any).convertResponse(response);
    component.onSortChange({active: 'totalEffect', direction: 'asc'});
    fixture.detectChanges();

    const names = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row td:first-child'))
      .map((td: HTMLElement) => td.textContent.trim());
    expect(names).toEqual(['Total', 'Information Technology', 'Energy']);
  });

  it('exports every column with its group, in percent', () => {
    (component as any).convertResponse(response);
    fill(100010, 100009);
    const table = component.buildExport({scope: 'all', format: 'csv'} as any);

    expect(table.title).toBe('Performance Attribution');
    expect(table.columns.map(c => c.header)).toEqual(
      ['Name', 'Portfolio', 'Benchmark', 'Active', 'Portfolio', 'Benchmark', 'Excess', 'Allocation', 'Selection', 'Interaction', 'Total']);
    expect(table.columns.slice(1, 4).every(c => c.group === 'Weight')).toBeTrue();
    expect(table.columns.slice(1).every(c => c.percent)).toBeTrue();
    expect(table.details).toContain(['Benchmark', 'S&P 500']);
    expect(table.details).toContain(['Period', 'Cumulative']);
    expect(table.rows.length).toBe(3);
  });
});
