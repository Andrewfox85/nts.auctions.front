import { Injectable } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor() { }
  private componentToast = new Subject<any>();

  componentToast$ = this.componentToast.asObservable();

  onShowToast(value: any) {
    this.componentToast.next(value);
  }

}
