import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PopupSidebarService {
  constructor() {}
  private componentPopupMethodCallSource = new Subject<any>();

  componentMethodCalled$ = this.componentPopupMethodCallSource.asObservable();

  onShowPopupSidebar(info: any) {
    this.componentPopupMethodCallSource.next(info);
  }

  private _close = new Subject<unknown>();
  get close$() {
    return this._close.asObservable();
  }
  public onClosePopup(data) {
    this._close.next(data);
  }

  private _submitBidInfo = new Subject<void>();
  get submitBidInfo$() {
    return this._submitBidInfo.asObservable();
  }
  public submitBidToBuyUpdate(data) {
    this._submitBidInfo.next(data);
  }

  private _counterOfferInfo = new Subject<void>();
  get counterOfferInfo$() {
    return this._counterOfferInfo.asObservable();
  }
  public counterOfferInfoUpdate(data) {
    this._counterOfferInfo.next(data);
  }

  private _triggerWatched = new Subject<void>();

  get triggerWatched$() {
    return this._triggerWatched.asObservable();
  }
  public updateWatched(data) {
    this._triggerWatched.next(data);
  }

  private _triggerAnalogList = new Subject<boolean>();

  get triggerAnalogList$(): Observable<boolean> {
    return this._triggerAnalogList.asObservable();
  }
  
  public updateAnalogListStatus(data: boolean): void {
    this._triggerAnalogList.next(data);
  }

  onClosePopupSideBar() {
    this.componentPopupMethodCallSource.next(null);
  }
}
