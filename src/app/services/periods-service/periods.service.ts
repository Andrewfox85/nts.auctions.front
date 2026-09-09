import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  PeriodsSchedulesResponse,
  AvailablePeriodsResponse,
  AvailableOptionsResponse,
  PeriodsAddPayload,
  PeriodsDeletePayoload,
  PeriodsStartPayoload,
  PeriodsEditPayload,
  PeriodsPausePayload,
  PeriodsFinishPayload,
  PeriodsExtendPayload,
  PeriodsEditoAutoStartPayoload,
  PeriodsEditOptionPayload,
  PeriodsExtendFinishedPayload,
  ManageDetailsResponse
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class PeriodsService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;
  private readonly orderManagement = this.conf.OrderManagement

  // получение расписания периодов
  public getPeriodsSchedule(
    sessionKey: string,
    sectionId: number,
    sessionId: number
  ): Observable<PeriodsSchedulesResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<PeriodsSchedulesResponse>(
      `${this.urlINV}${this.trading}/Periods/GetPeriodsSchedule?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // получение перечня периодов, которые можно добавить в расписание
  public getAvailablePeriods(
    sessionKey: string,
    sectionId: number,
    sessionId: number
  ): Observable<AvailablePeriodsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<AvailablePeriodsResponse>(
      `${this.urlINV}${this.trading}/Periods/GetAvailablePeriods?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // получение перечня настроек, для добавляемого периода со значениями по умолчанию
  public getAvailableOptions(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    sessionPeriodId: number
  ): Observable<AvailableOptionsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<AvailableOptionsResponse>(
      `${this.urlINV}${this.trading}/Periods/GetAvailableOptions?IdSection=${sectionId}&IdSession=${sessionId}&IdSessionPeriod=${sessionPeriodId}`,
      { headers: myHeaders }
    );
  }

  // добавление периода
  public periodsAdd(
    sessionKey: string,
    body: PeriodsAddPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsAdd`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // удаление последнего периода из расписания
  public periodsDelete(
    sessionKey: string,
    body: PeriodsDeletePayoload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsDelete`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // запуск периода вручную
  public periodsStart(
    sessionKey: string,
    body: PeriodsStartPayoload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsStart`,
      body,
      {
        headers: myHeaders,
      }
    );
  }
  // массовое изменение настроек неактивного периода
  public periodsEdit(
    sessionKey: string,
    body: PeriodsEditPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsEdit`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // увеличение продолжительности периода
  public periodsExtend(
    sessionKey: string,
    body: PeriodsExtendPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsExtend`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // изменение состояния настройки автоматического старта
  public periodsEditAutoStart(
    sessionKey: string,
    body: PeriodsEditoAutoStartPayoload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsEditAutoStart`,
      body,
      { headers: myHeaders }
    );
  }

  // изменение конктретного настрочного параметра текущего периода
  public periodsEditOption(
    sessionKey: string,
    body: PeriodsEditOptionPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsEditOption`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // приостановка периода
  public periodsPause(
    sessionKey: string,
    body: PeriodsPausePayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsPause`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // остановка периода
  public periodsFinish(
    sessionKey: string,
    body: PeriodsFinishPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsFinish`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // продление завершенного периода
  public periodsExtendFinished(
    sessionKey: string,
    body: PeriodsExtendFinishedPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Periods/PeriodsExtendFinished`,
      body,
      { headers: myHeaders }
    );
  }

    //кол-во внерегламентных действий для кнопки Открыть доступ
    public getManageDetails(
      sessionKey: string,
      sectionId: number,
      sessionId: number
    ): Observable<ManageDetailsResponse> {
      const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
  
      return this.http.get<ManageDetailsResponse>(
        `${this.urlINV}${this.orderManagement}/Permissions/worker/GetManageDetails?IdSection=${sectionId}&IdSession=${sessionId}`,
        { headers: myHeaders }
      );
    }
}
