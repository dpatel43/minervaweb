/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, UntypedFormControl} from "@angular/forms";
import {HomeModule} from "../../../home.module";
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from "@angular/material/datepicker";
import {PmaExportService} from "../../services/pmaexport/pma-export.service";

@Component({
  selector: 'app-dashboard',
  imports: [
    HomeModule,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    ReactiveFormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  exportForm: FormGroup;

  constructor(private pmaExportService: PmaExportService, private formBuilder: FormBuilder) {
    this.exportForm = this.formBuilder.group({
      account: new UntypedFormControl(),
      profile: new UntypedFormControl(),
      start: new UntypedFormControl(),
      end: new UntypedFormControl(),
    });
  }
}
