import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  BuceTransferStartMainResponse,
  BuceTransferStartTargetResponse,
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class ArchieveService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  //------------------------Перенос в архив-----------------------------------------

  // todo check with backend about isFinalCall: number coz from frontend we send boolean
  // перенос в архив основной части
  public buceTransferStartMain(
    sessionKey: string,
    body: BuceTransferStartMainResponse
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Sessions/worker/BuceTransferStartMain`,
      body,
      { headers: myHeaders }
    );
  }

  // промежуточный перенос в архив
  public buceTransferStartTarget(
    sessionKey: string,
    body: BuceTransferStartTargetResponse
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Sessions/worker/BuceTransferStartTarget`,
      body,
      { headers: myHeaders }
    );
  }
}
