/**
 * Навигация между вкладками trading-v2: sync URL, persist в store и localStorage.
 */
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { LocalStorageService, SelectedTabState } from '@shared-services';
import { isTradingV2TabPath, TradingTab } from '../shared';
import { TradingShellState } from '../models/trading-shell-state.model';
import { getTradingSessionQueryParams } from '../utils/trading-route-query-params';
import { TradingAppInfoStore } from '@store';
import { TradingDefaultTabService } from './trading-default-tab.service';
import { TradingTabVisibilityService } from './trading-tab-visibility.service';

@Injectable({ providedIn: 'root' })
export class TradingTabNavigationService {
  private readonly tradingAppInfo = inject(TradingAppInfoStore);

  constructor(
    private readonly router: Router,
    private readonly localStorage: LocalStorageService,
    private readonly defaultTab: TradingDefaultTabService,
    private readonly tabVisibility: TradingTabVisibilityService
  ) {}

  /** Синхронизирует child-route с целевой вкладкой (restore/default) без лишнего navigate. */
  public syncTabRoute(shellRoute: ActivatedRoute, state: TradingShellState): void {
    const childPath: string = shellRoute.firstChild?.snapshot.url[0]?.path ?? '';
    const target: TradingTab = this.resolveTargetTab(childPath, state);

    this.persistActiveTabToStore(state, target);

    if (childPath === target) {
      return;
    }

    this.navigateToTab(shellRoute, target);
  }

  /** Сохраняет выбранную вкладку в local storage (совместимость с v1 `selectedTabState`) */
  public persistActiveTab(tab: TradingTab, sessionId: string, tabIndex: number = 0): void {
    this.localStorage.setSelectedTab({
      tabName: tab,
      tabIndex,
      isFromMessages: false,
      idSession: Number(sessionId),
    });
  }

  /** Переход на запрошенную вкладку, если она видима; иначе — на default */
  public navigateToTabIfVisible(shellRoute: ActivatedRoute, state: TradingShellState, tab: TradingTab): void {
    const target: TradingTab = this.tabVisibility.isTabVisible(tab, state)
      ? tab
      : this.defaultTab.resolveDefaultTab(state);

    this.persistActiveTabToStore(state, target);
    this.navigateToTab(shellRoute, target);
  }

  /** Navigate на вкладку относительно shell-route с merge query-параметров сессии. */
  private navigateToTab(shellRoute: ActivatedRoute, target: TradingTab, extras: NavigationExtras = {}): void {
    this.router.navigate([target], {
      relativeTo: shellRoute,
      queryParams: getTradingSessionQueryParams(shellRoute),
      queryParamsHandling: 'merge',
      replaceUrl: true,
      ...extras,
    });
  }

  /** Целевая вкладка: текущий path, restore из store/LS или default. */
  private resolveTargetTab(currentPath: string, state: TradingShellState): TradingTab {
    if (
      currentPath &&
      isTradingV2TabPath(currentPath as TradingTab) &&
      this.tabVisibility.isTabVisible(currentPath as TradingTab, state)
    ) {
      return currentPath as TradingTab;
    }

    const restoredTab: TradingTab | null = this.resolveRestoredTab(state);

    if (restoredTab) {
      return restoredTab;
    }

    return this.defaultTab.resolveDefaultTab(state);
  }

  /** Восстанавливает вкладку из TradingAppInfo или legacy selectedTabState в LS. */
  private resolveRestoredTab(state: TradingShellState): TradingTab | null {
    if (state.isFromMessages) {
      return null;
    }

    const session: { idSection: string, idSession: string } =
      state.sectionId != null && state.sessionId != null
        ? { idSection: state.sectionId, idSession: state.sessionId }
        : null;

    const restoredTab: TradingTab = session
      ? this.tradingAppInfo.getActiveTab(session)
      : null;

    if (
      restoredTab &&
      isTradingV2TabPath(restoredTab as TradingTab) &&
      this.tabVisibility.isTabVisible(restoredTab, state)
    ) {
      return restoredTab;
    }

    const selectedTabStateFromLS: SelectedTabState = this.localStorage.getSelectedTab();
    const canUseLegacy: boolean =
      selectedTabStateFromLS &&
      selectedTabStateFromLS.idSession === Number(state.sessionId) &&
      !selectedTabStateFromLS.isFromMessages &&
      isTradingV2TabPath(selectedTabStateFromLS.tabName as TradingTab) &&
      this.tabVisibility.isTabVisible(selectedTabStateFromLS.tabName as TradingTab, state);

    if (canUseLegacy) {
      return selectedTabStateFromLS.tabName as TradingTab;
    }

    return null;
  }

  /** Записывает активную вкладку в TradingAppInfo и localStorage. */
  private persistActiveTabToStore(state: TradingShellState, tab: TradingTab): void {
    if (!state.sectionId || !state.sessionId) {
      return;
    }

    const session: { idSection: string, idSession: string } = { idSection: state.sectionId, idSession: state.sessionId };
    this.tradingAppInfo.setActiveTab(tab, session);
    this.persistActiveTab(tab, state.sessionId);
  }
}
