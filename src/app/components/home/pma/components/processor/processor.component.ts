/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnInit} from '@angular/core';
import {CalculationRequest} from "../../data/calculation-request";
import {CalculationService} from "../../services/calculation.service";
import {UntypedFormControl, UntypedFormGroup} from "@angular/forms";
import {HttpErrorResponse} from "@angular/common/http";
import {finalize} from "rxjs/operators";

interface ProcessorRun {
  account: string;
  start: Date;
  end: Date;
  finishedAt: Date;
  error?: string;
}

@Component({
  selector: 'app-processor',
  templateUrl: './processor.component.html',
  styleUrls: ['./processor.component.scss'],
  standalone: false
})
export class ProcessorComponent implements OnInit {

  userForm = new UntypedFormGroup({
    account: new UntypedFormControl(),
    range: new UntypedFormGroup({
      start: new UntypedFormControl(),
      end: new UntypedFormControl()
    })
  });

  running = false;
  /** Outcome of the most recent run, shown under the form */
  lastRun: ProcessorRun = null;

  constructor(private calculationService: CalculationService) {
  }

  ngOnInit(): void {
  }

  /** End date is set and earlier than the start date */
  get rangeInvalid(): boolean {
    const {start, end} = this.userForm.value.range ?? {};
    return !!start && !!end && new Date(end) < new Date(start);
  }

  get canRun(): boolean {
    const {account, range} = this.userForm.value;
    return !!account?.id && !!range?.start && !!range?.end && !this.rangeInvalid;
  }

  onSubmit() {
    if (!this.canRun || this.running) {
      return;
    }
    let calculationRequest = new CalculationRequest();
    calculationRequest.accountId = this.userForm.value.account.id;
    calculationRequest.startDate = this.userForm.value.range.start;
    calculationRequest.endDate = this.userForm.value.range.end;

    const run = {
      account: this.userForm.value.account.displayValue ?? `Account ${calculationRequest.accountId}`,
      start: calculationRequest.startDate,
      end: calculationRequest.endDate
    };
    this.running = true;
    this.lastRun = null;
    this.calculationService.runPerformance(calculationRequest)
      .pipe(finalize(() => this.running = false))
      .subscribe({
        next: () => this.lastRun = {...run, finishedAt: new Date()},
        error: (error: HttpErrorResponse) => this.lastRun = {
          ...run,
          finishedAt: new Date(),
          error: error?.error?.message || error?.message || 'The server returned an error.'
        }
      });
  }
}
