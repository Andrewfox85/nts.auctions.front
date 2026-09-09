import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import { RedisExchangeDataForFront } from './shared';

@Injectable({
  providedIn: 'root',
})
export class RedisExchangeService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly uasService = this.conf.uasService;

  public getDataForFront(
    sessionKey: string
  ): Observable<RedisExchangeDataForFront> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<RedisExchangeDataForFront>(
      `${this.urlINV}${this.uasService}/RedisExchange/GetDataForFront`,
      {
        headers: myHeaders,
      }
    );
  }

  public logOut(sessionKey: string): Observable<Object> {
    localStorage.removeItem('privileges');
    localStorage.removeItem('sections');
    localStorage.removeItem('autoControlChanges');
    localStorage.removeItem('viewOffer');
    sessionStorage.clear();

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .post(`${this.urlINV}${this.uasService}/Auth/Logout`,
        {},{
        headers: myHeaders,
      });
  }
}
