// Test environment setup for Karma. The Angular test builder finds the *.spec.ts files itself
// (the old require.context discovery is no longer supported).

import 'zone.js/testing';
import {getTestBed} from '@angular/core/testing';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';


// HttpService reads the API base URL from window.__env (normally set by assets/env.js)
(window as any).__env = {apiServer: 'http://localhost/test-api'};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: {destroyAfterEach: false}
  }
);
