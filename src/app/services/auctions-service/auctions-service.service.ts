import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  DemandOfferResponse,
  GetListDemoffResponse,
  TradingUpdateMasterResponse,
  BuceTradingListResponse,
  GetTradingListResponse
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class AuctionsService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  /* ------------------------торги-------------------------- */

  //получение списка заявок на сессию Работником
  public buceGetListTradingWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    filterIdCurrency?: number
  ): Observable<DemandOfferResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<DemandOfferResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/BuceGetListTrading?IdSection=${sectionId}&IdSession=${sessionId}&FilterIdCurrency=${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //получение списка заявок на сессию Трейдером
  public getListTrading(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    filterIdCurrency?: number
  ): Observable<GetListDemoffResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetListDemoffResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetListTrading?IdSection=${sectionId}&IdSession=${sessionId}&FilterIdCurrency=${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  // сведения по заявке после сокетов на вкладке Торги
  public tradingGetUpdateMaster(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number
  ): Observable<TradingUpdateMasterResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<TradingUpdateMasterResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/TradingGetUpdateMaster?IdSection=${sectionId}&IdSession=${sessionId}&IdDemandOffer=${idOffer}`,
      { headers: myHeaders }
    );
  }

  // получение заявок по списку для вкладки торги работник
  public buceGetTradingWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    DemandsOffers: number[],
    FilterIdCurrency?: string
  ): Observable<BuceTradingListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let demandsOffers = '';

    for (let i = 0; i < DemandsOffers?.length; i++) {
      demandsOffers += '&DemandsOffers=' + DemandsOffers[i];
    }

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

      return this.http.get<BuceTradingListResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/BuceGetTrading?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}${demandsOffers}`,
      { headers: myHeaders }
    );
  }

  // получение заявок по списку для вкладки торги трейдер
  public getTrading(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    DemandsOffers: number[],
    FilterIdCurrency?: string
  ): Observable<GetTradingListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;
    let demandsOffers = '';
    for (let i = 0; i < DemandsOffers?.length; i++) {
      demandsOffers += '&DemandsOffers=' + DemandsOffers[i];
    }

    return this.http.get<GetTradingListResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetTrading?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}${demandsOffers}`,
      { headers: myHeaders }
    );
  }
}
