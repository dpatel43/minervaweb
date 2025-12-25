/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

export class PmaSummaryExportRequest {
  accountId: number;
  benchmarkId: number;
  profileId: number;
  endDate: Date;
  periods: string[];
}
