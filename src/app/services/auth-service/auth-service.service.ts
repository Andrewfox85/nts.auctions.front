import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import { IUserRoleResponse } from './shared';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly orderManagement = this.conf.OrderManagement;

  public getRole(token: string): Observable<IUserRoleResponse> {
    const headers = new HttpHeaders().set('Authorization', token);

    return this.http
      .get<IUserRoleResponse>(
        `${this.urlINV}${this.orderManagement}/Auth/GetRole`,
        { headers }
      )
      .pipe(shareReplay(1));
  }

  public hasWorkerRole(sessionKey: string): Observable<boolean> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<boolean>(
      `${this.urlINV}${this.orderManagement}/Auth/HasWorkerRole`,
      {
        headers: myHeaders,
      }
    );
  }
}
