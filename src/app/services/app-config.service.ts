import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
   public uas_front: string;
  public OrderManagement: string;
  public uasService: string;
  public backendINV: string;
  public NSIManagement: string;
  public orderMan: string;
  public domain: string;
  public nts: string;
  public trading: string;
  public demands: string;
  public ppRedirectUrl: string;
  public sockets: string;

  constructor(private http: HttpClient) {}

  load() :Promise<any>  {
    const promise = this.http.get('./assets/config.json')
      .toPromise()
      .then((data: any) => {
        Object.assign(this, data);
        return data;
      });
    return promise;
  }
}
