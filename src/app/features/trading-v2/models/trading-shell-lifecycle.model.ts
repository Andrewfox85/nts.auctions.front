/**
 * Зависимости для teardown и destroy shell v2.
 */

/** Зависимости при завершении сессии (SignalR, таймер, layout). */
export interface TradingShellSessionTeardownDeps {
  disableBodyLayout: () => void;
  onSignalrSessionEnd: () => void;
  disconnectSignalrFacade: () => void;
  clearSignalrShellCallbacks: () => void;
  offHubConnection: () => void;
  onSignalrDisconnected: () => void;
  stopRemainderTimer: () => void;
}

/** Расширенные зависимости при полном уничтожении shell-компонента. */
export interface TradingShellSessionDestroyDeps extends TradingShellSessionTeardownDeps {
  removePopStateListener: () => void;
  persistTradingAppInfo: () => void;
  clearShellStore: () => void;
  clearSessionStorage: () => void;
  cleanLocalStorageAfterExit: () => void;
}
