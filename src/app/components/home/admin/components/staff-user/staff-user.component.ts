/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Input, OnInit} from '@angular/core';
import {AbstractEntityComponent} from "../../../../common/abstract-entity-component";
import {StaffUser} from "../../data/staff-user";
import {Observable} from "rxjs";
import {Page} from "../../../../../models/page";
import {tap} from "rxjs/operators";
import {StaffUserService} from "../../services/staff-user.service";

@Component({
  selector: 'app-staff-user',
  templateUrl: './staff-user.component.html',
  styleUrls: ['./staff-user.component.scss'],
  standalone: false
})
export class StaffUserComponent extends AbstractEntityComponent<StaffUser> implements OnInit {


  private _staffUser: StaffUser;

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
    this.staffUser = new StaffUser();
    return undefined;
  }


  protected onList(): Observable<StaffUser> {
    return undefined;
  }

  protected onReload(): Observable<StaffUser> {
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
