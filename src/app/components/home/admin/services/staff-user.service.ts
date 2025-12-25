import {Injectable} from '@angular/core';
import {HttpService} from "../../../../services/http.service";
import {BaseService} from "../../../../services/base.service";
import {StaffUser} from "../data/staff-user";
import {Observable} from "rxjs";
import {HttpParams} from "@angular/common/http";
import {SearchStaffUser} from "../data/search-staff-user";
import {Page} from "../../../../models/page";

@Injectable({
  providedIn: 'root'
})
export class StaffUserService extends BaseService {

  constructor(private httpService: HttpService) { super(); }

  postStaffUser(staffUser: StaffUser) : Observable<StaffUser> {
    return this.httpService.post('/api/staffuser', staffUser);
  }

  findStaffUsersBySearchParameters(firstName: string, lastName: string, sort: string, direction: string, page: number, size: number): Observable<Page<SearchStaffUser>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append("firstName", firstName);
    httpParams = httpParams.append("lastName", lastName);
    httpParams = httpParams.append("page", JSON.stringify(page));
    httpParams = httpParams.append("size", JSON.stringify(size));
    httpParams = httpParams.append("sort", `${sort},${direction}`);

    return this.httpService.get("/api/staffuser", httpParams);
  }

  findStaffUserById(staffUserId: number): Observable<StaffUser> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append("staffUserId", JSON.stringify(staffUserId));

    return this.httpService.get('/api/findStaffUserById', httpParams);
  }
}
