/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {
  excelNumberFormat, exportFileName, exportValues, flattenForExport, isoDate, TableExport, toCsv, toXlsx
} from './table-export';

interface Node {
  name: string;
  ror?: number;
  ctx?: boolean;
  children?: Node[];
}

const tree: Node[] = [{
  name: 'Total', ror: 0.0123456, children: [
    {name: 'Equities', ror: -0.02, ctx: true, children: [{name: 'Tech, "Big"', ror: 0.031}]},
    {name: 'Cash'}
  ]
}];

function table(): TableExport {
  const columns = [
    {key: 'name', header: 'Name', widthPx: 210},
    {key: 'ror', header: 'Return', group: 'Portfolio', digits: '.3-5'},
    {key: 'bm', header: 'Return', group: 'Benchmark', digits: '.3-5'}
  ];
  return {
    title: 'Performance History',
    details: [['Account', 'ABC Fund']],
    columns,
    rows: flattenForExport(tree, n => exportValues(columns, k => k === 'name' ? n.name : k === 'ror' ? n.ror : 0.001),
      n => !!n.ctx),
    treeColumn: 'name'
  };
}

describe('table export', () => {
  it('flattens a tree depth-first with levels, parents and context rows', () => {
    const rows = table().rows;
    expect(rows.map(r => [r.values['name'], r.level, r.parent, r.context])).toEqual([
      ['Total', 0, true, false],
      ['Equities', 1, true, true],
      ['Tech, "Big"', 2, false, false],
      ['Cash', 1, false, false]
    ]);
    expect(rows[3].values['ror']).toBeNull();
  });

  it('writes CSV with a level column, grouped headers, raw numbers and quoting', () => {
    const lines = toCsv(table()).replace(/^﻿/, '').trim().split('\r\n');
    expect(lines[0]).toBe('Level,Name,Portfolio Return,Benchmark Return');
    expect(lines[1]).toBe('0,Total,0.0123456,0.001');
    expect(lines[3]).toBe('2,"Tech, ""Big""",0.031,0.001');
    expect(lines[4]).toBe('1,Cash,,0.001');
  });

  it('neutralises formulas in CSV text but keeps negative numbers', () => {
    const t = table();
    t.rows = [{level: 0, values: {name: '=HYPERLINK("x")', ror: -0.5, bm: null}}];
    const line = toCsv(t).trim().split('\r\n')[1];
    expect(line).toBe(`0,"'=HYPERLINK(""x"")",-0.5,`);
  });

  it('maps DecimalPipe digits to Excel number formats', () => {
    expect(excelNumberFormat('.3-3')).toBe('#,##0.000');
    expect(excelNumberFormat('.3-5')).toBe('#,##0.000##');
    expect(excelNumberFormat('.0-0')).toBe('#,##0');
    expect(excelNumberFormat('.3-5', true)).toBe('#,##0.000##%');
  });

  it('keeps percentage points in CSV with (%) in the header, and stores fractions in Excel', async () => {
    const t = table();
    t.columns[1].percent = true;
    const lines = toCsv(t).replace(/^\uFEFF/, '').trim().split('\r\n');
    expect(lines[0]).toBe('Level,Name,Portfolio Return (%),Benchmark Return');
    expect(lines[1]).toBe('0,Total,0.0123456,0.001');

    const blob = await toXlsx(t);
    // @ts-ignore: bundle without type definitions
    const mod: any = await import('exceljs/dist/exceljs.min.js');
    const wb = new (mod.default ?? mod).Workbook();
    await wb.xlsx.load(await blob.arrayBuffer());
    const cell = wb.worksheets[0].getRow(6).getCell(2);
    expect(cell.value).toBeCloseTo(0.000123456, 12);
    expect(cell.numFmt).toBe('#,##0.000##%');
    expect(wb.worksheets[0].getRow(6).getCell(3).value).toBe(0.001);
  });

  it('builds safe file names and ISO dates', () => {
    expect(exportFileName(['Performance History', 'A/B: Fund', '2025-01-01 to 2025-12-31', ''], 'csv'))
      .toBe('Performance History - A_B_ Fund - 2025-01-01 to 2025-12-31.csv');
    expect(exportFileName([], 'xlsx')).toBe('export.xlsx');
    expect(isoDate(new Date(2025, 0, 5))).toBe('2025-01-05');
    expect(isoDate('2025-03-31T00:00:00Z')).toBe('2025-03-31');
  });

  it('writes an Excel workbook with grouped headers, numbers, outline levels and a frozen header', async () => {
    const blob = await toXlsx(table());
    // @ts-ignore: bundle without type definitions
    const mod: any = await import('exceljs/dist/exceljs.min.js');
    const ExcelJS = mod.default ?? mod;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await blob.arrayBuffer());
    const ws = wb.worksheets[0];

    expect(ws.name).toBe('Performance History');
    expect(ws.getCell('A1').value).toBe('Performance History');
    expect(ws.getCell('B2').value).toBe('ABC Fund');
    // row 3 blank, 4 = groups, 5 = headers, 6.. = data
    expect(ws.getCell('B4').value).toBe('Portfolio');
    expect(ws.getCell('C4').value).toBe('Benchmark');
    expect(ws.getRow(5).values.slice(1)).toEqual(['Name', 'Return', 'Return']);

    const total = ws.getRow(6);
    expect(total.getCell(2).value).toBe(0.0123456);
    expect(total.getCell(2).numFmt).toBe('#,##0.000##');
    expect(total.getCell(1).font.bold).toBeTrue();

    const tech = ws.getRow(8);
    expect(tech.getCell(1).value).toBe('Tech, "Big"');
    expect(tech.outlineLevel).toBe(2);
    expect(tech.getCell(1).alignment.indent).toBe(4);
    expect(ws.getRow(9).getCell(2).value).toBeNull();

    expect(ws.views[0].state).toBe('frozen');
    expect(ws.views[0].ySplit).toBe(5);
  });
});
