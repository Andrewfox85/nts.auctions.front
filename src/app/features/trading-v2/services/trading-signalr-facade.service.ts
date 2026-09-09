/**
 * Единая точка подписки на SignalR-события торгов: shell callbacks и tab handlers.
 */
import { inject, Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Messages } from '@interfaces';
import { MessagesService, SignalrService } from '@services';
import { LocalStorageService } from '@shared-services';
import { TradingAppInfoSessionRef, TradingAppInfoStore } from '@store';
import { TradingTab } from '../shared';
import { TradingSignalrShellCallbacks } from '../models/trading-signalr-shell-callbacks.model';
import {
  MaklerMessageIdPayload,
  MaklerReplyForTraderPayload,
  SignalrChangeSessionStatePayload,
  SignalrChangedTraderRolePayload,
  SignalrHubPayload,
  TraderInboxMessageRow,
  TraderSystemMessagesByPeriodPayload,
  WorkerInboxMessageRow,
} from '../models/trading-signalr-payloads.model';
import {
  AuctionsSignalrHandlers,
  MessagesSignalrHandlers,
  OffersSignalrHandlers,
  TradersSignalrHandlers,
} from '../models/trading-tab-signalr-handlers.model';
import { ChatAsTraderPersonResponse, MessagesResponse } from '../../../services/messages-service/shared';

/** Ключи вкладок, для которых регистрируются SignalR-обработчики. */
type TradingSignalrTabKey =
  | typeof TradingTab.OFFERS
  | typeof TradingTab.TRADING
  | typeof TradingTab.TRADERS
  | typeof TradingTab.MESSAGES;

type TabHandlerMap = {
  [TradingTab.OFFERS]?: OffersSignalrHandlers;
  [TradingTab.TRADING]?: AuctionsSignalrHandlers;
  [TradingTab.TRADERS]?: TradersSignalrHandlers;
  [TradingTab.MESSAGES]?: MessagesSignalrHandlers;
};

type TabHandlerPicker<H, T extends SignalrHubPayload> = (
  handlers: H
) => ((data: T) => void);

type UnsubscribeFn = () => void;

@Injectable()
export class TradingSignalrFacade {
  private shellCallbacks: TradingSignalrShellCallbacks | null = null;
  private readonly tabHandlers: TabHandlerMap = {};
  private readonly subscriptions: Subscription[] = [];

  private connected: boolean = false;

  private readonly tradingAppInfo = inject(TradingAppInfoStore);

  constructor(
    private readonly signalrService: SignalrService,
    private readonly messagesService: MessagesService,
    private readonly localStorageService: LocalStorageService
  ) {}

  /** Устанавливает shell callbacks (session state, role, badge). */
  public setShellCallbacks(callbacks: TradingSignalrShellCallbacks): void {
    this.shellCallbacks = callbacks;
  }

  /**
   * Регистрация обработчиков вкладки.
   * @returns функция снятия регистрации.
   */
  public registerTabHandlers<T extends TradingSignalrTabKey>(
    tab: T,
    handlers: NonNullable<TabHandlerMap[T]>
  ): UnsubscribeFn {
    this.tabHandlers[tab] = handlers;

    return (): void => {
      if (this.tabHandlers[tab] === handlers) {
        delete this.tabHandlers[tab];
      }
    };
  }

  /** Подключает hub и при первом connect подписывает все hub-streams. */
  public async connect(sectionId: number, sessionId: number): Promise<void> {
    if (this.signalrService.connectionIsEstablished === false) {
      await this.signalrService.createConnection(sectionId, sessionId);
    }

    if (!this.connected) {
      this.subscribeAll();
      this.connected = true;
    }
  }

  /** Отписывается от hub, сбрасывает tab handlers и флаг connected. */
  public disconnect(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    this.subscriptions.length = 0;
    this.connected = false;
    this.tabHandlers[TradingTab.OFFERS] = undefined;
    this.tabHandlers[TradingTab.TRADING] = undefined;
    this.tabHandlers[TradingTab.TRADERS] = undefined;
    this.tabHandlers[TradingTab.MESSAGES] = undefined;
  }

  /** Триггерит getDirectData на offers после перехода в direct tabs. */
  public notifyOffersDirectDataRefresh(): void {
    this.tabHandlers[TradingTab.OFFERS]?.getDirectData?.();
  }

  /** Загружает начальный счётчик непрочитанных для worker или trader. */
  public loadInitialMessageBadgeCount(): void {
    const context: TradingSignalrShellCallbacks | null = this.shellCallbacks;
    if (!context?.user) {
      return;
    }

    if (context.user.IsWorker) {
      this.loadWorkerMessageBadge(context);
    } else {
      this.loadTraderMessageBadge(context);
    }
  }

  /** Считает inbox badge для worker (observer или makler API). */
  private loadWorkerMessageBadge(context: TradingSignalrShellCallbacks): void {
    const request$: Observable<MessagesResponse> = context.privilegesObserver
      ? this.messagesService.getListAsWorker(
          context.user.token,
          context.sectionId,
          context.sessionId
        )
      : context.workerPrivileges
        ? this.messagesService.getListAsMakler(
            context.user.token,
            context.sectionId,
            context.sessionId
          )
        : null;

    request$?.subscribe((res: MessagesResponse) => {
      const rows: WorkerInboxMessageRow[] = res.messages as unknown as WorkerInboxMessageRow[];
      const count: number = rows.filter(
        (row: WorkerInboxMessageRow) => row.idStatus !== 2 && row.isInbox
      ).length;
      context.setMessageBadgeCount(count);
    });
  }

  /** Считает inbox badge для trader с учётом просмотренных сообщений в local storage. */
  private loadTraderMessageBadge(context: TradingSignalrShellCallbacks): void {
    this.messagesService
      .getChatAsTraderPerson(context.user.token, context.sectionId, context.sessionId)
      .subscribe((res: ChatAsTraderPersonResponse) => {
        const rows: TraderInboxMessageRow[] = res.messages as unknown as TraderInboxMessageRow[];
        const inboxCount: number = rows.filter((row: TraderInboxMessageRow) => row.isInbox).length;
        const stored: Messages | Record<string, never> =
          this.localStorageService.getMessages();
        const viewedCount: number =
          'messNumber' in stored &&
          Number(stored.sessionId) === Number(context.sessionId)
            ? stored.messNumber
            : 0;

        context.setMessageBadgeCount(inboxCount - viewedCount);
      });
  }

  /** Регистрирует все группы hub-подписок один раз при connect. */
  private subscribeAll(): void {
    this.subscribeChangeSessionState();
    this.subscribeOffersAndTrading();
    this.subscribeChangedTraderRole();
    this.subscribeMessages();
  }

  /** Подписка на changeSessionState → shell handleChangeSessionState. */
  private subscribeChangeSessionState(): void {
    this.subscriptions.push(
      this.signalrService.changeSessionState.subscribe(
        (data: SignalrChangeSessionStatePayload) => {
          const context: TradingSignalrShellCallbacks = this.shellCallbacks;
          if (!context || String(data.idSession) !== String(context.sessionId)) {
            return;
          }
          context.handleChangeSessionState(data);
        }
      )
    );
  }

  /** Подписка на changedTraderRole → shell handleChangedTraderRole. */
  private subscribeChangedTraderRole(): void {
    this.subscriptions.push(
      this.signalrService.changedTraderRole.subscribe(
        (data: SignalrChangedTraderRolePayload) => {
          this.shellCallbacks?.handleChangedTraderRole(data);
        }
      )
    );
  }

  /** Подписки offers/trading/traders: заявки, торги, targeted, reinstate/exclude. */
  private subscribeOffersAndTrading(): void {
    this.subscriptions.push(
      this.signalrService.demandsOffersUpdateStatus.subscribe(
        (data: SignalrHubPayload) => {
          this.invokeOffers((handlers: OffersSignalrHandlers) => handlers.getUpdateDataSource, data);

          const context: TradingSignalrShellCallbacks = this.shellCallbacks;
          const session: TradingAppInfoSessionRef = context
            ? { idSection: context.sectionId, idSession: context.sessionId }
            : null;

          if (
            context &&
            session &&
            this.tradingAppInfo.isActive(TradingTab.TRADERS, session)
          ) {
            this.invokeTraders(
              (handlers: TradersSignalrHandlers) => handlers.getUpdateDataSource,
              data
            );
          }
        }
      )
    );

    this.subscriptions.push(
      this.signalrService.demandsOffersTradingUpdateStatus.subscribe(
        (data: SignalrHubPayload) => {
          this.invokeOffers(
            (handlers: OffersSignalrHandlers) => handlers.getDemandsOffersTradingUpdateStatus,
            data
          );
          this.invokeTrading(
            (handlers: AuctionsSignalrHandlers) => handlers.getDemandsOffersTradingUpdateStatus,
            data
          );
        }
      )
    );

    this.subscriptions.push(
      this.signalrService.editOffer.subscribe((data: SignalrHubPayload) => {
        this.invokeOffers((handlers: OffersSignalrHandlers) => handlers.getUpdateOffer, data);
      })
    );

    this.subscriptions.push(
      this.signalrService.editDemand.subscribe((data: SignalrHubPayload) => {
        this.invokeOffers((handlers: OffersSignalrHandlers) => handlers.getUpdateDemands, data);
      })
    );

    this.subscriptions.push(
      this.signalrService.demandsOffersEdit.subscribe((data: SignalrHubPayload) => {
        this.invokeOffers((handlers: OffersSignalrHandlers) => handlers.getAddLots, data);
      })
    );

    const context: TradingSignalrShellCallbacks = this.shellCallbacks;
    if (context?.user?.IsWorker) {
      this.subscriptions.push(
        this.signalrService.demandsOffersBUCETraderLogin.subscribe(
          (data: SignalrHubPayload) => {
            this.invokeOffers(
              (handlers: OffersSignalrHandlers) => handlers.updateOfferStatus,
              data
            );
          }
        )
      );
    }

    this.subscriptions.push(
      this.signalrService.targetedUpdateStatus.subscribe((data: SignalrHubPayload) => {
        this.invokeOffers(
          (handlers: OffersSignalrHandlers) => handlers.getUpdateDataSourceDirect,
          data
        );
      })
    );

    this.subscriptions.push(
      this.signalrService.targetedExclude.subscribe((data: SignalrHubPayload) => {
        this.invokeOffers(
          (handlers: OffersSignalrHandlers) => handlers.getOffersTargetedExclude,
          data
        );
      })
    );

    this.subscriptions.push(
      this.signalrService.demandsOffersTradingReinstate.subscribe(
        (data: SignalrHubPayload) => {
          this.invokeTrading(
            (handlers: AuctionsSignalrHandlers) => handlers.getDemandsOffersTradingReinstate,
            data
          );
        }
      )
    );

    this.subscriptions.push(
      this.signalrService.demandsOffersTradingExclude.subscribe(
        (data: SignalrHubPayload) => {
          this.invokeTrading(
            (handlers: AuctionsSignalrHandlers) => handlers.getDemandsOffersTradingExclude,
            data
          );
        }
      )
    );
  }

  /** Подписки messages: worker или trader streams в зависимости от роли. */
  private subscribeMessages(): void {
    const context: TradingSignalrShellCallbacks | null = this.shellCallbacks;
    if (!context?.user) {
      return;
    }

    if (context.user.IsWorker) {
      this.subscribeWorkerMessages(context);
    } else {
      this.subscribeTraderMessages(context);
    }
  }

  /** Worker: public, makler personal/system streams и dispatch по idMessage. */
  private subscribeWorkerMessages(context: TradingSignalrShellCallbacks): void {
    this.subscriptions.push(
      this.signalrService.messageNewPublic.subscribe(
        (data: { idMessage: number }) => {
          if (context.privilegesObserver || context.workerPrivileges) {
            this.dispatchWorkerMessage(data.idMessage, context);
          }
        }
      )
    );

    if (!context.workerPrivileges) {
      return;
    }

    const maklerStreams: Array<EventEmitter<MaklerMessageIdPayload>> = [
      this.signalrService.messagesUpdateStatus,
      this.signalrService.messagesNewPersonalMakler,
      this.signalrService.messagesReplyByMaklerForMaklers,
      this.signalrService.messagesReplyByTraderForMaklers,
    ];

    maklerStreams.forEach((stream$: EventEmitter<MaklerMessageIdPayload>) => {
      this.subscriptions.push(
        stream$.subscribe((data: MaklerMessageIdPayload) => {
          const id: number | undefined = data.idMessage ?? data.idMessageNew;
          if (id != null) {
            this.dispatchWorkerMessage(id, context);
          }
        })
      );
    });

    this.subscriptions.push(
      this.signalrService.messagesNewSystemByPeriodMakler.subscribe(
        (data: SignalrHubPayload) => {
          const handlers: MessagesSignalrHandlers | undefined =
            this.tabHandlers[TradingTab.MESSAGES];
          if (handlers?.getSystemMessageWorker) {
            this.safeInvoke(() => handlers.getSystemMessageWorker!(data));
          } else {
            context.incrementMessageBadge();
          }
        }
      )
    );
  }

  /** Маршрутизирует worker-сообщение в tab handler или increment badge. */
  private dispatchWorkerMessage(
    idMessage: number,
    context: TradingSignalrShellCallbacks
  ): void {
    const handlers: MessagesSignalrHandlers = this.tabHandlers[TradingTab.MESSAGES];

    if (!handlers) {
      context.incrementMessageBadge();
      return;
    }

    if (context.privilegesObserver && handlers.getMessageAsWorker) {
      this.safeInvoke(() => handlers.getMessageAsWorker!(idMessage));
    } else if (context.workerPrivileges && handlers.getMessageAsMakler) {
      this.safeInvoke(() => handlers.getMessageAsMakler!(idMessage));
    } else {
      context.incrementMessageBadge();
    }
  }

  /** Trader: personal, public, reply и system-by-period → onUpdateMessages/badge. */
  private subscribeTraderMessages(context: TradingSignalrShellCallbacks): void {
    /** Общий обработчик входящего trader-сообщения с обновлением badge. */
    const onTraderMessage = (data: SignalrHubPayload): void => {
      const handlers: MessagesSignalrHandlers | undefined =
        this.tabHandlers[TradingTab.MESSAGES];

      if (handlers?.onUpdateMessages) {
        this.safeInvoke(() => handlers.onUpdateMessages!(data));
        if (context.isMessagesTabActive()) {
          context.setMessageBadgeCount(0);
        } else {
          context.incrementMessageBadge();
        }
      } else if (!context.isMessagesTabActive()) {
        context.incrementMessageBadge();
      }
    };

    this.subscriptions.push(
      this.signalrService.messagesNewPersonal.subscribe(onTraderMessage)
    );
    this.subscriptions.push(
      this.signalrService.getMessagePublic.subscribe(onTraderMessage)
    );
    this.subscriptions.push(
      this.signalrService.messagesReplyByMaklerForTrader.subscribe(
        (data: MaklerReplyForTraderPayload) => {
          onTraderMessage({
            ...data.message,
            idParent: data.idMessageSource,
          });
        }
      )
    );
    this.subscriptions.push(
      this.signalrService.messagesNewSystemByPeriod.subscribe(
        (data: TraderSystemMessagesByPeriodPayload) => {
          data.messages.forEach((message: Record<string, unknown>) => {
            onTraderMessage({
              idSection: data.idSection,
              idSession: data.idSession,
              idTrader: data.idTrader,
              ...message,
            });
          });
        }
      )
    );
  }

  /** Вызывает зарегистрированный offers-handler, если вкладка смонтирована. */
  private invokeOffers(
    pick: TabHandlerPicker<OffersSignalrHandlers, SignalrHubPayload>,
    data: SignalrHubPayload
  ): void {
    const handlers: OffersSignalrHandlers = this.tabHandlers[TradingTab.OFFERS];
    if (!handlers) {
      return;
    }
    const fn = pick(handlers);
    this.safeInvoke(() => fn?.(data));
  }

  /** Вызывает зарегистрированный trading-handler, если вкладка смонтирована. */
  private invokeTrading(
    pick: TabHandlerPicker<AuctionsSignalrHandlers, SignalrHubPayload>,
    data: SignalrHubPayload
  ): void {
    const handlers: AuctionsSignalrHandlers = this.tabHandlers[TradingTab.TRADING];
    if (!handlers) {
      return;
    }
    const fn = pick(handlers);
    this.safeInvoke(() => fn?.(data));
  }

  /** Вызывает зарегистрированный traders-handler, если вкладка смонтирована. */
  private invokeTraders(
    pick: TabHandlerPicker<TradersSignalrHandlers, SignalrHubPayload>,
    data: SignalrHubPayload
  ): void {
    const handlers: TradersSignalrHandlers = this.tabHandlers[TradingTab.TRADERS];
    if (!handlers) {
      return;
    }
    const fn = pick(handlers);
    this.safeInvoke(() => fn?.(data));
  }

  /** Защита от падения v1-обработчиков */
  private safeInvoke(fn: () => void): void {
    try {
      fn();
    } catch (error: unknown) {
      console.error('TradingSignalrFacade: handler error', error);
    }
  }
}
