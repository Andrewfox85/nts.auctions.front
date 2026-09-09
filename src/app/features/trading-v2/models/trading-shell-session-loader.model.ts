/**
 * Контекст и колбэки shell при первичной загрузке состояния сессии.
 */
import { TradingShellViolationsPopupState } from '../utils/trading-shell-violations-popup.util';

/** Привилегии worker для загрузки сессии. */
export interface TradingShellWorkerPrivileges {
  workerPrivileges: boolean;
  privilegesObserver: boolean;
}

/** Параметры запроса GetSessionState. */
export interface TradingShellSessionLoadContext {
  token: string;
  sectionId: string;
  sessionId: string;
  sessionInfo: any;
}

/** Колбэки shell при первичной загрузке `GetSessionState`. */
export interface TradingShellSessionLoaderHost {
  getLoadContext(): TradingShellSessionLoadContext;
  setAuctionType(idAuctionType: number): void;
  mergeSessionInfo(sessionState: any): void;
  applyViolationsPatch(patch: Partial<TradingShellViolationsPopupState> | null): void;
  onSessionReady(): void;
  navigateHome(): void;
  onLoadComplete(): void;
}
