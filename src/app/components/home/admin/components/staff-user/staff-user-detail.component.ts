/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Input, OnInit} from '@angular/core';
import {AbstractEntityDetailComponent} from '../../../../common/abstract-entity-detail-component';
import {StaffUser} from '../../data/staff-user';
import {Observable} from 'rxjs';
import {StaffUserService} from '../../services/staff-user.service';
import {tap} from 'rxjs/operators';
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';

export const USER_TYPE_CACHE_NAME = 'userTypeCache';
export const ACL_GROUP_CACHE_NAME = 'aclGroupCache';

@Component({
  selector: 'app-staff-user-detail',
  templateUrl: './staff-user-detail.component.html',
  styleUrls: ['./staff-user-detail.component.scss'],
  standalone: false
})
export class StaffUserDetailComponent extends AbstractEntityDetailComponent<StaffUser> implements OnInit {

  userTypeCacheName = USER_TYPE_CACHE_NAME;
  aclGroupCacheName = ACL_GROUP_CACHE_NAME;
  private _staffUser: StaffUser = new StaffUser();
  staffDetailForm: UntypedFormGroup;

  constructor(private staffUserService: StaffUserService, private formBuilder: UntypedFormBuilder) {
    super();
  }

  get staffUser() {
    return this._staffUser;
  }

  @Input('staffUser') set staffUser(staffUser: StaffUser) {
    this._staffUser = staffUser;
  }

  ngOnInit(): void {

  }

  protected onSave(): Observable<StaffUser> {
    return this.staffUserService.postStaffUser(this.staffUser).pipe(
      tap((staffUser: StaffUser) => { this.staffUser = staffUser; })
    );
  }
}
