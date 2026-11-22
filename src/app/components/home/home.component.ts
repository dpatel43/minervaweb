/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthenticationService} from "../../services/authentication.service";
import {UserService} from "./admin/services/user.service";
import {ModuleGroupVO} from "./admin/data/moduleGroupVO";
import {ModuleVO} from "./admin/data/moduleVO";
import {ColDef} from "@ag-grid-community/core";
import {AppTab, TabService} from "../../services/tabs/tab.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit {


  rowData = [
    {make: 'Tesla', model: 'Model Y', price: 64950, electric: true},
    {make: 'Ford', model: 'F-Series', price: 33850, electric: false},
    {make: 'Toyota', model: 'Corolla', price: 29600, electric: false},
    {make: 'Mercedes', model: 'EQA', price: 48890, electric: true},
    {make: 'Fiat', model: '500', price: 15774, electric: false},
    {make: 'Nissan', model: 'Leaf', price: 28100, electric: true},
  ];

  // Define your column definitions
  colDefs: ColDef[] = [
    {field: 'make'},
    {field: 'model'},
    {field: 'price'},
    {field: 'electric'}
  ]

  loggedIn: boolean;
  moduleGroups: ModuleGroupVO[];
  modules: ModuleVO[] = [];
  username = '';
  userInitials = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private userService: UserService,
    public tabService: TabService
  ) {
    this.authenticationService.isLoggedIn.subscribe(x => this.loggedIn = x);
  }

  ngOnInit() {
    this.username = this.authenticationService.username;
    this.userInitials = this.username.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
    this.userService.getPermittedModuleGroups().subscribe(
      (data: ModuleGroupVO[]) => {
        this.moduleGroups = data;
        //console.log(this.moduleGroups);
        for (const moduleGroupVO of this.moduleGroups) {
          for (const module of moduleGroupVO.modules) {
            this.modules.push(module);
          }
        }
        this.tabService.setKnownTitles(new Map(this.modules.map(m => [this.moduleUrl(m), m.name])));
      }
    );
  }

  openModule(module: ModuleVO) {
    this.tabService.open(this.moduleUrl(module), module.name);
  }

  /**
   * Absolute URL for a menu item. homeURL may be relative (e.g. "pma/field"),
   * as the menu used to be a routerLink inside this component; resolve it
   * the same way routerLink did, relative to this route (/home).
   */
  moduleUrl(module: ModuleVO): string {
    return this.router.serializeUrl(this.router.createUrlTree([module.homeURL], {relativeTo: this.route}));
  }

  closeTab(tab: AppTab, event: Event) {
    event.stopPropagation();
    this.tabService.close(tab);
  }

  trackTab(_: number, tab: AppTab) {
    return tab.url;
  }

  logout() {
    this.tabService.reset();
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }
}
