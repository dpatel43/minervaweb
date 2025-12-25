import { Injectable } from '@angular/core';
import {BaseService} from "../../../../services/base.service";
import {HttpService} from "../../../../services/http.service";

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService {

  constructor(private httpService: HttpService) { super(); }

  getPermittedModuleGroups() {
    return this.httpService.get('/api/user/getPermittedModuleGroups');
  }
}
