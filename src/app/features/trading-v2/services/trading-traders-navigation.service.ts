/**
 * Переход с вкладки «Трейдеры» на offers/registration с фильтром в shell store.
 */
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TradingShellStore } from '@store';
import { INewTabData } from '../../trading/interfaces';
import { TradingTradersNavigationTargetTab } from '../shared';
import { getTradingSessionQueryParams } from '../utils/trading-route-query-params';


@Injectable({ providedIn: 'root' })
export class TradingTradersNavigationService {
  private readonly router: Router = inject(Router);
  private readonly shellStore = inject(TradingShellStore);

  /** Сохраняет фильтр и navigates на целевую вкладку с query сессии. */
  public navigateFromTraders(
    shellRoute: ActivatedRoute,
    targetTab: TradingTradersNavigationTargetTab,
    filter: INewTabData
  ): void {
    this.shellStore.initOrPatch({ tradersNavigationFilter: filter });

    this.router.navigate([targetTab], {
      relativeTo: shellRoute,
      queryParams: getTradingSessionQueryParams(shellRoute),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
