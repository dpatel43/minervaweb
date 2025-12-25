import {Observable} from "rxjs";
import {Page} from "../../models/page";

export abstract class AbstractEntityComponent<T> {

  private _valueChanged = false;
  private detail = false;

  retrieve() {
    this.onRetrieve().subscribe();
  }

  edit(entity: number) {
    let observable1 = this.onEdit(entity);
    if (observable1) {
      observable1.subscribe(() => {this.detail = true});
    } else {
      this.detail = true;
    }

  }

  createNew() {
    let observable1 = this.onCreateNew();
    if (observable1) {
      observable1.subscribe( () => { this.detail = true});
    } else {
      this.detail = true;
    }
  }

  list() {
    let observable1 = this.onList();
    if (observable1) {
      observable1.subscribe( () => { this.detail = false});
    } else {
      this.detail = false
    }
  }

  reload() {
    let observable1 = this.onReload();
    if (observable1) {
      observable1.subscribe();
    }
  }

  get detailMode() {
    return this.detail;
  }

  get listMode() {
    return !this.detailMode;
  }

  get saveDisabled() {
    return !this.valueChanged;
  }

  set valueChanged(flag: boolean) {
    this._valueChanged = flag;
  }

  protected abstract onReload(): Observable<T>;
  protected abstract onList(): Observable<T>;
  protected abstract onSave(): Observable<T> ;
  protected abstract onEdit(enity: number): Observable<T>;
  protected abstract onRetrieve(): Observable<Page<T>> ;
  protected abstract onCreateNew(): Observable<T>;
}
