import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderPanelService {
  constructor() {}
  // Observable string sources
  private loaderSource = new Subject<boolean>();

  // Observable string streams
  loaderSourceCalled$ = this.loaderSource.asObservable();

  //вызов лодера
  startLoader(load: boolean) {
    this.loaderSource.next(load);
  }
}
