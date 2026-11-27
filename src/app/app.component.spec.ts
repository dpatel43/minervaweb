import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AlertComponent } from './alert/alert.component';
import { AppComponent } from './app.component';
import { apiTestingProviders } from './testing/test-providers';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([])
      ],
      declarations: [
        AppComponent,
        AlertComponent
      ],
      providers: [...apiTestingProviders]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'minervaweb'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('minervaweb');
  });
});
