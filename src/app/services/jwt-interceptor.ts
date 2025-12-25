/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {AuthenticationService} from "./authentication.service";

@Injectable({
  providedIn: 'root'
})
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authenticationService: AuthenticationService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
     if (this.authenticationService.isLoggedIn) {
       if (localStorage.getItem('loginResponse')) {
         const loginResponseString = localStorage.getItem("loginResponse");
         let token = loginResponseString == null ? "" : JSON.parse(loginResponseString).token;
         request = request.clone({
           setHeaders: {
             Authorization: token
           }
         });
       }
     }

    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        // console.log('event--->>>', event);
        // if (event instanceof HttpResponse) {
        //   console.log('event--->>>', event);
        // } else if (event instanceof HttpErrorResponse) {
        //   console.log('Error--->>>', event.status);
        // }
        return event;
      }));
  }
}
