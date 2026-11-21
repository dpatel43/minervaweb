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
      expect(component.chartPeriods[0].axisLines).toEqual(['Aug 1', 'Aug 31']);
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
});
