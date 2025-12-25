import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import {AdminComponent} from "./admin.component";
import {StaffUserListComponent} from "./components/staff-user/staff-user-list.component";
import {StaffUserDetailComponent} from "./components/staff-user/staff-user-detail.component";
import {StaffUserComponent} from "./components/staff-user/staff-user.component";


let routes: Routes = [
  {
    path: '', component: AdminComponent,
    children: [
      { path: 'staff-user', component: StaffUserComponent},
      { path: 'staff-user-list', component: StaffUserListComponent},
      { path: 'staff-user-detail', component: StaffUserDetailComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
