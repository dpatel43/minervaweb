/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {HttpContext, HttpContextToken, HttpErrorResponse} from '@angular/common/http';

/**
 * Set on a request whose caller shows its own error, so JwtInterceptor doesn't also show the
 * page-level alert. Every other failed API call shows the server's message in that alert.
 */
export const OWN_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);

export const ownErrorHandling = () => new HttpContext().set(OWN_ERROR_HANDLING, true);

/**
 * The text to show for a failed API call. The backend sends {message} for a MinervaException
 * (MinervaExceptionHandler); otherwise this falls back to the status.
 */
export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return (error as any)?.message || 'Something went wrong. Please try again.';
  }
  const body = error.error;
  const message = typeof body === 'string' ? body : body?.message;
  if (message && typeof message === 'string' && message.trim()) {
    return message;
  }
  if (error.status === 0) {
    return 'The server could not be reached. Check your connection and try again.';
  }
  if (error.status === 401 || error.status === 403) {
    return 'You are not allowed to do this, or your session has expired. Please sign in again.';
  }
  return `The server returned an error (${error.status}${error.statusText ? ' ' + error.statusText : ''}).`;
}
