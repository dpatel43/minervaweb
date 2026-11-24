/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Inject, LOCALE_ID} from '@angular/core';
import {formatDate} from '@angular/common';
import {FormBuilder, FormGroup, UntypedFormControl} from '@angular/forms';
import {forkJoin} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {formatValue} from '../../../../common/pipes/number-format';
import {PmaExportService} from '../../services/pmaexport/pma-export.service';
import {PmaSummaryExportRequest} from '../../data/pmaexport/pma-summary-export-request';
import {PmaSummaryExportResponse} from '../../data/pmaexport/pma-summary-export-response';
import {PmaHistoryRequest} from '../../data/pma-history/pma-history-request';
import {PmaHistoryResponse} from '../../data/pma-history/pma-history-response';
import {PmaHistoryRow} from '../../data/pma-history/pma-history-row';
import {BarItem} from './diverging-bars.component';
import {CumulativePoint} from './cumulative-return-chart.component';
import {AssistantContextService} from '../../../../../services/ai/assistant-context.service';
import {ActivatedRoute} from '@angular/router';

/** Values on the dashboard: percentages, two decimals */
export const DASHBOARD_DIGITS = '.2-2';
const TOP_SEGMENTS = 5;

export interface ReturnTile {
  key: string;
  label: string;
  portfolio: number | null;
  benchmark: number | null;
  excess: number | null;
}

const EFFECTS = [
  {field: 'AllocationEffect', label: 'Allocation'},
  {field: 'SelectionEffect', label: 'Selection'},
  {field: 'InteractionEffect', label: 'Interaction'}
];

/**
 * One account against a chosen benchmark, as of an end date: return tiles for standard periods, the cumulative
 * return of both over the date range, the period's attribution with its top contributing and detracting
 * segments, and the active weight of each segment. It reads the same exports as the reports (Summary for the
 * tiles and weights, History daily for the chart and cumulative for the attribution), in parallel.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: false
})
export class DashboardComponent {

  readonly periods = [
    {key: '1D', label: '1 Day'},
    {key: 'MTD', label: 'Month to Date'},
    {key: 'QTD', label: 'Quarter to Date'},
    {key: 'YTD', label: 'Year to Date'},
    {key: 'ITD', label: 'Since Inception'}
  ];
  readonly digits = DASHBOARD_DIGITS;

  exportForm: FormGroup;
  loading = false;
  error = '';
  /** Names and dates of what is shown (the form may have changed since) */
  shown: { account: string; benchmark: string; start: string; end: string } | null = null;

  tiles: ReturnTile[] = [];
  points: CumulativePoint[] = [];
  /** The period's portfolio, benchmark and excess return, for the attribution card's subtitle */
  periodReturns: { portfolio: number | null; benchmark: number | null; excess: number | null } | null = null;
  effects: BarItem[] = [];
  contributors: BarItem[] = [];
  detractors: BarItem[] = [];
  weights: BarItem[] = [];
  /** This screen's tab, for sharing its selection with the app-level AI assistant */
  private readonly tabUrl: string;

  constructor(private pmaExportService: PmaExportService, private formBuilder: FormBuilder,
              @Inject(LOCALE_ID) private locale: string, private assistant: AssistantContextService, route: ActivatedRoute) {
    this.tabUrl = AssistantContextService.tabUrlOf(route);
    this.exportForm = this.formBuilder.group({
      account: new UntypedFormControl(),
      benchmark: new UntypedFormControl(),
      profile: new UntypedFormControl(),
      start: new UntypedFormControl(),
      end: new UntypedFormControl()
    });
  }

  get canRetrieve(): boolean {
    const {account, benchmark, profile, start, end} = this.exportForm.value;
    return !!account?.id && !!benchmark?.id && !!profile?.id && !!start && !!end;
  }

  get sameAccount(): boolean {
    const {account, benchmark} = this.exportForm.value;
    return !!account?.id && account.id === benchmark?.id;
  }

  get hasData(): boolean {
    return !!this.shown;
  }

  format(v: number | null): string {
    return v === null || v === undefined ? '–' : formatValue(v, this.locale, this.digits);
  }

  onSubmit() {
    if (!this.canRetrieve || this.sameAccount || this.loading) {
      return;
    }
    const {account, benchmark, profile, start, end} = this.exportForm.value;

    const summary = new PmaSummaryExportRequest();
    summary.accountId = account.id;
    summary.benchmarkId = benchmark.id;
    summary.profileId = profile.id;
    summary.endDate = end;
    summary.periods = this.periods.map(p => p.key);
    summary.filterSecurities = true;

    const history = (period: string) => {
      const request = new PmaHistoryRequest();
      request.accountId = account.id;
      request.benchmarkId = benchmark.id;
      request.profileId = profile.id;
      request.startDate = start;
      request.endDate = end;
      request.period = period;
      request.filterSecurities = true;
      return this.pmaExportService.runPmaHistory(request);
    };

    this.loading = true;
    this.error = '';
    forkJoin({
      summary: this.pmaExportService.runPmaSummaryExport(summary),
      daily: history('D'),
      cumulative: history('C')
    }).pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({summary: s, daily, cumulative}) => {
          this.shown = {
            account: account.displayValue ?? String(account.id),
            benchmark: benchmark.displayValue ?? String(benchmark.id),
            start: formatDate(start, 'mediumDate', this.locale),
            end: formatDate(end, 'mediumDate', this.locale)
          };
          this.assistant.publish('dashboard', {
            accountId: account.id, benchmarkId: benchmark.id, profileId: profile.id,
            startDate: formatDate(start, 'yyyy-MM-dd', this.locale), endDate: formatDate(end, 'yyyy-MM-dd', this.locale)
          }, this.tabUrl);
          this.buildTiles(s);
          this.buildWeights(s);
          this.buildChart(daily);
          this.buildAttribution(cumulative);
        },
        error: e => {
          console.error('Dashboard request failed', e);
          this.error = 'The dashboard could not be loaded. Please try again.';
        }
      });
  }

  /** Root row (Total) and its direct segments of a flat export */
  private split<T extends { id: number; parentId: number }>(rows: T[]): { root: T | null; segments: T[] } {
    const root = rows.find(r => r.id == 0) ?? null;
    return {root, segments: root ? rows.filter(r => r.parentId === root.id) : []};
  }

  private num(v: unknown): number | null {
    return typeof v === 'number' && isFinite(v) ? v : null;
  }

  buildTiles(response: PmaSummaryExportResponse) {
    const {root} = this.split(response.exportRows ?? []);
    const account = (root?.accountValues ?? {}) as any;
    const benchmark = (root?.benchmarkValues ?? {}) as any;
    this.tiles = this.periods.map(p => {
      const portfolio = this.num(account[p.key]?.BaseTotalRor);
      const bench = this.num(benchmark[p.key]?.BaseTotalRor);
      const excess = this.num(account[p.key]?.ExcessReturn) ?? (portfolio !== null && bench !== null ? portfolio - bench : null);
      return {key: p.key, label: p.label, portfolio, benchmark: bench, excess};
    });
  }

  /**
   * Active begin weight of each top-level segment on the end date (the weights at the previous close). Segments
   * neither side holds that day, such as cash spent earlier, are left out.
   */
  buildWeights(response: PmaSummaryExportResponse) {
    const {segments} = this.split(response.exportRows ?? []);
    this.weights = segments
      .map(s => ({
        name: s.name,
        p: this.num((s.accountValues as any)?.['1D']?.CompositeBeginWeight) ?? 0,
        b: this.num((s.benchmarkValues as any)?.['1D']?.CompositeBeginWeight) ?? 0
      }))
      .filter(w => w.p !== 0 || w.b !== 0)
      .map(w => ({label: w.name, value: w.p - w.b, detail: `Portfolio ${this.format(w.p)} · Benchmark ${this.format(w.b)}`}))
      .sort((x, y) => y.value - x.value);
  }

  /** Each day's Total return, linked from the start date into a cumulative return for both */
  buildChart(response: PmaHistoryResponse) {
    const days = Object.values(response.exportRows ?? {})
      .map((rows: PmaHistoryRow[]) => rows.find(r => r.id == 0))
      .filter(r => !!r)
      .sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)));
    let p = 1;
    let b = 1;
    this.points = days.map(r => {
      p *= 1 + (this.num((r.accountValues as any)?.BaseTotalRor) ?? 0) / 100;
      b *= 1 + (this.num((r.benchmarkValues as any)?.BaseTotalRor) ?? 0) / 100;
      return {date: String(r.endDate), portfolio: (p - 1) * 100, benchmark: (b - 1) * 100};
    });
  }

  buildAttribution(response: PmaHistoryResponse) {
    const rows = (Object.values(response.exportRows ?? {})[0] ?? []) as PmaHistoryRow[];
    const {root, segments} = this.split(rows);
    const values = (row: PmaHistoryRow) => (row?.accountValues ?? {}) as any;
    const total = values(root);
    this.periodReturns = root ? {
      portfolio: this.num(total.BaseTotalRor),
      benchmark: this.num((root.benchmarkValues as any)?.BaseTotalRor),
      excess: this.num(total.ExcessReturn)
    } : null;
    this.effects = root ? [
      ...EFFECTS.map(e => ({label: e.label, value: this.num(total[e.field])})),
      {label: 'Total', value: this.num(total.TotalEffect), emphasised: true, ruleBefore: true}
    ] : [];

    const ranked = segments
      .map(s => ({
        label: s.name,
        value: this.num(values(s).TotalEffect),
        detail: EFFECTS.map(e => `${e.label} ${this.format(this.num(values(s)[e.field]))}`).join(' · ')
      }))
      .filter(s => s.value !== null);
    this.contributors = ranked.filter(s => s.value > 0).sort((x, y) => y.value - x.value).slice(0, TOP_SEGMENTS);
    this.detractors = ranked.filter(s => s.value < 0).sort((x, y) => x.value - y.value).slice(0, TOP_SEGMENTS);
  }
}
