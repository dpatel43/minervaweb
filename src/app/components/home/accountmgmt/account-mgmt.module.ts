import { NgModule } from '@angular/core';
import {MineraCommonModule} from "../../common/minera-common.module";
import {AccountMgmtRoutingModule} from "./account-mgmt-routing.module";
import {HomeModule} from "../home.module";
import { AccountComponent } from './account/account.component';

@NgModule({
  declarations: [AccountComponent],
  imports: [
      MineraCommonModule,
      AccountMgmtRoutingModule
  ]
})
export class AccountmgmtModule { }
