/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {PmaExportRow} from "./pma-export-row";

export class PmaExportResponse {
  startDate: Date;
  endDate: Date;
  exportRows: PmaExportRow[];
  /** Problems with the data behind the numbers, e.g. the benchmark has no results on some days */
  warnings?: string[];
}
