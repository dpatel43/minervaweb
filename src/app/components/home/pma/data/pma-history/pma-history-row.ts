/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

export class PmaHistoryRow {

  name: string;
  id: number;
  parentId: number;
  startDate: Date;
  endDate: Date;
  accountValues: Map<string, number>;
  benchmarkValues: Map<string, number>;
}
