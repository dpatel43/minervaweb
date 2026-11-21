import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {HomeComponent} from "./home.component";

let routes: Routes = [
  {
    // tabHost: screens rendered in this component's outlet are kept alive per tab
    path: '', component: HomeComponent, data: {tabHost: true},
    children: [
      {path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
      {
        path: 'accountmgmt',
        loadChildren: () => import('./accountmgmt/account-mgmt.module').then(m => m.AccountmgmtModule)
      },
      {path: 'pma', loadChildren: () => import('./pma/pma.module').then(m => m.PmaModule)},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
