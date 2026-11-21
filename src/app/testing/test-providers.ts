/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

/**
 * HttpClient backed by HttpTestingController, for specs of services and
 * components that call the API through HttpService. No real requests are sent.
 */
export const apiTestingProviders = [
  provideHttpClient(),
  provideHttpClientTesting()
];
