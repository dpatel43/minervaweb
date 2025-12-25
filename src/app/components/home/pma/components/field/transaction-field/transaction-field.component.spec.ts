import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TransactionFieldComponent} from './transaction-field.component';

describe('TransactionFieldComponent', () => {
  let component: TransactionFieldComponent;
  let fixture: ComponentFixture<TransactionFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TransactionFieldComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
