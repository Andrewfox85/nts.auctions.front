import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  IGetListParticipantsResponse,
  IGetTraderDirectionsResponse,
  ITraderCastOutBody,
  IGetListFirmTradersResponse,
  ITraderChangeOwnerBody,
  IBuceTraderGetNumbersResponse,
  IBucePriceStepsBody,
  IBucePeriodsUpdatePriceStepBody,
  ITraderCastOutResponse,
  ITraderChangeOwnerResponse,
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class TraderService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  //получение списка трейдеров на сессию
  public getListParticipants(
    sessionKey: string,
    sectionId: number,
    sessionId: number
  ): Observable<IGetListParticipantsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<IGetListParticipantsResponse>(
      `${this.urlINV}${this.trading}/Sessions/worker/GetListParticipants?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  //получение списка направлений, по которым исключаются трейдеры
  public getTraderDirections(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    traderId: number
  ): Observable<IGetTraderDirectionsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<IGetTraderDirectionsResponse>(
      `${this.urlINV}${this.trading}/Sessions/worker/GetTraderDirections?IdSection=${sectionId}&IdSession=${sessionId}&IdTrader=${traderId}`,
      { headers: myHeaders }
    );
  }

  //исключение трейдера из торгов
  public traderCastOut(
    sessionKey: string,
    body: ITraderCastOutBody
  ): Observable<ITraderCastOutResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<ITraderCastOutResponse>(
      `${this.urlINV}${this.trading}/Sessions/worker/TraderCastOut`,
      body,
      { headers: myHeaders }
    );
  }

  //получение списка трейдеров
  public getListFirmTraders(
    sessionKey: string,
    sectionId: number,
    SessionId: number,
    firmId: number
  ): Observable<IGetListFirmTradersResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<IGetListFirmTradersResponse>(
      `${this.urlINV}${this.trading}/Sessions/worker/GetListFirmTraders?IdSection=${sectionId}&IdSession=${SessionId}&IdFirm=${firmId}`,
      { headers: myHeaders }
    );
  }

  //замена трейдера
  public traderChangeOwner(
    sessionKey: string,
    body: ITraderChangeOwnerBody
  ): Observable<ITraderChangeOwnerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<ITraderChangeOwnerResponse>(
      `${this.urlINV}${this.trading}/Sessions/worker/TraderChangeOwner`,
      body,
      { headers: myHeaders }
    );
  }

  //обновление количества заявок по трейдеру
  public buceTraderGetNumbers(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    traderId: number
  ): Observable<IBuceTraderGetNumbersResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<IBuceTraderGetNumbersResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/BuceTraderGetNumbers?IdSection=${sectionId}&IdSession=${sessionId}&IdTrader=${traderId}`,
      { headers: myHeaders }
    );
  }

  //индивидуальный шаг цены
  public bucePriceSteps(
    sessionKey: string,
    body: IBucePriceStepsBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/worker/BucePriceSteps`,
      body,
      { headers: myHeaders }
    );
  }

  //пересчет шага цены
  public bucePeriodsUpdatePriceStep(
    sessionKey: string,
    body: IBucePeriodsUpdatePriceStepBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/worker/BucePeriodsUpdatePriceStep`,
      body,
      { headers: myHeaders }
    );
  }
}
