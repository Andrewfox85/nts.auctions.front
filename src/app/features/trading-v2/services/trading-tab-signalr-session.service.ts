/**
 * SignalR-сессия торгов: регистрация hub-обработчиков и ссылки на смонтированные v1-вкладки.
 */
import { inject, Injectable } from '@angular/core';
import { AuctionsComponent } from '../../trading/pages/auctions/auctions.component';
import { OffersComponent } from '../../trading/pages/offers';
import { TradersComponent } from '../../trading/pages/traders/traders.component';
import { ChatTraderComponent, MessagesComponent } from '../../trading/pages/messages';
import { TradingSignalrFacade } from './trading-signalr-facade.service';
import { TradingSignalrShellCallbacks } from '../models/trading-signalr-shell-callbacks.model';
import { TradingTab } from '../shared';


@Injectable()
export class TradingTabSignalrSessionService {
  private readonly facade: TradingSignalrFacade = inject(TradingSignalrFacade);

  private registered: boolean = false;
  private shellCallbacks: TradingSignalrShellCallbacks | null = null;

  public offers: OffersComponent | null = null;
  public trading: AuctionsComponent | null = null;
  public traders: TradersComponent | null = null;
  public messagesWorker: MessagesComponent | null = null;
  public chatTrader: ChatTraderComponent | null = null;

  /** Однократно регистрирует tab-handlers в facade и сохраняет shell callbacks. */
  public ensureHandlersRegistered(shellCallbacks: TradingSignalrShellCallbacks): void {
    this.shellCallbacks = shellCallbacks;

    if (this.registered) {
      return;
    }

    this.registered = true;
    this.facade.registerTabHandlers(TradingTab.OFFERS, {
      getUpdateDataSource: (data: unknown) => this.offers?.getUpdateDataSource(data),
      getDemandsOffersTradingUpdateStatus: (data: unknown) =>
        this.offers?.getDemandsOffersTradingUpdateStatus(data),
      getUpdateOffer: (data: unknown) => this.offers?.getUpdateOffer(data),
      getUpdateDemands: (data: unknown) => this.offers?.getUpdateDemands(data),
      getAddLots: (data: unknown) => this.offers?.getAddLots(data),
      updateOfferStatus: (data: unknown) => this.offers?.updateOfferStatus(data),
      getUpdateDataSourceDirect: (data: unknown) => this.offers?.getUpdateDataSourceDirect(data),
      getOffersTargetedExclude: (data: unknown) => this.offers?.getOffersTargetedExclude(data),
      getDirectData: () => this.offers?.getDirectData(),
    });

    this.facade.registerTabHandlers(TradingTab.TRADING, {
      getDemandsOffersTradingUpdateStatus: (data: unknown) =>
        this.trading?.getDemandsOffersTradingUpdateStatus(data),
      getDemandsOffersTradingReinstate: (data: unknown) =>
        this.trading?.getDemandsOffersTradingReinstate(data),
      getDemandsOffersTradingExclude: (data: unknown) =>
        this.trading?.getDemandsOffersTradingExclude(data),
    });

    this.facade.registerTabHandlers(TradingTab.TRADERS, {
      getUpdateDataSource: (data: unknown) => this.traders?.getUpdateDataSource(data),
    });

    this.facade.registerTabHandlers(TradingTab.MESSAGES, {
      getMessageAsWorker: (idMessage: number) => this.dispatchWorkerMessage(idMessage),
      getMessageAsMakler: (idMessage: number) => this.dispatchWorkerMessage(idMessage),
      getSystemMessageWorker: (data: unknown) => {
        if (this.messagesWorker) {
          this.messagesWorker.getSystemMessageWorker(data);
        } else {
          this.shellCallbacks?.incrementMessageBadge();
        }
      },
      onUpdateMessages: (data: unknown) => this.dispatchTraderMessage(data),
    });
  }

  /** Сбрасывает регистрацию handlers и очищает callbacks при завершении сессии. */
  public onSessionEnd(): void {
    this.registered = false;
    this.shellCallbacks = null;
    this.clearTargets();
  }

  /** Обнуляет ссылки на смонтированные v1-компоненты вкладок. */
  public clearTargets(): void {
    this.offers = null;
    this.trading = null;
    this.traders = null;
    this.messagesWorker = null;
    this.chatTrader = null;
  }

  /** Доставляет worker-сообщение в MessagesComponent или инкрементирует badge. */
  private dispatchWorkerMessage(idMessage: number): void {
    const callbacks: TradingSignalrShellCallbacks = this.shellCallbacks;
    if (!callbacks) {
      return;
    }

    const worker: MessagesComponent = this.messagesWorker;

    if (!worker) {
      callbacks.incrementMessageBadge();
      return;
    }

    if (callbacks.privilegesObserver) {
      worker.getMessageAsWorker(idMessage);
    } else if (callbacks.workerPrivileges) {
      worker.getMessageAsMakler(String(idMessage));
    } else {
      callbacks.incrementMessageBadge();
    }
  }

  /** Доставляет trader-сообщение в ChatTraderComponent и обновляет badge. */
  private dispatchTraderMessage(data: unknown): void {
    const callbacks: TradingSignalrShellCallbacks = this.shellCallbacks;

    if (!callbacks) {
      return;
    }

    const chat: ChatTraderComponent = this.chatTrader;

    if (chat) {
      chat.onUpdateMessages(data);
      if (callbacks.isMessagesTabActive()) {
        callbacks.setMessageBadgeCount(0);
      } else {
        callbacks.incrementMessageBadge();
      }
    } else if (!callbacks.isMessagesTabActive()) {
      callbacks.incrementMessageBadge();
    }
  }
}
