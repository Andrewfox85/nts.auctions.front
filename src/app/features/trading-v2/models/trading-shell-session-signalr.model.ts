/**
 * Контекст и колбэки shell для обработки SignalR-событий сессии.
 */
import { ActivatedRoute } from '@angular/router';
import { User } from '@classes';
import { TradingShellState } from './trading-shell-state.model';
import { TradingShellViolationsPopupState } from '../utils/trading-shell-violations-popup.util';

/** Данные сессии, необходимые для SignalR-обработчиков. */
export interface TradingShellSessionSignalrContext {
  sessionId: string;
  sectionId: string;
  user: User;
  sessionInfo: any;
  directTabs: boolean;
  isTrading: boolean;
  idDirectionRole: number;
  workerPrivileges: boolean;
  privilegesObserver: boolean;
  currentLang: string;
}

/** Колбэки shell для hub `ChangeSessionState` / `ChangedTraderRole`. */
export interface TradingShellSessionSignalrHost {
  getRoute(): ActivatedRoute;
  getSignalrContext(): TradingShellSessionSignalrContext;
  getShellState(): TradingShellState;
  getTradingSessionContext(): { idSection: string; idSession: string } | undefined;

  applyViolationsPatch(patch: Partial<TradingShellViolationsPopupState> | null): void;
  triggerAdmissionDataReload(): void;
  replaceSessionInfo(sessionState: any): void;
  applyRuntimeFlags(): void;
  getDirectTabs(): boolean;
  notifyOffersDirectDataRefresh(): void;
  restartRemainderTimer(): void;
  syncRuntimeStateToStore(): void;
  syncTabRouteAfterSessionChange(): void;
  detectChanges(): void;

  setIdDirectionRole(idDirection: number): void;

  setMessageBadgeCount(count: number): void;
  incrementMessageBadge(): void;
}
