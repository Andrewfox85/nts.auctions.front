/**
 * NgRx Signal Store состояния оболочки торгов (trading-v2 shell).
 * Единый источник runtime-данных сессии: пользователь, sessionInfo, флаги вкладок и worker-привилегии.
 */
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createTradingShellState,
  TradingShellState,
} from '../features/trading-v2/models/trading-shell-state.model';

export const TradingShellStore = signalStore(
  withState(createTradingShellState()),
  withDevtools('TradingShell'),
  withMethods((store) => {
    const snapshot = (): TradingShellState => ({
      user: store.user(),
      sessionInfo: store.sessionInfo(),
      sectionId: store.sectionId(),
      sessionId: store.sessionId(),
      idDirectionRole: store.idDirectionRole(),
      isExistsViolations: store.isExistsViolations(),
      workerPrivileges: store.workerPrivileges(),
      privilegesObserver: store.privilegesObserver(),
      directTabs: store.directTabs(),
      directSession: store.directSession(),
      isTrading: store.isTrading(),
      disableTabs: store.disableTabs(),
      disableTransferBtn: store.disableTransferBtn(),
      isFromMessages: store.isFromMessages(),
      tradersNavigationFilter: store.tradersNavigationFilter(),
      isAdmissionFinished: store.isAdmissionFinished(),
      isCalcFeeFinished: store.isCalcFeeFinished(),
      isIntermediateTransfer: store.isIntermediateTransfer(),
      isSessionReady: store.isSessionReady(),
    });

    return {
      snapshot,
      initOrPatch(statePatch: Partial<TradingShellState>): void {
        patchState(store, statePatch);
      },
      update(statePatch: Partial<TradingShellState>): void {
        patchState(store, statePatch);
      },
      clear(): void {
        patchState(store, createTradingShellState());
      },
    };
  })
);
