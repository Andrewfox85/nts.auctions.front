import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly orderManagement = this.conf.OrderManagement;

  public getPrecision(
    sessionKey: string,
    idCurrency: number
  ): Observable<number> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<number>(
      `${this.urlINV}${this.orderManagement}/Currency/GetPrecision?IdCurrency=${idCurrency}`,
      { headers: myHeaders }
    );
  }

  public convertCurrency(
    sessionKey: string,
    number: number,
    idCurrencyFrom: number,
    idCurrencyTo: number,
    date: number
  ): Observable<number> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<number>(
      `${this.urlINV}${this.orderManagement}/Currency/ConvertCurrency?Number=${number}&IdCurrencyFrom=${idCurrencyFrom}&IdCurrencyTo=${idCurrencyTo}&Date=${date}`,
      { headers: myHeaders }
    );
  }
}
