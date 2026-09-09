/**
 * Выбор вкладки по умолчанию для торгов v2 с учётом роли, типа аукциона и видимости вкладок.
 */
import { Injectable } from '@angular/core';
import { auctionType } from '@constants';
import { ID_DIRECTION_TRADER_ROLE } from '@enums';
import { TradingTab } from '../shared';
import { TradingShellState } from '../models/trading-shell-state.model';
import { TradingTabVisibilityService } from './trading-tab-visibility.service';

@Injectable({ providedIn: 'root' })
export class TradingDefaultTabService {
  constructor(
    private readonly tabVisibility: TradingTabVisibilityService
  ) {}

  /** Возвращает первую доступную вкладку: предлаемую по условиям или первую видимую. */
  public resolveDefaultTab(state: TradingShellState): TradingTab {
    const preferred: TradingTab = this.resolvePreferredDefaultTab(state);
    if (this.tabVisibility.isTabVisible(preferred, state)) {
      return preferred;
    }

    const visible: TradingTab[] = this.tabVisibility.getVisibleTabs(state);
    return visible[0] ?? TradingTab.MESSAGES;
  }

  /** Определяет вкладку по роли, direct-сессии и флагу isFromMessages. */
  private resolvePreferredDefaultTab(state: TradingShellState): TradingTab {
    const isWorker: boolean = Boolean(state.user?.IsWorker);

    if (state.directSession) {
      if (isWorker) {
        return state.isFromMessages ? TradingTab.MESSAGES : TradingTab.SETTING;
      }
      return TradingTab.OFFERS;
    }

    if (isWorker) {
      return state.isFromMessages ? TradingTab.MESSAGES : TradingTab.SETTING;
    }

    if (state.isTrading) {
      return TradingTab.TRADING;
    }

    return this.resolveTraderWithoutTradingTab(state);
  }

  /** Вкладка по умолчанию для трейдера вне этапа торгов — по роли и типу аукциона. */
  private resolveTraderWithoutTradingTab(state: TradingShellState): TradingTab {
    const role: number = state.idDirectionRole;
    const roleToTab: Partial<Record<number, TradingTab>> = {
      [ID_DIRECTION_TRADER_ROLE.SALE]:
        state.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction
          ? TradingTab.OFFERS
          : TradingTab.REGISTRATION,
      [ID_DIRECTION_TRADER_ROLE.PURCHASE]:
        state.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction
          ? TradingTab.REGISTRATION
          : TradingTab.OFFERS,
      [ID_DIRECTION_TRADER_ROLE.PURCHASE_SALE]: TradingTab.OFFERS,
      [ID_DIRECTION_TRADER_ROLE.NULL_ROLE]: TradingTab.OFFERS,
    };

    return (
      roleToTab[role ?? ID_DIRECTION_TRADER_ROLE.NULL_ROLE] ??
      TradingTab.OFFERS
    );
  }
}
