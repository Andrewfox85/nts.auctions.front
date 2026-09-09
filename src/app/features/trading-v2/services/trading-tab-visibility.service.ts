/**
 * Правила видимости вкладок trading-v2 по роли, этапу сессии и типу аукциона.
 */
import { Injectable } from '@angular/core';
import { auctionType, IdSessionPeriods, sessionStage } from '@constants';
import { ID_DIRECTION_TRADER_ROLE } from '@enums';
import { TradingTab } from '../shared';
import { TradingShellState } from '../models/trading-shell-state.model';

@Injectable({ providedIn: 'root' })
export class TradingTabVisibilityService {
  /** Проверяет, должна ли отображаться указанная вкладка для текущего состояния shell. */
  public isTabVisible(tab: TradingTab, state: TradingShellState): boolean {
    switch (tab) {
      case TradingTab.TRADING:
        return this.isTradingTabVisible(state);
      case TradingTab.OFFERS:
        return this.isOffersTabVisible(state);
      case TradingTab.REGISTRATION:
        return this.isRegsTabVisible(state);
      case TradingTab.TRADERS:
        return !!state.user?.IsWorker && !state.directTabs;
      case TradingTab.DEPOSIT:
        return !state.user?.IsWorker || state.workerPrivileges;
      case TradingTab.DEALS:
        return this.isDealsTabVisible(state);
      case TradingTab.MESSAGES:
        return true;
      case TradingTab.SETTING:
        return !!state.user?.IsWorker && state.workerPrivileges;
      default:
        return false;
    }
  }

  /** Возвращает список всех видимых вкладок для состояния shell. */
  public getVisibleTabs(state: TradingShellState): TradingTab[] {
    const tabs: TradingTab[] = [
      TradingTab.TRADING,
      TradingTab.OFFERS,
      TradingTab.REGISTRATION,
      TradingTab.TRADERS,
      TradingTab.DEPOSIT,
      TradingTab.DEALS,
      TradingTab.MESSAGES,
      TradingTab.SETTING,
    ];
    return tabs.filter((tab: TradingTab) => this.isTabVisible(tab, state));
  }

  /** Видимость вкладки «Торги» по directTabs, этапу и флагам паузы/активности. */
  private isTradingTabVisible(state: TradingShellState): boolean {
    if (state.directTabs) {
      return false;
    }

    const info = state.sessionInfo;
    if (!info || info.sessionStageId === sessionStage.applicationsSaleOpen) {
      return false;
    }

    if (info.idSessionPeriod !== IdSessionPeriods.pretrading) {
      return true;
    }

    return (
      (info.isPaused && info.datetimeRemaind != null) ||
      info.isActive ||
      info.isFinished
    );
  }

  /** Видимость «Заявки» для трейдера по роли и типу аукциона; worker всегда видит. */
  private isOffersTabVisible(state: TradingShellState): boolean {
    if (state.user?.IsWorker) {
      return true;
    }

    const role: number = state.idDirectionRole;
    const isNullRole: boolean = role === ID_DIRECTION_TRADER_ROLE.NULL_ROLE;
    const isSaleInSellerAuction: boolean =
      state.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction &&
      role === ID_DIRECTION_TRADER_ROLE.SALE;
    const isPurchaseInBuyerAuction: boolean =
      state.sessionInfo?.idAuctionType === auctionType.simpleBuyerAuction &&
      role === ID_DIRECTION_TRADER_ROLE.PURCHASE;
    const isPurchaseSaleRole: boolean = role === ID_DIRECTION_TRADER_ROLE.PURCHASE_SALE;

    return (
      isNullRole ||
      isSaleInSellerAuction ||
      isPurchaseInBuyerAuction ||
      isPurchaseSaleRole
    );
  }

  /** Видимость «Регистрация» с учётом worker, directTabs и роли трейдера. */
  private isRegsTabVisible(state: TradingShellState): boolean {
    if (state.user?.IsWorker) {
      return !state.directTabs;
    }

    const role: number = state.idDirectionRole;
    const isNullRole: boolean = role === ID_DIRECTION_TRADER_ROLE.NULL_ROLE;
    const isPurchaseInSellerAuction: boolean =
      state.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction &&
      role === ID_DIRECTION_TRADER_ROLE.PURCHASE;
    const isSaleInBuyerAuction: boolean =
      state.sessionInfo?.idAuctionType === auctionType.simpleBuyerAuction &&
      role === ID_DIRECTION_TRADER_ROLE.SALE;
    const isPurchaseSaleRole: boolean = role === ID_DIRECTION_TRADER_ROLE.PURCHASE_SALE;
    const isAllowedRoleForDirectTabs: boolean =
      isPurchaseInSellerAuction || isSaleInBuyerAuction || isPurchaseSaleRole;

    return isNullRole || (!state.directTabs && isAllowedRoleForDirectTabs);
  }

  /** Видимость «Сделки»: скрыта для null-role трейдера и при directTabs. */
  private isDealsTabVisible(state: TradingShellState): boolean {
    const isTraderNullRole: boolean =
      !state.user?.IsWorker &&
      state.idDirectionRole === ID_DIRECTION_TRADER_ROLE.NULL_ROLE;

    return !isTraderNullRole && !state.directTabs;
  }
}
