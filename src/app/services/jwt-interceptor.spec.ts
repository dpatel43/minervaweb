/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {TestBed} from '@angular/core/testing';
import {HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {JwtInterceptor} from './jwt-interceptor';
import {AlertService} from './alert.service';
import {apiErrorMessage, ownErrorHandling} from './api-error';
import {SessionService} from './session.service';
import {clearSession, fakeJwt, storeSession} from '../testing/fake-jwt';

describe('JwtInterceptor error alert', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let alerts: any[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true}
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    alerts = [];
    TestBed.inject(AlertService).getAlert().subscribe(a => alerts.push(a));
  });

  afterEach(() => backend.verify());

  const failWith = (url: string, body: any, status = 400) =>
    backend.expectOne(url).flush(body, {status, statusText: 'Bad Request'});

  it('shows the server message and still passes the error to the caller', () => {
    let received: HttpErrorResponse | undefined;
    http.post('/api/pma/export/runPmaExport', {}).subscribe({error: e => received = e});
    failWith('/api/pma/export/runPmaExport', {message: 'Select a profile.'});

    expect(alerts.at(-1)).toEqual({type: 'error', text: 'Select a profile.'});
    expect(received?.status).toBe(400);
  });

  it('stays quiet for a caller that shows its own error', () => {
    http.post('/api/ai/ask', {}, {context: ownErrorHandling()}).subscribe({error: () => {}});
    failWith('/api/ai/ask', {message: 'No'});
    expect(alerts.filter(a => a)).toEqual([]);
  });

  it('leaves login errors to the login form', () => {
    http.post('/minervaapi/login', {}).subscribe({error: () => {}});
    failWith('/minervaapi/login', {}, 401);
    expect(alerts.filter(a => a)).toEqual([]);
  });

  it('clears the last error when the next action starts, but not on lookups', () => {
    http.post('/api/a', {}).subscribe({error: () => {}});
    failWith('/api/a', {message: 'First'});
    http.get('/api/cache').subscribe();
    expect(alerts.at(-1)?.text).toBe('First');

    http.post('/api/b', {}).subscribe();
    expect(alerts.at(-1)).toBeNull();
    backend.expectOne('/api/cache').flush([]);
    backend.expectOne('/api/b').flush({});
  });
});

describe('apiErrorMessage', () => {
  const error = (status: number, body: any = null, statusText = '') =>
    new HttpErrorResponse({status, error: body, statusText});

  it('uses the message the backend sends', () => {
    expect(apiErrorMessage(error(400, {message: 'No calculated results for accountId: 1'}))).toBe('No calculated results for accountId: 1');
  });

  it('falls back to the status when there is no message', () => {
    expect(apiErrorMessage(error(500, {message: ''}, 'Internal Server Error'))).toBe('The server returned an error (500 Internal Server Error).');
    expect(apiErrorMessage(error(0))).toContain('could not be reached');
    expect(apiErrorMessage(error(403))).toContain('sign in again');
  });
});

describe('JwtInterceptor session', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let session: jasmine.SpyObj<SessionService>;
  let alerts: any[];
  const token = fakeJwt(Date.now() + 60_000);

  const start = () => {
    session = jasmine.createSpyObj('SessionService', ['expire']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
        {provide: SessionService, useValue: session}
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    alerts = [];
    TestBed.inject(AlertService).getAlert().subscribe(a => alerts.push(a));
  };

  afterEach(() => {
    backend.verify();
    clearSession();
  });

  it('sends the raw token and ends the session when the server rejects it', () => {
    storeSession(token);
    start();
    let received: HttpErrorResponse | undefined;
    http.post('/api/pma/export/runPmaExport', {}).subscribe({error: e => received = e});

    const call = backend.expectOne('/api/pma/export/runPmaExport');
    expect(call.request.headers.get('Authorization')).toBe(token);
    call.flush(null, {status: 401, statusText: 'Unauthorized'});

    expect(session.expire).toHaveBeenCalledTimes(1);
    expect(alerts.filter(a => a)).toEqual([]);
    expect(received?.status).toBe(401);
  });

  it('leaves a wrong password to the login form', () => {
    storeSession(token);
    start();
    http.post('/minervaapi/login', {}).subscribe({error: () => {}});
    backend.expectOne('/minervaapi/login').flush(null, {status: 401, statusText: 'Unauthorized'});
    expect(session.expire).not.toHaveBeenCalled();
  });

  it('sends no token and keeps the plain error when signed out', () => {
    start();
    http.post('/api/a', {}).subscribe({error: () => {}});
    const call = backend.expectOne('/api/a');
    expect(call.request.headers.has('Authorization')).toBeFalse();
    call.flush(null, {status: 401, statusText: 'Unauthorized'});
    expect(session.expire).not.toHaveBeenCalled();
    expect(alerts.at(-1)?.type).toBe('error');
  });
});
