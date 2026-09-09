import { inject, Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom, Subject, Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Body } from '../features/trading/pages/deposit/shared';
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root',
})
export class TradingService {
  private readonly cookieService = inject(CookieService);
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  sessionId: number = 0;
  sectionId: number = 0;
  isExistsViolations: boolean;
  idDirection: number | null;
  deletedScopeForCounter: any;
  //infoDeletedScopeFromCounter: any;

  private urlINV = this.conf.backendINV;
  private NSIManagement = this.conf.NSIManagement;
  private OrderManagement = this.conf.OrderManagement;
  private trading = this.conf.trading;
  private demands = this.conf.demands;

  private _trigger = new Subject<void>();

  get trigger$() {
    return this._trigger.asObservable();
  }

  public getDataFromSocket(data) {
    this._trigger.next(data);
  }

  //-----------------настройки периодов ------------------------//

  // получение перечня действующих настроек
  public buceGetListOptions(
    sessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get(
      `${this.urlINV}${this.trading}/Sessions/worker/BuceGetListOptions?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  //включение/отключение контроля ограничений на покупку
  public buceOptSetBuyersLimits(
    sessionKey: string,
    body: any
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Sessions/worker/BuceOptSetBuyersLimits`,
      body,
      { headers: myHeaders }
    );
  }

  // просмотр ограничений
  public getLimitations(
    sessionKey: string,
    sectionId: number,
    sessionId: number
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get(
      `${this.urlINV}${this.OrderManagement}/Sessions/worker/GetLimitations?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // получение участников
  public getLimitParticipants(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    ListLimits?: number[]
  ): Observable<any> {
    let listLimits = '';

    for (let i = 0; i < ListLimits?.length; i++) {
      listLimits += '&ListLimits=' + ListLimits[i];
    }

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get(
      `${this.urlINV}${this.OrderManagement}/Sessions/worker/GetLimitParticipants?IdSection=${sectionId}&IdSession=${sessionId}${listLimits}`,
      { headers: myHeaders }
    );
  }

  //включение/отключение режима "цель ограничения"
  public buceOptSetBuyersPurps(sessionKey: string, body: Body) {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Sessions/worker/BuceOptSetBuyersPurps`,
      body,
      { headers: myHeaders }
    );
  }

  // может ли трейдер получать данные по сокету
  public checkWhetherLogged(sessionKey: string, body: any): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Sessions/CheckWhetherLogged`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  /* ------------------------Правила редактирования модели заявки-------------------------- */

  // получение информации о последней поданной ставке для предзаполнения формы
  Get(SessionKey: string, ModelId, SectionId): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get(
      `${this.urlINV}${this.demands}/models/Get?model_id=${ModelId}&section_id=${SectionId}`,
      { headers: myHeaders }
    );
  }

  // Получение списка полей, подлежащих настройке, с указанием возможных вариантов редактирования
  GetIntFields(SessionKey: string, SectionId, idAuctionType: number) {
    const myHeaders = new HttpHeaders()
      .set('Authorization', SessionKey)
      .set('Section-Id', SectionId)
      .set('lang', this.cookieService.get('UasLang'));
    /*  .set('version ', '1')*/ return this.http
      .get(
        `${this.urlINV}${this.demands}/edit_rules/GetIntFields?id_auction_type=${idAuctionType}&Section-Id=${SectionId}`,
        {
          headers: myHeaders,
        }
      )
      .toPromise();
  }

  //сохранение правил редактирования
  SetEditRules(SessionKey: string, SectionId: number, body: any):Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    const headerDict = {
      Authorization: SessionKey,
      'Section-Id': SectionId.toString(), //сделать sectionId стринг!
      accept: '*/*',
    };
    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    return this.http
      .post(
        `${this.urlINV}${this.demands}/edit_rules/SetEditRules`,
        body,
        requestOptions
      )
  }

  //сохранение правил редактирования
  getEditRules(SessionKey: string, SectionId: number, sessionId: number, modelId: number):Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    const headerDict = {
      Authorization: SessionKey,
      'Section-Id': SectionId.toString(), //сделать sectionId стринг!
      accept: '*/*',
    };
    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    return this.http
      .get(
        `${this.urlINV}${this.demands}/edit_rules/GetEditRules?session_id=${sessionId}&model_id=${modelId}`,
        requestOptions
      )
  }


  /* ------------------------ Редактирование заявки/Принятие встречного предложения -------------------------- */
  // получение условий поставки
  public getDeliveryBasesTreeByModelId(
    sessionKey: string,
    modelId: number,
    sectionId: number
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get(
      `${this.urlINV}${this.NSIManagement}/bases/GetDeliveryBasesTreeByModelId?model_id=${modelId}&section_id=${sectionId}`,
      { headers: myHeaders }
    );
  }

  //срок поставки
  public getModelsDeliveryConfig(sessionKey: string): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .get(
        `${this.urlINV}${this.NSIManagement}/classifiers/GetModelsDeliveryConfig`,
        { headers: myHeaders }
      );
  }

  //условия оплаты
  public getPaymentConfig(
    sessionKey: string,
    sectionId: string
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get(
      `${this.urlINV}${this.NSIManagement}/payment/GetPaymentConfig?section_id=${sectionId}`,
      { headers: myHeaders }
    );
  }

  //нажали на карандашик и перешли на табку редактирования базисов
  private _clickEdit = new Subject<void>();
  get clickEdit$() {
    return this._clickEdit.asObservable();
  }
  public goToBasis() {
    this._clickEdit.next();
  }

  //изменили цену в основном базисе, эта цена поменялась в товарах
  private _changeMainBasis = new Subject<void>();
  get changeMainBasis$() {
    return this._changeMainBasis.asObservable();
  }
  public editMainBasisInfo(data) {
    this._changeMainBasis.next(data);
  }

  //изменили базисы
  private _changeBasis = new Subject<void>();
  get changeBasis$() {
    return this._changeBasis.asObservable();
  }
  public changeBasis(data) {
    this._changeBasis.next(data);
  }

  //изменили существующий доп.базис
  private _changedAddBasis = new Subject<void>();
  get changeAddBasis$() {
    return this._changedAddBasis.asObservable();
  }
  public changedAdditionalBasis(data) {
    this._changedAddBasis.next(data);
  }

  //изменили количество
  private _changeVolume = new Subject<void>();
  get changeVolume$() {
    return this._changeVolume.asObservable();
  }
  public editVolume(data) {
    this._changeVolume.next(data);
  }

  //изменили данные в сроке поставки
  private _changeDeliveryParams = new Subject<void>();
  get changeDeliveryParams$() {
    return this._changeDeliveryParams.asObservable();
  }
  public editDeliveryParams(data) {
    this._changeDeliveryParams.next(data);
  }

  //изменили что-то на вкладках и на вкладке общая информация разблокировалась кнопка Сохранить, передаем то, что изменилось
  private _isDisabledSaveButton = new Subject<void>();
  get isDisabledSaveButton$() {
    return this._isDisabledSaveButton.asObservable();
  }
  public nonDisabledSaveButton(data) {
    this._isDisabledSaveButton.next(data);
  }

  //при принятии встречного предложения передаем строку с удаленными грузоотправителями на страницу с грузоотправителями
  private _concatedDeletedClients = new Subject<void>();
  get concatedDeletedClients$() {
    return this._concatedDeletedClients.asObservable();
  }
  public sendConcatedDeletedClients(data) {
    this._concatedDeletedClients.next(data);
  }

  //при принятии встречного предложения передаем массив грузоотправителей когда нажали принять встречку
  private _changeScope = new Subject<void>();
  get changeScopes$() {
    return this._changeScope.asObservable();
  }
  public sendChangeScope(data) {
    this._changeScope.next(data);
  }

  //смотрим грузоотпраивтлей при встречке
  private _infoDeletedScopeFromCounter = new Subject<any>();

  get infoDeletedScopeFromCounter$() {
    return this._infoDeletedScopeFromCounter.asObservable();
  }

  public updateDeletedScopeFromCounter(newData: any): void {
    this._infoDeletedScopeFromCounter.next(newData);
  }

  //изменили тип выезжающего окна
  private _openTypeSidebar = new Subject<any>();
  get openTypeSidebar$() {
    return this._openTypeSidebar.asObservable();
  }
  public changedOpenTypeSidebar(type: string): void {
    this._openTypeSidebar.next(type);
  }
}
