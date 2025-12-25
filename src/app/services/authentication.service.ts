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

  private loggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>( new Boolean(localStorage.getItem('loggedIn')).valueOf() || false);

  constructor(private httpService: HttpService) {
  }


  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }

  get token() {
    const loginResponseVO = localStorage.getItem('loginResponse')
    return JSON.parse(loginResponseVO).token;
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
