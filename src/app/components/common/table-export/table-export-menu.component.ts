/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ExportFormat, ExportRequest, ExportScope} from './table-export';

/**
 * Export icon buttons for a table toolbar: one per format (Excel, CSV), each a
 * Bootstrap dropdown offering the current view (filters and sort applied) or all
 * retrieved data. The screen builds and saves the file; it sets `busy` meanwhile.
 */
@Component({
  selector: 'app-table-export-menu',
  templateUrl: './table-export-menu.component.html',
  standalone: false
})
export class TableExportMenuComponent {
  @Input() disabled = false;
  @Input() busy = false;
  /** Shown under "Current view", e.g. "12 of 132 rows"; omit when nothing is filtered */
  @Input() viewNote = '';
  @Output() export = new EventEmitter<ExportRequest>();

  /** Format being exported, so only its button shows the spinner */
  busyFormat: ExportFormat | null = null;

  readonly formats: { format: ExportFormat; label: string; icon: string; tone: string }[] = [
    {format: 'xlsx', label: 'Excel', icon: 'bi-file-earmark-excel', tone: 'export-excel'},
    {format: 'csv', label: 'CSV', icon: 'bi-filetype-csv', tone: 'export-csv'}
  ];

  choose(scope: ExportScope, format: ExportFormat) {
    if (!this.disabled && !this.busy) {
      this.busyFormat = format;
      this.export.emit({scope, format});
    }
  }
}
