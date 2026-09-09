import { Injectable } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  dataForReq: any = [];
  type: string;
  idOffer: number;
  idDirection: number;
  fullInfo:any = []

  get newData$() {
    return this.newData.asObservable();
  }

  private newData = new Subject<void>();

  public getData() {
    this.newData.next();
  }

  get template$() {
    return this.template.asObservable();
  }

  private template = new Subject<void>();

  public createEditTemplate() {
    this.template.next();
  }

  constructor() { }
}
