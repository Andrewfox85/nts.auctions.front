/**
 * UI-состояние popup нарушений/предупреждений при входе и завершении сессии торгов.
 */
import { Injectable } from '@angular/core';
import {
  resolveEntryViolationsPopup,
  shouldNavigateHomeOnViolationsPopupClose,
  TradingShellViolationsPopupState,
} from '../utils/trading-shell-violations-popup.util';

@Injectable({ providedIn: 'root' })
export class TradingShellViolationsFacadeService {
  public violationsPopup: boolean = false;
  public warningMessage?: string;
  public transferingMessage: boolean = false;
  public currentDateForDisplay?: { currentDate: string };

  /** Применяет частичный patch к полям popup (игнорирует null). */
  public applyPatch(patch: Partial<TradingShellViolationsPopupState> | null): void {
    if (!patch) {
      return;
    }

    if (patch.violationsPopup !== undefined) {
      this.violationsPopup = patch.violationsPopup;
    }
    if (patch.warningMessage !== undefined) {
      this.warningMessage = patch.warningMessage;
    }
    if (patch.transferingMessage !== undefined) {
      this.transferingMessage = patch.transferingMessage;
    }
    if (patch.currentDateForDisplay !== undefined) {
      this.currentDateForDisplay = patch.currentDateForDisplay;
    }
  }

  /** Показывает entry-popup, если при входе есть isExistsViolations. */
  public showEntryPopupIfNeeded(isExistsViolations: boolean | string | null): void {
    this.applyPatch(resolveEntryViolationsPopup(isExistsViolations));
  }

  /** Закрывает popup; возвращает true, если нужен переход на главную. */
  public close(): boolean {
    this.violationsPopup = false;

    return shouldNavigateHomeOnViolationsPopupClose({
      warningMessage: this.warningMessage,
      transferingMessage: this.transferingMessage,
    });
  }
}
