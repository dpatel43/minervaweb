/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {PmaHistoryRow} from "./pma-history-row";

export class PmaHistoryResponse {
  startDate: Date;
  endDate: Date;
  exportRows: Map<string, PmaHistoryRow[]> = new Map();
}
