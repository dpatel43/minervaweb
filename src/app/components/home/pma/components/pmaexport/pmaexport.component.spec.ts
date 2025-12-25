import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PMAExportComponent} from './pmaexport.component';

describe('PMAExportComponent', () => {
  let component: PMAExportComponent;
  let fixture: ComponentFixture<PMAExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PMAExportComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PMAExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
