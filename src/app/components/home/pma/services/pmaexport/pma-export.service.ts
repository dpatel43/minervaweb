/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable} from '@angular/core';
import {HttpService} from "../../../../../services/http.service";
import {Observable} from "rxjs";
import {PmaSummaryExportRequest} from "../../data/pmaexport/pma-summary-export-request";
import {PmaSummaryExportResponse} from "../../data/pmaexport/pma-summary-export-response";
import {PmaHistoryRequest} from '../../data/pma-history/pma-history-request';
import {PmaHistoryResponse} from '../../data/pma-history/pma-history-response';

@Injectable({
  providedIn: 'root'
})
export class PmaExportService {

  constructor(private httpService: HttpService) {
  }


  public runPmaSummaryExport(request: PmaSummaryExportRequest): Observable<PmaSummaryExportResponse> {
    return this.httpService.post("/api/pma/export/runPmaSummaryExport", request);
  }

  public runPmaHistory(request: PmaHistoryRequest): Observable<PmaHistoryResponse> {
    return this.httpService.post("/api/pma/export/runPmaExport", request);
  }
}
