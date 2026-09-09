/**
 * Снимок query-параметров и колбэки shell для синхронизации URL и состояния.
 */
import { TradingTab } from '../shared';

/** Значения query-параметров торговой сессии из URL. */
export interface TradingShellQuerySnapshot {
  sectionId: string;
  sessionId: string;
  idDirectionRole: number | null;
  isExistsViolations: unknown;
}

/** Колбэки shell для синхронизации URL ↔ состояние. */
export interface TradingShellRouteHost {
  applyResolverSessionInfo(sessionInfo: unknown): void;
  applyQuerySnapshot(snapshot: TradingShellQuerySnapshot): void;
  applyTabFlags(isFromMessages: boolean): void;
  onQueryParamsReady(shouldLoadSession: boolean): void;
  onRouteTabChanged(tab: TradingTab): void;
  getSectionId(): string;
  getSessionId(): string;
  isTabNavigationDisabled(): boolean;
  isTraderUser(): boolean;
  resetTraderMessageBadge(): void;
  persistTradingAppInfo(): void;
}
