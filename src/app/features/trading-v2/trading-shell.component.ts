/**
 * Корневой компонент оболочки торговой сессии (trading-v2).
 * Координирует маршрутизацию, загрузку сессии, SignalR, воркер-действия и дочерние UI-блоки.
 */
import {
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  Renderer2, Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { ItemClickEvent } from 'devextreme/ui/drop_down_button';
import { AppConfigService, SignalrService } from '@services';
import { TradingShellStore } from '@store';
import { EnglishUpgradingAuctionStore } from '../../views/english-upgrading-auction/store';
import {
  LocalStorageService,
  SessionStorageService,
} from '@shared-services';
import {
  TradingShellHeaderComponent,
  TradingShellOtherAuctionsPopupComponent,
  TradingShellTabsComponent,
  TradingShellViolationsPopupComponent,
  TradingShellWorkerDialogsComponent,
} from './components';
import { TradingTab } from './shared';
import {TradingShellSessionDestroyDeps, TradingShellSessionTeardownDeps} from './models/trading-shell-lifecycle.model';
import {
  TradingTabNavigationService,
  TradingSignalrFacade,
  TradingTabSignalrSessionService,
  TradingShellInboxService,
  TradingShellWorkerActionsService,
  TradingShellSessionLoaderService,
  TradingShellSessionSignalrService,
  TradingShellRemainderTimerService,
  TradingShellRouteContextService,
  TradingShellOtherAuctionsService,
  TradingShellLifecycleService,
  TradingShellStatePublisherService,
  TradingShellViolationsFacadeService,
  TradingShellPlatformSyncService, TradingShellOtherAuctionsListResult,
} from './services';
import {
  TradingShellSubmissionType,
  TradingShellWorkerActionHost,
  TradingShellWorkerContext
} from './models/trading-shell-worker-actions.model';
import {
  TradingShellSessionLoadContext,
  TradingShellSessionLoaderHost,
  TradingShellWorkerPrivileges
} from './models/trading-shell-session-loader.model';
import {
  TradingShellSessionSignalrContext,
  TradingShellSessionSignalrHost
} from './models/trading-shell-session-signalr.model';
import {TradingShellQuerySnapshot, TradingShellRouteHost} from './models/trading-shell-route-context.model';
import { TradingShellBodyLayoutService } from './services/trading-shell-body-layout.service';
import { User } from '@classes';
import { TradingShellState } from './models/trading-shell-state.model';
import { Observable } from 'rxjs';
import { TradingSignalrShellCallbacks } from './models/trading-signalr-shell-callbacks.model';
import { TradingShellViolationsPopupState } from './utils/trading-shell-violations-popup.util';
import { TradingShellRuntimeFlagsPatch } from './services/trading-shell-state-publisher.service';

@Component({
  selector: 'app-trading-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    TradingShellHeaderComponent,
    TradingShellTabsComponent,
    TradingShellViolationsPopupComponent,
    TradingShellOtherAuctionsPopupComponent,
    TradingShellWorkerDialogsComponent,
  ],
  templateUrl: './trading-shell.component.html',
  styleUrl: './trading-shell.component.scss',
})
export class TradingShellComponent implements OnInit, OnDestroy {
  protected readonly shellStore = inject(TradingShellStore);
  protected readonly shellVm: Signal<TradingShellState> = computed(() => this.shellStore.snapshot());

  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly renderer: Renderer2 = inject(Renderer2);
  private readonly cdRef: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly signalrService: SignalrService = inject(SignalrService);
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly config: AppConfigService = inject(AppConfigService);
  private readonly routeContext: TradingShellRouteContextService = inject(TradingShellRouteContextService);
  private readonly otherAuctions: TradingShellOtherAuctionsService = inject(TradingShellOtherAuctionsService);
  private readonly workerActions: TradingShellWorkerActionsService = inject(TradingShellWorkerActionsService);
  private readonly sessionLoader: TradingShellSessionLoaderService = inject(TradingShellSessionLoaderService);
  private readonly sessionSignalr: TradingShellSessionSignalrService = inject(TradingShellSessionSignalrService);
  private readonly remainderTimer: TradingShellRemainderTimerService = inject(TradingShellRemainderTimerService);
  private readonly lifecycle: TradingShellLifecycleService = inject(TradingShellLifecycleService);
  private readonly statePublisher: TradingShellStatePublisherService = inject(TradingShellStatePublisherService);
  protected readonly violationsFacade: TradingShellViolationsFacadeService = inject(TradingShellViolationsFacadeService);
  private readonly localStorageService: LocalStorageService = inject(LocalStorageService);
  private readonly sessionStorageService: SessionStorageService = inject(SessionStorageService);
  private readonly tabNavigation: TradingTabNavigationService = inject(TradingTabNavigationService);
  private readonly signalrFacade: TradingSignalrFacade = inject(TradingSignalrFacade);
  private readonly signalrSession: TradingTabSignalrSessionService = inject(TradingTabSignalrSessionService);
  private readonly shellInbox: TradingShellInboxService = inject(TradingShellInboxService);
  protected readonly countInboxUnanswered$: Observable<number> = this.shellInbox.countChanges$;
  private readonly bodyLayout: TradingShellBodyLayoutService = inject(TradingShellBodyLayoutService);
  private readonly auctionStore = inject(EnglishUpgradingAuctionStore);
  private readonly platformSync: TradingShellPlatformSyncService = inject(TradingShellPlatformSyncService);

  private readonly sessionTeardownDeps: TradingShellSessionTeardownDeps =
    this.lifecycle.createTeardownDepsFromShellServices({
      bodyLayout: this.bodyLayout,
      signalrSession: this.signalrSession,
      signalrFacade: this.signalrFacade,
      signalrService: this.signalrService,
      remainderTimer: this.remainderTimer,
    });

  private sessionStateInitialized: boolean = false;

  public otherAuctionsPopup: boolean = false;
  public popupDropDown: boolean = false;
  public popupDropDownTitle: string;
  public submissionPopup: boolean = false;
  public submissionType: TradingShellSubmissionType;

  public sections: any;
  public sessions: any;
  public sessionsForDisplay: any;

  public form: FormGroup = this.formBuilder.group({
    section: [null, Validators.required],
    session: [null, Validators.required],
  });

  public admissionForm: FormGroup = this.formBuilder.group({
    isAdmissionControlViols: [true],
    isAdmissionControlDeposit: [true],
    specialAdmissionProcedure: [false],
    radioButton: ['forAllApplicationsRegistrations'],
  });

  /** Сохраняет контекст сессии и освобождает ресурсы перед закрытием вкладки. */
  @HostListener('window:beforeunload')
  public unloadHandler(): void {
    this.persistTradingAppInfo();
    this.lifecycle.teardownSession(this.sessionTeardownDeps);
  }

  /** Инициализирует сессию, store и привязку маршрута. */
  public ngOnInit(): void {
    this.lifecycle.registerBfcacheReload();
    const user: User = this.lifecycle.initializeTradingSession();
    this.shellStore.initOrPatch({ user });
    this.lifecycle.registerPopState(() => this.routeContext.handleBrowserBack());

    this.routeContext.bindShellRoute(
      this.route,
      this.destroyRef,
      this.createRouteHost(),
      this.renderer
    );
  }

  /** Полностью завершает торговую сессию и очищает состояние. */
  public ngOnDestroy(): void {
    const destroyDeps: TradingShellSessionDestroyDeps = {
      ...this.sessionTeardownDeps,
      removePopStateListener: () => this.lifecycle.unregisterPopState(),
      persistTradingAppInfo: () => this.persistTradingAppInfo(),
      clearShellStore: () => this.statePublisher.clear(),
      clearSessionStorage: () => this.sessionStorageService.clearSessionStorage(),
      cleanLocalStorageAfterExit: () =>
        this.localStorageService.cleanLocalStorageFieldsAfterSessionExit(),
    };

    this.lifecycle.destroySession(destroyDeps);
  }

  /** Вычисляет и публикует привилегии воркера для текущей секции. */
  private applyWorkerPrivileges(): void {
    const state: TradingShellState = this.shellStore.snapshot();
    if (!state?.user) {
      return;
    }

    const privileges: TradingShellWorkerPrivileges = this.sessionLoader.resolveWorkerPrivileges(
      state.user,
      state.sectionId
    );
    this.statePublisher.publishPartial({
      workerPrivileges: privileges.workerPrivileges,
      privilegesObserver: privileges.privilegesObserver,
    });
  }

  /** Запускает первичную загрузку данных торговой сессии. */
  private loadSessionState(): void {
    this.statePublisher.publishPartial({ isSessionReady: false });
    this.sessionLoader.loadInitialSessionState(this.createSessionLoaderHost());
  }

  /** Возвращает id секции и сессии из store. */
  private getTradingSessionContext():
    | { idSection: string; idSession: string }
    | undefined {
    const state: TradingShellState = this.shellStore.snapshot();
    if (!state) {
      return undefined;
    }

    return this.routeContext.getTradingSessionContext(
      state.sectionId,
      state.sessionId
    );
  }

  /** Сохраняет контекст приложения в хранилище. */
  private persistTradingAppInfo(): void {
    const state: TradingShellState = this.shellStore.snapshot();
    if (!state) {
      return;
    }

    this.routeContext.persistTradingAppInfo(state.sectionId, state.sessionId);
  }

  /** Обрабатывает переход на вкладку и синхронизирует маршрут. */
  public onTabNavigated(tab: TradingTab): void {
    this.routeContext.handleTabNavigated(tab, this.createRouteHost());
  }

  /** Синхронизирует URL вкладки после смены сессии. */
  private syncTabRouteAfterSessionChange(): void {
    const state: TradingShellState = this.shellStore.snapshot();
    if (!state) {
      return;
    }

    this.tabNavigation.syncTabRoute(this.route, state);
  }

  /** Подключает SignalR и загружает счётчик сообщений при наличии сессии. */
  private connectSignalrIfNeeded(): void {
    const state : TradingShellState = this.shellStore.snapshot();
    if (!state?.sectionId || !state?.sessionId) {
      return;
    }

    const shellCallbacks: TradingSignalrShellCallbacks = this.sessionSignalr.createShellCallbacks(
      this.createSessionSignalrHost()
    );
    this.signalrFacade.setShellCallbacks(shellCallbacks);
    this.signalrSession.ensureHandlersRegistered(shellCallbacks);

    this.signalrFacade
      .connect(Number(state.sectionId), Number(state.sessionId))
      .then(() => {
        this.signalrFacade.loadInitialMessageBadgeCount();
      });
  }

  /** Закрывает попап нарушений и при необходимости переходит на главную. */
  public violationsPopupClose(): void {
    if (this.violationsFacade.close()) {
      this.router.navigate(['/']);
    }
  }

  /** Загружает список секций и сессий и открывает попап других аукционов. */
  public openOtherAuctions(): void {
    const token: string = this.shellStore.snapshot()?.user?.token;
    this.otherAuctions.loadSessionsList(token).subscribe((result: TradingShellOtherAuctionsListResult) => {
      this.sessions = result.sessions;
      this.sections = result.sections;
      if (this.sections?.length === 1) {
        this.form.get('section')?.patchValue(this.sections[0].id);
      }
      this.otherAuctionsPopup = true;
    });
  }

  /** Открывает выбранный аукцион в новой вкладке браузера. */
  public goToOtherAuctions(sectionId: number, sessionId: number): void {
    const token: string = this.shellStore.snapshot()?.user?.token;
    this.otherAuctions.openTradingInNewTab(
      token,
      sectionId,
      sessionId,
      this.destroyRef
    );
  }

  /** Фильтрует список сессий при смене секции в попапе. */
  public onChangeSection(e: { value?: number }): void {
    const sessionId: string = this.shellStore.snapshot()?.sessionId ?? '';
    this.sessionsForDisplay = this.otherAuctions.filterSessionsForSection(
      this.sessions,
      e.value,
      sessionId
    );
  }

  /** Сбрасывает состояние диалога допуска после закрытия. */
  public onAdmissionPopupClosed(): void {
    this.popupDropDown = false;
    this.popupDropDownTitle = null;
  }

  /** Сбрасывает состояние диалога подачи заявок после закрытия. */
  public onSubmissionPopup(): void {
    this.submissionPopup = false;
    this.submissionType = ' ';
  }

  /** Запускает передачу сессии в архив. */
  public onArchiveTransfer(): void {
    this.workerActions.executeArchiveTransfer(this.createWorkerActionHost());
  }

  /** Обрабатывает выбор пункта меню действий воркера. */
  public onChangeDropDown(e: ItemClickEvent): void {
    this.workerActions.handleMenuItemClick(String(e.itemData.id), this.createWorkerActionHost());
  }

  /** Запускает процедуру допуска участников. */
  public onStartAdmission(): void {
    this.workerActions.startAdmission(this.createWorkerActionHost());
  }

  /** Создаёт хост-колбэки для сервиса контекста маршрута. */
  private createRouteHost(): TradingShellRouteHost {
    return {
      applyResolverSessionInfo: (sessionInfo: unknown): void => {
        this.statePublisher.publishPartial({ sessionInfo });
      },
      applyQuerySnapshot: (snapshot: TradingShellQuerySnapshot): void => {
        this.statePublisher.initOrPatch({
          sectionId: snapshot.sectionId,
          sessionId: snapshot.sessionId,
          idDirectionRole: snapshot.idDirectionRole,
          isExistsViolations: snapshot.isExistsViolations as boolean | string,
        });
      },
      applyTabFlags: (isFromMessages: boolean): void => {
        this.statePublisher.publishPartial({ isFromMessages });
      },
      onQueryParamsReady: (shouldLoadSession: boolean): void => {
        this.applyWorkerPrivileges();
        const isExistsViolations: string | boolean = this.shellStore.snapshot()?.isExistsViolations;
        this.violationsFacade.showEntryPopupIfNeeded(isExistsViolations);

        if (!this.sessionStateInitialized && shouldLoadSession) {
          this.sessionStateInitialized = true;
          this.loadSessionState();
        }
      },
      onRouteTabChanged: (): void => {
        const snapshot: TradingShellState = this.shellStore.snapshot();
        if (!snapshot) {
          return;
        }

        this.routeContext.syncTabOnNavigationEnd(
          this.route,
          snapshot.sectionId,
          snapshot.sessionId,
          (): void => {
            if (this.shellStore.snapshot()?.isFromMessages) {
              this.statePublisher.publishPartial({ isFromMessages: false });
            }
          }
        );
      },
      getSectionId: (): string => this.shellStore.snapshot()?.sectionId ?? '',
      getSessionId: (): string => this.shellStore.snapshot()?.sessionId ?? '',
      isTabNavigationDisabled: (): boolean => this.shellStore.snapshot()?.disableTabs ?? false,
      isTraderUser: (): boolean => !this.shellStore.snapshot()?.user?.IsWorker,
      resetTraderMessageBadge: (): void => {
        this.shellInbox.reset();
      },
      persistTradingAppInfo: (): void => this.persistTradingAppInfo(),
    };
  }

  /** Создаёт хост-колбэки для загрузчика данных сессии. */
  private createSessionLoaderHost(): TradingShellSessionLoaderHost {
    return {
      getLoadContext: (): TradingShellSessionLoadContext => {
        const state: TradingShellState = this.shellStore.snapshot();
        return {
          token: state?.user?.token,
          sectionId: state?.sectionId,
          sessionId: state?.sessionId,
          sessionInfo: state?.sessionInfo,
        };
      },
      setAuctionType: (idAuctionType: number): void => {
        this.auctionStore.setIdAuctionType(idAuctionType);
      },
      mergeSessionInfo: (sessionInfo: any): void => {
        this.statePublisher.publishPartial({ sessionInfo });
      },
      applyViolationsPatch: (patch: Partial<TradingShellViolationsPopupState>): void => this.violationsFacade.applyPatch(patch),
      onSessionReady: (): void => {
        const wasDirectTabs: boolean = this.shellStore.snapshot()?.directTabs ?? false;
        const flags: TradingShellRuntimeFlagsPatch = this.statePublisher.applyRuntimeFlags();

        if (!wasDirectTabs && flags.directTabs) {
          this.signalrFacade.notifyOffersDirectDataRefresh();
        }

        const state: TradingShellState = this.shellStore.snapshot();
        this.platformSync.syncFromShell(state);

        if (state) {
          this.tabNavigation.syncTabRoute(this.route, state);
        }
        this.statePublisher.publishPartial({ isSessionReady: true });
        this.connectSignalrIfNeeded();
      },
      navigateHome: () => {
        this.router.navigate(['/']);
      },
      onLoadComplete: () => {
        this.cdRef.detectChanges();
      },
    };
  }

  /** Создаёт хост-колбэки для обработчиков SignalR сессии. */
  private createSessionSignalrHost(): TradingShellSessionSignalrHost {
    return {
      getRoute: (): ActivatedRoute => this.route,
      getSignalrContext: (): TradingShellSessionSignalrContext => {
        const state: TradingShellState = this.shellStore.snapshot();
        return {
          sessionId: state?.sessionId,
          sectionId: state?.sectionId,
          user: state?.user,
          sessionInfo: state?.sessionInfo,
          directTabs: state?.directTabs ?? false,
          isTrading: state?.isTrading ?? false,
          idDirectionRole: state?.idDirectionRole,
          workerPrivileges: state?.workerPrivileges ?? false,
          privilegesObserver: state?.privilegesObserver ?? false,
          currentLang: this.translate.store.currentLang,
        };
      },
      getShellState: (): TradingShellState => this.shellStore.snapshot(),
      getTradingSessionContext: (): { idSection: string, idSession: string } => this.getTradingSessionContext(),
      applyViolationsPatch: (patch: Partial<TradingShellViolationsPopupState>): void => this.violationsFacade.applyPatch(patch),
      triggerAdmissionDataReload: (): void => {
        this.statePublisher.publishPartial({ isAdmissionFinished: false });
        this.cdRef.detectChanges();
        this.statePublisher.publishPartial({ isAdmissionFinished: true });
        this.statePublisher.applyRuntimeFlags();
        this.cdRef.detectChanges();
      },
      replaceSessionInfo: (sessionInfo: any): void => {
        this.statePublisher.publishPartial({ sessionInfo });
        this.platformSync.syncFromShell(this.shellStore.snapshot(), {
          activeTab: this.routeContext.getActiveTab(this.route),
        });
      },
      applyRuntimeFlags: (): void => {
        this.statePublisher.applyRuntimeFlags();
      },
      getDirectTabs: (): boolean => this.shellStore.snapshot()?.directTabs ?? false,
      notifyOffersDirectDataRefresh: (): void =>
        this.signalrFacade.notifyOffersDirectDataRefresh(),
      restartRemainderTimer: (): void => {
        const sessionInfo = this.shellStore.snapshot()?.sessionInfo;
        this.remainderTimer.start(sessionInfo);
      },
      syncRuntimeStateToStore: (): TradingShellRuntimeFlagsPatch => this.statePublisher.applyRuntimeFlags(),
      syncTabRouteAfterSessionChange: (): void => this.syncTabRouteAfterSessionChange(),
      detectChanges: (): void => this.cdRef.detectChanges(),
      setIdDirectionRole: (idDirection: number): void => {
        this.statePublisher.publishPartial({ idDirectionRole: idDirection });
        this.platformSync.syncFromShell(this.shellStore.snapshot(), {
          activeTab: this.routeContext.getActiveTab(this.route),
        });
      },
      setMessageBadgeCount: (count: number): void => {
        this.shellInbox.setCount(count);
      },
      incrementMessageBadge: (): void => {
        this.shellInbox.showUnreadBadge();
      },
    };
  }

  /** Создаёт хост-колбэки для действий воркера в сессии. */
  private createWorkerActionHost(): TradingShellWorkerActionHost {
    return {
      getContext: (): TradingShellWorkerContext => {
        const state: TradingShellState = this.shellStore.snapshot();
        return {
          token: state?.user?.token,
          sectionId: state?.sectionId,
          sessionId: state?.sessionId,
          sessionInfo: state?.sessionInfo,
          admissionForm: this.admissionForm,
          submissionType: this.submissionType,
          currentLang: this.translate.store.currentLang,
        };
      },
      openAdmissionPopup: (title: string): void => {
        this.popupDropDown = true;
        this.popupDropDownTitle = title;
      },
      openSubmissionPopup: (submissionType: TradingShellSubmissionType): void => {
        this.submissionPopup = true;
        this.submissionType = submissionType;
      },
      closeAdmissionPopup: (): void => {
        this.popupDropDown = false;
      },
      closeSubmissionPopup: (): void => {
        this.submissionPopup = false;
      },
      patchAdmissionForm: (options: {
        isAdmissionControlViols: boolean;
        isAdmissionControlDeposit: boolean;
        isAdmissionBySpecialRules: boolean;
      }): void => {
        this.admissionForm.controls['isAdmissionControlViols'].patchValue(
          options.isAdmissionControlViols
        );
        this.admissionForm.controls['isAdmissionControlDeposit'].patchValue(
          options.isAdmissionControlDeposit
        );
        this.admissionForm.controls['specialAdmissionProcedure'].patchValue(
          options.isAdmissionBySpecialRules
        );
      },
      markCalcFeeFinished: (): void => {
        this.statePublisher.publishPartial({ isCalcFeeFinished: true });
      },
    };
  }

  /** Перенаправляет пользователя в личный кабинет на главную страницу. */
  public goToPersonalPageIndex(): void {
    const user: User = this.shellStore.snapshot()?.user;
    window.location.href =
      `${this.config.ppRedirectUrl}?jwt=${user?.token}&page=index&lang=${this.translate.store.currentLang}`;
  }
}
