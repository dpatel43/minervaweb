/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {niceDomain, PmaReturnChartsComponent, ReturnNode} from './pma-return-charts.component';

const periods = [
  {key: '1D', label: '1 Day'},
  {key: 'MTD', label: 'Month to Date'},
  {key: 'YTD', label: 'Year to Date'}
];

function node(name: string, values: Record<string, number>, children: ReturnNode[] = []): ReturnNode {
  const accountValues = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, {BaseTotalRor: v}]));
  return {name, pmaExportRow: {accountValues}, children};
}

describe('niceDomain', () => {
  it('rounds out to clean ticks and always includes zero', () => {
    const {lo, hi, step} = niceDomain(-0.013, 0.052);
    expect(step).toBeCloseTo(0.02, 10);
    expect(lo).toBeCloseTo(-0.02, 10);
    expect(hi).toBeCloseTo(0.06, 10);
  });

  it('handles a flat series', () => {
    const {lo, hi} = niceDomain(0, 0);
    expect(hi).toBeGreaterThan(lo);
  });
});

describe('PmaReturnChartsComponent', () => {
  let component: PmaReturnChartsComponent;
  let fixture: ComponentFixture<PmaReturnChartsComponent>;

  const us = node('US Large Cap', {'1D': -0.023, MTD: 0.004, YTD: -0.022});
  const intl = node('International', {'1D': 0.008, MTD: 0.020, YTD: 0.034});
  const equities = node('Equities', {'1D': 0.052, MTD: 0.010, YTD: -0.013}, [us, intl]);
  const cash = node('Cash', {'1D': -0.020, MTD: 0.003, YTD: 0.002});
  const total = node('Total Portfolio', {'1D': -0.025, MTD: 0.011, YTD: 0.016}, [equities, cash]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({declarations: [PmaReturnChartsComponent]}).compileComponents();
    fixture = TestBed.createComponent(PmaReturnChartsComponent);
    component = fixture.componentInstance;
    component.periods = periods;
    component.period = 'YTD';
  });

  function render(row: ReturnNode, parent: ReturnNode | null = null) {
    component.row = row;
    component.parent = parent;
    component.ngOnChanges();
    fixture.detectChanges();
  }

  it('draws one column per period, coloured by sign, labelling only the extremes', () => {
    render(equities);
    expect(component.columns.map(c => c.key)).toEqual(['1D', 'MTD', 'YTD']);
    expect(component.columns.map(c => c.negative)).toEqual([false, false, true]);
    expect(component.columns.filter(c => c.showLabel).map(c => c.key)).toEqual(['1D', 'YTD']);
    expect(fixture.nativeElement.querySelectorAll('g.column path.bar.negative').length).toBe(1);
  });

  it('compares a parent row\'s segments, ranked largest first', () => {
    render(equities);
    expect(component.segmentContainer).toBe(equities);
    expect(component.segments.map(s => s.name)).toEqual(['International', 'US Large Cap']);
    expect(component.segments.some(s => s.emphasised)).toBeFalse();
  });

  it('compares a leaf row with its siblings and emphasises it', () => {
    render(cash, total);
    expect(component.segmentContainer).toBe(total);
    expect(component.segments.map(s => s.name)).toEqual(['Cash', 'Equities']);
    expect(component.segments.find(s => s.emphasised)?.name).toBe('Cash');
  });

  it('shows an empty state for a leaf without a parent', () => {
    render(cash, null);
    expect(component.segments.length).toBe(0);
    expect(fixture.nativeElement.querySelector('.chart-empty').textContent).toContain('Cash has no segments');
  });

  it('asks for a new period when a column is selected', () => {
    render(total);
    const emitted: string[] = [];
    component.periodChange.subscribe((k: string) => emitted.push(k));
    component.selectPeriod('MTD');
    component.selectPeriod('YTD'); // already shown: no event
    expect(emitted).toEqual(['MTD']);
  });

  it('stacks multi-line period labels, such as start and end date, and grows to fit them', () => {
    const before = component.periodHeight;
    component.periods = periods.map(p => ({...p, axisLines: ['Aug 1', 'Aug 31']}));
    render(total);
    expect(component.periodHeight).toBe(before + 12);
    const labels = [...fixture.nativeElement.querySelectorAll('text.period')].map((t: Element) => t.textContent.trim());
    expect(labels.slice(0, 2)).toEqual(['Aug 1', 'Aug 31']);
  });

  it('labels every n-th period, counting back from the latest, when periods are crowded', () => {
    component.periods = Array.from({length: 24}, (_, i) => ({key: 'p' + i, label: 'Period ' + i, short: 'Mon ' + i}));
    component.width = 300;
    render(total);
    const shown = component.columns.filter(c => c.showPeriod);
    expect(shown.length).toBeLessThan(24);
    expect(shown[shown.length - 1].key).toBe('p23');
    expect(shown[0].lines).toEqual([jasmine.stringMatching(/^Mon /)]);
  });
});
