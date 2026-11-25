/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {AlertService} from "../services/alert.service";


@Component({
  selector: 'alert', templateUrl: 'alert.component.html', styleUrls: ['alert.component.scss'],
  standalone: false
})
export class AlertComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  message: any;

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    this.subscription = this.alertService.getAlert()
      .subscribe(message => {
        switch (message && message.type) {
          case 'success':
            message.cssClass = 'alert alert-success';
            break;
          case 'error':
            message.cssClass = 'alert alert-danger';
            break;
        }

        this.message = message;
      });
  }

  close() {
    this.alertService.clear();
  }

  ngOnDestroy() {
    // May be destroyed before ngOnInit ran (e.g. in tests)
    this.subscription?.unsubscribe();
  }
}
