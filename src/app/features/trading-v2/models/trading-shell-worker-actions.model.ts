/**
 * Типы контекста и колбэков shell для действий worker (допуск, завершение сессии).
 */
import { FormGroup } from '@angular/forms';

/** Тип отправки формы worker (завершение сессии, промежуточный перевод). */
export type TradingShellSubmissionType =
  | 'endSession'
  | 'intermediatetransfer'
  | ' ';

/** Контекст worker-действия: токен, сессия, форма допуска. */
export interface TradingShellWorkerContext {
  token: string;
  sectionId: string;
  sessionId: string;
  sessionInfo: any;
  admissionForm: FormGroup;
  submissionType: TradingShellSubmissionType;
  currentLang: string;
}

/** Колбэки shell для обновления UI при worker-действиях. */
export interface TradingShellWorkerActionHost {
  getContext(): TradingShellWorkerContext;
  openAdmissionPopup(title: string): void;
  patchAdmissionForm(options: {
    isAdmissionControlViols: boolean;
    isAdmissionControlDeposit: boolean;
    isAdmissionBySpecialRules: boolean;
  }): void;
  openSubmissionPopup(submissionType: TradingShellSubmissionType): void;
  closeSubmissionPopup(): void;
  closeAdmissionPopup(): void;
  markCalcFeeFinished(): void;
}
