import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import {AccountmgmtComponent} from "./accountmgmt.component";
import {AccountComponent} from "./account/account.component";


let routes: Routes = [
  {
    path: '', component: AccountmgmtComponent,
    children: [
      { path: 'account', component: AccountComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountMgmtRoutingModule { }
