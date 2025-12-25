import { NgModule } from '@angular/core';
import { LoginComponent } from './login.component';
import {LoginRoutingModule} from "./login-routing.module";
import {MineraCommonModule} from "../common/minera-common.module";

@NgModule({
  declarations: [LoginComponent],
  imports: [
    MineraCommonModule,
    LoginRoutingModule,
  ],
  providers: []
})
export class LoginModule { }
