import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  GetListRegistrationsWorkerResponse,
  GetListRegistrationsResponse,
  RegistrationRestoreRequest,
  RegistrationRestoreResponse,
  RegistrationAnnulRequest,
  RegistrationAnnulResponse,
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  /* --------------------регистрации--------------------- */

  // получение списка регистраций на сессию Работником
  public getListRegistrationsWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    searchString?: string
  ): Observable<GetListRegistrationsWorkerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetListRegistrationsWorkerResponse>(
      `${this.urlINV}${this.trading}/Sessions/worker/GetListRegistrationsWorker?IdSection=${sectionId}&IdSession=${sessionId}&SearchString=${searchString}`,
      { headers: myHeaders }
    );
  }

  // получение списка регистраций на сессию Трейдером
  public getListRegistrations(
    sessionKey: string,
    sectionId: number,
    sessionId: number
  ): Observable<GetListRegistrationsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetListRegistrationsResponse>(
      `${this.urlINV}${this.trading}/Sessions/GetListRegistrations?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // восстановление регистраций
  public registrationRestore(
    sessionKey: string,
    body: RegistrationRestoreRequest
  ): Observable<RegistrationRestoreResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<RegistrationRestoreResponse>(
      `${this.urlINV}${this.trading}/Sessions/worker/RegistrationRestore`,
      body,
      { headers: myHeaders }
    );
  }

  // отклонение регистраций
  public registrationAnnul(
    sessionKey: string,
    body: RegistrationAnnulRequest
  ): Observable<RegistrationAnnulResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<RegistrationAnnulResponse>(
      `${this.urlINV}${this.trading}/Sessions/worker/RegistrationAnnul`,
      body,
      { headers: myHeaders }
    );
  }
}
