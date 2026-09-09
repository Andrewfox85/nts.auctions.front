import { Injectable } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ErrorServiceService {

  constructor() { }

  // Observable string sources
  private componentErrorMethodCallSource = new Subject<any>();

  // Observable string streams
  componentMethodCalled$ = this.componentErrorMethodCallSource.asObservable();

  //вызов popup для ошибок
  callErrorPopup(er: any) {
    this.componentErrorMethodCallSource.next(er);
  }
}
