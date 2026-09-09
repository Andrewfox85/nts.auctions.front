import { Routes } from '@angular/router';
import { sessionInfoResolver } from '@resolvers';
import { AuthGuard } from '@guards';
import { tradingV2ShellRoute } from '@trading-v2';

export const childrenComponents: Array<{ path: string, children: Routes }> = [
  {
    path: 'main-page',
    children: [
      {
        path: '',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('@features').then((m) => m.TradingComponent),
        data: {
          isExistsViolations: 'isExistsViolations',
          idDirection: 'idDirection',
          idSection: 'IdSection',
          idSession: 'IdSession',
          message: 'message',
        },
        resolve: {
          sessionInfo: sessionInfoResolver,
        },
      },
      {
        path: 'detailInfo',
        canActivate: [AuthGuard],
        data: { json: 'json', session: 'session' },
        loadComponent: () =>
          import('@features').then((m) => m.DetailInfoComponent),
      },
      {
        path: 'chat/:sectionId/:sessionId/:traderId',
        canActivate: [AuthGuard],
        loadComponent: () => import('@features').then((m) => m.ChatComponent),
      },
      {
        path: 'bidding-process',
        canActivate: [AuthGuard],
        data: {
          idSection: 'IdSection',
          idSession: 'IdSession',
          idOffer: 'IdOffer',
        },
        loadComponent: () =>
          import('@features').then((m) => m.BiddingProcessComponent),
      },
      {
        path: 'limitations',
        canActivate: [AuthGuard],
        data: { idSection: 'IdSection', idSession: 'IdSession' },
        loadComponent: () =>
          import('@features').then((m) => m.LimitationsComponent),
      },
    ],
  },
  {
    path: 'main-page-v2',
    children: tradingV2ShellRoute,
  },
];

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('@views').then((m) => m.HomepageComponent),
  },
  {
    path: 'english-upgrading-auction',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('@views').then((m) => m.EnglishUpgradingAuctionComponent),
    children: childrenComponents,
  },
  {
    path: 'dutch-down-auction',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('@views').then((m) => m.DutchDownAuctionComponent),
    children: childrenComponents,
  },
  {
    path: 'double-counter-auction',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('@views').then((m) => m.DoubleCounterAuctionComponent),
    children: childrenComponents,
  },
];
