/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component} from '@angular/core';
import {SessionService} from './services/session.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent {
  title = 'minervaweb';

  // Created with the app, so an expired session is ended even while no screen calls the server
  constructor(session: SessionService) {
    session.check();
  }
}
