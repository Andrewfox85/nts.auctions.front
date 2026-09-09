import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  TargetedOfferResponse,
  TargetedOfferFullInfoResponse,
  DepositBody,
  WatchedBody,
  OffersDeleteBody,
  OffersCheckedBody,
  OffersResponse,
  OffersRejectBody,
  OffersRestoreBody,
  OffersOptionsResponse,
  OffersApproveBody,
  OffersApproveResponse,
  TimberVolumeResponse,
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class TargetedService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  //-----------------------------Адресные заявки-------------------------------

  //получение списка заявок на адресную сессию Работником
  public getListOffersAllWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    filterIdCurrency?: number
  ): Observable<TargetedOfferResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<TargetedOfferResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/BuceGetListOffersAll?IdSection=${sectionId}&IdSession=${sessionId}&FilterIdCurrency=${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //получение списка заявок на адресную сессию Трейдером
  public getListOffersAll(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    filterIdCurrency?: number
  ): Observable<TargetedOfferResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<TargetedOfferResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/GetListOffersAll?IdSection=${sectionId}&IdSession=${sessionId}&FilterIdCurrency=${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  // получение данных по списку заявок трейдером
  public getListOffersFixed(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    Offers: number[],
    FilterIdCurrency?: string
  ): Observable<TargetedOfferResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let offers = this.buildOffersQueryParam(Offers);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<TargetedOfferResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/GetListOffersFixed?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}${offers}`,
      { headers: myHeaders }
    );
  }

  // получение данных по списку заявок работником
  public getListOffersFixedWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    Offers: number[],
    FilterIdCurrency?: string
  ): Observable<TargetedOfferResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let offers = this.buildOffersQueryParam(Offers);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<TargetedOfferResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/BuceGetListOffersFixed?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}${offers}`,
      { headers: myHeaders }
    );
  }

  private buildOffersQueryParam(offers: number[]): string {
    let offersQuery = '';
    for (let i = 0; i < offers?.length; i++) {
      offersQuery += `&Offers=${offers[i]}`;
    }
    return offersQuery;
  }

  //просмотр адресной заявки
  public getOfferFullInfo(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    offerId: number,
    FilterIdCurrency?: string
  ): Observable<TargetedOfferFullInfoResponse> {
    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<TargetedOfferFullInfoResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/GetOfferFullInfo?IdSection=${sectionId}&IdSession=${sessionId}&IdOffer=${offerId}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  // просмотр инф-ции о задатке на сессию Работником
  public getDirectListDepositWorker(
    sessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/GetListDeposit?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // просмотр инф-ции о задатке на сессию Трейдером
  public getDirectListDeposit(
    sessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get(
      `${this.urlINV}${this.trading}/TargetedOffer/GetListDeposit?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // включение/отклонение контроля задатка по клиенту
  public changeCtrlDirect(
    sessionKey: string,
    body: DepositBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/ChangeCtrl`,
      body,
      { headers: myHeaders }
    );
  }

  //добавление заявки в наблюдаемые Работник
  public directWatchedAddWorker(
    sessionKey: string,
    body: WatchedBody
  ): Observable<void> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<void>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/WatchedAdd`,
      body,
      { headers: myHeaders }
    );
  }

  //удаление заявки из наблюдаемых Работник
  public directWatchedDeleteWorker(
    sessionKey: string,
    body: WatchedBody
  ): Observable<void> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<void>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/WatchedDelete`,
      body,
      { headers: myHeaders }
    );
  }

  //добавление заявки в наблюдаемые Трейдер
  public directWatchedAdd(
    sessionKey: string,
    body: WatchedBody
  ): Observable<void> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<void>(
      `${this.urlINV}${this.trading}/TargetedOffer/WatchedAdd`,
      body,
      { headers: myHeaders }
    );
  }

  //удаление заявки из наблюдаемых Трейдер
  public directWatchedDelete(
    sessionKey: string,
    body: WatchedBody
  ): Observable<void> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<void>(
      `${this.urlINV}${this.trading}/TargetedOffer/WatchedDelete`,
      body,
      { headers: myHeaders }
    );
  }

  //удаление заявки  Трейдер
  public offersDelete(
    sessionKey: string,
    body: OffersDeleteBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/TargetedOffer/OffersDelete`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  //установка отметки от рассмотрении
  public offersBuceMarkChecked(
    sessionKey: string,
    body: OffersCheckedBody
  ): Observable<OffersResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<OffersResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/OffersBuceMarkChecked`,
      body,
      { headers: myHeaders }
    );
  }

  //снятие отметки от рассмотрении
  public offersBuceRevokeChecked(
    sessionKey: string,
    body: OffersCheckedBody
  ): Observable<OffersResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<OffersResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/OffersBuceRevokeCheck`,
      body,
      { headers: myHeaders }
    );
  }

  //отклонение заявок
  public offersBuceReject(
    sessionKey: string,
    body: OffersRejectBody
  ): Observable<OffersResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<OffersResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/OffersBuceReject`,
      body,
      { headers: myHeaders }
    );
  }

  //восстановление заявок
  public offersBuceRestoreReject(
    sessionKey: string,
    body: OffersRestoreBody
  ): Observable<OffersResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<OffersResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/OffersBuceRestoreReject`,
      body,
      { headers: myHeaders }
    );
  }

  //получение параметров выполнения процедуры одобрения
  public offersBuceGetOptions(
    sessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<OffersOptionsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<OffersOptionsResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/OffersBuceGetOptions?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  //одобрение заявок
  public offersBuceApprove(
    sessionKey: string,
    body: OffersApproveBody
  ): Observable<OffersApproveResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<OffersApproveResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/worker/OffersBuceApprove`,
      body,
      { headers: myHeaders }
    );
  }

  //разрешенный объем
  public getAdTimberVolume(
    sessionKey: string,
    sessionId: number
  ): Observable<TimberVolumeResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<TimberVolumeResponse>(
      `${this.urlINV}${this.trading}/TargetedOffer/GetAdTimberVolume?IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }
}
