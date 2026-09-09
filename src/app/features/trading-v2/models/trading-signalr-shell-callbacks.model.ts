/**
 * Колбэки shell для реакции на события SignalR (шапка, таймер, маршрутизация, бейджи).
 */
import { User } from '@classes';
import { TradingTab } from '../shared';

/** Реакции shell на hub-события и обновление UI. */
export interface TradingSignalrShellCallbacks {
  sessionId: string;
  sectionId: string;
  user: User;
  workerPrivileges: boolean;
  privilegesObserver: boolean;

  getActiveTab(): TradingTab | null;
  isMessagesTabActive(): boolean;

  handleChangeSessionState(data: unknown): void;
  handleChangedTraderRole(data: unknown): void;

  setMessageBadgeCount(count: number): void;
  incrementMessageBadge(): void;
}
