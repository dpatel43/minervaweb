/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {AuthGuard} from './auth.guard';
import {SessionService} from './session.service';
import {clearSession, fakeJwt, storeSession} from '../testing/fake-jwt';

describe('AuthGuard', () => {
  let session: jasmine.SpyObj<SessionService>;

  afterEach(() => clearSession());

  const guardFor = (url: string) => {
    session = jasmine.createSpyObj('SessionService', ['expire']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), AuthGuard, {provide: SessionService, useValue: session}]
    });
    const result = TestBed.inject(AuthGuard).canActivate({} as ActivatedRouteSnapshot, {url} as RouterStateSnapshot);
    const router = TestBed.inject(Router);
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  };

  it('opens a guarded screen with a live session', () => {
    storeSession(fakeJwt(Date.now() + 60_000));
    expect(guardFor('/home/pma/dashboard')).toBeTrue();
  });

  it('sends the app root to home', () => {
    storeSession(fakeJwt(Date.now() + 60_000));
    expect(guardFor('/')).toBe('/home');
  });

  it('ends an expired session and sends it to the login page', () => {
    storeSession(fakeJwt(Date.now() - 1000));
    expect(guardFor('/home')).toBe('/login');
    expect(session.expire).toHaveBeenCalledTimes(1);
  });

  it('sends a signed-out user to the login page', () => {
    expect(guardFor('/home')).toBe('/login');
    expect(session.expire).not.toHaveBeenCalled();
  });
});
