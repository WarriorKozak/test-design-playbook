import { Component, OnInit } from '@angular/core';
import { Result } from '../../shared/models/result';
import { DataSourceService } from '../../shared/service/data-source.service';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-results-page',
  templateUrl: './results-page.component.html',
  styleUrls: ['./results-page.component.css']
})
export class ResultsPageComponent implements OnInit {
  
  results: Array<Result> = [];
  resultsDisplay: Array<Result> = []; // for search
  resultsSet: Set<Result>;
  groupResults: Map<String, Array<Result>> = new Map<String, Array<Result>>();
  isLoadedContent: boolean = false;

  constructor(private dataSource: DataSourceService,
              private datePipe: DatePipe,
              private snackBar: MatSnackBar) {  }

  ngOnInit(): void {
    this.update();
    this.resultsSet = new Set<Result>();
  }

  updateAfterDelete() {
    this.update();
  }

  update() {
    this.dataSource.getAllResults()
      .subscribe((data: Array<Result>) => {
        this.results = data;
        this.resultsDisplay = data;
        
        this.isLoadedContent = true;

        this.groupResults = ResultsPageComponent.doGroupResults(this.results);

      }, (error) => {
        this.snackBar.open(error, 'Close', { duration: 2000 });
      });
  }

  transformDate(date) {
    return this.datePipe.transform(date, 'dd-MM-yyyy');
  }

  searchResults(request) {
    this.resultsDisplay = [];
    this.resultsSet.clear();

    if (request === "") {
      this.resultsDisplay = this.results;
      return;
    }

    const allKeywords = request.split(" ");
    console.log(allKeywords);

    allKeywords.forEach(keyword => {
      this.results.forEach(res => {
        if (res.applicant.surname.includes(keyword) || res.applicant.first_name.includes(keyword)
        || res.applicant.second_name.includes(keyword) || this.datePipe.transform(res.solved_date, 'dd-MM-yyyy') === keyword) {
          if (!this.resultsSet.has(res)) {
            this.resultsSet.add(res);
            this.resultsDisplay.push(res);
          }
        }
      });
    });
  }

  onKeyDown(event) {
    if (event.key === "Enter") {
      this.searchResults(event.target.value);
    }
  }

  private static doGroupResults(value: Array<Result>): Map<String, Array<Result>>  {
    const groupResults: Map<String, Array<Result>> = new Map<String, Array<Result>>();
    value.forEach((item: Result) => {
      const solved_date = new Date(item.solved_date);
      const daytime = ResultsPageComponent.dateFormat(solved_date);
      if (groupResults.get(daytime)) {
        groupResults.get(daytime).push(item);
      } else {
        groupResults.set(daytime, [item]);
      }
    });
    groupResults.forEach((results, key) => {
      results.sort((a, b) => new Date(a.solved_date).getTime() - new Date(b.solved_date).getTime());
    });
    return groupResults;
  }

  private static dateFormat(solved_date) {
    return ResultsPageComponent.timeFormat(solved_date.getDate() + 1) + '/' + ResultsPageComponent.timeFormat(solved_date.getMonth() + 1) + '/' + solved_date.getFullYear();
  }

  private static timeFormat(value: Number): String {
    return value < 10 ? '0' + value : value.toString();
  }

}
