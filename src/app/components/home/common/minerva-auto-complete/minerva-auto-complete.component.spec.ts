import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MinervaAutoCompleteComponent } from './minerva-auto-complete.component';

describe('MinervaAutoCompleteComponent', () => {
  let component: MinervaAutoCompleteComponent;
  let fixture: ComponentFixture<MinervaAutoCompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MinervaAutoCompleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinervaAutoCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
