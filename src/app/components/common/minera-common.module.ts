import {NgModule} from '@angular/core';
import {MatCommonModule, MatNativeDateModule} from "@angular/material/core";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatCardModule} from "@angular/material/card";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatButtonModule} from "@angular/material/button";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatTableModule} from "@angular/material/table";
import {MatChipsModule} from "@angular/material/chips";
import {MatIconModule} from "@angular/material/icon";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatSidenavModule} from "@angular/material/sidenav";
import {CommonModule} from "@angular/common";
import {MatMenuModule} from "@angular/material/menu";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSortModule} from "@angular/material/sort";
import {MinervaTableComponent} from './minerva-paginated-and-sorted-table/minerva-table.component';
import {ColumnResizeDirective} from './column-resize.directive';
import {FitGridHeightDirective} from './fit-grid-height.directive';
import {TableExportMenuComponent} from './table-export/table-export-menu.component';
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatDividerModule} from "@angular/material/divider";
import {NumberValuePipe} from './pipes/number-value.pipe';
import {DecimalsControlComponent} from './decimals-control/decimals-control.component';
import {DataWarningsComponent} from './data-warnings/data-warnings.component';
import {AssistantComponent} from './assistant/assistant.component';

const COMMON_COMPONENTS = [
  MinervaTableComponent,
  ColumnResizeDirective,
  FitGridHeightDirective,
  TableExportMenuComponent,
  DecimalsControlComponent,
  NumberValuePipe, AssistantComponent, DataWarningsComponent
];

const MODULES = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  // Material Modules
  MatCommonModule,
  MatFormFieldModule,
  MatCardModule,
  MatToolbarModule,
  MatInputModule,
  MatSelectModule,
  MatButtonModule,
  MatAutocompleteModule,
  MatTableModule,
  MatFormFieldModule,
  MatChipsModule,
  MatIconModule,
  MatSidenavModule,
  MatMenuModule,
  MatAutocompleteModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatCheckboxModule,
  MatNativeDateModule,
  MatDatepickerModule,
  MatDividerModule
];
@NgModule({
  declarations: [...COMMON_COMPONENTS],
  imports: [
    ...MODULES
  ],
  providers: [],
  exports: [
    ...MODULES,
    ...COMMON_COMPONENTS
  ]
})
export class MineraCommonModule { }
