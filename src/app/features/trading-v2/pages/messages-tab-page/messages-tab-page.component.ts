/**
 * Страница вкладки «Сообщения»: подключает legacy-компоненты чата и регистрирует их для SignalR.
 */
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { MessagesComponent, ChatTraderComponent } from '../../../trading/pages/messages';
import {
  TradingTab,
  TradingTabPageContextService,
  TradingShellInboxService,
  TradingTabSignalrSessionService,
  TradingTabPageViewModel,
} from '@trading-v2';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-messages-tab-page',
  standalone: true,
  imports: [MessagesComponent, ChatTraderComponent, AsyncPipe],
  templateUrl: './messages-tab-page.component.html',
  styleUrl: './messages-tab-page.component.scss',
})
export class MessagesTabPageComponent implements OnInit {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly shellInbox: TradingShellInboxService = inject(TradingShellInboxService);
  private readonly signalrSession: TradingTabSignalrSessionService = inject(TradingTabSignalrSessionService);

  public readonly tabId: TradingTab = TradingTab.MESSAGES;

  protected readonly viewModel$: Observable<TradingTabPageViewModel> = inject(TradingTabPageContextService).viewModel$;

  /** Регистрирует компонент сообщений в SignalR-сессии вкладки. */
  @ViewChild(MessagesComponent)
  public set messagesComponent(component: MessagesComponent) {
    this.signalrSession.messagesWorker = component ?? null;
  }

  /** Регистрирует компонент чата трейдера в SignalR-сессии вкладки. */
  @ViewChild(ChatTraderComponent)
  public set chatTraderComponent(component: ChatTraderComponent) {
    this.signalrSession.chatTrader = component ?? null;
  }

  /** Очищает ссылки на дочерние компоненты при уничтожении вкладки. */
  public ngOnInit(): void {
    this.destroyRef.onDestroy((): void => {
      this.signalrSession.messagesWorker = null;
      this.signalrSession.chatTrader = null;
    });
  }

  /** Передаёт счётчик непрочитанных сообщений. */
  public onInboxCountChange(count: number): void {
    this.shellInbox.setCount(count);
  }
}
