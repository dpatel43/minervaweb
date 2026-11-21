import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FieldComponent} from './field.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {provideStore} from '@ngrx/store';
import {field} from '../../store/reducers/field.reducers';

describe('FieldComponent', () => {
  let component: FieldComponent;
  let fixture: ComponentFixture<FieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldComponent],
      imports: [FormsModule],
      providers: [provideStore({field})],
      // shallow: the list/detail children have their own specs
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
