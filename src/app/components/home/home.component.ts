/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {AuthenticationService} from "../../services/authentication.service";
import {UserService} from "./admin/services/user.service";
import {ModuleGroupVO} from "./admin/data/moduleGroupVO";
import {ModuleVO} from "./admin/data/moduleVO";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false
})
export class HomeComponent implements OnInit {

  loggedIn: boolean;
  moduleGroups: ModuleGroupVO[];
  modules: ModuleVO[] = [];

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private userService: UserService
  ) {
    this.authenticationService.isLoggedIn.subscribe(x => this.loggedIn = x);
  }

  ngOnInit() {
    this.userService.getPermittedModuleGroups().subscribe(
      (data: ModuleGroupVO[]) => {
        this.moduleGroups = data;
        console.log(this.moduleGroups);
        for (const moduleGroupVO of this.moduleGroups) {
          for (const module of moduleGroupVO.modules) {
            this.modules.push(module);
          }
        }
      }
    );
  }

  logout() {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }
}
