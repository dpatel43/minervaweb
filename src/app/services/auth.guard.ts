import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {AuthenticationService} from "./authentication.service";
import {SessionService} from "./session.service";

@Injectable()
export class AuthGuard {

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private sessionService: SessionService
  ) {
  }


  /**
   * Without a valid session (signed in, token not expired) any guarded route goes to the login page; a stale
   * one is ended the usual way, so the user is told it expired. With one, the app root goes to /home and
   * anything else opens as asked.
   */
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (!this.authenticationService.hasValidSession()) {
      if (this.authenticationService.loggedInNow) {
        this.sessionService.expire();
      }
      return this.router.createUrlTree(['/login']);
    }
    return state.url === '/' ? this.router.createUrlTree(['/home']) : true;
  }
}
