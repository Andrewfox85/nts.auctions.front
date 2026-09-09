import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  SessionDepositListResponse,
  GetListDepositResponse,
  ChangeDepositControlRequest,
  GetDepositDetailsResponse,
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class DepositService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  /* --------------------задаток--------------------- */

  // просмотр инф-ции о задатке на сессию Работником
  public getListDepositWorker(
    sessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<SessionDepositListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<SessionDepositListResponse>(
      `${this.urlINV}${this.trading}/Deposit/worker/GetListDeposit?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // просмотр инф-ции о задатке на сессию Трейдером
  public getListDeposit(
    SessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<GetListDepositResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http.get<GetListDepositResponse>(
      `${this.urlINV}${this.trading}/Deposit/GetListDeposit?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // включение/отклонение контроля задатка по клиенту
  public changeCtrl(
    sessionKey: string,
    body: ChangeDepositControlRequest
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Deposit/worker/ChangeCtrl`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // просмотр инф-ции о задатке по заявке Работником
  public depositDetailsWorker(
    sessionKey: string,
    sectionId: string,
    sessionId: string,
    directionId: string,
    demandOfferId: string
  ): Observable<GetDepositDetailsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetDepositDetailsResponse>(
      `${this.urlINV}${this.trading}/Deposit/worker/DepositDetails?IdSection=${sectionId}&IdSession=${sessionId}&IdDirection=${directionId}&IdDemandOffer=${demandOfferId}`,
      { headers: myHeaders }
    );
  }

  // просмотр инф-ции о задатке по заявке Трейдером
  public depositDetails(
    sessionKey: string,
    sectionId: string,
    sessionId: string,
    directionId: string,
    demandOfferId: string
  ): Observable<GetDepositDetailsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetDepositDetailsResponse>(
      `${this.urlINV}${this.trading}/Deposit/DepositDetails?IdSection=${sectionId}&IdSession=${sessionId}&IdDirection=${directionId}&IdDemandOffer=${demandOfferId}`,
      { headers: myHeaders }
    );
  }
}
