/**
 * Синхронизация GlobalStore и TradingAppInfo из состояния TradingShellStore (v1 + v2).
 */
import { inject, Injectable } from '@angular/core';
import { GlobalStore, TradingAppInfoStore } from '@store';
import { TradingShellState } from '../models/trading-shell-state.model';
import { TradingTab } from '../shared';

@Injectable({ providedIn: 'root' })
export class TradingShellPlatformSyncService {
  private readonly globalStore = inject(GlobalStore);
  private readonly tradingAppInfo = inject(TradingAppInfoStore);

  public syncFromShell(
    state: TradingShellState,
    options?: { activeTab?: TradingTab | null }
  ): void {
    this.globalStore.setIdDirectionRole(state.idDirectionRole);

    if (!state.sectionId || !state.sessionId) {
      return;
    }

    const session = { idSection: state.sectionId, idSession: state.sessionId };
    this.tradingAppInfo.bindSession(state.sectionId, state.sessionId);

    if (options?.activeTab !== undefined) {
      this.tradingAppInfo.setActiveTab(options.activeTab, session);
    }

    if (state.sessionInfo) {
      this.globalStore.setSessionInfo(state.sessionInfo);

      const idAuctionType = Number(state.sessionInfo.idAuctionType);
      if (Number.isFinite(idAuctionType)) {
        this.globalStore.setMainSessionInfo({
          sectionId: Number(state.sectionId),
          sessionId: Number(state.sessionId),
          idAuctionType,
        });
      }
    }
  }
}
