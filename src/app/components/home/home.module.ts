import {NgModule} from '@angular/core';
import {HomeComponent} from './home.component';
import {HomeRoutingModule} from "./home-routing.module";
import {MineraCommonModule} from "../common/minera-common.module";
import {MinervaAutoCompleteComponent} from "./common/minerva-auto-complete/minerva-auto-complete.component";
import {MinervaCacheSelectComponent} from './common/minerva-cache-select/minerva-cache-select.component';

@NgModule({
  declarations: [
    HomeComponent,
    MinervaAutoCompleteComponent,
    MinervaCacheSelectComponent
  ],
    exports: [
      MinervaAutoCompleteComponent,
      MinervaCacheSelectComponent
    ],
  imports: [
    MineraCommonModule,
    HomeRoutingModule
  ]
})
export class HomeModule { }
