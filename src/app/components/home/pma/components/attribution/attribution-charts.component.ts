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
import {formatValue} from '../../../../common/pipes/number-format';
import {horizontalBar, truncate} from '../return-charts/pma-return-charts.component';
import {snapZero} from './attribution.component';

/** A row of the attribution tree, as far as the charts need it: its values are in percent, as sent by the API */
export interface AttributionNode {
  key: string;
  name: string;
  row?: { accountValues?: any };
  children?: AttributionNode[];
}

interface Bar {
  key: string;
  name: string;
  shortName: string;
  value: number | null;
  display: string;
  /** Tooltip line under the value */
  detail: string;
  y: number;
  path: string;
  negative: boolean;
  labelX: number;
  labelAnchor: 'start' | 'end';
  emphasised: boolean;
}

const EFFECTS = [
  {field: 'AllocationEffect', label: 'Allocation'},
  {field: 'SelectionEffect', label: 'Selection'},
  {field: 'InteractionEffect', label: 'Interaction'},
  {field: 'TotalEffect', label: 'Total'}
];

const MIN_WIDTH = 260;
const MAX_WIDTH = 1000;
const COLUMN_GAP = 25;   // between the two charts when side by side (matches the CSS gap + divider)
const ROW_HEIGHT = 26;
const BAR = 14;
const NAME_WIDTH = 128;
const TOTAL_GAP = 8;     // extra space above the Total bar, which sums the three before it
const COLLAPSED_KEY = 'attributionCharts.collapsed';

/**
 * Two SVG charts in a strip above the Performance Attribution table:
 *  1. The selected row's allocation, selection and interaction effects and their total.
 *  2. The total effect of the row's segments (a leaf's siblings), ranked; selecting one selects its row.
 * Positive and negative effects use the reports' validated blue/red diverging pair. The table is the charts'
 * table view. The charts sit side by side when the panel has room for two, otherwise stacked, and the strip can
 * be collapsed; that choice is remembered.
 */
@Component({
  selector: 'app-attribution-charts',
  templateUrl: './attribution-charts.component.html',
  styleUrls: ['../return-charts/pma-return-charts.component.css', './attribution-charts.component.css'],
  standalone: false
})
export class AttributionChartsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() row: AttributionNode;
  /** Its parent; a leaf is compared with its siblings */
  @Input() parent: AttributionNode | null = null;
  /** The period the row belongs to, for the titles; empty for a single cumulative period */
  @Input() periodLabel = '';
  /** Number format of the effects (DecimalPipe digits info) */
  @Input() valueFormat = '.4-4';
  /** A segment chosen in the segment chart, by row key */
  @Output() segmentSelect = new EventEmitter<string>();

  width = 360;
  @HostBinding('class.side-by-side') sideBySide = false;
  @HostBinding('class.collapsed') collapsed = readCollapsed();

  effects: Bar[] = [];
  effectsHeight = 0;
  effectsZeroX = 0;
  /** y of the hairline between the three effects and their total */
  totalRuleY = 0;

  segments: Bar[] = [];
  segmentHeight = 0;
  segmentZeroX = 0;
  segmentContainer: AttributionNode | null = null;

  tooltip: { x: number; y: number; value: string; label: string; detail: string } | null = null;

  private resizeObserver: ResizeObserver;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone, @Inject(LOCALE_ID) private locale: string) {
  }

  /** Room for the segment list beside the effects chart, so the two stay level */
  get segmentMaxHeight(): number {
    return Math.max(this.effectsHeight + 40, 150);
  }

  ngOnInit(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w <= 0) {
        return;
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

  selectSegment(bar: Bar) {
    this.tooltip = null;
    this.segmentSelect.emit(bar.key);
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
    this.tooltip = {x: Math.max(90, Math.min(x, box.width - 90)), y, value: bar.display, label: bar.name, detail: bar.detail};
  }

  hideTooltip() {
    this.tooltip = null;
  }

  private build() {
    if (!this.row) {
      this.effects = [];
      this.segments = [];
      return;
    }
    this.buildEffects();
    this.buildSegments();
  }

  private value(node: AttributionNode, field: string): number | null {
    const v = node?.row?.accountValues?.[field];
    return typeof v === 'number' && !isNaN(v) ? snapZero(v) : null;
  }

  private format(v: number | null): string {
    return v === null ? 'No value' : formatValue(v, this.locale, this.valueFormat);
  }

  /** x scale over the values and zero, leaving room for the value labels on the side each bar grows to */
  private scale(values: (number | null)[]): { x: (v: number) => number; zeroX: number } {
    const present = values.filter((v): v is number => v !== null);
    const lo = Math.min(0, ...present);
    const hi = Math.max(0, ...present);
    const labelRoom = Math.max(48, ...present.map(v => this.format(v).length * 6 + 8));
    const left = NAME_WIDTH + (lo < 0 ? labelRoom : 4);
    const right = this.width - 8 - (hi > 0 ? labelRoom : 4);
    const span = hi - lo || 1;
    const x = (v: number) => left + ((v - lo) / span) * (right - left);
    return {x, zeroX: x(0)};
  }

  private bar(key: string, name: string, value: number | null, y: number, x: (v: number) => number, zeroX: number,
              detail: string, emphasised: boolean): Bar {
    const negative = value !== null && value < 0;
    const end = value === null ? zeroX : x(value);
    return {
      key, name, shortName: truncate(name, 20), value, display: this.format(value), detail, y,
      path: value === null ? '' : horizontalBar(zeroX, end, y, BAR),
      negative, labelX: negative ? end - 4 : end + 4, labelAnchor: negative ? 'end' : 'start', emphasised
    };
  }

  private buildEffects() {
    const values = EFFECTS.map(e => this.value(this.row, e.field));
    const {x, zeroX} = this.scale(values);
    this.effectsZeroX = zeroX;
    const yOf = (i: number) => 4 + i * ROW_HEIGHT + (i === EFFECTS.length - 1 ? TOTAL_GAP : 0) + (ROW_HEIGHT - BAR) / 2;
    this.effects = EFFECTS.map((e, i) =>
      this.bar(e.field, e.label, values[i], yOf(i), x, zeroX, `${e.label} effect, ${this.row.name}`, e.field === 'TotalEffect'));
    this.totalRuleY = yOf(EFFECTS.length - 1) - (ROW_HEIGHT - BAR) / 2 - TOTAL_GAP / 2;
    this.effectsHeight = EFFECTS.length * ROW_HEIGHT + TOTAL_GAP + 8;
  }

  private buildSegments() {
    const hasChildren = !!this.row.children?.length;
    this.segmentContainer = hasChildren ? this.row : this.parent;
    const nodes = this.segmentContainer?.children ?? [];
    if (!nodes.length) {
      this.segments = [];
      this.segmentHeight = 0;
      return;
    }
    const rows = nodes
      .map(n => ({node: n, value: this.value(n, 'TotalEffect')}))
      // ranked, largest first; segments without effects last
      .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
    const {x, zeroX} = this.scale(rows.map(r => r.value));
    this.segmentZeroX = zeroX;
    this.segmentHeight = rows.length * ROW_HEIGHT + 8;
    this.segments = rows.map((r, i) => {
      const detail = r.value === null ? 'No attribution for this period'
        : EFFECTS.slice(0, 3).map(e => `${e.label} ${this.format(this.value(r.node, e.field))}`).join(' · ');
      return this.bar(r.node.key, r.node.name, r.value, 4 + i * ROW_HEIGHT + (ROW_HEIGHT - BAR) / 2, x, zeroX, detail,
        !hasChildren && r.node.key === this.row.key);
    });
  }
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}
