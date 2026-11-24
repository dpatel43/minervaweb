/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DivergingBarsComponent} from './diverging-bars.component';
import {MineraCommonModule} from '../../../../common/minera-common.module';

describe('DivergingBarsComponent', () => {
  let component: DivergingBarsComponent;
  let fixture: ComponentFixture<DivergingBarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({declarations: [DivergingBarsComponent], imports: [MineraCommonModule]}).compileComponents();
    fixture = TestBed.createComponent(DivergingBarsComponent);
    component = fixture.componentInstance;
  });

  it('grows positive bars right and negative ones left of zero, with a rule before a total', () => {
    component.items = [
      {label: 'Allocation', value: 0.5},
      {label: 'Selection', value: -1.25},
      {label: 'Total', value: -0.75, emphasised: true, ruleBefore: true}
    ];
    component.ngOnChanges();
    fixture.detectChanges();

    const [a, s, t] = component.bars;
    expect([a.display, s.display, t.display]).toEqual(['0.50', '(1.25)', '(0.75)']);
    expect(a.labelAnchor).toBe('start');
    expect(s.negative && s.labelAnchor === 'end').toBeTrue();
    expect(a.labelX).toBeGreaterThan(component.zeroX);
    expect(s.labelX).toBeLessThan(component.zeroX);
    expect(t.ruleY).toBeGreaterThan(s.y);
    expect(t.y - s.y).toBe(26 + 8);
    expect(fixture.nativeElement.querySelectorAll('line.rule').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('path.bar.negative').length).toBe(2);
  });

  it('draws no bar for a missing value', () => {
    component.items = [{label: 'Other', value: null}];
    component.ngOnChanges();
    expect(component.bars[0].path).toBe('');
    expect(component.bars[0].display).toBe('No value');
  });
});
