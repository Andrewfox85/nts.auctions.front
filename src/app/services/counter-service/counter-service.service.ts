import { inject, Injectable, resource } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  ListOfferCountersWorkerResponse,
  ListOfferCountersResponse,
  OfferCountersGoodsResponse,
  OfferCounterDeleteBody,
  ListDemandCountersWorkerResponse,
  ListDemandCountersResponse,
  DemandCountersGoodsResponse,
  DemandCounterDeleteBody,
  AddToGeneralCatalogBody,
  AddToGeneralCatalogResponse,
  AnalogListResponse,
  DemandAnalogAcceptAndDeclineBody,
  FilterAnalogsNameGoodResponse,
  FiltersReferencesTreeResponse,
  FiltersReferencesTreeBody
} from './shared';
import { Subject } from 'rxjs';

import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CounterService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;
  private readonly orderManagement = this.conf.OrderManagement;

  //-----------------------------Встречные предложения-------------------------------

  //получение реестра встречных предложений РАБОТНИКОМ (продажа)
  public getListOfferCountersWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number,
    FilterIdCurrency?: string
  ): Observable<ListOfferCountersWorkerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<ListOfferCountersWorkerResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/GetListOfferCounters?IdSection=${sectionId}&IdSession=${sessionId}&IdOffer=${idOffer}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //получение реестра встречных предложений ТРЕЙДЕРОМ (продажа)
  public getListOfferCountersTrader(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number,
    FilterIdCurrency: string,
    IsMyOffer: boolean
  ): Observable<ListOfferCountersResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    let isMyOffer = IsMyOffer === false ? '' : '&IsMyOffer=' + IsMyOffer;

    return this.http.get<ListOfferCountersResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetListOfferCounters?IdSection=${sectionId}&IdSession=${sessionId}&IdOffer=${idOffer}${filterIdCurrency}${isMyOffer}`,
      { headers: myHeaders }
    );
  }

  //получение товаров встречного предложения (продажа)
  public getListOfferCountersGoods(
    sessionKey: string,
    idOffer: number,
    FilterIdCurrency: string
  ): Observable<OfferCountersGoodsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<OfferCountersGoodsResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetListOfferCountersGoods?IdOffer=${idOffer}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //удаление встречного предложения (продажа)
  public offerCounterDelete(
    sessionKey: string,
    body: OfferCounterDeleteBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/OfferCounterDelete`,
      body,
      { headers: myHeaders }
    );
  }

  //получение реестра встречных предложений РАБОТНИКОМ (покупка)
  public getListDemandCountersWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idDemand: number,
    FilterIdCurrency?: string
  ): Observable<ListDemandCountersWorkerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<ListDemandCountersWorkerResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/GetListDemandCounters?IdSection=${sectionId}&IdSession=${sessionId}&IdDemand=${idDemand}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //получение реестра встречных предложений ТРЕЙДЕРОМ (покупка)
  public getListDemandCountersTrader(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idDemand: number,
    FilterIdCurrency: string,
    IsMyDemand: boolean
  ): Observable<ListDemandCountersResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    let isMyDemand = IsMyDemand === false ? '' : '&IsMyDemand=' + IsMyDemand;

    return this.http.get<ListDemandCountersResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetListDemandCounters?IdSection=${sectionId}&IdSession=${sessionId}&IdDemand=${idDemand}${filterIdCurrency}${isMyDemand}`,
      { headers: myHeaders }
    );
  }

  //получение товаров встречного предложения (покупка)
  public getListDemandCountersGoods(
    sessionKey: string,
    idDemand: number,
    FilterIdCurrency: string
  ): Observable<DemandCountersGoodsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<DemandCountersGoodsResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetListDemandCounterGoods?IdDemand=${idDemand}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //удаление встречного предложения (покупка)
  public demandCounterDelete(
    sessionKey: string,
    body: DemandCounterDeleteBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/DemandCounterDelete`,
      body,
      { headers: myHeaders }
    );
  }

  //получение списка наименований товаров
  public getFilterAnalogsNameGood(
    sessionKey: string,
    idDemand: number
  ): Observable<FilterAnalogsNameGoodResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<FilterAnalogsNameGoodResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetFilterAnalogsNameGood?IdDemand=${idDemand}`,
      { headers: myHeaders }
    );
  }

  //получение дерева с учетом зависимых хар-к и значений
  public getFiltersReferencesTree(
    sessionKey: string,
    body: FiltersReferencesTreeBody
  ): Observable<FiltersReferencesTreeResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<FiltersReferencesTreeResponse>(
      `${this.urlINV}${this.orderManagement}/Filters/GetFiltersReferencesTree`,
      body,
      { headers: myHeaders }
    );
  }

  //добавление товара
  public addToGeneralCatalog(
    sessionKey: string,
    body: AddToGeneralCatalogBody
  ): Observable<AddToGeneralCatalogResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<AddToGeneralCatalogResponse>(
      `${this.urlINV}${this.orderManagement}/Filters/submission/AddToGeneralCatalog`,
      body,
      { headers: myHeaders }
    );
  }

  //подача встречного предложения
  public setOfferCounter(SessionKey: string, body: any): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/SetOfferCounter`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  public setDemandCounter(sessionKey: string, body: any): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/SetDemandCounter`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // получение информации о последнем встречном предложении для предзаполнения формы
  public counterOfferGetLast(
    SessionKey: string,
    SectionId,
    SessionId,
    IdOffer
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http.get(
      `${this.urlINV}${this.trading}/DemandOffer/CounterOfferGetLast?IdSection=${SectionId}&IdSession=${SessionId}&IdOffer=${IdOffer}`,
      { headers: myHeaders }
    );
  }

  public counterDemandGetLast(
    SessionKey: string,
    SectionId,
    SessionId,
    idDemandOffer
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http.get(
      `${this.urlINV}${this.trading}/DemandOffer/CounterDemandGetLast?IdSection=${SectionId}&IdSession=${SessionId}&IdDemand=${idDemandOffer}`,
      { headers: myHeaders }
    );
  }

  // контекстная проверка
  public checkCounterOfferState(
    sessionKey: string,
    body: any,
    typeRequest: string
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/${typeRequest}`,
      body,
      { headers: myHeaders }
    );
  }

  private catalogGoodSubject = new Subject<any>();
  catalogGood$ = this.catalogGoodSubject.asObservable();

  emitCatalogGood(event: any) {
    this.catalogGoodSubject.next(event);
  }

  private nsiGoodSubject = new Subject<any>();
  public nsiGood$ = this.nsiGoodSubject.asObservable();

  public emitNsiGood(event: any): void {
    this.nsiGoodSubject.next(event);
  }

  //список товаров
  public getGoodsListSubmission(
    sessionKey: string,
    idSection: number,
    idModel: number,
    idGroup: number
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
    return this.http.get(
      `${this.urlINV}${this.orderManagement}/Filters/submission/GetGoodsListSubmission?IdSection=${idSection}&IdGroup=${idGroup}&IdModel=${idModel}`,
      { headers: myHeaders }
    );
  }

  //получение списка товаров-аналогов
  public getListDemandAnalogTradeInfo(
    sessionKey: string,
    idSection: number,
    idSession: number,
    idDemand: number
  ): Observable<AnalogListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<AnalogListResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetListDemandAnalogTradeInfo?IdSection=${idSection}&IdSession=${idSession}&IdDemand=${idDemand}`,
      { headers: myHeaders }
    );
  }

  //допуск и отклонение списка товаров-аналогов к торгам
  public demandAnalogAcceptAndDecline(
    sessionKey: string,
    body: DemandAnalogAcceptAndDeclineBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/DemandAnalogAcceptAndDecline`,
      body,
      { headers: myHeaders }
    );
  }
}
