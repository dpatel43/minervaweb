import {CollectionViewer, DataSource} from "@angular/cdk/collections";
import {BehaviorSubject, Observable, of} from "rxjs";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {catchError, finalize, tap} from "rxjs/operators";
import {Page} from "../../models/page";

export class MinervaDataSource<T> implements DataSource<T> {
  // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  private usersSubject = new BehaviorSubject<T[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();

  constructor(private paginator: MatPaginator, private matSort: MatSort, private loadFunction: Function) {
    this.counter$.pipe(tap((count) => {this.paginator.length = count;})).subscribe();

    // when paginator event is invoked, retrieve the related data
    this.paginator.page.pipe(tap(() => this.loadData())).subscribe();

    // reset the paginator after sorting
    this.matSort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
    this.matSort.sortChange.pipe(
      tap(() => this.loadData())
    ).subscribe();

    this.loadData();
  }

  public loadData(): Observable<Page<T>> {
    return this.loadFunction(this.matSort, this.paginator).pipe(
      catchError(() => of([])),
      finalize(()=>{})
    )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result : Page<T>) => {
          this.usersSubject.next(result.content);
          this.countSubject.next(result.totalElements);
        }
      );
  }

  connect(collectionViewer: CollectionViewer): Observable<T[]> {
    return this.usersSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.usersSubject.complete();
    this.countSubject.complete();
  }


}

