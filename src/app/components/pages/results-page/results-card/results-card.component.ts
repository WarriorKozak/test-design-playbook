import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Result } from '../../../shared/models/result';
import { DataSourceService } from '../../../shared/service/data-source.service';
import { MatDialog } from '@angular/material';
import { ConfirmRemoveComponent } from './confirm-remove/confirm-remove.component';
@Component({
  selector: 'app-results-card',
  templateUrl: './results-card.component.html',
  styleUrls: ['./results-card.component.css']
})
export class ResultsCardComponent {

  @Input() result_item: Result;
  @Input() index: number;
  @Output() onDelete = new EventEmitter();

  constructor(private dataSource: DataSourceService, public dialog: MatDialog) {  }

  // <button class="btn delete" color="warn" mat-raised-button (click)="deleteResult(result_item.applicant.token)">

  openDialog() {

    const dialogRef = this.dialog.open(ConfirmRemoveComponent, {
      data: this.result_item.applicant
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.dataSource.deleteResult(this.result_item.applicant.token)
        .subscribe(() => {
          this.onDelete.emit();
      });
    }
    });
  }




}
