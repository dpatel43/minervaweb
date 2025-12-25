import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MinervaTableComponent } from './minerva-table.component';

describe('MinervaPaginatedAndSortedTableComponent', () => {
  let component: MinervaTableComponent;
  let fixture: ComponentFixture<MinervaTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MinervaTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinervaTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
