/**
 * Состояние и резолверы popup нарушений при входе и смене сессии.
 */
import { sessionStage } from '@constants';

/** Состояние popup нарушений/предупреждений в shell. */
export interface TradingShellViolationsPopupState {
  violationsPopup: boolean;
  warningMessage?: string;
  transferingMessage: boolean;
  currentDateForDisplay?: { currentDate: string };
}

/** Формирует контекст с текущей датой для отображения в popup. */
export function createViolationsPopupDateContext(): { currentDate: string } {
  return { currentDate: new Date().toLocaleString() };
}

/** Определяет popup при входе по флагу isExistsViolations из URL. */
export function resolveEntryViolationsPopup(
  isExistsViolations: boolean | string | null
): Partial<TradingShellViolationsPopupState> | null {
  if (isExistsViolations == null) {
    return null;
  }

  return {
    violationsPopup: true,
    currentDateForDisplay: createViolationsPopupDateContext(),
  };
}

/** Определяет popup при загрузке сессии, если есть warning без sessionStates. */
export function resolveSessionLoadViolationsPopup(
  sessionStates: unknown,
  warningMessage: string
): Partial<TradingShellViolationsPopupState> | null {
  if (sessionStates == null && warningMessage != null) {
    return {
      violationsPopup: true,
      warningMessage,
    };
  }

  return null;
}

/** Определяет popup при логине трейдера с предупреждением. */
export function resolveTraderLoginViolationsPopup(
  warningMessage: string,
  isLogged: boolean
): Partial<TradingShellViolationsPopupState> | null {
  if (warningMessage == null && isLogged) {
    return null;
  }

  return {
    violationsPopup: true,
    warningMessage: warningMessage ?? undefined,
  };
}

/** Определяет popup при завершении сессии (этап sessionEnded). */
export function resolveSessionEndedViolationsPopup(
  sessionStageId: number
): Partial<TradingShellViolationsPopupState> | null {
  if (sessionStageId !== sessionStage.sessionEnded) {
    return null;
  }

  return {
    violationsPopup: true,
    transferingMessage: true,
  };
}

/** Возвращает true, если после закрытия popup нужен переход на главную. */
export function shouldNavigateHomeOnViolationsPopupClose(
  state: Pick<TradingShellViolationsPopupState, 'warningMessage' | 'transferingMessage'>
): boolean {
  return !!(state.warningMessage || state.transferingMessage);
}
