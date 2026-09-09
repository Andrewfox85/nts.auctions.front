import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  DemandBiddingProcessResponse,
  DemandOfferListResponse,
  DemandOfferResponse,
  DemandOfferWatchedAddRequest,
  DemandOfferWatchedDeleteRequest,
  DemandsOffersRejectRequest,
  DemandsOffersRejectResponse,
  EditOfferDemandResponse,
  GetListDemoffResponse,
  handleLongRequestTimeout,
  IAnalogGoodsResponse,
  OfferBiddingProcessResponse,
  OfferFullInfoResponse,
  OptSetActiveModeBody,
  OptSetAnalogRulesBody,
  REQUEST_TIMEOUT_MS,
  TradingUpdateDetailsResponse,
  WatchedAddRequest,
  WatchedDeleteRequest,
} from './shared';
import { catchError, map, timeout } from 'rxjs/operators';
import { ErrorServiceService } from '../error-service.service';
import { LocalStorageService } from "@shared-services";
import { ISessionStateConfig } from '../../views/homepage/interfaces';
import { SessionIds } from '../../features/trading/pages/deposit/shared';
import { IdDirection, sectionID } from '@constants';
import { CookieService } from 'ngx-cookie-service';
import { getTranslateResultByCurrentLang } from '@helpers';

export interface concatedCondition {
  result: string
}

@Injectable({
  providedIn: 'root',
})
export class DemandService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly errorServiceService: ErrorServiceService = inject(ErrorServiceService);
  private readonly cookieService: CookieService = inject(CookieService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;
  private readonly orderManagmanet = this.conf.OrderManagement;

  /* ---------------------заявки----------------------- */

  // получение списка заявок на сессию Работником
  public getListDemoffWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    directionId: number,
    filterIdCurrency?: number
  ): Observable<DemandOfferResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<DemandOfferResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/GetListDemoff?IdSection=${sectionId}&IdSession=${sessionId}&FilterIdDirection=${directionId}&FilterIdCurrency=${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  // получение списка заявок на сессию Трейдером
  public getListDemoff(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    directionId: number,
    filterIdCurrency?: number
  ): Observable<GetListDemoffResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetListDemoffResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetListDemoff?IdSection=${sectionId}&IdSession=${sessionId}&FilterIdDirection=${directionId}&FilterIdCurrency=${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  // добавление заявки в наблюдаемые Работник
  public watchedAddWorker(
    sessionKey: string,
    body: WatchedAddRequest
  ): Observable<void> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<void>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/WatchedAdd`,
      body,
      { headers: myHeaders }
    );
  }

  // удаление заявки из наблюдаемых Работник
  public watchedDeleteWorker(
    sessionKey: string,
    body: WatchedDeleteRequest
  ): Observable<void> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<void>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/WatchedDelete`,
      body,
      { headers: myHeaders }
    );
  }

  // добавление заявки в наблюдаемые Трейдер
  public watchedAdd(
    sessionKey: string,
    body: DemandOfferWatchedAddRequest
  ): Observable<void> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<void>(
      `${this.urlINV}${this.trading}/DemandOffer/WatchedAdd`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // удаление заявки из наблюдаемых Трейдер
  public watchedDelete(
    sessionKey: string,
    body: DemandOfferWatchedDeleteRequest
  ): Observable<void> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<void>(
      `${this.urlINV}${this.trading}/DemandOffer/WatchedDelete`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // просмотр заявки
  public getDemandOfferFullInfo(
    sessionKey: string,
    directionId: number,
    sectionId: number,
    sessionId: number,
    demandOfferId: number,
    currentTab: number,
    FilterIdCurrency?: string,
    IsNeedOriginalVat?: boolean
  ): Observable<OfferFullInfoResponse> {
    //currentTab 1-заявки, 2 - торги
    let filterIdCurrency: string =
      '&FilterIdCurrency=' + FilterIdCurrency;

    let isNeedOriginalVat: string =
      IsNeedOriginalVat ? '&IsNeedOriginal=' + true : '';

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .get<OfferFullInfoResponse>(
        `${this.urlINV}${this.trading}/DemandOffer/GetDemandOfferFullInfo?IdDirection=${directionId}&IdSection=${sectionId}&IdSession=${sessionId}&IdDemandOffer=${demandOfferId}&CurrentTab=${currentTab}${filterIdCurrency}${isNeedOriginalVat}`,
        { headers: myHeaders }
      )
      .pipe(
        map((res) => {
            if (!IsNeedOriginalVat) {
              return this.adjustVatForCombinedMarketTypes(res, FilterIdCurrency);
            }
            return res;
          }
        )
      );
  }

  // отклонение заявок
  public demandsOffersReject(
    sessionKey: string,
    body: DemandsOffersRejectRequest
  ): Observable<DemandsOffersRejectResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<DemandsOffersRejectResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/DemandsOffersReject`,
      body,
      { headers: myHeaders }
    );
  }

  // восстановление заявок
  public restoreRejected(sessionKey: string, body: any): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/worker/RestoreRejected`,
      body,
      { headers: myHeaders }
    );
  }

  // детализация по товарам
  public tradingGetUpdateDetails(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number,
    FilterIdCurrency: string
  ): Observable<TradingUpdateDetailsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<TradingUpdateDetailsResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/TradingGetUpdateDetails?IdSection=${sectionId}&IdSession=${sessionId}&IdDemandOffer=${idOffer}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  // получение данных по списку заявок трейдером
  public getDemoff(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    DemandsOffers: number[],
    FilterIdDirection: number,
    FilterIdCurrency?: string
  ): Observable<DemandOfferListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let demandsOffers = this.buildDemandOfferQueryParam(DemandsOffers);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<DemandOfferListResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetDemoff?${demandsOffers}&IdSection=${sectionId}&IdSession=${sessionId}&FilterIdDirection=${FilterIdDirection}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  // получение данных по списку заявок работником
  public buceGetDemoff(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    DemandsOffers: number[],
    FilterIdDirection: number,
    FilterIdCurrency?: string
  ): Observable<DemandOfferListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let demandsOffers = this.buildDemandOfferQueryParam(DemandsOffers);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<DemandOfferListResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/BuceGetDemoff?${demandsOffers}&IdSection=${sectionId}&IdSession=${sessionId}&FilterIdDirection=${FilterIdDirection}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  private buildDemandOfferQueryParam(demandsOffers: number[]): string {
    let demandOffersQuery = '';

    for (let i = 0; i < demandsOffers?.length; i++) {
      demandOffersQuery += '&DemandsOffers=' + demandsOffers[i];
    }

    return demandOffersQuery;
  }

  //изменения режима активации заявок
  public buceOptSetActiveMode(sessionKey: string, body: OptSetActiveModeBody) {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
    return lastValueFrom(
      this.http.post<ResponseType>(
        `${this.urlINV}${this.trading}/DemandOffer/worker/BuceOptSetActiveMode`,
        body,
        { headers: myHeaders }
      )
    );
  }

  // краткий просмотр заявки на продажу
  public getOfferShortInfo(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number,
    currentTab: number,
    typeRequest: string,
    queryParams: string,
    FilterIdCurrency?: string
  ): Observable<OfferFullInfoResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http
      .get<OfferFullInfoResponse>(
        `${this.urlINV}${this.trading}/DemandOffer/${typeRequest}?IdSection=${sectionId}&IdSession=${sessionId}&${queryParams}=${idOffer}&CurrentTab=${currentTab}${filterIdCurrency}`,
        { headers: myHeaders }
      )
      .pipe(
        map((res) =>
          this.adjustVatForCombinedMarketTypes(res, FilterIdCurrency)
        )
      );
  }

  // краткий просмотр заявки на продажу
  public getDemandShortInfo(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idDemand: number,
    currentTab: number,
    FilterIdCurrency?: string
  ): Observable<OfferFullInfoResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http
      .get<OfferFullInfoResponse>(
        `${this.urlINV}${this.trading}/DemandOffer/GetDemandShortInfo?IdSection=${sectionId}&IdSession=${sessionId}&IdDemand=${idDemand}&CurrentTab=${currentTab}${filterIdCurrency}`,
        { headers: myHeaders }
      )
      .pipe(
        map((res) =>
          this.adjustVatForCombinedMarketTypes(res, FilterIdCurrency)
        )
      );
  }

  /*если в фильтре валюта не выбрана, получаем цены из заявки (для заявок на два типа рынка НДС автоматически сбрасывается на 0, сумма НДС вычитается из стоимости);
          если в фильтре выбрана иностранная валюта, получаем уже пересчитанные цены (для заявок на два типа рынка НДС также сбрасывается);
          если в фильтре выбраны BYN, получаем пересчитанные в рубли цены.*/

  private adjustVatForCombinedMarketTypes(
    response: OfferFullInfoResponse,
    filterIdCurrency: string
  ): OfferFullInfoResponse {
    if (
      filterIdCurrency !== '1' &&
      response.generalInfo?.isCombinedMarketTypes
    ) {
      response.goods?.forEach((good) => {
        const vat = good.goodsSpecifications?.find(
          (el) => el.idInterfaceField === 5
        );
        if (vat) {
          vat.fieldValue = '0%';
          vat.fieldValueNumber = 2;
        }
      });
    }
    return response;
  }

  public getDeliveryCondConcated(
    sessionKey: string,
    IdBasisLink: number,
    IdPlaceLink?: number,
    PlaceDetails?: string
  ): Observable<concatedCondition> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let idPlaceLink =
      IdPlaceLink != null
        ? '&IdPlaceLink=' + IdPlaceLink :
        '';
    let placeDetails =
      PlaceDetails != null
        ? '&PlaceDetails=' + PlaceDetails :
        '';

    return this.http.get<concatedCondition>(
      `${this.urlINV}${this.orderManagmanet}/Submission/GetDeliveryCondConcated?IdBasisLink=${IdBasisLink}${idPlaceLink}${placeDetails}`,
      { headers: myHeaders }
    );
  }

  //todo EditOfferBody вместо any
  // редактирование заявки на продажу
  public editOffer(
    sessionKey: string,
    body: any
  ): Observable<EditOfferDemandResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<EditOfferDemandResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/EditOffer`,
      body,
      {
        headers: myHeaders,
      }
    ).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      catchError((error) =>
        handleLongRequestTimeout(
          error,
          this.errorServiceService,
          this.getLongRequestMessage()
        )
      )
    );
  }

  //todo EditDemandBody
  // редактирование заявки на покупку
  public editDemand(
    sessionKey: string,
    body: any
  ): Observable<EditOfferDemandResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<EditOfferDemandResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/EditDemand`,
      body,
      {
        headers: myHeaders,
      }
    ).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      catchError((error) =>
        handleLongRequestTimeout(
          error,
          this.errorServiceService,
          this.getLongRequestMessage()
        )
      )
    );
  }

  private getLongRequestMessage(): string {
    const lang: string = this.cookieService.get('UasLang')?.toUpperCase();
    return getTranslateResultByCurrentLang(
      lang,
      'errors.longRequestTimeout'
    );
  }

  public workerEditOffer(
    idOffer: number,
    sessionInfo: ISessionStateConfig,
    sessionIds: SessionIds,
    idModel: number,
    modelMarketTypes: string,
    direction: number): void {
    const createOffer = {
      isMine: false, //если пришел участник, значит заявка самого трейдера
      isCreateCopy: false,
      isArchiveSubmit: false,
      idOffer: idOffer,
      sessionName: sessionInfo.sessionName,
      sectionName: sessionInfo.sectionName,
      sessionDateTime: sessionInfo.datetimeBegin,
      sessionId: sessionIds.sessionId,
      sectionId: sessionIds.sectionId,
      modelId: idModel,
      choosenMarketType: modelMarketTypes,
      direction: direction,
      modelsResult: {
        idAuctionType: sessionInfo?.idAuctionType,
        pricingTypeId: sessionInfo.idPricingType,
        type: 'editAuctionOffer'
      }
    };
    // this.localStorageService.setItemToLocalStorage('createOffer', createOffer)
    sessionStorage.setItem('createOffer', JSON.stringify(createOffer))
    const offerData = encodeURIComponent(JSON.stringify(createOffer));
    let strAuctions =
      `${this.conf.orderMan}/createOffer?offer=${offerData}`
    window.location.href = strAuctions;
  }

  public editDirectOffer(
    idOffer: number,
    sessionInfo: ISessionStateConfig,
    sessionIds: SessionIds,
    idModel: number,
    modelMarketTypes: string
  ): void {
    const createOffer = {
      idOffer: idOffer,
      sessionName: sessionInfo.sessionName,
      sectionName: sessionInfo.sectionName,
      sessionDateTime: sessionInfo.datetimeBegin,
      sessionId: sessionIds.sessionId,
      sectionId: sessionIds.sectionId,
      modelId: idModel,
      choosenMarketType: modelMarketTypes,
      direction: IdDirection.sale,
      modelsResult: {
        pricingTypeId: sessionInfo.idPricingType,
      },
      type: 'editAgriOffer',
    };
    sessionStorage.setItem('createOffer', JSON.stringify(createOffer));
    // Создаем параметры для передачи
    const offerData = encodeURIComponent(JSON.stringify(createOffer));
    const strAuctions =
      Number(sessionIds.sectionId) === sectionID.forestProducts
        ? `${this.conf.orderMan}createDirectOffer?offer=${offerData}`
        : `${this.conf.orderMan}createAgriDirectOffer?offer=${offerData}`;
    window.location.href = strAuctions;
  }

  // просмотр хода торгов по заявке (на повышение)
  public getOfferBiddingProcess(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idOffer: number
  ): Observable<OfferBiddingProcessResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<OfferBiddingProcessResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/GetOfferBiddingProcess?IdSection=${sectionId}&IdSession=${sessionId}&IdOffer=${idOffer}`,
      { headers: myHeaders }
    );
  }

   // просмотр хода торгов по заявке (на понижение)
   public getDemandBiddingProcess(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    idDemand: number
  ): Observable<DemandBiddingProcessResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<DemandBiddingProcessResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/worker/GetDemandBiddingProcess?IdSection=${sectionId}&IdSession=${sessionId}&IdDemand=${idDemand}`,
      { headers: myHeaders }
    );
  }

  //активация заявок
  public activateInactive(sessionKey: string, body: any): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/worker/ActivateInactive`,
      body,
      { headers: myHeaders }
    );
  }

  //включение/отключение особого порядка проведения первого периода торгов
  public buceOptSetAnalogRules(
    sessionKey: string,
    body: OptSetAnalogRulesBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/DemandOffer/worker/BuceOptSetAnalogRules`,
      body,
      { headers: myHeaders }
    );
  }

  public getFilteredAnalogsCatalog(
    sessionKey: string,
    idSection: string,
    idSession: string,
    idDemand: string,
    searchString?: string
  ): Observable<IAnalogGoodsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<IAnalogGoodsResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetFilteredAnalogsCatalog?IdSection=${idSection}&IdSession=${idSession}&IdDemand=${idDemand}&SearchString=${searchString}`,
      { headers: myHeaders }
    );
  }
}
