/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {SESSION_EXPIRED_MESSAGE, SessionService} from './session.service';
import {AuthenticationService} from './authentication.service';
import {TabService} from './tabs/tab.service';
import {AlertService} from './alert.service';
import {clearSession, fakeJwt, storeSession} from '../testing/fake-jwt';

describe('SessionService', () => {
  const NOW = new Date('2026-11-27T12:00:00Z').getTime();
  let router: jasmine.SpyObj<Router>;
  let tabs: jasmine.SpyObj<TabService>;
  let alerts: jasmine.SpyObj<AlertService>;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(NOW));
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    tabs = jasmine.createSpyObj('TabService', ['reset']);
    alerts = jasmine.createSpyObj('AlertService', ['error']);
  });

  afterEach(() => {
    TestBed.inject(SessionService).ngOnDestroy();
    jasmine.clock().uninstall();
    clearSession();
  });

  /** Created after the session is stored, as the app is after a page load */
  const start = () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {provide: Router, useValue: router},
        {provide: TabService, useValue: tabs},
        {provide: AlertService, useValue: alerts}
      ]
    });
    return {session: TestBed.inject(SessionService), auth: TestBed.inject(AuthenticationService)};
  };

  const expectSignedOut = async (auth: AuthenticationService) => {
    await Promise.resolve(); // the message follows the navigation
    expect(auth.loggedInNow).toBeFalse();
    expect(localStorage.getItem('loginResponse')).toBeNull();
    expect(tabs.reset).toHaveBeenCalledTimes(1);
    expect(alerts.error).toHaveBeenCalledOnceWith(SESSION_EXPIRED_MESSAGE);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  };

  it('signs out a session whose token expired while the app was closed', async () => {
    storeSession(fakeJwt(NOW - 1000));
    const {auth} = start();
    await expectSignedOut(auth);
  });

  it('signs out when the token expires while the page sits idle', async () => {
    storeSession(fakeJwt(NOW + 60_000));
    const {auth} = start();
    jasmine.clock().tick(59_000);
    expect(auth.loggedInNow).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();

    jasmine.clock().tick(1_000);
    await expectSignedOut(auth);
  });

  it('checks again when the user comes back to a page whose timer slept through the expiry', async () => {
    storeSession(fakeJwt(NOW + 60_000));
    const {auth} = start();
    jasmine.clock().mockDate(new Date(NOW + 120_000)); // the clock moved on, the timer did not fire
    window.dispatchEvent(new Event('focus'));
    await expectSignedOut(auth);
  });

  it('signs out once however many calls fail at the same moment', async () => {
    storeSession(fakeJwt(NOW + 60_000));
    const {session, auth} = start();
    session.expire();
    session.expire();
    await expectSignedOut(auth);
  });

  it('leaves a signed-out app and a live session alone', () => {
    const {session} = start();
    session.check();
    expect(router.navigate).not.toHaveBeenCalled();

    TestBed.inject(AuthenticationService);
    storeSession(fakeJwt(NOW + 60_000));
    session.check();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
