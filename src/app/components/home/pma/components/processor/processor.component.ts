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

  constructor(private calculationService: CalculationService) {
  }

  ngOnInit(): void {
  }

  onSubmit() {
    let calculationRequest = new CalculationRequest();
    calculationRequest.accountId = this.userForm.value.account.id;
    calculationRequest.startDate = this.userForm.value.range.start;
    calculationRequest.endDate = this.userForm.value.range.end;

    this.calculationService.runPerformance(calculationRequest).subscribe();
  }
}
