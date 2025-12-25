import { NgModule } from '@angular/core';
import { AdminComponent } from './admin.component';
import { StaffUserListComponent } from './components/staff-user/staff-user-list.component';
import {MineraCommonModule} from "../../common/minera-common.module";
import {AdminRoutingModule} from "./admin-routing.module";
import {HomeModule} from "../home.module";
import { StaffUserDetailComponent } from './components/staff-user/staff-user-detail.component';
import { StaffUserComponent } from './components/staff-user/staff-user.component';



@NgModule({
  declarations: [AdminComponent, StaffUserListComponent, StaffUserDetailComponent, StaffUserComponent],
    imports: [
        MineraCommonModule,
        AdminRoutingModule,
        HomeModule
    ]
})
export class AdminModule { }
