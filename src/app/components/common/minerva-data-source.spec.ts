import {EventEmitter} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {of} from 'rxjs';
import {MinervaDataSource} from './minerva-data-source';

describe('MinervaDataSource', () => {
  it('should load the first page and expose its rows and total', () => {
    const paginator = {page: new EventEmitter(), pageIndex: 0, pageSize: 20, length: 0} as unknown as MatPaginator;
    const sort = {sortChange: new EventEmitter()} as unknown as MatSort;
    const load = jasmine.createSpy('load').and.returnValue(of({content: [{id: 1}, {id: 2}], totalElements: 42}));

    const dataSource = new MinervaDataSource<{ id: number }>(paginator, sort, load);
    let rows: { id: number }[] = [];
    dataSource.connect(null).subscribe(r => rows = r);

    expect(load).toHaveBeenCalledWith(sort, paginator);
    expect(rows.length).toBe(2);
    expect(paginator.length).toBe(42);
  });
});
