/**
 * Снимок состояния торгового shell v2 и фабрика начальных значений.
 */
import { User } from '@classes';
import { INewTabData } from '../../trading/interfaces';

/** Полное состояние shell: пользователь, сессия, флаги UI и навигации. */
export interface TradingShellState {
  user: User;
  sessionInfo: any;
  sectionId: string;
  sessionId: string;
  idDirectionRole: number | null;
  isExistsViolations: boolean | string | null;
  workerPrivileges: boolean;
  privilegesObserver: boolean;
  directTabs: boolean;
  directSession: boolean;
  isTrading: boolean;
  disableTabs: boolean;
  disableTransferBtn: boolean;
  isFromMessages: boolean;
  tradersNavigationFilter: INewTabData | null;
  isAdmissionFinished: boolean;
  isCalcFeeFinished: boolean;
  isIntermediateTransfer: boolean;
  isSessionReady: boolean;
}

/** Создаёт состояние shell с дефолтами и переданным патчем. */
export function createTradingShellState(
  patch: Partial<TradingShellState> = {}
): TradingShellState {
  return {
    user: patch.user,
    sessionInfo: patch.sessionInfo ?? null,
    sectionId: patch.sectionId ?? '',
    sessionId: patch.sessionId ?? '',
    idDirectionRole: patch.idDirectionRole ?? null,
    isExistsViolations: patch.isExistsViolations ?? null,
    workerPrivileges: patch.workerPrivileges ?? false,
    privilegesObserver: patch.privilegesObserver ?? false,
    directTabs: patch.directTabs ?? false,
    directSession: patch.directSession ?? false,
    isTrading: patch.isTrading ?? false,
    disableTabs: patch.disableTabs ?? false,
    disableTransferBtn: patch.disableTransferBtn ?? false,
    isFromMessages: patch.isFromMessages ?? false,
    tradersNavigationFilter: patch.tradersNavigationFilter ?? null,
    isAdmissionFinished: patch.isAdmissionFinished ?? false,
    isCalcFeeFinished: patch.isCalcFeeFinished ?? false,
    isIntermediateTransfer: patch.isIntermediateTransfer ?? false,
    isSessionReady: patch.isSessionReady ?? false,
    ...patch,
  };
}
