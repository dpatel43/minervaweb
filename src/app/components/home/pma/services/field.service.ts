import {Injectable} from '@angular/core';
import {BaseService} from "../../../../services/base.service";
import {Observable} from "rxjs";
import {Page} from "../../../../models/page";
import {HttpParams} from "@angular/common/http";
import {HttpService} from "../../../../services/http.service";
import {SearchField} from "../data/search-field";
import {Field} from "../data/field";

@Injectable({
  providedIn: 'root'
})
export class FieldService extends BaseService {

  constructor(private httpService: HttpService) {
    super();
  }

  findFieldsBySearchParameters(name: string, sort: string, direction: string, page: number, size: number): Observable<Page<SearchField>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append("name", name);
    httpParams = httpParams.append("page", JSON.stringify(page));
    httpParams = httpParams.append("size", JSON.stringify(size));
    httpParams = httpParams.append("sort", `${sort},${direction}`);

    return this.httpService.get("/api/pma/field/findFields", httpParams);
  }

  findFieldById(id: number): Observable<Field> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append("fieldId", JSON.stringify(id));
    return this.httpService.get("/api/pma/field/findFieldById", httpParams);
  }

  saveField(field: Field): Observable<Field> {
    if (field.fieldId === 0) {
      return this.httpService.put("/api/pma/field", field);
    } else {
      return this.httpService.post("/api/pma/field", field);
    }
  }
}
