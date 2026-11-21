import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FieldDetailComponent} from './field-detail.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {provideRouter} from '@angular/router';
import {HomeModule} from '../../../home.module';
import {apiTestingProviders} from '../../../../../testing/test-providers';
import {provideStore} from '@ngrx/store';
import {field} from '../../store/reducers/field.reducers';

describe('FieldDetailComponent', () => {
  let component: FieldDetailComponent;
  let fixture: ComponentFixture<FieldDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldDetailComponent],
      // HomeModule supplies app-minerva-cache-select, which the form binds with ngModel
      imports: [FormsModule, HomeModule],
      providers: [provideStore({field}), ...apiTestingProviders, provideRouter([])],
      // shallow for the type-specific sub-forms (they have their own specs)
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
