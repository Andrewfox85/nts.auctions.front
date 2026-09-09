import { Injectable, inject } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import {
  ISessions,
  ISessionLogin,
  ISessionState,
} from '../views/homepage/interfaces';

import {
  ExportResponse,
  DownloadResponse,
  IApiDataSectionsResponse,
  DxGridState,
  DxGridColumnState
} from '@interfaces';
import { COMPLEX_LOT_PRODUCT_TYPE_ID, COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES, IdInterfaceField } from "@constants";
import { ComplexLotProductType } from "./edit-demand-offer-service.service";

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);
  private readonly urlINV = this.conf.backendINV;
  private readonly OrderManagement = this.conf.OrderManagement;
  private readonly NSIManagement = this.conf.NSIManagement;
  private readonly trading = this.conf.trading;

  public checkPrivileges(str: string): boolean {
    let privilegesArray = localStorage.getItem('privileges');

    return privilegesArray.includes(str);
  }

  public getExportRequestList(token: string): Observable<ExportResponse> {
    const headers = new HttpHeaders().set('Authorization', token);

    return this.http.get<ExportResponse>(
      `${this.urlINV}${this.OrderManagement}/DemandOfferCatalogue/GetExportRequestsList`,
      { headers }
    );
  }

  public getExportRequestDocument(
    token: string,
    requestId: number
  ): Observable<DownloadResponse> {
    const headers = new HttpHeaders().set('Authorization', token);

    return this.http.get<DownloadResponse>(
      `${this.urlINV}${this.OrderManagement}/DemandOfferCatalogue/GetExportRequestDocument?RequestId=${requestId}`,
      { headers }
    );
  }

  public getAllSections(sessionKey: string): Observable<IApiDataSectionsResponse> {
    const myHeaders: HttpHeaders = new HttpHeaders().set('Authorization', sessionKey);
    const url: string = `${this.urlINV}${this.OrderManagement}/Filters/GetRefbookByName?RefbookName=sections`;

    return sessionKey === ''
      ? this.http.get<IApiDataSectionsResponse>(url)
      : this.http.get<IApiDataSectionsResponse>(url,
        {
           headers: myHeaders,
          }
      );
  }

  //получение списка сессий

  GetListSessions(SessionKey: string): Observable<ISessions> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get<ISessions>(
      `${this.urlINV}${this.trading}/Sessions/GetListSessions`,
      { headers: myHeaders }
    );
  }

  //вход в торги
  SessionLogin(
    SessionKey: string,
    SectionId,
    SessionId
  ): Observable<ISessionLogin> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get<ISessionLogin>(
      `${this.urlINV}${this.trading}/Sessions/SessionLogin?IdSection=${SectionId}&IdSession=${SessionId}`,
      { headers: myHeaders }
    );
  }

  //получение текущего состояния сессии
  GetSessionState(
    SessionKey: string,
    SectionId,
    SessionId
  ): Observable<ISessionState> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get<ISessionState>(
      `${this.urlINV}${this.trading}/Sessions/GetSessionState?IdSection=${SectionId}&IdSession=${SessionId}`,
      { headers: myHeaders }
    );
  }

  //получения идентификатора действующего режима активации заявок
  CheckActivationMode(
    SessionKey: string,
    SectionId,
    SessionId,
    NumberOffers,
    NumberDemands
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return lastValueFrom(
      this.http.get<ResponseType>(
        `${this.urlINV}${this.trading}/DemandOffer/CheckActivationMode?IdSection=${SectionId}&IdSession=${SessionId}&NumberOffers=${NumberOffers}&NumberDemands=${NumberDemands}`,
        { headers: myHeaders }
      )
    );
  }

  // справочник
  getByName(
    sessionKey: string,
    className: string,
    sectionId?: string
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let sectionIdResult =
      sectionId === undefined ? '' : '&IdSection=' + sectionId;

    return this.http.get(
      `${this.urlINV}${this.OrderManagement}/Filters/GetRefbookByName?RefbookName=${className}${sectionIdResult}`,
      { headers: myHeaders }
    );
  }

  // справочник по ид
  getById(
    sessionKey: string,
    reference_id: number,
    sectionId?: string
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let sectionIdResult =
      sectionId === undefined ? '' : '&section_id=' + sectionId;

    return this.http.get(
      `${this.urlINV}${this.NSIManagement}/classifiers/GetById?reference_id=${reference_id}${sectionIdResult}`,
      { headers: myHeaders }
    );
  }

  public actualDimensions(value: string, part: number): string {
    //отображение фактических размеров без типа данных
    return value.split('#')[part];
  }

  public visibleDestinations(localStorageName: string): boolean {
    const filtersInfo: DxGridState = JSON.parse(localStorage.getItem(localStorageName));
    const foundField: DxGridColumnState = filtersInfo?.columns?.find(
      el => el.dataField === IdInterfaceField.destination.toString()
    );
    return foundField?.visible ?? true;
  }

  public isComplexLotBySameCharacteristics(complexLotProductTypes: ComplexLotProductType[]): boolean {
    return !!(complexLotProductTypes?.length === 1 &&
      complexLotProductTypes.find(
        (el: ComplexLotProductType) => el.typeId === COMPLEX_LOT_PRODUCT_TYPE_ID &&
          el.referenceIds?.length === 1 &&
          el.referenceIds[0] === COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES
      ));
  }
}
