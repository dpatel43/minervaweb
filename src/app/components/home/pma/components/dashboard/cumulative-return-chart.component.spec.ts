/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CumulativeReturnChartComponent} from './cumulative-return-chart.component';
import {MineraCommonModule} from '../../../../common/minera-common.module';

describe('CumulativeReturnChartComponent', () => {
  let component: CumulativeReturnChartComponent;
  let fixture: ComponentFixture<CumulativeReturnChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({declarations: [CumulativeReturnChartComponent], imports: [MineraCommonModule]})
      .compileComponents();
    fixture = TestBed.createComponent(CumulativeReturnChartComponent);
    component = fixture.componentInstance;
    component.portfolioName = 'Growth Equity';
    component.benchmarkName = 'S&P 500';
  });

  const build = (points: { date: string; portfolio: number; benchmark: number }[]) => {
    component.points = points;
    component.ngOnChanges();
    fixture.detectChanges();
  };

  it('draws both lines, names them in the legend and labels their ends with the last values', () => {
    build([{date: '2025-11-20', portfolio: 0, benchmark: 0}, {date: '2026-05-20', portfolio: 9.4, benchmark: 11.2},
      {date: '2026-11-20', portfolio: 2.7554, benchmark: 6.5947}]);

    expect(component.series.map(s => [s.name, s.display])).toEqual([['Growth Equity', '2.76'], ['S&P 500', '6.59']]);
    expect(fixture.nativeElement.querySelectorAll('path.series').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.legend').textContent).toContain('S&P 500');
    expect(component.summary).toContain('Growth Equity 2.76, S&P 500 6.59');
    expect(component.excess(2)).toBeCloseTo(2.7554 - 6.5947, 10);
  });

  it('keeps the end labels apart when the lines end close together', () => {
    build([{date: '2025-11-20', portfolio: 0, benchmark: 0}, {date: '2026-11-20', portfolio: 5.0, benchmark: 5.1}]);
    const [p, b] = component.series;
    expect(Math.abs(p.labelY - b.labelY)).toBeGreaterThanOrEqual(26);
  });
});
