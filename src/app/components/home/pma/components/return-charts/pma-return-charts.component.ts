/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {
  Component, ElementRef, EventEmitter, HostBinding, Inject, Input, LOCALE_ID, NgZone, OnChanges, OnDestroy, OnInit,
  Output
} from '@angular/core';
import {formatNumber} from '@angular/common';

export interface ChartPeriod {
  key: string;
  label: string;
  /** Axis label; defaults to the key */
  short?: string;
  /** Axis label on several lines (e.g. start and end date); takes precedence over short */
  axisLines?: string[];
}

/**
 * A row of the report tree, as far as the charts need it: its return for each
 * period is accountValues[periodKey].BaseTotalRor.
 */
export interface ReturnNode {
  name: string;
  pmaExportRow?: { id?: number; accountValues?: any };
  children?: ReturnNode[];
}

interface Column {
  key: string;
  label: string;
  /** Axis label, one entry per line */
  lines: string[];
  showPeriod: boolean;
  value: number | null;
  display: string;
  bandX: number;
  bandWidth: number;
  path: string;
  negative: boolean;
  labelY: number;
  showLabel: boolean;
}

interface Segment {
  name: string;
  shortName: string;
  value: number | null;
  display: string;
  y: number;
  path: string;
  negative: boolean;
  labelX: number;
  labelAnchor: 'start' | 'end';
  emphasised: boolean;
}

interface Tick {
  y: number;
  label: string;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 1000;
const COLUMN_GAP = 25;    // between the two charts when side by side (matches the CSS gap + divider)
const PERIOD_PLOT_HEIGHT = 150;
const COLLAPSED_KEY = 'pmaReturnCharts.collapsed';
const BAR_MAX = 24;       // mark spec: bars never thicker than 24px
const RADIUS = 4;         // rounded data end, square at the baseline
const AXIS_LINE = 12;     // height of one line of period label
const PERIOD_BOTTOM = 42; // value label under a negative column + one line of period label

/**
 * Two SVG charts in a strip above the Performance Summary / History tables:
 *  1. Returns by period for the selected row (columns above/below zero).
 *  2. Returns of the row's sub-segments for one period (ranked bars).
 * Positive and negative returns use a validated blue/red diverging pair.
 * The table itself is the charts' table view.
 * The charts sit side by side when the panel has room for two, otherwise stacked.
 * The strip can be collapsed to give the table the room; that choice is remembered.
 */
@Component({
  selector: 'app-pma-return-charts',
  templateUrl: './pma-return-charts.component.html',
  styleUrls: ['./pma-return-charts.component.css'],
  standalone: false
})
export class PmaReturnChartsComponent implements OnInit, OnChanges, OnDestroy {
  /** Row being charted */
  @Input() row: ReturnNode;
  /** Its parent; used to compare a leaf with its siblings */
  @Input() parent: ReturnNode | null = null;
  @Input() periods: ChartPeriod[] = [];
  /** Period shown in the segment chart */
  @Input() period: string;
  /** Number format of the returns (DecimalPipe digits info) */
  @Input() valueFormat = '.3-3';
  @Output() periodChange = new EventEmitter<string>();

  /** Width of one chart */
  width = 360;
  /** Two charts side by side (the panel is wide enough) rather than stacked */
  @HostBinding('class.side-by-side') sideBySide = false;
  @HostBinding('class.collapsed') collapsed = readCollapsed();

  // Chart 1: returns by period
  // grows by one line for each extra line of period label, so the plot keeps its height
  periodHeight = PERIOD_PLOT_HEIGHT;
  // bottom: room for a value label under a negative column, then the period labels
  private readonly m = {top: 18, right: 8, bottom: PERIOD_BOTTOM, left: 44};
  columns: Column[] = [];
  ticks: Tick[] = [];
  zeroY = 0;
  plotLeft = this.m.left;
  plotRight = 0;

  // Chart 2: segment returns
  segments: Segment[] = [];
  segmentHeight = 0;
  segmentZeroX = 0;
  segmentContainer: ReturnNode | null = null;
  private readonly rowHeight = 26;
  private readonly segBar = 14;
  private readonly nameWidth = 128;

  tooltip: { x: number; y: number; value: string; label: string } | null = null;

  private resizeObserver: ResizeObserver;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone, @Inject(LOCALE_ID) private locale: string) {
  }

  get periodLabel(): string {
    return this.periods.find(p => p.key === this.period)?.label ?? this.period;
  }

  ngOnInit(): void {
    // Fill whatever width the panel has: two charts side by side when both get at
    // least MIN_WIDTH, otherwise one per line
    this.resizeObserver = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w <= 0) {
        return; // collapsed or hidden: keep the last layout
      }
      const sideBySide = w >= 2 * MIN_WIDTH + COLUMN_GAP;
      const column = sideBySide ? Math.floor((w - COLUMN_GAP) / 2) : w;
      const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, column));
      if (sideBySide !== this.sideBySide || Math.abs(width - this.width) >= 2) {
        this.zone.run(() => {
          this.sideBySide = sideBySide;
          this.width = width;
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

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    this.tooltip = null;
    try {
      localStorage.setItem(COLLAPSED_KEY, String(this.collapsed));
    } catch {
      // storage unavailable: the choice just isn't remembered
    }
  }

  selectPeriod(key: string) {
    if (key !== this.period) {
      this.periodChange.emit(key);
    }
  }

  showTooltip(event: MouseEvent | FocusEvent, label: string, display: string) {
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
    // keep the centred tooltip inside the panel
    this.tooltip = {x: Math.max(60, Math.min(x, box.width - 60)), y, value: display, label};
  }

  hideTooltip() {
    this.tooltip = null;
  }

  private build() {
    if (!this.row) {
      this.columns = [];
      this.segments = [];
      return;
    }
    this.buildPeriodChart();
    this.buildSegmentChart();
  }

  private value(node: ReturnNode, period: string): number | null {
    const v = node?.pmaExportRow?.accountValues?.[period]?.BaseTotalRor;
    return typeof v === 'number' && !isNaN(v) ? v : null;
  }

  private format(v: number | null): string {
    return v === null ? 'No value' : formatNumber(v, this.locale, this.valueFormat);
  }

  private buildPeriodChart() {
    const lines = this.periods.map(p => p.axisLines?.length ? p.axisLines : [p.short ?? p.key]);
    const extraLines = Math.max(0, ...lines.map(l => l.length - 1));
    this.periodHeight = PERIOD_PLOT_HEIGHT + extraLines * AXIS_LINE;
    this.m.bottom = PERIOD_BOTTOM + extraLines * AXIS_LINE;

    const values = this.periods.map(p => this.value(this.row, p.key));
    const present = values.filter((v): v is number => v !== null);
    const {lo, hi, step} = niceDomain(Math.min(0, ...present), Math.max(0, ...present));

    this.plotRight = this.width - this.m.right;
    const top = this.m.top;
    const bottom = this.periodHeight - this.m.bottom;
    const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
    this.zeroY = y(0);

    this.ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) {
      const rounded = Math.abs(v) < step / 1e6 ? 0 : v;
      this.ticks.push({y: y(rounded), label: formatNumber(rounded, this.locale, decimalsFor(step))});
    }

    const band = (this.plotRight - this.plotLeft) / this.periods.length;
    const barWidth = Math.min(BAR_MAX, band * 0.55);
    // Label only the extremes; the axis, tooltip and table carry the rest
    const max = present.length ? Math.max(...present) : null;
    const min = present.length ? Math.min(...present) : null;
    // Many periods: label every n-th one, counting back from the latest
    const labelWidth = Math.max(...[].concat(...lines).map((t: string) => t.length)) * 6 + 8;
    const every = Math.max(1, Math.ceil(labelWidth / band));
    const last = this.periods.length - 1;

    this.columns = this.periods.map((p, i) => {
      const v = values[i];
      const bandX = this.plotLeft + i * band;
      const x = bandX + (band - barWidth) / 2;
      const negative = v !== null && v < 0;
      const end = v === null ? this.zeroY : y(v);
      return {
        key: p.key,
        label: p.label,
        lines: lines[i],
        showPeriod: (last - i) % every === 0,
        value: v,
        display: this.format(v),
        bandX,
        bandWidth: band,
        path: v === null ? '' : verticalBar(x, barWidth, this.zeroY, end),
        negative,
        labelY: negative ? end + 12 : end - 5,
        showLabel: v !== null && v !== 0 && (v === max || v === min)
      };
    });
  }

  private buildSegmentChart() {
    // A row with sub-segments compares them; a leaf is compared with its siblings
    const hasChildren = !!this.row.children?.length;
    this.segmentContainer = hasChildren ? this.row : this.parent;
    const nodes = this.segmentContainer?.children ?? [];
    if (!nodes.length) {
      this.segments = [];
      this.segmentHeight = 0;
      return;
    }

    const rows = nodes
      .map(n => ({node: n, value: this.value(n, this.period)}))
      // ranked, largest first; rows without a value last
      .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
    const present = rows.map(r => r.value).filter((v): v is number => v !== null);
    const lo = Math.min(0, ...present);
    const hi = Math.max(0, ...present);
    const labelRoom = 48;
    const left = this.nameWidth + (lo < 0 ? labelRoom : 4);
    const right = this.width - 8 - (hi > 0 ? labelRoom : 4);
    const span = hi - lo || 1;
    const x = (v: number) => left + ((v - lo) / span) * (right - left);
    this.segmentZeroX = x(0);
    this.segmentHeight = rows.length * this.rowHeight + 8;

    this.segments = rows.map((r, i) => {
      const yTop = 4 + i * this.rowHeight + (this.rowHeight - this.segBar) / 2;
      const v = r.value;
      const negative = v !== null && v < 0;
      const end = v === null ? this.segmentZeroX : x(v);
      return {
        name: r.node.name,
        shortName: truncate(r.node.name, 20),
        value: v,
        display: this.format(v),
        y: yTop,
        path: v === null ? '' : horizontalBar(this.segmentZeroX, end, yTop, this.segBar),
        negative,
        labelX: negative ? end - 4 : end + 4,
        labelAnchor: negative ? 'end' : 'start',
        emphasised: !hasChildren && r.node === this.row
      };
    });
  }
}

/** Domain rounded out to clean ticks (about four intervals), always including zero */
export function niceDomain(min: number, max: number): { lo: number; hi: number; step: number } {
  if (min === max) {
    max = min + 0.01;
  }
  const step = niceStep((max - min) / 4);
  return {lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step};
}

function niceStep(x: number): number {
  const exp = Math.floor(Math.log10(x));
  const f = x / Math.pow(10, exp);
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * Math.pow(10, exp);
}

function decimalsFor(step: number): string {
  const d = Math.max(0, Math.min(4, -Math.floor(Math.log10(step))));
  return `1.${d}-${d}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/** Column from the baseline y0 to y1, rounded at the data end only */
function verticalBar(x: number, w: number, y0: number, y1: number): string {
  const h = Math.abs(y1 - y0);
  if (h < 0.5) {
    return '';
  }
  const r = Math.min(RADIUS, h, w / 2);
  const dir = y1 < y0 ? 1 : -1; // 1: grows up
  return `M${x},${y0} L${x},${y1 + dir * r} Q${x},${y1} ${x + r},${y1} L${x + w - r},${y1} ` +
    `Q${x + w},${y1} ${x + w},${y1 + dir * r} L${x + w},${y0} Z`;
}

/** Bar from the baseline x0 to x1, rounded at the data end only */
function horizontalBar(x0: number, x1: number, y: number, h: number): string {
  const w = Math.abs(x1 - x0);
  if (w < 0.5) {
    return '';
  }
  const r = Math.min(RADIUS, w, h / 2);
  const dir = x1 > x0 ? 1 : -1; // 1: grows right
  return `M${x0},${y} L${x1 - dir * r},${y} Q${x1},${y} ${x1},${y + r} L${x1},${y + h - r} ` +
    `Q${x1},${y + h} ${x1 - dir * r},${y + h} L${x0},${y + h} Z`;
}

/** Finds a row by id in a report tree, with its parent (null for a top-level row). */
export function findWithParent<T extends ReturnNode>(nodes: T[], id: number, parent: T | null = null)
  : { node: T; parent: T | null } | null {
  for (const node of nodes ?? []) {
    if (node.pmaExportRow?.id === id) {
      return {node, parent};
    }
    const found = findWithParent((node.children ?? []) as T[], id, node);
    if (found) {
      return found;
    }
  }
  return null;
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}
