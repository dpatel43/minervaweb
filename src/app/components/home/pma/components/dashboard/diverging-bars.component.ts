/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, ElementRef, Inject, Input, LOCALE_ID, NgZone, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {formatValue} from '../../../../common/pipes/number-format';
import {horizontalBar, truncate} from '../return-charts/pma-return-charts.component';

/** One labelled value; the bar grows right from zero when positive, left when negative */
export interface BarItem {
  label: string;
  value: number | null;
  /** Second tooltip line, e.g. the parts that make up the value */
  detail?: string;
  /** Bold label, e.g. a total */
  emphasised?: boolean;
  /** A hairline above the row, e.g. before a total */
  ruleBefore?: boolean;
}

interface Bar extends BarItem {
  shortLabel: string;
  display: string;
  y: number;
  path: string;
  negative: boolean;
  labelX: number;
  labelAnchor: 'start' | 'end';
  ruleY: number;
}

const ROW = 26;
const BAR = 14;
const RULE_GAP = 8;

/**
 * A small horizontal bar chart of labelled values around a zero line, sized to its container: blue for
 * positive and red for negative values (the reports' validated diverging pair), the value beside each bar, a
 * tooltip on hover or focus. Used by the dashboard's cards; the values' meaning and unit go in the card title.
 */
@Component({
  selector: 'app-diverging-bars',
  templateUrl: './diverging-bars.component.html',
  styleUrls: ['../return-charts/pma-return-charts.component.css', './diverging-bars.component.css'],
  standalone: false
})
export class DivergingBarsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() items: BarItem[] = [];
  /** Number format of the values (DecimalPipe digits info) */
  @Input() valueFormat = '.2-2';
  /** Width reserved for the labels */
  @Input() labelWidth = 128;
  /** Accessible name of the chart */
  @Input() ariaLabel = '';

  width = 320;
  height = 0;
  zeroX = 0;
  bars: Bar[] = [];
  tooltip: { x: number; y: number; value: string; label: string; detail?: string } | null = null;

  private resizeObserver: ResizeObserver;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone, @Inject(LOCALE_ID) private locale: string) {
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

  showTooltip(event: MouseEvent | FocusEvent, bar: Bar) {
    const box = this.host.nativeElement.getBoundingClientRect();
    let x: number;
    let y: number;
    if (event instanceof MouseEvent) {
      x = event.clientX - box.left;
      y = event.clientY - box.top;
    } else {
      const r = (event.target as Element).getBoundingClientRect();
      x = r.left + r.width / 2 - box.left;
      y = r.top - box.top;
    }
    this.tooltip = {x: Math.max(80, Math.min(x, box.width - 80)), y, value: bar.display, label: bar.label, detail: bar.detail};
  }

  hideTooltip() {
    this.tooltip = null;
  }

  private format(v: number | null): string {
    return v === null ? 'No value' : formatValue(v, this.locale, this.valueFormat);
  }

  private build() {
    const items = this.items ?? [];
    const present = items.map(i => i.value).filter((v): v is number => v !== null && isFinite(v));
    const lo = Math.min(0, ...present);
    const hi = Math.max(0, ...present);
    const labelRoom = Math.max(40, ...present.map(v => this.format(v).length * 6 + 8));
    const left = this.labelWidth + (lo < 0 ? labelRoom : 4);
    const right = this.width - 4 - (hi > 0 ? labelRoom : 4);
    const span = hi - lo || 1;
    const x = (v: number) => left + ((v - lo) / span) * Math.max(1, right - left);
    this.zeroX = x(0);

    let top = 4;
    this.bars = items.map(item => {
      if (item.ruleBefore) {
        top += RULE_GAP;
      }
      const y = top + (ROW - BAR) / 2;
      const ruleY = top - RULE_GAP / 2;
      top += ROW;
      const v = item.value !== null && isFinite(item.value) ? item.value : null;
      const negative = v !== null && v < 0;
      const end = v === null ? this.zeroX : x(v);
      return {
        ...item, value: v, shortLabel: truncate(item.label, Math.floor(this.labelWidth / 6.2)), display: this.format(v), y,
        path: v === null ? '' : horizontalBar(this.zeroX, end, y, BAR), negative,
        labelX: negative ? end - 4 : end + 4, labelAnchor: negative ? 'end' : 'start', ruleY
      };
    });
    this.height = top + 4;
  }
}
