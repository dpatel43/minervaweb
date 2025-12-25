/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, OnInit} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from "@angular/material/tree";
import {FlatTreeControl} from "@angular/cdk/tree";
import {PmaSummaryExportRequest} from "../../data/pmaexport/pma-summary-export-request";
import {PmaExportService} from "../../services/pmaexport/pma-export.service";
import {PmaSummaryExportRow} from "../../data/pmaexport/pma-summary-export-row";
import {PmaSummaryExportResponse} from "../../data/pmaexport/pma-summary-export-response";
import {UntypedFormControl, UntypedFormGroup} from "@angular/forms";

interface PmaExportRowView {
  name: string;
  pmaExportRow?: PmaSummaryExportRow;
  children?: PmaExportRowView[];
}


interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  pmaExportRow?: PmaSummaryExportRow;
  level: number;
}


@Component({
  selector: 'app-pmaexport',
  templateUrl: './pmaexport.component.html',
  styleUrls: ['./pmaexport.component.css'],
  standalone: false
})
export class PMAExportComponent implements OnInit {

  exportForm = new UntypedFormGroup({
    account: new UntypedFormControl(),
    profile: new UntypedFormControl(),
    end: new UntypedFormControl()
  });


  displayedColumns: string[] = ['name', '1D', 'MTD', '1M', '3M', 'YTD', 'ITD'];
  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level, node => node.expandable);
  dataSource: MatTreeFlatDataSource<any, any>;

  constructor(private pmaExportService: PmaExportService) {
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  ngOnInit(): void {
    // this.onSubmit();
  }

  onSubmit() {
    let calculationRequest = new PmaSummaryExportRequest();
    calculationRequest.accountId = this.exportForm.value.account.id;
    calculationRequest.profileId = this.exportForm.value.profile.id;
    calculationRequest.benchmarkId = this.exportForm.value.account.id;
    calculationRequest.endDate = this.exportForm.value.end;////new Date("2024-10-10");
    console.log(calculationRequest.endDate);
    //calculationRequest.endDate.setHours(0, 0, 0, 0);
    calculationRequest.periods = ["1D", "MTD", "1M", "3M", "YTD", "ITD"];

    this.pmaExportService.runPmaSummaryExport(calculationRequest).subscribe((data: PmaSummaryExportResponse) => {
        this.convertResponse(data);
        console.log(this.dataSource.data);
      }
    );
  }

  private transformer = (node: PmaExportRowView, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      pmaExportRow: node.pmaExportRow,
      level: level,
    };
  }

  treeFlattener = new MatTreeFlattener(
    this.transformer, node => node.level,
    node => node.expandable, node => node.children);

  private convertResponse(pmaExportResponse: PmaSummaryExportResponse) {
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    let map = new Map<number, PmaExportRowView>();
    let rootTreeView = null;
    for (let i = 0; i < pmaExportResponse.exportRows.length; i++) {
      let exportRow = pmaExportResponse.exportRows[i];
      let exportRowView = {
        name: exportRow.name,
        pmaExportRow: exportRow,
        children: []
      }
      map.set(exportRow.id, exportRowView);
      if (exportRow.id == 0) {
        rootTreeView = exportRowView;
      }
    }

    for (let i = 0; i < pmaExportResponse.exportRows.length; i++) {
      let exportRow = pmaExportResponse.exportRows[i];
      let parentExportRowView = map.get(exportRow.parentId);
      let exportRowView = map.get(exportRow.id);
      if (parentExportRowView != null) {
        parentExportRowView.children.push(exportRowView);
      }
    }

    this.dataSource.data = [rootTreeView];
    console.log(this.dataSource.data);
  }


}
