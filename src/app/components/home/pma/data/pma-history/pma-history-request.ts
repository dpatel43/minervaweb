/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

export class PmaHistoryRequest {
  accountId: number;
  benchmarkId: number;
  profileId: number;
  startDate: Date;
  endDate: Date;
  period: string;
  filterSecurities: boolean;
}
