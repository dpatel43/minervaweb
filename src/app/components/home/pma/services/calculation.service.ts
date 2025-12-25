/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable} from '@angular/core';
import {CalculationRequest} from "../data/calculation-request";
import {HttpService} from "../../../../services/http.service";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor(private httpService: HttpService) {
  }

  public runPerformance(request: CalculationRequest): Observable<any> {
    return this.httpService.post("/api/pma/runPerformance", request);
  }
}
