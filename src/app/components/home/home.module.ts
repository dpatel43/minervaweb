/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {NgModule} from '@angular/core';
import {HomeComponent} from './home.component';
import {HomeRoutingModule} from "./home-routing.module";
import {MineraCommonModule} from "../common/minera-common.module";
import {MinervaAutoCompleteComponent} from "./common/minerva-auto-complete/minerva-auto-complete.component";
import {MinervaCacheSelectComponent} from './common/minerva-cache-select/minerva-cache-select.component';
import {AgGridAngular} from "@ag-grid-community/angular";

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
    HomeRoutingModule,
    AgGridAngular
  ]
})
export class HomeModule { }
