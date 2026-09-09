import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
    ListBranchesFirm,
    ListBranchesOfAllClientsResponse,
    CheckBidderStatePayload,
    CheckBidderStateResponse,
    TradingMakeBidPayload,
    LastBidInfoResponse,
    TradingRemovingleadBidPayload,
    TradingRemovingleadBidResponse,
    TradingGetFinanceSourceResponse,
    AnalogsBidsResponse
} from './shared';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class BidService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  /* ------------------------Подача ставки-------------------------- */

  // получение списка структурных участника
  public getListBranchesFirm(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    isMakingBid: boolean
  ): Observable<ListBranchesFirm> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<ListBranchesFirm>(
      `${this.urlINV}${this.trading}/Bid/GetListBranchesFirm?IdSection=${sectionId}&IdSession=${sessionId}&IsMakingBid=${isMakingBid}`,
      { headers: myHeaders }
    );
  }

  // получение списка клиентов со структурных
  public getListBranchesOfAllClients(
    sessionKey: string,
    sectionId: number,
    sessionId: number
  ): Observable<ListBranchesOfAllClientsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<ListBranchesOfAllClientsResponse>(
      `${this.urlINV}${this.trading}/Bid/GetListBranchesOfAllClients?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // контекстная проверка на продажу
  public checkBidderStateOffer(
    sessionKey: string,
    body: Partial<CheckBidderStatePayload>
  ): Observable<CheckBidderStateResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .post<CheckBidderStateResponse>(`${this.urlINV}${this.trading}/Bid/CheckBidderStateOffer`, body, {
        headers: myHeaders,
      });
  }

  // контекстная проверка на покупку
  public checkBidderStateDemand(
    sessionKey: string,
    body: Partial<CheckBidderStatePayload>
  ): Observable<CheckBidderStateResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .post<CheckBidderStateResponse>(`${this.urlINV}${this.trading}/Bid/CheckBidderStateDemand`, body, {
        headers: myHeaders,
      });
  }

  // подача ставки на покупку
  public tradingMakeBidOffer(
    sessionKey: string,
    body: TradingMakeBidPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .post(`${this.urlINV}${this.trading}/Bid/TradingMakeBidOffer`, body, {
        headers: myHeaders,
      });
  }

  // подача заявки на продажу
  public tradingMakeBidDemand(
    sessionKey: string,
    body: TradingMakeBidPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .post(`${this.urlINV}${this.trading}/Bid/TradingMakeBidDemand`, body, {
        headers: myHeaders,
      });
  }

  // получение информации о последней поданной ставке для предзаполнения формы
  public tradingGetLastBidOfferInfo(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number
  ): Observable<LastBidInfoResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .get<LastBidInfoResponse>(
        `${this.urlINV}${this.trading}/Bid/TradingGetLastBidOfferInfo?IdSection=${sectionId}&IdSession=${sessionId}&IdOffer=${idOffer}`,
        { headers: myHeaders }
      );
  }

  // получение информации о последней поданной заявки для предзаполнения формы
  public tradingGetLastBidDemandInfo(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number
  ): Observable<LastBidInfoResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .get<LastBidInfoResponse>(
        `${this.urlINV}${this.trading}/Bid/TradingGetLastBidDemandInfo?IdSection=${sectionId}&IdSession=${sessionId}&IdDemand=${idOffer}`,
        { headers: myHeaders }
      );
  }

  // снятие ставки
  public tradingRemovingLeadBid(
    sessionKey: string,
    body: TradingRemovingleadBidPayload
  ): Observable<TradingRemovingleadBidResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .post<TradingRemovingleadBidResponse>(
        `${this.urlINV}${this.trading}/Bid/worker/TradingRemovingLeadBid`,
        body,
        { headers: myHeaders }
      );
  }

  // получение источников финансирования
  public tradingGetFinanceSource(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number,
    IdFirmClient: string
  ): Observable<TradingGetFinanceSourceResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let idFirmClient =
      IdFirmClient === '' ? '' : '&IdFirmClient=' + IdFirmClient;

    return this.http
      .get<TradingGetFinanceSourceResponse>(
        `${this.urlINV}${this.trading}/Bid/TradingGetFinanceSource?IdSection=${sectionId}&IdSession=${sessionId}&IdOffer=${idOffer}${idFirmClient}`,
        { headers: myHeaders }
      );
  }

  // получение сведений о товарах, используемых при выборе и направлении ставки (аналоги)
  public getListDemandAnalogBidInfo(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idDemand: number
  ): Observable<AnalogsBidsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .get<AnalogsBidsResponse>(
        `${this.urlINV}${this.trading}/Bid/GetListDemandAnalogBidInfo?IdSection=${sectionId}&IdSession=${sessionId}&IdDemand=${idDemand}`,
        { headers: myHeaders }
      );
  }
}
