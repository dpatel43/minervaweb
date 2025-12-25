/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component} from '@angular/core';
import {FormBuilder, FormGroup, UntypedFormControl} from '@angular/forms';
import {PmaHistoryRequest} from '../../data/pma-history/pma-history-request';
import {PmaExportService} from '../../services/pmaexport/pma-export.service';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {PmaHistoryRow} from '../../data/pma-history/pma-history-row';
import {PmaHistoryResponse} from '../../data/pma-history/pma-history-response';
import {FlatTreeControl} from '@angular/cdk/tree';


interface PmaHistoryRowView {
  name: string;
  pmaExportRow?: PmaHistoryRow;
  children?: PmaHistoryRowView[];
}


interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  pmaExportRow?: PmaHistoryRow;
  level: number;
}


@Component({
  selector: 'app-pma-history',
  templateUrl: './pma-history.component.html',
  styleUrl: './pma-history.component.css',
  standalone: false
})
export class PmaHistoryComponent {

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level, node => node.expandable);
  dataSource: MatTreeFlatDataSource<any, any>;


  displayedColumns: string[] = ['name', 'Start Date', 'End Date', 'BMV', 'EMV', 'BOD Inflow', 'BOD Outflow', 'Weight', 'Return',
    'Bench BMV', 'Bench EMV', 'Bench BOD Inflow', 'Bench BOD Outflow', 'Bench Weight', 'Bench Return'
  ];

  exportForm: FormGroup;

  constructor(private pmaExportService: PmaExportService, private formBuilder: FormBuilder) {
    this.exportForm = this.formBuilder.group({
      account: new UntypedFormControl(),
      profile: new UntypedFormControl(),
      start: new UntypedFormControl(),
      end: new UntypedFormControl(),
      filterSecurities: [false],
      period: new UntypedFormControl()// Initial state of the checkbox
    });
  }

  ngOnInit(): void {
    // this.onSubmit();
  }


  onSubmit() {
    console.log('OnSubmit is called');
    let calculationRequest = new PmaHistoryRequest();
    calculationRequest.accountId = this.exportForm.value.account.id;
    calculationRequest.profileId = this.exportForm.value.profile.id;
    calculationRequest.benchmarkId = 100009;
    calculationRequest.startDate = this.exportForm.value.start;////new Date("2024-10-10");
    calculationRequest.endDate = this.exportForm.value.end;////new Date("2024-10-10");
    calculationRequest.filterSecurities = this.exportForm.value.filterSecurities;
    calculationRequest.period = this.exportForm.value.period;
    console.log(calculationRequest.endDate);
    this.pmaExportService.runPmaHistory(calculationRequest).subscribe((data: PmaHistoryResponse) => {
        this.convertResponse(data);
      }
    );
  }


  private transformer = (node: PmaHistoryRowView, level: number) => {
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

  private convertResponse(pmaExportResponse: PmaHistoryResponse) {
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    let rootTreeView = [];
    let rowsMap: Map<string, PmaHistoryRow[]> = new Map(Object.entries(pmaExportResponse.exportRows));
    for (const [key, value] of rowsMap.entries()) {
      let map = new Map<number, PmaHistoryRowView>();
      let exportRows = value;
      for (let i = 0; i < exportRows.length; i++) {
        let exportRow = exportRows[i];
        let exportRowView = {
          name: exportRow.name,
          pmaExportRow: exportRow,
          children: []
        }
        map.set(exportRow.id, exportRowView);
        if (exportRow.id == 0) {
          rootTreeView.push(exportRowView);
        }
      }
      for (let i = 0; i < exportRows.length; i++) {
        let exportRow = exportRows[i];
        let parentExportRowView = map.get(exportRow.parentId);
        let exportRowView = map.get(exportRow.id);
        if (parentExportRowView != null) {
          parentExportRowView.children.push(exportRowView);
        }
      }
    }
    this.dataSource.data = rootTreeView;
    console.log(this.dataSource.data);
  }


}
