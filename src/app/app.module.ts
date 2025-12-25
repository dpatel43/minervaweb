/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {AlertComponent} from "./alert/alert.component";
import {JwtInterceptor} from "./services/jwt-interceptor";
import {AuthGuard} from "./services/auth.guard";
import {MineraCommonModule} from "./components/common/minera-common.module";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AppRoutingModule} from "./app-routing.module";
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from "@angular/material/form-field";
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from "../environments/environment";
import {RouterModule} from "@angular/router";
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from "@ngrx/effects";
import {APP_BASE_HREF} from "@angular/common";

@NgModule({
  declarations: [
    AppComponent,
    AlertComponent
  ],
  exports: [
    AlertComponent
  ],
  bootstrap: [AppComponent], imports: [BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule,
    MineraCommonModule,
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    StoreModule.forRoot(),
    EffectsModule.forRoot()], providers: [
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {apperance: 'fill'}},
    {provide: APP_BASE_HREF, useValue: '/minervaweb'},
    AuthGuard,
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule { }
