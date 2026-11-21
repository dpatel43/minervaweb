/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AbstractEntityComponent} from "../../../../common/abstract-entity-component";
import {StaffUser} from "../../data/staff-user";
import {Observable} from "rxjs";
import {Page} from "../../../../../models/page";
import {tap} from "rxjs/operators";
import {StaffUserService} from "../../services/staff-user.service";
import {StaffUserDetailComponent} from "./staff-user-detail.component";

@Component({
  selector: 'app-staff-user',
  templateUrl: './staff-user.component.html',
  styleUrls: ['./staff-user.component.scss'],
  standalone: false
})
export class StaffUserComponent extends AbstractEntityComponent<StaffUser> implements OnInit {


  private _staffUser: StaffUser;

  @ViewChild(StaffUserDetailComponent) private detailComponent: StaffUserDetailComponent;

  /** True when the detail form has unsaved changes */
  canSave = false;

  get title(): string {
    const u = this.staffUser;
    if (!u?.staffUserId) {
      return 'New staff user';
    }
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return name || `Staff user ${u.staffUserId}`;
  }

  saveDetail() {
    this.detailComponent?.save();
  }

  onDetailSaved(staffUser: StaffUser) {
    this.staffUser = staffUser;
    this.canSave = false;
  }

  constructor(private staffUserService: StaffUserService) { super(); }

  get staffUser() {
    return this._staffUser;
  }

  @Input('staffUser') set staffUser(staffUser: StaffUser) {
    this._staffUser = staffUser;
  }

  ngOnInit(): void {
  }

  protected onCreateNew(): Observable<StaffUser> {
    this.canSave = false;
    this.staffUser = new StaffUser();
    return undefined;
  }


  protected onList(): Observable<StaffUser> {
    return undefined;
  }

  protected onReload(): Observable<StaffUser> {
    this.canSave = false;
    return this.loadStaffUser(this.staffUser.staffUserId);
  }

  protected onRetrieve(): Observable<Page<StaffUser>> {
    return undefined;
  }

  protected onSave(): Observable<StaffUser> {
    return this.staffUserService.postStaffUser(this.staffUser).pipe(
      tap((staffUser: StaffUser) => { this.staffUser = staffUser})
    );
  }

  protected onEdit(editId: number): Observable<StaffUser> {
    this.canSave = false;
    if (editId != 0) {
      return this.loadStaffUser(editId);
    } else {
      this.staffUser = new StaffUser();
      return undefined;
    }
  }

  private loadStaffUser(editId: number): Observable<StaffUser> {
    return this.staffUserService.findStaffUserById(editId).pipe(
      tap((staffUser: StaffUser) => { this.staffUser = staffUser})
    );
  }
}
