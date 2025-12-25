/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {NgModule} from '@angular/core';
import {MineraCommonModule} from "../../common/minera-common.module";
import {HomeModule} from "../home.module";
import {PmaComponent} from './pma.component';
import {PmaRoutingModule} from "./pma-routing.module";
import {FieldComponent} from './components/field/field.component';
import {FieldListComponent} from './components/field/field-list.component';
import {FieldDetailComponent} from './components/field/field-detail.component';
import {TimeFieldComponent} from "./components/field/time-field/time-field.component";
import {TransactionFieldComponent} from "./components/field/transaction-field/transaction-field.component";
import {StoreModule} from "@ngrx/store";
import {field} from "./store/reducers/field.reducers";
import {EffectsModule} from "@ngrx/effects";
import {FieldEffects} from "./store/effects/field.effects";
import {StoreDevtoolsModule} from "@ngrx/store-devtools";
import {environment} from "../../../../environments/environment";
import {ProcessorComponent} from './components/processor/processor.component';
import {PMAExportComponent} from './components/pmaexport/pmaexport.component';
import {PmaHistoryComponent} from './components/pma-history//pma-history.component';
import {AgGridAngular} from "@ag-grid-community/angular";

@NgModule({
  declarations: [PmaComponent, FieldComponent, FieldListComponent, FieldDetailComponent, TimeFieldComponent, TransactionFieldComponent, ProcessorComponent, PMAExportComponent, PmaHistoryComponent],
  imports: [
    MineraCommonModule,
    PmaRoutingModule,
    HomeModule,
    StoreModule.forFeature('field', field),
    EffectsModule.forFeature([FieldEffects]),
    StoreDevtoolsModule.instrument({maxAge: 25, logOnly: environment.production}),
    AgGridAngular
  ],
  exports: [StoreModule]
})
export class PmaModule {
}
