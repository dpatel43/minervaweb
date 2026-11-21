/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {AgGridAngular} from '@ag-grid-community/angular';
import {Subscription} from 'rxjs';

/**
 * Sizes an AG Grid to the rows on the current page, so the paging bar sits
 * right under the last row instead of at the bottom of a tall empty area.
 *
 * The grid keeps its normal layout (sticky header, internal scrolling): when
 * the rows need more room than the page has, flexbox shrinks it to fit.
 * The parent must be a flex column that does not grow, e.g. `.results-card.fit-content`.
 *
 *   <ag-grid-angular appFitGridHeight [pagination]="true" ...></ag-grid-angular>
 */
@Directive({
  selector: 'ag-grid-angular[appFitGridHeight]',
  standalone: false
})
export class FitGridHeightDirective implements OnInit, OnDestroy {
  /** Rows of space kept when the page is empty, so the "No rows" message fits */
  @Input() minRows = 3;

  private subscriptions: Subscription[] = [];
  private frame = 0;

  constructor(private grid: AgGridAngular, private el: ElementRef<HTMLElement>, private renderer: Renderer2,
              private zone: NgZone) {
  }

  ngOnInit(): void {
    const host = this.el.nativeElement;
    this.renderer.setStyle(host, 'flex', '0 1 auto');
    this.renderer.setStyle(host, 'min-height', '0');
    this.subscriptions.push(
      this.grid.gridReady.subscribe(() => this.scheduleUpdate()),
      this.grid.rowDataUpdated.subscribe(() => this.scheduleUpdate()),
      this.grid.paginationChanged.subscribe(() => this.scheduleUpdate()),
      this.grid.modelUpdated.subscribe(() => this.scheduleUpdate())
    );
  }

  private scheduleUpdate() {
    this.zone.runOutsideAngular(() => {
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.update());
    });
  }

  private update() {
    const api = this.grid.api;
    const host = this.el.nativeElement;
    const viewport = host.querySelector<HTMLElement>('.ag-body-viewport');
    if (!api || api.isDestroyed() || !viewport) {
      return;
    }

    const total = api.getDisplayedRowCount();
    let rows = total;
    if (this.grid.pagination && !this.grid.paginationAutoPageSize) {
      const size = api.paginationGetPageSize();
      const page = api.paginationGetCurrentPage();
      rows = Math.min(size, total - page * size);
    }
    rows = Math.max(rows, this.minRows);

    const rowHeight = api.getSizesForCurrentTheme().rowHeight;
    // Everything that isn't row area. Summed from the parts rather than taken
    // from host minus viewport, which is wrong while the grid is mid-layout
    // (e.g. before the paging bar is shown).
    const height = (selector: string) => host.querySelector<HTMLElement>(selector)?.offsetHeight ?? 0;
    const wrapper = host.querySelector<HTMLElement>('.ag-root-wrapper');
    const borders = wrapper ? wrapper.offsetHeight - wrapper.clientHeight : 0;
    const chrome = height('.ag-header') + height('.ag-paging-panel') + height('.ag-body-horizontal-scroll')
      + height('.ag-floating-top') + height('.ag-floating-bottom') + borders;
    this.renderer.setStyle(host, 'height', `${chrome + rows * rowHeight}px`);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
