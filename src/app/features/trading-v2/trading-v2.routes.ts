/**
 * Маршруты торгов v2: shell, lazy-loaded вкладки и guards видимости.
 */
import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthGuard } from '@guards';
import { tradingV2SessionInfoResolver } from './resolvers/trading-session-info.resolver';
import { tradingTabCanActivate } from './guards/trading-tab.guard';
import { TRADING_V2_TAB_PATHS, TradingTab } from './shared';
import {
  TradingShellInboxService, TradingShellRouteContextService,
  TradingShellSessionSignalrService,
  TradingSignalrFacade, TradingTabPageContextService,
  TradingTabSignalrSessionService,
} from './services';
import { TabActivationService }  from '@shared-services';

/** Ключи data маршрута для query-параметров главной страницы v2. */
export const tradingMainPageV2RouteData = {
  isExistsViolations: 'isExistsViolations',
  idDirection: 'idDirection',
  idSection: 'IdSection',
  idSession: 'IdSession',
};

const TAB_PAGE_LOADERS: Partial<Record<TradingTab, () => Promise<Type<unknown>>>> = {
  setting: () =>
    import('./pages/setting-tab-page/setting-tab-page.component').then(
      (m) => m.SettingTabPageComponent
    ),
  deposit: () =>
    import('./pages/deposit-tab-page/deposit-tab-page.component').then(
      (m) => m.DepositTabPageComponent
    ),
  registration: () =>
    import('./pages/registration-tab-page/registration-tab-page.component').then(
      (m) => m.RegistrationTabPageComponent
    ),
  trading: () =>
    import('./pages/trading-tab-page/trading-tab-page.component').then(
      (m) => m.TradingTabPageComponent
    ),
  offers: () =>
    import('./pages/offers-tab-page/offers-tab-page.component').then(
      (m) => m.OffersTabPageComponent
    ),
  traders: () =>
    import('./pages/traders-tab-page/traders-tab-page.component').then(
      (m) => m.TradersTabPageComponent
    ),
  deals: () =>
    import('./pages/deals-tab-page/deals-tab-page.component').then(
      (m) => m.DealsTabPageComponent
    ),
  messages: () =>
    import('./pages/messages-tab-page/messages-tab-page.component').then(
      (m) => m.MessagesTabPageComponent
    ),
};

/** Создаёт child-маршрут вкладки с guard и lazy loadComponent. */
function createTabRoute(path: TradingTab): Routes[number] {
  const loadComponent: () => Promise<Type<unknown>> =
    TAB_PAGE_LOADERS[path] ??
    (() =>
      import('./pages/trading-tab-stub/trading-tab-stub.component').then(
        (m) => m.TradingTabStubComponent
      ));

  return {
    path,
    canActivate: [tradingTabCanActivate(path)],
    loadComponent,
    data: { tradingTab: path },
  };
}

/** Дочерние маршруты всех вкладок торгов v2. */
export const TRADING_V2_TAB_ROUTES: Routes = TRADING_V2_TAB_PATHS.map(createTabRoute);

/** Корневой маршрут shell с resolver, providers и children-вкладками. */
export const tradingV2ShellRoute: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    providers: [
      TradingSignalrFacade,
      TradingTabSignalrSessionService,
      TradingShellSessionSignalrService,
      TradingShellInboxService,
      TradingTabPageContextService,
      TradingShellRouteContextService,
      TabActivationService,
    ],
    loadComponent: () =>
      import('./trading-shell.component').then((m) => m.TradingShellComponent),
    data: tradingMainPageV2RouteData,
    resolve: { sessionInfo: tradingV2SessionInfoResolver },
    children: [...TRADING_V2_TAB_ROUTES],
  },
];
