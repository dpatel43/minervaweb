/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

/**
 * Export of a (tree) report table to Excel or CSV, done in the browser.
 *
 * A screen describes its columns and hands over rows already in display order
 * (depth-first, with a tree level). Values are the raw numbers, not the rounded
 * display text, so nothing is lost; Excel shows them with the same number of
 * decimals as the screen through a number format.
 *
 * ExcelJS is loaded with a dynamic import, so it is only downloaded the first
 * time someone exports to Excel.
 */

export type ExportFormat = 'xlsx' | 'csv';
/** 'view' = rows as filtered and sorted on screen; 'all' = everything retrieved */
export type ExportScope = 'view' | 'all';

export interface ExportRequest {
  format: ExportFormat;
  scope: ExportScope;
}

export type ExportValue = string | number | null | undefined;

export interface ExportColumn {
  key: string;
  header: string;
  /** Header shown above this column, merged across neighbours with the same group (e.g. Portfolio) */
  group?: string;
  /** Angular DecimalPipe digits info used on screen, e.g. '.3-5'; marks the column as numeric */
  digits?: string;
  /** Column width in screen pixels; converted to Excel character widths */
  widthPx?: number;
}

export interface ExportRow {
  /** Depth in the tree; 0 for top-level rows */
  level: number;
  values: Record<string, ExportValue>;
  /** Has child rows; shown in bold */
  parent?: boolean;
  /** Only present because a descendant matched the filters; shown muted */
  context?: boolean;
}

export interface TableExport {
  /** Report name, e.g. "Performance History"; first line of the sheet and start of the file name */
  title: string;
  /** Lines under the title, e.g. ['Account', 'ABC Fund'] */
  details: [string, string][];
  columns: ExportColumn[];
  rows: ExportRow[];
  /** Column holding the tree labels; indented by level. Defaults to the first column */
  treeColumn?: string;
}

/** One row's values for the given columns, keyed by column key. */
export function exportValues(columns: ExportColumn[], value: (column: string) => unknown): Record<string, ExportValue> {
  const values: Record<string, ExportValue> = {};
  for (const c of columns) {
    const v = value(c.key);
    values[c.key] = typeof v === 'number' || typeof v === 'string' ? v : null;
  }
  return values;
}

/** Walks a tree depth-first into export rows, in the order given. */
export function flattenForExport<T extends { children?: T[] }>(
  nodes: T[],
  values: (node: T) => Record<string, ExportValue>,
  context: (node: T) => boolean = () => false,
  level = 0,
  out: ExportRow[] = []
): ExportRow[] {
  for (const node of nodes ?? []) {
    const children = node.children ?? [];
    out.push({level, values: values(node), parent: children.length > 0, context: context(node)});
    flattenForExport(children, values, context, level + 1, out);
  }
  return out;
}

/** "Performance History - ABC Fund - 2025-12-31.xlsx", without characters file systems reject. */
export function exportFileName(parts: (string | null | undefined)[], format: ExportFormat): string {
  const name = parts
    .map(p => (p ?? '').toString().trim())
    .filter(p => p)
    .join(' - ')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_')
    .slice(0, 150);
  return `${name || 'export'}.${format}`;
}

/** Date as yyyy-MM-dd in local time (form datepickers give local midnight). */
export function isoDate(value: Date | string | null | undefined): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

// ---------------------------------------------------------------- CSV

/**
 * RFC 4180 CSV: a Level column first so the tree survives, one header row
 * ("Portfolio Return" when grouped), raw numbers with full precision.
 * Starts with a BOM so Excel reads it as UTF-8.
 */
export function toCsv(table: TableExport): string {
  const header = ['Level', ...table.columns.map(c => c.group ? `${c.group} ${c.header}` : c.header)];
  const lines = [header];
  for (const row of table.rows) {
    lines.push([String(row.level), ...table.columns.map(c => csvValue(row.values[c.key]))]);
  }
  return '﻿' + lines.map(l => l.map(csvField).join(',')).join('\r\n') + '\r\n';
}

function csvValue(v: ExportValue): string {
  if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) {
    return '';
  }
  return String(v);
}

function csvField(text: string): string {
  // Neutralise spreadsheet formulas in text cells (CSV injection); numbers are left alone
  if (/^[=+\-@\t\r]/.test(text) && isNaN(Number(text))) {
    text = "'" + text;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// ---------------------------------------------------------------- Excel

/** '.3-5' (DecimalPipe) -> '#,##0.000##' (Excel) */
export function excelNumberFormat(digits: string | undefined): string {
  const m = /^(\d*)\.(\d+)-(\d+)$/.exec(digits ?? '');
  if (!m) {
    return '#,##0.###';
  }
  const min = +m[2];
  const max = Math.max(min, +m[3]);
  return max === 0 ? '#,##0' : '#,##0.' + '0'.repeat(min) + '#'.repeat(max - min);
}

const NAVY = 'FF1F3A5F';
const HEADER_BG = 'FFE6ECF4';
const HEADER_INK = 'FF22385A';
const BORDER = 'FFD8DEE6';
const MUTED = 'FF5F6B7A';

export async function toXlsx(table: TableExport): Promise<Blob> {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Minerva';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(table.title.slice(0, 31), {
    properties: {outlineProperties: {summaryBelow: false}},
    views: [{showGridLines: false}]
  });
  const columns = table.columns;
  const treeKey = table.treeColumn ?? columns[0]?.key;
  const lastCol = Math.max(columns.length, 2);

  // Title and details
  const title = sheet.addRow([table.title]);
  title.font = {bold: true, size: 14, color: {argb: NAVY}};
  for (const [label, value] of table.details) {
    const r = sheet.addRow([label, value]);
    r.getCell(1).font = {color: {argb: MUTED}};
    sheet.mergeCells(r.number, 2, r.number, lastCol);
  }
  sheet.addRow([]);

  // Group header row (merged over each run of columns with the same group)
  const hasGroups = columns.some(c => c.group);
  if (hasGroups) {
    const g = sheet.addRow(columns.map(c => c.group ?? ''));
    let start = 0;
    for (let i = 1; i <= columns.length; i++) {
      if (i === columns.length || columns[i].group !== columns[start].group) {
        if (columns[start].group && i - 1 > start) {
          sheet.mergeCells(g.number, start + 1, g.number, i);
        }
        start = i;
      }
    }
    columns.forEach((c, i) => {
      const cell = g.getCell(i + 1);
      if (c.group) {
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: NAVY}};
        cell.font = {bold: true, color: {argb: 'FFFFFFFF'}};
        cell.alignment = {horizontal: 'center'};
      }
    });
  }

  // Column header row
  const header = sheet.addRow(columns.map(c => c.header));
  header.eachCell((cell: any, col: number) => {
    cell.font = {bold: true, color: {argb: HEADER_INK}};
    cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: HEADER_BG}};
    cell.border = {bottom: {style: 'thin', color: {argb: BORDER}}};
    cell.alignment = {horizontal: columns[col - 1].digits ? 'right' : 'left', vertical: 'middle'};
  });
  const headerRow = header.number;

  // Data rows; tree levels become Excel outline levels, so groups collapse in Excel too
  for (const row of table.rows) {
    const r = sheet.addRow(columns.map(c => excelValue(row.values[c.key])));
    if (row.level > 0) {
      r.outlineLevel = Math.min(row.level, 7);
    }
    columns.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      if (c.digits) {
        cell.numFmt = excelNumberFormat(c.digits);
      }
      if (c.key === treeKey && row.level > 0) {
        cell.alignment = {indent: Math.min(row.level * 2, 15)};
      }
      if (row.parent || row.context) {
        cell.font = {bold: row.parent, italic: row.context, color: row.context ? {argb: MUTED} : undefined};
      }
      cell.border = {bottom: {style: 'hair', color: {argb: BORDER}}};
    });
  }

  // Widths from the screen, header frozen, filter buttons on the header
  columns.forEach((c, i) => {
    const px = c.widthPx ?? (c.digits ? 110 : 160);
    sheet.getColumn(i + 1).width = Math.max(8, Math.round(px / 7));
  });
  sheet.views = [{state: 'frozen', ySplit: headerRow, xSplit: 1, showGridLines: false}];
  if (table.rows.length) {
    sheet.autoFilter = {from: {row: headerRow, column: 1}, to: {row: headerRow, column: columns.length}};
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

function excelValue(v: ExportValue): string | number | null {
  if (v === undefined || v === null || (typeof v === 'number' && !isFinite(v))) {
    return null;
  }
  return v;
}

/**
 * Loads ExcelJS's prebuilt browser bundle (what its package "browser" field points
 * to). Importing it by path keeps its Node-only type definitions (stream, NodeJS)
 * out of this browser build, so the API is untyped here.
 */
async function loadExcelJs(): Promise<any> {
  // @ts-ignore: the bundle ships without type definitions
  const mod: any = await import('exceljs/dist/exceljs.min.js');
  return mod.default ?? mod;
}

// ---------------------------------------------------------------- download

export async function buildExportFile(table: TableExport, format: ExportFormat): Promise<Blob> {
  return format === 'xlsx'
    ? toXlsx(table)
    : new Blob([toCsv(table)], {type: 'text/csv;charset=utf-8'});
}

/** Saves a file through a temporary link. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before releasing the data
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
