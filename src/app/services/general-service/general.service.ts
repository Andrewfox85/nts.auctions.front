import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  // получение серверного времени
  public getServerDatetime(): Observable<number> {
    return this.http.get<number>(
      `${this.urlINV}${this.trading}/General/GetServerDatetime`
    );
  }
}
