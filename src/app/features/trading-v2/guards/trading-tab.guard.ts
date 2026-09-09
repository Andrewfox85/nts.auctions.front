/**
 * Guard активации вкладки: перенаправляет на default, если вкладка скрыта.
 */
import { inject } from '@angular/core';
import { ActivatedRoute, CanActivateFn, Router, UrlTree } from '@angular/router';
import { TradingTab } from '../shared';
import { TradingDefaultTabService } from '../services/trading-default-tab.service';
import { TradingTabVisibilityService } from '../services/trading-tab-visibility.service';
import { TradingShellStore } from '../../../store/trading-shell';
import { getTradingSessionQueryParams } from '../utils/trading-route-query-params';
import { TradingShellState } from '../models/trading-shell-state.model';

/** Создаёт CanActivateFn для указанной вкладки с редиректом на доступную. */
export function tradingTabCanActivate(tab: TradingTab): CanActivateFn {
  return (): boolean | UrlTree => {
    const route: ActivatedRoute = inject(ActivatedRoute);
    const visibility: TradingTabVisibilityService = inject(TradingTabVisibilityService);
    const defaultTab: TradingDefaultTabService = inject(TradingDefaultTabService);
    const router: Router = inject(Router);
    const shellState = inject(TradingShellStore);

    const snapshot: TradingShellState = shellState.snapshot();

    if (!snapshot.sessionInfo) {
      return true;
    }

    if (visibility.isTabVisible(tab, snapshot)) {
      return true;
    }

    const target: TradingTab = defaultTab.resolveDefaultTab(snapshot);
    const shellRoute: ActivatedRoute = route.parent ?? route;

    return router.createUrlTree(['../', target], {
      relativeTo: route,
      queryParams: getTradingSessionQueryParams(shellRoute),
      queryParamsHandling: 'merge',
    });
  };
}
