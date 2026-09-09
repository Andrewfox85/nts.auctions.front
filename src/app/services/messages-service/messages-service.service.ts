import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../app-config.service';
import {
  MessageResponse,
  MessagesResponse,
  MessageAsMaklerResponse,
  MessagesAsMaklerResponse,
  MaklerChatMsgTemplatesResponse,
  ChatAsMaklerPersonResponse,
  ChatAsTraderPersonResponse,
  SendToMaklerMessagePayload,
  SendToMaklerMessageResponse,
  TraderMessageReplyPayload,
  MaklerSetChatMsgTemplatePayload,
  MaklerSetChatMsgTemplateResponse,
  MaklerDeleteChatMsgTemplatePayload,
  MaklerSendToTraderPayload,
  MaklerReplyPayload,
  MaklerSendPublicMessagePayload,
  MaklerReplyMarkPayload,
  MaklerWatchAddPayload,
} from './shared';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(AppConfigService);

  private readonly urlINV = this.conf.backendINV;
  private readonly trading = this.conf.trading;

  /* ---------------------Сообщения---------------- ------- */

  // получение списка сообщений в качестве наблюдателя
  public getListAsWorker(
    sessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<MessagesResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<MessagesResponse>(
      `${this.urlINV}${this.trading}/Messages/worker/GetListAsWorker?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // получение сведений по одному новому сообщению в качестве маклера
  public getMessageAsWorker(
    sessionKey: string,
    sectionId: string,
    sessionId: string,
    idMessage: number
  ): Observable<MessageResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<MessageResponse>(
      `${this.urlINV}${this.trading}/Messages/worker/GetMessageAsWorker?IdSection=${sectionId}&IdSession=${sessionId}&IdMessage=${idMessage}`,
      { headers: myHeaders }
    );
  }

  // получение сведений по одному новому сообщению в качестве маклера
  public getMessageAsMakler(
    sessionKey: string,
    sectionId: string | number,
    sessionId: string | number,
    idMessage: string
  ): Observable<MessageAsMaklerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<MessageAsMaklerResponse>(
      `${this.urlINV}${this.trading}/Messages/makler/GetMessageAsMakler?IdSection=${sectionId}&IdSession=${sessionId}&IdMessage=${idMessage}`,
      { headers: myHeaders }
    );
  }

  // получение списка сообщений в качестве наблюдателя
  public getListAsMakler(
    sessionKey: string,
    sectionId: string,
    sessionId: string
  ): Observable<MessagesAsMaklerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<MessagesAsMaklerResponse>(
      `${this.urlINV}${this.trading}/Messages/makler/GetListAsMakler?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  // получение шаблонов сообщений
  public getChatMsgTemplates(
    sessionKey: string,
    sectionId: string
  ): Observable<MaklerChatMsgTemplatesResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<MaklerChatMsgTemplatesResponse>(
      `${this.urlINV}${this.trading}/Messages/makler/GetChatMsgTemplates?IdSection=${sectionId}`,
      { headers: myHeaders }
    );
  }

  // получение переписки маклера с трейдером
  public getChatAsMaklerPerson(
    sessionKey: string,
    sectionId: number,
    idSession: number,
    idTrader: number
  ): Observable<ChatAsMaklerPersonResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<ChatAsMaklerPersonResponse>(
      `${this.urlINV}${this.trading}/Messages/makler/GetChatAsMaklerPerson?IdSection=${sectionId}&IdSession=${idSession}&IdTrader=${idTrader}`,
      { headers: myHeaders }
    );
  }

  // получение системных сообщений по трейдеру маклером
  public getListAsMaklerPeriod(
    sessionKey: string,
    sectionId: number,
    idSession: number,
    idTrader: number,
    DateBegin: number
  ): Observable<MessagesAsMaklerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<MessagesAsMaklerResponse>(
      `${this.urlINV}${this.trading}/Messages/makler/GetListAsMaklerPeriod?IdSection=${sectionId}&IdSession=${idSession}&IdTrader=${idTrader}&DateBegin=${DateBegin}`,
      { headers: myHeaders }
    );
  }

  // получение переписки трейдера
  public getChatAsTraderPerson(
    sessionKey: string,
    sectionId: string,
    idSession: string
  ): Observable<ChatAsTraderPersonResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<ChatAsTraderPersonResponse>(
      `${this.urlINV}${this.trading}/Messages/GetChatAsTraderPerson?IdSection=${sectionId}&IdSession=${idSession}`,
      { headers: myHeaders }
    );
  }

  // отправка сообщения трейдером
  public sendToMakler(
    sessionKey: string,
    body: SendToMaklerMessagePayload
  ): Observable<SendToMaklerMessageResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<SendToMaklerMessageResponse>(
      `${this.urlINV}${this.trading}/Messages/SendToMakler`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // ответ на входящее сообщение трейдером
  public reply(
    sessionKey: string,
    body: TraderMessageReplyPayload
  ): Observable<SendToMaklerMessageResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<SendToMaklerMessageResponse>(
      `${this.urlINV}${this.trading}/Messages/Reply`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // сохранение шаблонов сообщений
  public setChatMsgTemplates(
    sessionKey: string,
    body: MaklerSetChatMsgTemplatePayload
  ): Observable<MaklerSetChatMsgTemplateResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<MaklerSetChatMsgTemplateResponse>(
      `${this.urlINV}${this.trading}/Messages/makler/SetChatMsgTemplates`,
      body,
      { headers: myHeaders }
    );
  }

  // удаление шаблонов сообщений
  public deleteChatMsgTemplate(
    sessionKey: string,
    body: MaklerDeleteChatMsgTemplatePayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Messages/makler/DeleteChatMsgTemplate`,
      body,
      { headers: myHeaders }
    );
  }

  // отправка сообщения лично тренйдеру
  public sendToTrader(
    sessionKey: string,
    body: MaklerSendToTraderPayload
  ): Observable<SendToMaklerMessageResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<SendToMaklerMessageResponse>(
      `${this.urlINV}${this.trading}/Messages/makler/SendToTrader`,
      body,
      { headers: myHeaders }
    );
  }

  // ответ на входящее сообщение МАКЛЕРОМ
  public brokerReply(
    sessionKey: string,
    body: MaklerReplyPayload
  ): Observable<SendToMaklerMessageResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<SendToMaklerMessageResponse>(
      `${this.urlINV}${this.trading}/Messages/makler/Reply`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // отправка сообщения всем трейдерам
  public sendPublic(
    SessionKey: string,
    body: MaklerSendPublicMessagePayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Messages/makler/SendPublic`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // gометить сообщение как отвеченное
  public replyMark(
    sessionKey: string,
    body: MaklerReplyMarkPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Messages/makler/ReplyMark`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // добавление сообщения в список наблюдаемых
  public watchAdd(
    sessionKey: string,
    body: MaklerWatchAddPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Messages/makler/WatchAdd`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  // удаление сообщения из списка наблюдаемых
  public watchRemove(
    sessionKey: string,
    body: MaklerWatchAddPayload
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlINV}${this.trading}/Messages/makler/WatchRemove`,
      body,
      {
        headers: myHeaders,
      }
    );
  }
}
