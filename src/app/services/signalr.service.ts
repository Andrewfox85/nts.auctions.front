import { EventEmitter, inject, Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { CookieService } from 'ngx-cookie-service';
import * as signalR from '@microsoft/signalr';
import {from, of} from "rxjs";
import {catchError, tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  private readonly cookieService = inject(CookieService);
  private readonly conf = inject(AppConfigService);
  private readonly sockets = this.conf.sockets;

  public connectionIsEstablished = false;
  public hubConnection: signalR.HubConnection;

  public changeSessionState = new EventEmitter<any>();
  public messageNewPublic = new EventEmitter<any>();
  public getMessagePublic = new EventEmitter<any>();
  public messagesUpdateStatus = new EventEmitter<any>();
  public messagesReplyMakler = new EventEmitter<any>();
  public messagesNewPersonalMakler = new EventEmitter<any>();
  public messagesNewPersonal = new EventEmitter<any>();
  public messagesNewSystemByPeriodMakler = new EventEmitter<any>();
  public messagesNewSystemByPeriod = new EventEmitter<any>();
  public messagesReplyByMaklerForMaklers = new EventEmitter<any>();
  public messagesReplyByMaklerForTrader = new EventEmitter<any>();
  public messagesReplyByTraderForMaklers = new EventEmitter<any>();
  public demandsOffersUpdateStatus = new EventEmitter<any>();
  public editOffer = new EventEmitter<any>();
  public editDemand = new EventEmitter<any>();
  public demandsOffersTradingUpdateStatus = new EventEmitter<any>();
  public demandsOffersTradingExclude = new EventEmitter<any>();
  public demandsOffersTradingReinstate = new EventEmitter<any>();
  public targetedUpdateStatus = new EventEmitter<any>();
  public targetedExclude = new EventEmitter<any>();
  public demandsOffersEdit = new EventEmitter<any>();
  public demandsOffersBUCETraderLogin = new EventEmitter<any>();
  public changedTraderRole = new EventEmitter<any>();

  async createConnection(
    sectionId: number,
    sessionId: number | string
  ): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.sockets}hub/ts/chat/${sectionId}/${sessionId}`, {
        accessTokenFactory: () => this.cookieService.get('UasToken'),
        skipNegotiation: true, // skipNegotiation as we specify WebSockets
        transport: signalR.HttpTransportType.WebSockets, //
      })
      .withAutomaticReconnect([1000, 1000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.registerOnServerEvents();

    return await this.hubConnection
      .start()
      .then(() => {
        this.connectionIsEstablished = true;
      })
      .catch((err) => {
        console.log('Error while starting connection: ' + err);
      });
  }

  private registerOnServerEvents(): void {
    this.hubConnection.on('ChangeSessionState', (data: any): void => {
      //изменение сессии (настройки)
      this.changeSessionState.emit(data);
    });

    this.hubConnection.on('MessageNewPublic', (data: any): void => {
      //новое сообщение для всех трейдеров маклер
      this.messageNewPublic.emit(data);
    });

    this.hubConnection.on('GetMessagePublic', (data: any): void => {
      //новое сообщение для трейдеров трейдер
      this.getMessagePublic.emit(data);
    });

    this.hubConnection.on('MessageUpdateStatus', (data: any): void => {
      //отметка об обработке, изменение статуса "наблюдаемое" маклер
      this.messagesUpdateStatus.emit(data);
    });

    this.hubConnection.on(
      'MessagesReplyByMaklerForMaklers',
      (data: any): void => {
        //Ответ на сообщение маклер маклеру
        this.messagesReplyByMaklerForMaklers.emit(data);
      }
    );

    this.hubConnection.on(
      'MessagesReplyByMaklerForTrader',
      (data: any): void => {
        //Ответ на сообщение маклер трейдеру
        this.messagesReplyByMaklerForTrader.emit(data);
      }
    );

    this.hubConnection.on(
      'MessagesReplyByTraderForMaklers',
      (data: any): void => {
        //Ответ на сообщение трейдер маклеру
        this.messagesReplyByTraderForMaklers.emit(data);
      }
    );

    this.hubConnection.on('MessagesNewPersonalMakler', (data: any): void => {
      //личное сообщение маклер
      this.messagesNewPersonalMakler.emit(data);
    });

    this.hubConnection.on('MessagesNewPersonal', (data: any): void => {
      //личное сообщение трейдер
      this.messagesNewPersonal.emit(data);
    });

    this.hubConnection.on(
      'MessagesNewSystemByPeriodMakler',
      (data: any): void => {
        //системное сообщение маклер
        this.messagesNewSystemByPeriodMakler.emit(data);
      }
    );

    this.hubConnection.on('MessagesNewSystemByPeriod', (data: any): void => {
      //системное сообщение трейдер
      this.messagesNewSystemByPeriod.emit(data);
    });

    this.hubConnection.on('DemandsOffersUpdateStatus', (data: any): void => {
      //изменение статуса заявки (идентификатор, наименование) и некоторых вспомогательных полей (дата и время отклонения, причина)
      this.demandsOffersUpdateStatus.emit(data);
    });

    this.hubConnection.on(
      'DemandsOffersTradingUpdateStatus',
      (data: any): void => {
        //при подаче ставки на покупку/снятии лидирующей ставки
        this.demandsOffersTradingUpdateStatus.emit(data);
      }
    );

    this.hubConnection.on('DemandsOffersTradingExclude', (data: any): void => {
      //вкладка Торги: удаления заявки из грида (отклонения/восстановления заявок, редактирования, заключения сделок, отказ в фиксации сделки)
      this.demandsOffersTradingExclude.emit(data);
    });

    this.hubConnection.on(
      'DemandsOffersTradingReinstate',
      (data: any): void => {
        //вкладка Торги: добавления заявки в грид (отклонения/восстановления заявок, редактирования, заключения сделок, отказ в фиксации сделки)
        this.demandsOffersTradingReinstate.emit(data);
      }
    );

    this.hubConnection.on('DemandsOffersEdit', (data: any): void => {
      //вкладка Мои заявки/Заявки: при расторжении фиксации сделки, доперенос заявок
      this.demandsOffersEdit.emit(data);
    });

    this.hubConnection.on('DemandsOffersBuceTraderLogin', (data: any): void => {
      //вкладка Заявки(работник): Обновление статусов заявок при входе трейдеров в торги
      this.demandsOffersBUCETraderLogin.emit(data);
    });

    this.hubConnection.on('EditOffer', (data: any): void => {
      //Редактирование заявки на продажу вкладка Заявки
      this.editOffer.emit(data);
    });

    this.hubConnection.on('EditDemand', (data: any): void => {
      //Редактирование заявки на покупку вкладка Заявки
      this.editDemand.emit(data);
    });

    this.hubConnection.on('TargetedUpdateStatus', (data: any): void => {
      //изменение статуса заявки АДРЕСНЫЕ
      this.targetedUpdateStatus.emit(data);
    });

    this.hubConnection.on('TargetedExclude', (data: any): void => {
      //удаление заявки из отображения АДРЕСНЫЕ
      this.targetedExclude.emit(data);
    });

    this.hubConnection.on('ChangedTraderRole', (data: any): void => {
      //изменение роли трейдера
      this.changedTraderRole.emit(data);
    });
  }

  public offHubConnection(): void {
    this.hubConnection?.off('ChangeSessionState');
    this.hubConnection?.off('MessageNewPublic');
    this.hubConnection?.off('GetMessagePublic');
    this.hubConnection?.off('MessageUpdateStatus');
    this.hubConnection?.off('MessagesReplyByMaklerForMaklers');
    this.hubConnection?.off('MessagesReplyByMaklerForTrader');
    this.hubConnection?.off('MessagesReplyByTraderForMaklers');
    this.hubConnection?.off('MessagesNewPersonalMakler');
    this.hubConnection?.off('MessagesNewPersonal');
    this.hubConnection?.off('MessagesNewSystemByPeriodMakler');
    this.hubConnection?.off('DemandsOffersUpdateStatus');
    this.hubConnection?.off('DemandsOffersEdit');
    this.hubConnection?.off('DemandsOffersTradingUpdateStatus');
    this.hubConnection?.off('DemandsOffersTradingExclude');
    this.hubConnection?.off('DemandsOffersTradingReinstate');
    this.hubConnection?.off('TargetedUpdateStatus');
    this.hubConnection?.off('TargetedExclude');
    this.hubConnection?.off('DemandsOffersBuceTraderLogin');
    this.hubConnection?.off('EditDemand');
    this.hubConnection?.off('EditOffer');
  }

  public OnDisconnected(): void {
    this.connectionIsEstablished = false;
    if (!this.hubConnection) {
      return;
    }

    from(this.hubConnection.stop())
      .pipe(
        catchError((error) => {
          console.error('Error while closing connection: ' + error);
          return of(null);
        })
      )
      .subscribe();
  }
}
