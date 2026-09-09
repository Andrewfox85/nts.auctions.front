/**
 * Shell-колбэки SignalR: смена состояния сессии, роль трейдера, badge сообщений.
 */
import { inject, Injectable } from '@angular/core';
import { sessionStage } from '@constants';
import { getTranslateResultByCurrentLang } from '@helpers';
import { ToastService, TradingService } from '@services';
import { GlobalStore, TradingAppInfoStore } from '@store';
import { TradingSignalrShellCallbacks } from '../models/trading-signalr-shell-callbacks.model';
import {
  TradingShellSessionSignalrContext,
  TradingShellSessionSignalrHost
} from '../models/trading-shell-session-signalr.model';
import { TradingTab } from '../shared';
import {
  resolveSessionEndedViolationsPopup,
  resolveTraderLoginViolationsPopup,
} from '../utils/trading-shell-violations-popup.util';
import { TradingDefaultTabService } from './trading-default-tab.service';
import { TradingTabNavigationService } from './trading-tab-navigation.service';
import {TradingShellState} from "../models/trading-shell-state.model";

@Injectable()
export class TradingShellSessionSignalrService {
  private readonly toastService: ToastService = inject(ToastService);
  private readonly tradingService: TradingService = inject(TradingService);
  private readonly globalStore = inject(GlobalStore);
  private readonly tradingAppInfo = inject(TradingAppInfoStore);
  private readonly defaultTabService: TradingDefaultTabService = inject(TradingDefaultTabService);
  private readonly tabNavigation: TradingTabNavigationService = inject(TradingTabNavigationService);

  /** Собирает TradingSignalrShellCallbacks для facade из host-контекста shell. */
  public createShellCallbacks(host: TradingShellSessionSignalrHost): TradingSignalrShellCallbacks {
    const context: TradingShellSessionSignalrContext = host.getSignalrContext();

    return {
      sessionId: context.sessionId,
      sectionId: context.sectionId,
      user: context.user,
      workerPrivileges: context.workerPrivileges,
      privilegesObserver: context.privilegesObserver,
      getActiveTab: (): TradingTab | null => {
        const session: { idSection: string; idSession: string } = host.getTradingSessionContext();
        return session ? this.tradingAppInfo.getActiveTab(session) : null;
      },
      isMessagesTabActive: (): boolean => {
        const session: { idSection: string; idSession: string } = host.getTradingSessionContext();
        return session
          ? this.tradingAppInfo.isActive(TradingTab.MESSAGES, session)
          : false;
      },
      handleChangeSessionState: (data): void =>
        this.handleChangeSessionState(data, host),
      handleChangedTraderRole: (data): void =>
        this.handleChangedTraderRole(data as { idDirection: number }, host),
      setMessageBadgeCount: (count: number): void => host.setMessageBadgeCount(count),
      incrementMessageBadge: (): void => host.incrementMessageBadge(),
    };
  }

  /** Обрабатывает changeSessionState: merge sessionInfo, violations, direct tabs, route sync. */
  public handleChangeSessionState(data: any, host: TradingShellSessionSignalrHost): void {
    const context: TradingShellSessionSignalrContext = host.getSignalrContext();

    if (String(data.idSession) !== String(context.sessionId)) {
      return;
    }

    this.showAdmissionResultToast(data, context);

    if (data.isDataReloadNeeded) {
      host.triggerAdmissionDataReload();
    }

    if (!context.user?.IsWorker) {
      this.tradingService
        .checkWhetherLogged(context.user?.token, {
          idSection: context.sectionId,
          idSession: context.sessionId,
        })
        .subscribe((res): void => {
          host.applyViolationsPatch(
            resolveTraderLoginViolationsPopup(res.warningMessage, res.isLogged)
          );
        });
    }

    this.pushSessionDataToTradingService(data, context);
    host.replaceSessionInfo(this.localizeSessionState(data.sessionState[0], context));

    host.applyViolationsPatch(
      resolveSessionEndedViolationsPopup(data.sessionState[0].sessionStageId)
    );

    const wasDirectTabs: boolean = context.directTabs;
    host.applyRuntimeFlags();

    if (!wasDirectTabs && host.getDirectTabs()) {
      host.notifyOffersDirectDataRefresh();
    }

    host.restartRemainderTimer();
    host.syncRuntimeStateToStore();
    host.syncTabRouteAfterSessionChange();
    host.detectChanges();
  }

  /** Обрабатывает changedTraderRole: обновляет роль и при необходимости переключает вкладку. */
  public handleChangedTraderRole(data: { idDirection: number }, host: TradingShellSessionSignalrHost): void {
    const context: TradingShellSessionSignalrContext = host.getSignalrContext();

    if (context.idDirectionRole !== data.idDirection) {
      host.setIdDirectionRole(data.idDirection);
      this.globalStore.setIdDirectionRole(data.idDirection);
      this.tradingService.idDirection = data.idDirection;
    }

    const refreshed: TradingShellSessionSignalrContext = host.getSignalrContext();

    if (!refreshed.isTrading && !refreshed.user?.IsWorker) {
      const state: TradingShellState = host.getShellState();
      const target: TradingTab = this.defaultTabService.resolveDefaultTab(state);
      this.tabNavigation.navigateToTabIfVisible(host.getRoute(), state, target);
    } else {
      host.syncTabRouteAfterSessionChange();
    }
  }

  /** Toast об успехе/неудаче допуска для worker при переходе этапа сессии. */
  private showAdmissionResultToast(
    data: any,
    context: ReturnType<TradingShellSessionSignalrHost['getSignalrContext']>
  ): void {
    if (
      !context.user?.IsWorker ||
      context.sessionInfo?.sessionStageId !== sessionStage.admissionComleted ||
      data.sessionState[0].sessionStageId !== sessionStage.transferAuctionCompleted
    ) {
      return;
    }

    const messageKey: string = data.IsAdmissionFailed
      ? 'trading.AdmissionNotSuccess'
      : 'trading.AdmissionSuccess';

    this.toastService.onShowToast({
      message: getTranslateResultByCurrentLang(context.currentLang, messageKey),
      type: data.IsAdmissionFailed ? 'error' : 'success',
    });
  }

  /** Пробрасывает sessionState в TradingService.getDataFromSocket с оптимизацией noChange. */
  private pushSessionDataToTradingService(
    data: any,
    context: ReturnType<TradingShellSessionSignalrHost['getSignalrContext']>
  ): void {
    const next = data.sessionState[0];
    const unchanged: boolean =
      context.sessionInfo?.isActive === next.isActive &&
      context.sessionInfo?.isFinished === next.isFinished &&
      context.sessionInfo?.isPaused === next.isPaused;

    this.tradingService.getDataFromSocket(unchanged ? { str: 'noChange' } : next);
  }

  /** Подставляет EN-поля имён/периода/этапа при currentLang === 'EN'. */
  private localizeSessionState(
    sessionState: any,
    context: ReturnType<TradingShellSessionSignalrHost['getSignalrContext']>
  ): any {
    if (context.currentLang !== 'EN') {
      return sessionState;
    }

    return {
      ...sessionState,
      sectionName: sessionState.sectionNameEn,
      sessionName: sessionState.sessionNameEn,
      sessionPeriod: sessionState.sessionPeriodEn,
      sessionStageName: sessionState.sessionStageNameEn,
    };
  }
}
