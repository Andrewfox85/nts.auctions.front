/**
 * Контекст роута trading shell: query-параметры, вкладки, title/favicon и browser back.
 */
import { DestroyRef, inject, Injectable, Renderer2 } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import {
  ActivatedRoute, Data,
  NavigationEnd,
  Params,
  Router,
} from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { getTranslateResultByCurrentLang } from '@helpers';
import {
  NavigationHistoryService,
  PopupSidebarService,
  TradingService,
} from '@services';
import { GlobalStore, TradingAppInfoStore } from '@store';
import { LocalStorageService, SelectedTabState, TabActivationService } from '@shared-services';
import { filter } from 'rxjs/operators';
import { isTradingV2TabPath, TradingTab } from '../shared';
import {
  TradingShellQuerySnapshot,
  TradingShellRouteHost,
} from '../models/trading-shell-route-context.model';
import { TradingTabNavigationService } from './trading-tab-navigation.service';
import { setTradingShellFavicon } from '../utils/trading-shell-favicon.util';
import { collectRouteQueryParams } from '../utils/trading-route-query-params';
import { TradingShellStore } from '../../../store/trading-shell';
import { TradingShellPlatformSyncService } from './trading-shell-platform-sync.service';

@Injectable()
export class TradingShellRouteContextService {
  private readonly document: Document = inject(DOCUMENT);
  private readonly title: Title = inject(Title);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly router: Router = inject(Router);
  private readonly tradingService: TradingService = inject(TradingService);
  private readonly globalStore = inject(GlobalStore);
  private readonly tradingAppInfo = inject(TradingAppInfoStore);
  private readonly localStorageService: LocalStorageService = inject(LocalStorageService);
  private readonly tabNavigation: TradingTabNavigationService = inject(TradingTabNavigationService);
  private readonly tabActivationService: TabActivationService = inject(TabActivationService);
  private readonly popupSidebarService: PopupSidebarService = inject(PopupSidebarService);
  private readonly navigationHistoryService: NavigationHistoryService = inject(NavigationHistoryService);
  private readonly shellStore = inject(TradingShellStore);
  private readonly platformSync: TradingShellPlatformSyncService = inject(TradingShellPlatformSyncService);

  /**
   * Подписываемся на роут: sessionInfo, query-параметры сессии и смену вкладки.
   * Синхронизирует URL ↔ store/LS (sectionId, sessionId, флаги), TradingService, title/favicon;
   * при готовых query — запускает первичную загрузку сессии; при NavigationEnd — активную вкладку.
   */
  public bindShellRoute(
    route: ActivatedRoute,
    destroyRef: DestroyRef,
    host: TradingShellRouteHost,
    renderer: Renderer2
  ): void {
    route.data.pipe(takeUntilDestroyed(destroyRef)).subscribe((data: Data): void => {
      if (data['sessionInfo']) {
        host.applyResolverSessionInfo(data['sessionInfo']);
      }
    });

    this.router.events
      .pipe(
        filter((event: NavigationEnd): boolean => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((): void => {
        const tab: TradingTab = this.getActiveTab(route);
        if (tab) {
          host.onRouteTabChanged(tab);
        }
      });

    /** Синхронизирует query-параметры при init и при каждом их изменении. */
    const syncQueryParams = (): void => {
      this.handleQueryParams(collectRouteQueryParams(route), host, renderer);
    };

    syncQueryParams();
    route.queryParams.pipe(takeUntilDestroyed(destroyRef)).subscribe((): void => syncQueryParams());
  }

  /** Нормализует query-параметры сессии и нарушений в TradingShellQuerySnapshot. */
  public parseQueryParams(params: Params): TradingShellQuerySnapshot {
    const sectionId =
      params['idSection'] ?? params['IdSection'] ?? params['idsection'];
    const sessionId =
      params['idSession'] ?? params['IdSession'] ?? params['idsession'];

    return {
      sectionId,
      sessionId,
      idDirectionRole: Number(params['idDirection'] ?? params['IdDirection']) || null,
      isExistsViolations: params['isExistsViolations'],
    };
  }

  /** Возвращает ref сессии { idSection, idSession } или undefined, если id неполные. */
  public getTradingSessionContext(
    sectionId: string,
    sessionId: string
  ): { idSection: string; idSession: string } | undefined {
    return sectionId && sessionId ? { idSection: sectionId, idSession: sessionId } : undefined;
  }

  /** Читает активную v2-вкладку из первого сегмента child-route. */
  public getActiveTab(route: ActivatedRoute): TradingTab | null {
    const tab: TradingTab = route.firstChild?.snapshot.url[0]?.path as TradingTab;

    if (!tab || !isTradingV2TabPath(tab)) {
      return null;
    }

    return tab;
  }

  /** Восстанавливает isFromMessages из localStorage selectedTab для текущей sessionId. */
  public loadTabFlagsFromStorage(sessionId: string): { isFromMessages: boolean } {
    const saved: SelectedTabState = this.localStorageService.getSelectedTab();

    if (saved && saved.idSession === Number(sessionId)) {
      return { isFromMessages: !!saved.isFromMessages };
    }

    this.localStorageService.removeSelectedTab();
    return { isFromMessages: false };
  }

  /** Реакция на navigate: persist вкладки, sidebar, badge, фильтр traders. */
  public handleTabNavigated(tab: TradingTab, host: TradingShellRouteHost): void {
    if (host.isTabNavigationDisabled()) {
      return;
    }

    const session: { idSection: string, idSession: string } = this.getTradingSessionContext(
      host.getSectionId(),
      host.getSessionId()
    );
    this.tradingAppInfo.setActiveTab(tab, session);
    this.tabNavigation.persistActiveTab(tab, host.getSessionId());
    this.popupSidebarService.onClosePopupSideBar();
    this.tabActivationService.notifyTabActivated();

    if (tab === TradingTab.MESSAGES && host.isTraderUser()) {
      host.resetTraderMessageBadge();
    }

    this.clearTradersNavigationFilterIfNeeded(tab);
  }

  /** Синхронизирует активную вкладку после NavigationEnd (URL уже обновлён). */
  public syncTabOnNavigationEnd(
    route: ActivatedRoute,
    sectionId: string,
    sessionId: string,
    onClearFromMessages: () => void
  ): void {
    const tab: TradingTab = this.getActiveTab(route);
    if (!tab || !sessionId) {
      return;
    }

    const session: { idSection: string, idSession: string } = this.getTradingSessionContext(sectionId, sessionId);
    this.tradingAppInfo.setActiveTab(tab, session);
    this.tabNavigation.persistActiveTab(tab, sessionId);
    this.popupSidebarService.onClosePopupSideBar();
    this.tabActivationService.notifyTabActivated();
    onClearFromMessages();
    this.clearTradersNavigationFilterIfNeeded(tab);
  }

  /** Сбрасывает tradersNavigationFilter при уходе с offers/registration. */
  private clearTradersNavigationFilterIfNeeded(tab: TradingTab): void {
    if (tab !== TradingTab.OFFERS && tab !== TradingTab.REGISTRATION) {
      this.shellStore.initOrPatch({ tradersNavigationFilter: null });
    }
  }

  /** Обрабатывает browser back: home или sessions-schedule после create-offer flows. */
  public handleBrowserBack(): void {
    const previousUrl: string = this.navigationHistoryService.getPreviousUrl();
    const urlsToCheck: string[] = [
      'createDirectOffer',
      'createAgriDirectOffer',
      'createOffer',
    ];

    if (urlsToCheck.some((url: string) => previousUrl?.includes(url))) {
      this.router.navigateByUrl('/ordermanagement/sessions-schedule', { replaceUrl: true });
    } else {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  /** Сохраняет TradingAppInfo в storage для пары sectionId/sessionId. */
  public persistTradingAppInfo(sectionId: string, sessionId: string): void {
    if (sectionId && sessionId) {
      this.tradingAppInfo.persistToStorage(sectionId, sessionId);
    }
  }

  /** Применяет query snapshot к host, TradingService, title/favicon и триггерит load. */
  private handleQueryParams(params: Params, host: TradingShellRouteHost, renderer: Renderer2): void {
    const snapshot: TradingShellQuerySnapshot = this.parseQueryParams(params);
    host.applyQuerySnapshot(snapshot);

    if (snapshot.sectionId && snapshot.sessionId) {
      this.tradingAppInfo.restoreFromStorage(snapshot.sectionId, snapshot.sessionId);
      this.platformSync.syncFromShell(this.shellStore.snapshot());
    } else {
      this.globalStore.setIdDirectionRole(snapshot.idDirectionRole);
    }

    this.tradingService.sectionId = Number(snapshot.sectionId);
    this.tradingService.sessionId = Number(snapshot.sessionId);
    this.tradingService.idDirection = snapshot.idDirectionRole;
    this.tradingService.isExistsViolations = snapshot.isExistsViolations as boolean;

    const tabFlags: { isFromMessages: boolean } = this.loadTabFlagsFromStorage(snapshot.sessionId);
    host.applyTabFlags(tabFlags.isFromMessages);

    if (snapshot.sessionId) {
      this.title.setTitle(
        `${snapshot.sessionId}: ${getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'filters.bidding'
        )}`
      );
    }

    setTradingShellFavicon(this.document, renderer, 'assets/img/icons/auctions.svg');

    host.onQueryParamsReady(Boolean(snapshot.sectionId && snapshot.sessionId));
  }
}
