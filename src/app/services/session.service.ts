/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable, NgZone, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {TabService} from './tabs/tab.service';
import {AlertService} from './alert.service';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

/** setTimeout holds at most 2^31-1 ms (~24.8 days); a later expiry is checked again at that point */
const MAX_DELAY_MS = 2_147_483_647;

/**
 * Ends a session whose token has expired: closes the tabs, signs out and opens the login page with a message.
 * It happens at the token's expiry time even when the page is idle, when the user comes back to a page that
 * was asleep or hidden past it (timers don't run then), and when the server answers 401 (JwtInterceptor).
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService implements OnDestroy {

  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly subscription: Subscription;
  private readonly onReturn = () => this.check();

  constructor(private authenticationService: AuthenticationService, private tabService: TabService,
              private alertService: AlertService, private router: Router, private zone: NgZone) {
    this.subscription = this.authenticationService.isLoggedIn.subscribe(() => this.check());
    document.addEventListener('visibilitychange', this.onReturn);
    window.addEventListener('focus', this.onReturn);
  }

  /** Ends the session now if its token has expired, otherwise waits for the expiry */
  check() {
    clearTimeout(this.timer);
    if (!this.authenticationService.loggedInNow) {
      return;
    }
    if (!this.authenticationService.hasValidSession()) {
      this.expire();
      return;
    }
    const delay = Math.min((this.authenticationService.expiresAt ?? 0) - Date.now(), MAX_DELAY_MS);
    // Outside Angular's zone, so a days-long timer doesn't keep the app "unstable"; back in it to navigate
    this.zone.runOutsideAngular(() => {
      this.timer = setTimeout(() => this.zone.run(() => this.check()), Math.max(delay, 0));
    });
  }

  /** Signs out once, however many calls fail with 401 at the same moment */
  expire() {
    if (!this.authenticationService.loggedInNow) {
      return;
    }
    clearTimeout(this.timer);
    this.tabService.reset();
    this.authenticationService.logout();
    // Shown once the login page is open: on a page load the first navigation and the guard's redirect both
    // start, and the alert clears itself on a route change, so a message set before them would be lost
    this.router.navigate(['/login']).finally(() => this.alertService.error(SESSION_EXPIRED_MESSAGE));
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
    this.subscription.unsubscribe();
    document.removeEventListener('visibilitychange', this.onReturn);
    window.removeEventListener('focus', this.onReturn);
  }
}
