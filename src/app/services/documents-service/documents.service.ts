import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import { GetOfferDocumentResponse } from './shared';

@Injectable({
  providedIn: 'root',
})
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  // идентификатор документа, поле ID_DOCUMENT курсора процедуры PRC_GET_OFFER_DOCUMENTS
  public getOfferDocumentContent(
    sessionKey: string,
    idOffer: number,
    idDocument: number,
    idDirection: number
  ): Observable<GetOfferDocumentResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetOfferDocumentResponse>(
      `${this.urlINV}${this.trading}/DemandOffer/GetDocContent?IdDirection=${idDirection}&IdDemandOffer=${idOffer}&IdDocument=${idDocument}`,
      { headers: myHeaders }
    );
  }
}
