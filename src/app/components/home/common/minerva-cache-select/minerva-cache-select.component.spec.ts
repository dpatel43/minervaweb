import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MinervaCacheSelectComponent} from './minerva-cache-select.component';
import {FormsModule} from '@angular/forms';
import {apiTestingProviders} from '../../../../testing/test-providers';

describe('MinervaCacheSelectComponent', () => {
  let component: MinervaCacheSelectComponent;
  let fixture: ComponentFixture<MinervaCacheSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MinervaCacheSelectComponent],
      imports: [FormsModule],
      providers: apiTestingProviders
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MinervaCacheSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
