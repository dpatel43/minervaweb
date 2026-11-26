import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CommonModule} from '@angular/common';
import {DataWarningsComponent} from './data-warnings.component';

describe('DataWarningsComponent', () => {
  let fixture: ComponentFixture<DataWarningsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [CommonModule], declarations: [DataWarningsComponent]});
    fixture = TestBed.createComponent(DataWarningsComponent);
  });

  it('renders nothing without warnings', () => {
    fixture.componentInstance.warnings = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alert')).toBeNull();
  });

  it('lists each warning', () => {
    fixture.componentInstance.warnings = ['S&P 500 has no results on 14 days', 'S&P 500\'s results end on 2026-10-30'];
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('14 days');
    expect(fixture.nativeElement.querySelector('.alert').getAttribute('role')).toBe('alert');
  });
});
