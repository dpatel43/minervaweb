import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MinervaTableComponent } from './minerva-table.component';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {MineraCommonModule} from '../minera-common.module';

describe('MinervaPaginatedAndSortedTableComponent', () => {
  let component: MinervaTableComponent<unknown>;
  let fixture: ComponentFixture<MinervaTableComponent<unknown>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      // MinervaTableComponent is declared by MineraCommonModule (with paginator and sort)
      imports: [MineraCommonModule],
      providers: [provideNoopAnimations()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinervaTableComponent);
    component = fixture.componentInstance;
    // Required inputs, normally bound by the parent list component
    component.tableColumns = [{columnLabel: 'ID', valueProperty: 'id', numeric: true}];
    component.loadFunction = () => of({content: [], totalElements: 0});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
