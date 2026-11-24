/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, ElementRef, Inject, Input, LOCALE_ID, NgZone, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {formatDate} from '@angular/common';
import {formatValue} from '../../../../common/pipes/number-format';
import {niceDomain} from '../return-charts/pma-return-charts.component';

/** Cumulative returns (in percent) at the end of each day */
export interface CumulativePoint {
  date: string;
  portfolio: number | null;
  benchmark: number | null;
}

interface Series {
  key: 'portfolio' | 'benchmark';
  name: string;
  path: string;
  endY: number;
  labelY: number;
  display: string;
}

const HEIGHT = 230;
const M = {top: 14, right: 132, bottom: 26, left: 48};

/**
 * Portfolio and benchmark cumulative return over the dashboard's date range, as two lines on one axis. The two
 * series use the first two categorical slots (blue, orange; both modes validated with the dataviz palette
 * validator against the app's white surface), are named in a legend and labelled at their line ends, and a
 * crosshair shows both values and the excess for the day under the pointer.
 */
@Component({
  selector: 'app-cumulative-return-chart',
  templateUrl: './cumulative-return-chart.component.html',
  styleUrls: ['../return-charts/pma-return-charts.component.css', './cumulative-return-chart.component.css'],
  standalone: false
})
export class CumulativeReturnChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() points: CumulativePoint[] = [];
  @Input() portfolioName = 'Portfolio';
  @Input() benchmarkName = 'Benchmark';
  @Input() valueFormat = '.2-2';

  readonly height = HEIGHT;
  readonly m = M;
  width = 600;
  series: Series[] = [];
  ticks: { y: number; label: string }[] = [];
  dateTicks: { x: number; label: string }[] = [];
  zeroY = 0;
  hover: { x: number; index: number; tipX: number; ys: { portfolio: number | null; benchmark: number | null } } | null = null;

  private xs: number[] = [];
  private y: (v: number) => number = v => v;
  private resizeObserver: ResizeObserver;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone, @Inject(LOCALE_ID) private locale: string) {
  }

  get plotRight(): number {
    return this.width - M.right;
  }

  get summary(): string {
    const last = this.points[this.points.length - 1];
    return last ? `${this.portfolioName} ${this.format(last.portfolio)}, ${this.benchmarkName} ${this.format(last.benchmark)} ` +
      `cumulative return to ${last.date}, in percent` : '';
  }

  ngOnInit(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0 && Math.abs(w - this.width) >= 2) {
        this.zone.run(() => {
          this.width = w;
          this.build();
        });
      }
    });
    this.resizeObserver.observe(this.host.nativeElement);
  }

  ngOnChanges(): void {
    this.build();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  format(v: number | null): string {
    return v === null ? 'No value' : formatValue(v, this.locale, this.valueFormat);
  }

  excess(index: number): number | null {
    const p = this.points[index];
    return p?.portfolio != null && p?.benchmark != null ? p.portfolio - p.benchmark : null;
  }

  dateLabel(index: number): string {
    const d = this.points[index]?.date;
    return d ? formatDate(d, 'mediumDate', this.locale) : '';
  }

  /** The crosshair snaps to the day nearest the pointer */
  onMove(event: MouseEvent) {
    if (!this.xs.length) {
      return;
    }
    const svg = (event.currentTarget as SVGElement).getBoundingClientRect();
    const px = (event.clientX - svg.left) * (this.width / svg.width);
    let index = 0;
    for (let i = 1; i < this.xs.length; i++) {
      if (Math.abs(this.xs[i] - px) < Math.abs(this.xs[index] - px)) {
        index = i;
      }
    }
    const p = this.points[index];
    const x = this.xs[index];
    this.hover = {
      x, index, tipX: Math.max(90, Math.min(x, this.width - 90)),
      ys: {portfolio: p.portfolio == null ? null : this.y(p.portfolio), benchmark: p.benchmark == null ? null : this.y(p.benchmark)}
    };
  }

  onLeave() {
    this.hover = null;
  }

  private build() {
    this.hover = null;
    const pts = this.points ?? [];
    if (!pts.length) {
      this.series = [];
      return;
    }
    // (no flatMap: the app's TypeScript lib predates ES2019)
    const values = ([] as (number | null)[]).concat(...pts.map(p => [p.portfolio, p.benchmark])).filter((v): v is number => v !== null);
    const {lo, hi, step} = niceDomain(Math.min(0, ...values), Math.max(0, ...values));
    const top = M.top;
    const bottom = HEIGHT - M.bottom;
    this.y = v => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
    this.zeroY = this.y(0);
    this.ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) {
      const r = Math.abs(v) < step / 1e6 ? 0 : v;
      this.ticks.push({y: this.y(r), label: formatValue(r, this.locale, '1.0-1')});
    }
    const left = M.left;
    const right = this.plotRight;
    const n = pts.length;
    this.xs = pts.map((_, i) => n === 1 ? (left + right) / 2 : left + (i / (n - 1)) * (right - left));

    // About five date labels, evenly spaced, always the first and the last
    const count = Math.min(n, Math.max(2, Math.floor((right - left) / 110)));
    const idx = [...new Set(Array.from({length: count}, (_, k) => Math.round(k * (n - 1) / Math.max(1, count - 1))))];
    this.dateTicks = idx.map(i => ({x: this.xs[i], label: formatDate(pts[i].date, 'MMM d, yy', this.locale)}));

    const line = (key: 'portfolio' | 'benchmark') => {
      let d = '';
      pts.forEach((p, i) => {
        const v = p[key];
        if (v !== null) {
          d += `${d && pts[i - 1]?.[key] != null ? 'L' : 'M'}${this.xs[i].toFixed(1)},${this.y(v).toFixed(1)}`;
        }
      });
      return d;
    };
    const lastOf = (key: 'portfolio' | 'benchmark') => [...pts].reverse().find(p => p[key] !== null)?.[key] ?? null;
    this.series = (['portfolio', 'benchmark'] as const).map(key => {
      const last = lastOf(key);
      const endY = last === null ? this.zeroY : this.y(last);
      return {key, name: key === 'portfolio' ? this.portfolioName : this.benchmarkName, path: line(key), endY, labelY: endY,
        display: this.format(last)};
    });
    // End labels at least two lines apart, so they never overlap
    const [a, b] = this.series;
    if (Math.abs(a.labelY - b.labelY) < 26) {
      const mid = (a.labelY + b.labelY) / 2;
      const upper = a.labelY <= b.labelY ? a : b;
      const lower = upper === a ? b : a;
      upper.labelY = mid - 13;
      lower.labelY = mid + 13;
    }
  }
}
