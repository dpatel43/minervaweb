import {Observable} from "rxjs";


export abstract class AbstractEntityDetailComponent<T> {

  save() {
    let observable1 = this.onSave();
    if (observable1) {
      observable1.subscribe(() =>  { });
    }
  }

  protected abstract onSave(): Observable<T> ;
}
