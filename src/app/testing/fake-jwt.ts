/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

const base64Url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** An unsigned JWT shaped like the backend's (the user as JSON in sub), expiring at expiresAtMs */
export function fakeJwt(expiresAtMs: number, username = 'suadmin'): string {
  const payload = {sub: JSON.stringify({username}), exp: Math.floor(expiresAtMs / 1000)};
  return `${base64Url({typ: 'JWT', alg: 'HS512'})}.${base64Url(payload)}.signature`;
}

/** Stores a signed-in session the way AuthenticationService.login does */
export function storeSession(token: string) {
  localStorage.setItem('loginResponse', JSON.stringify({token}));
  localStorage.setItem('loggedIn', 'true');
}

export function clearSession() {
  localStorage.removeItem('loginResponse');
  localStorage.removeItem('loggedIn');
}
