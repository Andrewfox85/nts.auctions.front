/**
 * Жизненный цикл сессии trading shell: bfcache, popstate, инициализация и teardown.
 */
import { inject, Injectable } from '@angular/core';
import { User } from '@classes';
import { GlobalStore } from '@store';
import { TradingShellBodyLayoutService } from './trading-shell-body-layout.service';
import {
  TradingShellSessionDestroyDeps,
  TradingShellSessionTeardownDeps,
} from '../models/trading-shell-lifecycle.model';

@Injectable({ providedIn: 'root' })
export class TradingShellLifecycleService {
  private readonly bodyLayout: TradingShellBodyLayoutService = inject(TradingShellBodyLayoutService);
  private readonly globalStore = inject(GlobalStore);

  private pageshowListener?: (event: PageTransitionEvent) => void;
  private popStateListener?: () => void;

  /**
   * bfcache: при «Назад» браузер может показать замороженную страницу без ngOnInit.
   * Полный reload — как v1
   */
  public registerBfcacheReload(): void {
    this.unregisterBfcacheReload();

    this.pageshowListener = (event: PageTransitionEvent): void => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', this.pageshowListener);
  }

  /** Снимает обработчик pageshow для bfcache-reload. */
  public unregisterBfcacheReload(): void {
    if (!this.pageshowListener) {
      return;
    }

    window.removeEventListener('pageshow', this.pageshowListener);
    this.pageshowListener = undefined;
  }

  /** Регистрирует обработчик popstate (кнопка «Назад» браузера). */
  public registerPopState(handler: () => void): void {
    this.unregisterPopState();
    this.popStateListener = handler;
    window.addEventListener('popstate', this.popStateListener);
  }

  /** Снимает обработчик popstate. */
  public unregisterPopState(): void {
    if (!this.popStateListener) {
      return;
    }

    window.removeEventListener('popstate', this.popStateListener);
    this.popStateListener = undefined;
  }

  /** Восстанавливает sessionInfo, включает body layout и возвращает user из localStorage. */
  public initializeTradingSession(): User {
    this.globalStore.restoreSessionInfo();
    this.bodyLayout.enable();

    return JSON.parse(localStorage.getItem('user') || '{}') as User;
  }

  /** Частичный teardown: SignalR, таймер, layout без очистки store и storage. */
  public teardownSession(deps: TradingShellSessionTeardownDeps): void {
    deps.disableBodyLayout();
    deps.onSignalrSessionEnd();
    deps.disconnectSignalrFacade();
    deps.clearSignalrShellCallbacks();
    deps.offHubConnection();
    deps.onSignalrDisconnected();
    deps.stopRemainderTimer();
  }

  /** Полное уничтожение сессии: listeners, persist, store, storage и teardown. */
  public destroySession(deps: TradingShellSessionDestroyDeps): void {
    this.unregisterBfcacheReload();
    deps.removePopStateListener();
    deps.persistTradingAppInfo();
    deps.clearShellStore();
    this.teardownSession(deps);
    deps.clearSessionStorage();
    deps.cleanLocalStorageAfterExit();
  }

  /** Собирает TradingShellSessionTeardownDeps из инжектированных shell-сервисов. */
  public createTeardownDepsFromShellServices(services: {
    bodyLayout: TradingShellBodyLayoutService;
    signalrSession: { onSessionEnd: () => void };
    signalrFacade: { disconnect: () => void; setShellCallbacks: (v: null) => void };
    signalrService: {
      offHubConnection: () => void;
      OnDisconnected: () => void;
    };
    remainderTimer: { stop: () => void };
  }): TradingShellSessionTeardownDeps {
    return {
      disableBodyLayout: () => services.bodyLayout.disable(),
      onSignalrSessionEnd: () => services.signalrSession.onSessionEnd(),
      disconnectSignalrFacade: () => services.signalrFacade.disconnect(),
      clearSignalrShellCallbacks: () => services.signalrFacade.setShellCallbacks(null),
      offHubConnection: () => services.signalrService.offHubConnection(),
      onSignalrDisconnected: () => services.signalrService.OnDisconnected(),
      stopRemainderTimer: () => services.remainderTimer.stop(),
    };
  }
}
