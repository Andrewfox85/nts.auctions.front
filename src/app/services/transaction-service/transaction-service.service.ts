import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  TransactionListWorkerResponse,
  TransactionListResponse,
  TransactionGoodsListWorkerResponse,
  TransactionGoodsListResponse,
  SetTransactionsBody,
  SetTransactionsResponse,
  UpdateExchFeeBody,
  TransactionFullInfoResponse,
  DocumentResponse,
  TransactionTerminateBody,
  TransactionRestoreBody,
  TransactStatsResponse,
  EntityTransactionEditResponse,
  TransactionEditBuyer,
  TransactionEditSeller
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  //-----------------------------Сделки-------------------------------

  //получение списка сделок на сессию Работником
  public buceGetListTransactionsWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    FilterIdCurrency?: string
  ): Observable<TransactionListWorkerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<TransactionListWorkerResponse>(
      `${this.urlINV}${this.trading}/Transaction/worker/BuceGetListTransactions?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //получение списка сделок на сессию Трейдером
  public getListTransactionsTrader(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    FilterIdCurrency?: string
  ): Observable<TransactionListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<TransactionListResponse>(
      `${this.urlINV}${this.trading}/Transaction/GetListTransactions?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //получение списка товаров сделок на сессию Работником
  public buceGetListGoodsTransactionWorker(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    ListTransactions: number[],
    FilterIdCurrency?: string
  ): Observable<TransactionGoodsListWorkerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    let listTransactions = this.buildTransactionsQueryParam(ListTransactions);

    return this.http.get<TransactionGoodsListWorkerResponse>(
      `${this.urlINV}${this.trading}/Transaction/worker/BuceGetListGoodsTransaction?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}${listTransactions}`,
      { headers: myHeaders }
    );
  }

  //получение списка товаров сделок на сессию Трейдером
  public getListGoodsTransactionTrader(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    ListTransactions: number[],
    FilterIdCurrency?: string
  ): Observable<TransactionGoodsListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    let listTransactions = this.buildTransactionsQueryParam(ListTransactions);

    return this.http.get<TransactionGoodsListResponse>(
      `${this.urlINV}${this.trading}/Transaction/GetListGoodsTransaction?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}${listTransactions}`,
      { headers: myHeaders }
    );
  }

  private buildTransactionsQueryParam(transactions: number[]): string {
    let transactionsQuery = '';
    for (let i = 0; i < transactions?.length; i++) {
      transactionsQuery += '&ListTransactions=' + transactions[i];
    }
    return transactionsQuery;
  }

  //фиксация сделок
  public tradingSetTransactions(
    sessionKey: string,
    body: SetTransactionsBody
  ): Observable<SetTransactionsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<SetTransactionsResponse>(
      `${this.urlINV}${this.trading}/Transaction/worker/TradingSetTransactions`,
      body,
      { headers: myHeaders }
    );
  }

  // пересчет биржевого сбора
  public tradingUpdateExchFee(
    sessionKey: string,
    body: UpdateExchFeeBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Transaction/worker/TradingUpdateExchFee`,
      body,
      { headers: myHeaders }
    );
  }

  //просмотр сделки
  public getTransactionFullInfo(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    transactionId: number
  ): Observable<TransactionFullInfoResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<TransactionFullInfoResponse>(
      `${this.urlINV}${this.trading}/Transaction/GetTransactionFullInfo?IdSection=${sectionId}&IdSession=${sessionId}&IdTransaction=${transactionId}`,
      { headers: myHeaders }
    );
  }

  //получение содержимого документа сделки
  public getTransactDocContent(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    transactionId: number,
    documentId: number
  ): Observable<DocumentResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<DocumentResponse>(
      `${this.urlINV}${this.trading}/Transaction/GetTransactDocContent?IdSection=${sectionId}&IdSession=${sessionId}&IdTransaction=${transactionId}&IdDocument=${documentId}`,
      { headers: myHeaders }
    );
  }

  //отказать в фиксации сделки
  public transactionTerminate(
    sessionKey: string,
    body: TransactionTerminateBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Transaction/TransactionsTerminate`,
      body,
      { headers: myHeaders }
    );
  }

  //восстановление сделки
  public transactionRestore(
    sessionKey: string,
    body: TransactionRestoreBody
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Transaction/worker/TransactionsRestore`,
      body,
      { headers: myHeaders }
    );
  }

  //получение статистики по биржевому сбору
  public buceGetTransactStats(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    FilterIdCurrency?: string
  ): Observable<TransactStatsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let filterIdCurrency =
      FilterIdCurrency === '' ? '' : '&FilterIdCurrency=' + FilterIdCurrency;

    return this.http.get<TransactStatsResponse>(
      `${this.urlINV}${this.trading}/Transaction/worker/BuceGetTransactStats?IdSection=${sectionId}&IdSession=${sessionId}${filterIdCurrency}`,
      { headers: myHeaders }
    );
  }

  //получение списка покупателей для замены по сделке
  public getEntityToTransactionEdit(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    transactionId: number,
    dealType: string
  ): Observable<EntityTransactionEditResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<EntityTransactionEditResponse>(
      `${this.urlINV}${this.trading}/Transaction/worker/${dealType}?IdSection=${sectionId}&IdSession=${sessionId}&IdTransaction=${transactionId}`,
      { headers: myHeaders }
    );
  }

  //редактирование сделки
  public transactionsEdit(
    sessionKey: string,
    body: TransactionEditBuyer | TransactionEditSeller,
    dealTypeEdit: string
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Transaction/worker/${dealTypeEdit}`,
      body,
      { headers: myHeaders }
    );
  }

  //получение содержимого документа сделки
  public getReestrsDealSheetContent(
    sessionKey: string,
    sectionId: number,
    offersIds: number[]
  ): Observable<Blob> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let idsOffers: string = '';
    for (let i = 0; i < offersIds?.length; i++) {
      idsOffers += '&IdOffers=' + offersIds[i];
    }

    return this.http.get<Blob>(
      `${this.urlINV}${this.trading}/Transaction/GetReestrsDealSheetsAsArchive?IdSection=${sectionId}${idsOffers}`,
      { 
        headers: myHeaders, 
        responseType: 'blob' as 'json'
      }
    );
  }

   private edittingTriggered = new Subject<void>();

   public edittingTriggered$ = this.edittingTriggered.asObservable();
 
   public triggerEdit() {
     this.edittingTriggered.next();
   }
}
