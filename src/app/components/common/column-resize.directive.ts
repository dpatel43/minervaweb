/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, Renderer2} from '@angular/core';

/** Column widths in px, keyed by column id. */
export type ColumnWidths = Record<string, number>;

/**
 * Adds a drag handle to the right edge of a header cell so the user can
 * resize that column.
 *
 * The table must use `table-layout: fixed` with a `<colgroup>` bound to the
 * same widths map (see `.resizable-table` in styles.css):
 *
 *   <table mat-table class="resizable-table" [style.width.px]="totalWidth">
 *     <colgroup><col *ngFor="let c of columns" [style.width.px]="widths[c]"></colgroup>
 *     <th mat-header-cell *matHeaderCellDef [appColumnResize]="widths" columnKey="bmv"
 *         (resized)="saveWidths()">BMV</th>
 *
 * The directive updates `widths[columnKey]` in place while dragging.
 * Double-click the handle to restore the column's starting width.
 */
@Directive({
  selector: '[appColumnResize]',
  standalone: false
})
export class ColumnResizeDirective implements OnInit, OnDestroy {
  @Input('appColumnResize') widths: ColumnWidths;
  @Input() columnKey: string;
  @Input() minWidth = 40;

  /** Emits the final widths map when a drag (or reset) ends. */
  @Output() resized = new EventEmitter<ColumnWidths>();

  private handle: HTMLElement;
  private initialWidth: number;
  private startX = 0;
  private startWidth = 0;
  private unlisteners: Array<() => void> = [];

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2, private zone: NgZone) {
  }

  ngOnInit(): void {
    this.initialWidth = this.widths?.[this.columnKey];
    this.renderer.addClass(this.el.nativeElement, 'resizable-header');

    this.handle = this.renderer.createElement('span');
    this.renderer.addClass(this.handle, 'col-resize-handle');
    this.renderer.setAttribute(this.handle, 'aria-hidden', 'true');
    this.renderer.setAttribute(this.handle, 'title', 'Drag to resize, double-click to reset');
    this.renderer.appendChild(this.el.nativeElement, this.handle);

    this.unlisteners.push(
      this.renderer.listen(this.handle, 'mousedown', (e: MouseEvent) => this.onMouseDown(e)),
      this.renderer.listen(this.handle, 'click', (e: MouseEvent) => e.stopPropagation()),
      this.renderer.listen(this.handle, 'dblclick', (e: MouseEvent) => this.reset(e))
    );
  }

  private onMouseDown(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.startX = event.clientX;
    this.startWidth = this.widths[this.columnKey] ?? this.el.nativeElement.offsetWidth;
    document.body.classList.add('col-resizing');
    this.renderer.addClass(this.handle, 'active');

    // Track the drag outside Angular and re-enter only to apply the width.
    this.zone.runOutsideAngular(() => {
      const move = (e: MouseEvent) => {
        const width = Math.max(this.minWidth, Math.round(this.startWidth + e.clientX - this.startX));
        if (width !== this.widths[this.columnKey]) {
          this.zone.run(() => this.widths[this.columnKey] = width);
        }
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.body.classList.remove('col-resizing');
        this.zone.run(() => {
          this.renderer.removeClass(this.handle, 'active');
          this.resized.emit(this.widths);
        });
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }

  private reset(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.initialWidth != null) {
      this.widths[this.columnKey] = this.initialWidth;
      this.resized.emit(this.widths);
    }
  }

  ngOnDestroy(): void {
    this.unlisteners.forEach(u => u());
    document.body.classList.remove('col-resizing');
  }
}
