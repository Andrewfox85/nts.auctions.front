import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import { SetPreferredLanguagePyaload } from './shared';

@Injectable({
  providedIn: 'root',
})
export class BuceService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly uasService = this.conf.uasService;

  public setPreferredLanguage(
    sessionKey: string,
    body: SetPreferredLanguagePyaload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.uasService}/Buce/SetPreferredLanguage`,
      body,
      { headers: myHeaders }
    );
  }
}
