/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, ViewChild} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {Store} from "@ngrx/store";
//import {selectDetailFlag} from "../../store/selectors/profile.selectors";
import {NewProfileAction, RetrieveProfilesAction} from "../../store/actions/profile.actions";
import {ProfileListComponent} from "./profile-list/profile-list.component";
import {ProfileDetailComponent} from "./profile-detail/profile-detail.component";
import {ProfileState} from "../../store/states/profile.state";

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    ProfileListComponent,
    ProfileDetailComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  @ViewChild(ProfileDetailComponent)
  private profileDetailComponent: ProfileDetailComponent;

  constructor(public store: Store<ProfileState>) {
  }

  private _detail: boolean;

  get detail() {
    return this._detail;
  }

  ngOnInit(): void {
    // this.store.pipe(select(selectDetailFlag)).subscribe(detail => this._detail = detail);
    this.store.dispatch(new RetrieveProfilesAction(''));
  }

  retrieve() {
    this.store.dispatch(new RetrieveProfilesAction(''));
  }

  createNew() {
    this.store.dispatch(new NewProfileAction());
  }

  list() {
    this.retrieve()
  }

  reload() {

  }

  save() {
    //this.profileDetailComponent.save();
  }
}
