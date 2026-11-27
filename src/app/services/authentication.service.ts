import { Injectable } from '@angular/core';
import {LoginRequestVO} from "../models/usermgmt/login-request-vo";
import {HttpService} from "./http.service";
import {map} from "rxjs/operators";
import {BehaviorSubject} from "rxjs";
import {LoginResponseVO} from "../models/usermgmt/login-response-vo";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private loggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(localStorage.getItem('loggedIn') === 'true');

  constructor(private httpService: HttpService) {
  }


  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }

  /** The stored JWT, or '' when there is none */
  get token(): string {
    try {
      return JSON.parse(localStorage.getItem('loginResponse') ?? 'null')?.token ?? '';
    } catch {
      return '';
    }
  }

  /** True while the user is signed in, whether or not the token is still valid; see hasValidSession */
  get loggedInNow(): boolean {
    return this.loggedIn.value;
  }

  /**
   * Username of the signed-in user, for display only. The login response carries just
   * the JWT, whose subject is the server's UserDetails serialized as JSON. This decodes
   * the token without verifying it, so never use it for authorization. Returns '' if absent.
   */
  get username(): string {
    try {
      return JSON.parse(this.claims()?.sub).username ?? '';
    } catch {
      return '';
    }
  }

  /** When the stored token expires (ms since the epoch), from its exp claim; null without a readable one */
  get expiresAt(): number | null {
    const exp = this.claims()?.exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  }

  /**
   * Signed in with a token that hasn't expired. Read from the token, not verified: the server still decides,
   * and answers 401 for a token it won't take. This only stops the UI from carrying on with a dead session.
   */
  hasValidSession(): boolean {
    const expiresAt = this.expiresAt;
    return this.loggedIn.value && !!this.token && expiresAt !== null && expiresAt > Date.now();
  }

  /** The token's payload, decoded without verifying it; null when there is no readable token */
  private claims(): any {
    try {
      const payload = this.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  login(username, password) {
    const loginRequestVO = new LoginRequestVO();
    loginRequestVO.username = username;
    loginRequestVO.password = password;
    return this.httpService.post(`/login`, loginRequestVO)
      .pipe(map(loginResponse => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        localStorage.setItem('loginResponse', JSON.stringify(loginResponse));
        localStorage.setItem('loggedIn', 'true');
        this.loggedIn.next(true);
        return loginResponse;
      }));
  }

  logout() {
    localStorage.removeItem('loginResponse');
    localStorage.removeItem('loggedIn');
    this.loggedIn.next(false);
  }
}
