/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable, Injector} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {catchError} from "rxjs/operators";
import {AuthenticationService} from "./authentication.service";
import {AlertService} from "./alert.service";
import {apiErrorMessage, OWN_ERROR_HANDLING} from "./api-error";
import {SessionService} from "./session.service";

@Injectable({
  providedIn: 'root'
})
export class JwtInterceptor implements HttpInterceptor {

  // SessionService is looked up when needed: it depends on services that use HttpClient, which needs this
  constructor(private authenticationService: AuthenticationService, private alertService: AlertService,
              private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authenticationService.loggedInNow ? this.authenticationService.token : '';
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: token
        }
      });
    }

    // A failed call shows the server's message in the page alert, unless the caller shows its own
    // (OWN_ERROR_HANDLING) or it is the login, whose form reports it. The error still reaches the caller.
    const showAlert = !request.context.get(OWN_ERROR_HANDLING) && !request.url.endsWith('/login');
    if (showAlert && request.method !== 'GET') {
      // A new action (e.g. Retrieve) replaces the last error; lookups (GET) while typing don't.
      this.alertService.clear();
    }
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // The server won't take our token (expired, or signed with a key it no longer uses): the session is over.
        // Not for /login, where 401 means a wrong password, nor for a call sent without a token.
        if (error.status === 401 && token && !request.url.endsWith('/login')) {
          this.injector.get(SessionService).expire();
          return throwError(() => error);
        }
        if (showAlert) {
          this.alertService.error(apiErrorMessage(error));
        }
        return throwError(() => error);
      }));
  }
}
