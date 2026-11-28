/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnInit} from '@angular/core';
import {CalculationRequest} from "../../data/calculation-request";
import {CalculationService} from "../../services/calculation.service";
import {UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {FormCheck, FormValidators, today} from "../../../common/form-validation/form-validation";
import {HttpErrorResponse} from "@angular/common/http";
import {finalize} from "rxjs/operators";
import {apiErrorMessage} from "../../../../../services/api-error";

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
    account: new UntypedFormControl(null, [Validators.required, FormValidators.picked]),
    range: new UntypedFormGroup({
      start: new UntypedFormControl(null, [Validators.required, FormValidators.notFuture]),
      end: new UntypedFormControl(null, [Validators.required, FormValidators.notFuture])
    }, {validators: FormValidators.dateOrder()})
  });

  /** The input form's error messages */
  readonly check = new FormCheck(this.userForm);
  /** The latest date the pickers offer */
  readonly maxDate = today();

  running = false;
  /** Outcome of the most recent run, shown under the form */
  lastRun: ProcessorRun = null;

  constructor(private calculationService: CalculationService) {
  }

  ngOnInit(): void {
  }

  onSubmit() {
    if (this.running || !this.check.submit()) {
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
          error: apiErrorMessage(error)
        }
      });
  }
}
