import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  SessionWorkerBuceAdmissionStartResponse,
  GetAdmissionOptionsResponse,
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class AccessService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  /* ---------------------допуск---------------- ------- */

  // старт процедуры допуска
  public buceAdmissionStart(
    sessionKey: string,
    body: SessionWorkerBuceAdmissionStartResponse
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Sessions/worker/BuceAdmissionStart`,
      body,
      { headers: myHeaders }
    );
  }

  /* ------------------------------------------------------- Transfer --------------------------------- */

  // получение параметров допуска
  public buceGetAdmissionOptions(
    sessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<GetAdmissionOptionsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetAdmissionOptionsResponse>(
      `${this.urlINV}${this.trading}/Transfer/worker/BuceGetAdmissionOptions?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // проверка были ли проведена процедура допуска
  public isAdmissionProcessed(sessionKey: string, sectionId: string, sessionId: string): Observable<boolean> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .get<boolean>(
        `${this.urlINV}${this.trading}/Transfer/worker/IsAdmissionProcessed?IdSection=${sectionId}&IdSession=${sessionId}`,
        { headers: myHeaders }
      );
  }
}
