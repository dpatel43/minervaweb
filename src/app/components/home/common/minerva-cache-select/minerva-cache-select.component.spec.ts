import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MinervaCacheSelectComponent} from './minerva-cache-select.component';

describe('MinervaCacheSelectComponent', () => {
  let component: MinervaCacheSelectComponent;
  let fixture: ComponentFixture<MinervaCacheSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MinervaCacheSelectComponent]
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
