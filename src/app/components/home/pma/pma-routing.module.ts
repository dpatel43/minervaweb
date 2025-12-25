/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {PmaComponent} from "./pma.component";
import {FieldComponent} from "./components/field/field.component";
import {ProcessorComponent} from "./components/processor/processor.component";
import {PMAExportComponent} from "./components/pmaexport/pmaexport.component";
import {PmaHistoryComponent} from "./components/pma-history/pma-history.component";
import {ProfileComponent} from "./components/profile/profile.component";
import {DashboardComponent} from "./components/dashboard/dashboard.component";


let routes: Routes = [
  {
    path: '', component: PmaComponent,
    children: [
      {path: 'field', component: FieldComponent},
      {path: 'processor', component: ProcessorComponent},
      {path: 'pmaexport', component: PMAExportComponent},
      {path: 'pma-history', component: PmaHistoryComponent},
      {path: 'profile', component: ProfileComponent},
      {path: 'dashboard', component: DashboardComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PmaRoutingModule {
}
