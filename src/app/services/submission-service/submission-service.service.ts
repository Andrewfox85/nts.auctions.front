import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  PlacesTreeResponse,
  DeliveryTermConcatedResponse,
  DeterminePaymentCondResponse,
  PaymentTermConcatedResponse,
  PayDelivDeadlinesResponse,
  PriceLimitQuotationResponse,
  PriceLimitCorridorResponse,
  ActivePriceLimitResponse,
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class SubmissionService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;
  private readonly orderManagement = this.conf.OrderManagement;

  //место поставки базиса
  public getDeliveryPlacesTree(
    sessionKey: string,
    idBasisLink: number
  ): Observable<PlacesTreeResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<PlacesTreeResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/GetDeliveryPlacesTree?IdBasisLink=${idBasisLink}`,
      { headers: myHeaders }
    );
  }

  //строка срок поставки
  public getDeliveryTermConcated(
    sessionKey: string,
    idDeliveryMoment: number,
    idPeriodType: number,
    PeriodTypeValue?: number,
    DateBegin?: number,
    DateEnd?: number
  ): Observable<DeliveryTermConcatedResponse> {
    let periodTypeValue =
      PeriodTypeValue === null ? '' : '&PeriodTypeValue=' + PeriodTypeValue;
    let dateBegin = DateBegin === null ? '' : '&DateBegin=' + DateBegin;
    let dateEnd = DateEnd === null ? '' : '&DateEnd=' + DateEnd;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<DeliveryTermConcatedResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/GetDeliveryTermConcated?IdDeliveryMoment=${idDeliveryMoment}&IdPeriodType=${idPeriodType}${periodTypeValue}${dateBegin}${dateEnd}`,
      { headers: myHeaders }
    );
  }

  //получение идентификатора набора условий
  public determinePaymentCondId(
    sessionKey: string,
    idPaymentType: number,
    idShipmentVolume: number,
    IdPaymentMomentPrepay: number,
    IdPaymentMomentDelay: number
  ): Observable<DeterminePaymentCondResponse> {
    let idPaymentMomentPrepay =
      IdPaymentMomentPrepay === null
        ? ''
        : '&IdPaymentMomentPrepay=' + IdPaymentMomentPrepay;
    let idPaymentMomentDelay =
      IdPaymentMomentDelay === null
        ? ''
        : '&IdPaymentMomentDelay=' + IdPaymentMomentDelay;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<DeterminePaymentCondResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/DeterminePaymentCondId?IdPaymentType=${idPaymentType}&IdShipmentVolume=${idShipmentVolume}${idPaymentMomentPrepay}${idPaymentMomentDelay}`,
      { headers: myHeaders }
    );
  }

  //строка условия оплаты
  public getPaymentTermConcated(
    sessionKey: string,
    idPaymentType: number,
    idPaymentCondition: number,
    FirstPeriodValueNumber: number,
    firstPercent: number,
    FirstPeriodValueDate: number,
    SecondPercent: number,
    SecondPeriodValueNumber: number,
    ThirdPeriodValueNumber: number,
    IdDayType: number
  ): Observable<PaymentTermConcatedResponse> {
    let firstPeriodValueNumber =
      FirstPeriodValueNumber === null
        ? ''
        : '&FirstPeriodValueNumber=' + FirstPeriodValueNumber;
    let firstPeriodValueDate =
      FirstPeriodValueDate === null
        ? ''
        : '&FirstPeriodValueDate=' + FirstPeriodValueDate;
    let secondPercent =
      SecondPercent === null ? '' : '&SecondPercent=' + SecondPercent;
    let secondPeriodValueNumber =
      SecondPeriodValueNumber === null
        ? ''
        : '&SecondPeriodValueNumber=' + SecondPeriodValueNumber;
    let thirdPeriodValueNumber =
      ThirdPeriodValueNumber === null
        ? ''
        : '&ThirdPeriodValueNumber=' + ThirdPeriodValueNumber;
    let idDayType = IdDayType === null ? '' : '&IdDayType=' + IdDayType;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<PaymentTermConcatedResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/GetPaymentTermConcated?IdPaymentType=${idPaymentType}&IdPaymentCondition=${idPaymentCondition}${firstPeriodValueNumber}&FirstPercent=${firstPercent}${firstPeriodValueDate}${secondPercent}${secondPeriodValueNumber}${thirdPeriodValueNumber}${idDayType}`,
      { headers: myHeaders }
    );
  }

  //расчет контрольных сроков по условиям оплаты/поставки
  public getPayDelivDeadlines(
    sessionKey: string,
    idSection: number,
    idSession: number,
    isTargeted: boolean,
    idPaymentType: number,
    IdMomentPrepay: number,
    IdMomentDelay: number,
    IdDayType: number,
    FirstPeriodValueNumber: number,
    FirstPeriodValueDate: number,
    SecondPeriodValueNumber: number,
    ThirdPeriodValueNumber: number,
    idDeliveryMoment: number,
    idPeriodType: number,
    PeriodTypeValue: number,
    DateBegin: number,
    DateEnd: number
  ): Observable<PayDelivDeadlinesResponse> {
    let idMomentPrepay =
      IdMomentPrepay === null ? '' : '&IdMomentPrepay=' + IdMomentPrepay;
    let idMomentDelay =
      IdMomentDelay === null ? '' : '&IdMomentDelay=' + IdMomentDelay;
    let firstPeriodValueNumber =
      FirstPeriodValueNumber === null
        ? ''
        : '&FirstPeriodValueNumber=' + FirstPeriodValueNumber;
    let firstPeriodValueDate =
      FirstPeriodValueDate === null
        ? ''
        : '&FirstPeriodValueDate=' + FirstPeriodValueDate;
    let secondPeriodValueNumber =
      SecondPeriodValueNumber === null
        ? ''
        : '&SecondPeriodValueNumber=' + SecondPeriodValueNumber;
    let thirdPeriodValueNumber =
      ThirdPeriodValueNumber === null
        ? ''
        : '&ThirdPeriodValueNumber=' + ThirdPeriodValueNumber;
    let idDayType = IdDayType === null ? '' : '&IdDayType=' + IdDayType;
    let periodTypeValue =
      PeriodTypeValue === null ? '' : '&PeriodTypeValue=' + PeriodTypeValue;
    let dateBegin = DateBegin === null ? '' : '&DateBegin=' + DateBegin;
    let dateEnd = DateEnd === null ? '' : '&DateEnd=' + DateEnd;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<PayDelivDeadlinesResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/GetPayDelivDeadlines?IdSection=${idSection}&IdSession=${idSession}&IsTargeted=${isTargeted}&IdPaymentType=${idPaymentType}${idMomentPrepay}${idMomentDelay}${idDayType}${firstPeriodValueNumber}${firstPeriodValueDate}${secondPeriodValueNumber}${thirdPeriodValueNumber}&IdDeliveryMoment=${idDeliveryMoment}&IdPeriodType=${idPeriodType}${periodTypeValue}${dateBegin}${dateEnd}`,
      { headers: myHeaders }
    );
  }

  //получение котировки для биржевого товара
  public getPriceLimitQuotation(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    modelId: number,
    directionId: number,
    goodId: number,
    currencyId: number,
    VatPercent: number,
    unitId: number,
    volume: number,
    paymentTypeId: number,
    basisValueId: number,
    IdPlaceLink?: number,
    PlaceDetails?: string
  ): Observable<PriceLimitQuotationResponse> {
    let idPlaceLink = IdPlaceLink === null ? '' : '&IdPlaceLink=' + IdPlaceLink;
    let placeDetails =
      PlaceDetails === null ? '' : '&PlaceDetails=' + PlaceDetails;
    let vatPercent = VatPercent === null ? '' : '&VatPercent=' + VatPercent;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<PriceLimitQuotationResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/GetPriceLimitQuotation?IdSection=${sectionId}&IdSession=${sessionId}&IdModel=${modelId}&IdDirection=${directionId}&IdGood=${goodId}&IdCurrency=${currencyId}${vatPercent}&IdUnit=${unitId}&Volume=${volume}&IdPaymentType=${paymentTypeId}&IdBasisValue=${basisValueId}${idPlaceLink}${placeDetails}`,
      { headers: myHeaders }
    );
  }

  //получения котировки для товара-аналога
  public getPriceLimitQuotationAnalog(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    modelId: number,
    directionId: number,
    groupNomenclatureId: number,
    groupGoodId: number,
    nameGoodId: number,
    GoodDescription: string,
    currencyId: number,
    VatPercent: number,
    unitId: number,
    volume: number,
    paymentTypeId: number,
    basisValueId: number,
    IdPlaceLink?: number,
    PlaceDetails?: string
  ): Observable<PriceLimitQuotationResponse> {
    let idGroupNomenclature =
      groupNomenclatureId === null
        ? ''
        : '&IdGroupNomenclature=' + groupNomenclatureId;
    let idGroupGood = groupGoodId === null ? '' : '&IdGroupGood=' + groupGoodId;
    let idNameGood = nameGoodId === null ? '' : '&IdNameGood=' + nameGoodId;
    let goodDescription =
      GoodDescription === null ? '' : '&GoodDescription=' + GoodDescription;
    let idPlaceLink = IdPlaceLink === null ? '' : '&IdPlaceLink=' + IdPlaceLink;
    let placeDetails =
      PlaceDetails === null ? '' : '&PlaceDetails=' + PlaceDetails;
    let vatPercent = VatPercent === null ? '' : '&VatPercent=' + VatPercent;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<PriceLimitQuotationResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/GetPriceLimitQuotationAnalog?IdSection=${sectionId}&IdSession=${sessionId}&IdModel=${modelId}&IdDirection=${directionId}${idGroupNomenclature}${idGroupGood}${idNameGood}${goodDescription}&IdCurrency=${currencyId}${vatPercent}&IdUnit=${unitId}&Volume=${volume}&IdPaymentType=${paymentTypeId}&IdBasisValue=${basisValueId}${idPlaceLink}${placeDetails}`,
      { headers: myHeaders }
    );
  }

  //получение ценового коридора для биржевого товара
  public getPriceLimitCorridor(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    modelId: number,
    directionId: number,
    goodId: number,
    currencyId: number,
    VatPercent: number,
    unitId: number,
    volume: number,
    paymentTypeId: number,
    basisValueId: number,
    IdPlaceLink?: number,
    PlaceDetails?: string
  ): Observable<PriceLimitCorridorResponse> {
    let idPlaceLink = IdPlaceLink === null ? '' : '&IdPlaceLink=' + IdPlaceLink;
    let placeDetails =
      PlaceDetails === null ? '' : '&PlaceDetails=' + PlaceDetails;
    let vatPercent = VatPercent === null ? '' : '&VatPercent=' + VatPercent;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<PriceLimitCorridorResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/GetPriceLimitCorridor?IdSection=${sectionId}&IdSession=${sessionId}&IdModel=${modelId}&IdDirection=${directionId}&IdGood=${goodId}&IdCurrency=${currencyId}${vatPercent}&IdUnit=${unitId}&Volume=${volume}&IdPaymentType=${paymentTypeId}&IdBasisValue=${basisValueId}${idPlaceLink}${placeDetails}`,
      { headers: myHeaders }
    );
  }

  //получения ценового коридора для товара-аналога
  public getPriceLimitCorridorAnalog(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    modelId: number,
    directionId: number,
    groupNomenclatureId: number,
    groupGoodId: number,
    nameGoodId: number,
    GoodDescription: string,
    currencyId: number,
    VatPercent: number,
    unitId: number,
    volume: number,
    paymentTypeId: number,
    basisValueId: number,
    IdPlaceLink?: number,
    PlaceDetails?: string
  ): Observable<PriceLimitCorridorResponse> {
    let idGroupNomenclature =
      groupNomenclatureId === null
        ? ''
        : '&IdGroupNomenclature=' + groupNomenclatureId;
    let idGroupGood = groupGoodId === null ? '' : '&IdGroupGood=' + groupGoodId;
    let idNameGood = nameGoodId === null ? '' : '&IdNameGood=' + nameGoodId;
    let goodDescription =
      GoodDescription === null ? '' : '&GoodDescription=' + GoodDescription;
    let idPlaceLink = IdPlaceLink === null ? '' : '&IdPlaceLink=' + IdPlaceLink;
    let placeDetails =
      PlaceDetails === null ? '' : '&PlaceDetails=' + PlaceDetails;
    let vatPercent = VatPercent === null ? '' : '&VatPercent=' + VatPercent;

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<PriceLimitCorridorResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/GetPriceLimitCorridorAnalog?IdSection=${sectionId}&IdSession=${sessionId}&IdModel=${modelId}&IdDirection=${directionId}${idGroupNomenclature}${idGroupGood}${idNameGood}${goodDescription}&IdCurrency=${currencyId}${vatPercent}&IdUnit=${unitId}&Volume=${volume}&IdPaymentType=${paymentTypeId}&IdBasisValue=${basisValueId}${idPlaceLink}${placeDetails}`,
      { headers: myHeaders }
    );
  }

  //проверка наличия контроля ценовых параметров
  public checkActivePriceLimit(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    modelId: number,
    directionId: number
  ): Observable<ActivePriceLimitResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<ActivePriceLimitResponse>(
      `${this.urlINV}${this.orderManagement}/Submission/CheckActivePriceLimit?IdSection=${sectionId}&IdSession=${sessionId}&IdModel=${modelId}&IdDirection=${directionId}`,
      { headers: myHeaders }
    );
  }
}
