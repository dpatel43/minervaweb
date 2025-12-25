/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {AbstractEntityListComponent} from "../../../../common/abstract-entity-list-component";
import {SearchStaffUser} from "../../data/search-staff-user";
import {StaffUserService} from "../../services/staff-user.service";
import {MatPaginator} from "@angular/material/paginator";
import {Page} from "../../../../../models/page";
import {MatSort} from "@angular/material/sort";
import {Observable} from "rxjs";

@Component({
  selector: 'app-staff-user-list',
  templateUrl: './staff-user-list.component.html',
  styleUrls: ['./staff-user-list.component.scss'],
  standalone: false
})
export class StaffUserListComponent extends AbstractEntityListComponent<SearchStaffUser> implements OnInit {

  private _tableColumns = [
    {
      columnLabel: 'Staff User Id',
      valueProperty: 'staffUserId'
    },
    {
      columnLabel: 'First Name',
      valueProperty: 'firstName'
    },
    {
      columnLabel: 'Middle Name',
      valueProperty: 'middleName'
    },
    {
      columnLabel: 'Last Name',
      valueProperty: 'lastName'
    },
    {
      columnLabel: 'Username',
      valueProperty: 'user' +
        'Name'
    }
  ];
  _selectedId = 0;

  loadFunction = (sort: MatSort, paginator: MatPaginator) => {
    return this.staffUserService.findStaffUsersBySearchParameters(null, null, sort.active, sort.direction, paginator.pageIndex, paginator.pageSize);
  }

  @Output() onSelectedIdChange: EventEmitter<number> = new EventEmitter<number>();

  set selectedId(selectedEntity: number) {
    this._selectedId = selectedEntity;
  }

  get selectedId() {
    return this._selectedId;
  }


  constructor(private staffUserService: StaffUserService) {
    super();
  }

  ngOnInit(): void {
    //this.dataSource = new MinervaDataSource<SearchStaffUser>();
  }

  get tableColumns() {
    return this._tableColumns;
  }

  protected onRetrieve(): Observable<Page<SearchStaffUser>> {
    return undefined;
  }

  public edit(selectedEntity: number) {
    this.selectedId = selectedEntity;
    this.onSelectedIdChange.emit(selectedEntity);
  }
}
