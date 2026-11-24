/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AttributionChartsComponent, AttributionNode} from './attribution-charts.component';
import {MineraCommonModule} from '../../../../common/minera-common.module';

describe('AttributionChartsComponent', () => {
  let component: AttributionChartsComponent;
  let fixture: ComponentFixture<AttributionChartsComponent>;

  const node = (key: string, name: string, a: number, s: number, i: number, children: AttributionNode[] = []): AttributionNode =>
    ({key, name, row: {accountValues: {AllocationEffect: a, SelectionEffect: s, InteractionEffect: i, TotalEffect: a + s + i}}, children});
  const it_ = node('1', 'Information Technology', -0.03, -2.92, -0.54);
  const energy = node('2', 'Energy', -0.62, 0.03, -0.02);
  const health = node('3', 'Health Care', -0.11, 0.88, -0.04);
  const total = node('0', 'Total', -1.32, -1.73, -0.78, [it_, energy, health]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({declarations: [AttributionChartsComponent], imports: [MineraCommonModule]})
      .compileComponents();
    localStorage.removeItem('attributionCharts.collapsed');
    fixture = TestBed.createComponent(AttributionChartsComponent);
    component = fixture.componentInstance;
    component.row = total;
    component.ngOnChanges();
    fixture.detectChanges();
  });

  it('shows the row\'s three effects and their total', () => {
    expect(component.effects.map(e => [e.name, e.display])).toEqual(
      [['Allocation', '(1.3200)'], ['Selection', '(1.7300)'], ['Interaction', '(0.7800)'], ['Total', '(3.8300)']]);
    expect(component.effects.every(e => e.negative)).toBeTrue();
    expect(component.effects[3].emphasised).toBeTrue();
    expect(component.effects[3].y).toBeGreaterThan(component.totalRuleY);
    expect(component.totalRuleY).toBeGreaterThan(component.effects[2].y);
  });

  it('ranks the segments by total effect, with the breakdown for the tooltip', () => {
    expect(component.segmentContainer).toBe(total);
    expect(component.segments.map(s => s.name)).toEqual(['Health Care', 'Energy', 'Information Technology']);
    expect(component.segments[0].negative).toBeFalse();
    expect(component.segments[2].detail).toBe('Allocation (0.0300) · Selection (2.9200) · Interaction (0.5400)');
  });

  it('compares a leaf with its siblings, and selects a segment by key', () => {
    component.row = energy;
    component.parent = total;
    component.ngOnChanges();
    expect(component.segmentContainer).toBe(total);
    expect(component.segments.find(s => s.emphasised).name).toBe('Energy');

    const picked: string[] = [];
    component.segmentSelect.subscribe((key: string) => picked.push(key));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('g.segment.selectable') as SVGElement).dispatchEvent(new MouseEvent('click'));
    expect(picked).toEqual(['3']);
  });

  it('remembers a collapsed strip', () => {
    component.toggleCollapsed();
    expect(localStorage.getItem('attributionCharts.collapsed')).toBe('true');
    expect(TestBed.createComponent(AttributionChartsComponent).componentInstance.collapsed).toBeTrue();
    localStorage.removeItem('attributionCharts.collapsed');
  });
});
