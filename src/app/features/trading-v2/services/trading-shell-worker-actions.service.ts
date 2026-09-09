/**
 * Действия worker в trading shell: допуск, калькулятор, завершение и промежуточный перенос.
 */
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IdSessionPeriods } from '@constants';
import { getTranslateResultByCurrentLang } from '@helpers';
import {
  AccessService,
  ArchieveService,
  DataRefreshService, GetAdmissionOptionsResponse,
  ToastService,
  TransactionService,
} from '@services';
import {
  TradingShellSubmissionType,
  TradingShellWorkerActionHost,
  TradingShellWorkerContext
} from '../models/trading-shell-worker-actions.model';

@Injectable({ providedIn: 'root' })
export class TradingShellWorkerActionsService {
  private readonly router: Router = inject(Router);
  private readonly accessService: AccessService = inject(AccessService);
  private readonly archiveService: ArchieveService = inject(ArchieveService);
  private readonly transactionService: TransactionService = inject(TransactionService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly dataRefreshService: DataRefreshService = inject(DataRefreshService);

  /** Маршрутизирует клик по пункту worker-меню (admission, calculator, endSession, transfer). */
  public handleMenuItemClick(itemId: string, host: TradingShellWorkerActionHost): void {
    const context: TradingShellWorkerContext = host.getContext();

    switch (itemId) {
      case 'admission':
        this.openAdmission(context, host);
        break;
      case 'calculator':
        this.runExchangeFeeCalculator(context, host);
        break;
      case 'endSession':
        host.openSubmissionPopup('endSession');
        break;
      case 'intermediatetransferToArchive':
        host.openSubmissionPopup('intermediatetransfer');
        break;
    }
  }

  /** Запускает процедуру допуска (buceAdmissionStart) с параметрами формы. */
  public startAdmission(host: TradingShellWorkerActionHost): void {
    const context: TradingShellWorkerContext = host.getContext();
    host.closeAdmissionPopup();

    this.accessService
      .buceAdmissionStart(context.token, {
        idSection: Number(context.sectionId),
        idSession: Number(context.sessionId),
        isControlViolations:
          context.admissionForm.controls['isAdmissionControlViols'].value,
        isControlDeposit:
          context.admissionForm.controls['isAdmissionControlDeposit'].value,
        isControlBySpecialRules:
          context.admissionForm.controls['specialAdmissionProcedure'].value,
        isShortCycle: context.sessionInfo?.isAdmissionFinished
          ? context.admissionForm.controls['radioButton'].value ===
            'onRejectedApplicationsRegistrations'
          : null,
      })
      .subscribe(() => {
        this.dataRefreshService.triggerRefresh();
      });
  }

  /** Выполняет выбранный тип submission: промежуточный перенос или endSession. */
  public executeArchiveTransfer(host: TradingShellWorkerActionHost): void {
    const submissionType: TradingShellSubmissionType = host.getContext().submissionType;

    if (submissionType === 'intermediatetransfer') {
      this.intermediateTransfer(host);
      return;
    }

    this.endSession(host);
  }

  /** Финальный перенос сессии в архив (buceTransferStartMain). */
  public endSession(host: TradingShellWorkerActionHost): void {
    const context: TradingShellWorkerContext = host.getContext();
    const body: { idSection: number, idSession: number, isFinalCall: boolean } = {
      idSection: Number(context.sectionId),
      idSession: Number(context.sessionId),
      isFinalCall:
        context.sessionInfo.idSessionPeriod !== IdSessionPeriods.direct &&
        context.sessionInfo.isAllowedTargetedTransact
          ? false
          : true,
    };

    this.archiveService.buceTransferStartMain(context.token, body).subscribe(() => {
      this.toastService.onShowToast({
        message: getTranslateResultByCurrentLang(
          context.currentLang,
          'trading.transferToArchiveResult'
        ),
        type: 'success',
      });
      host.closeSubmissionPopup();

      if (body.isFinalCall === true) {
        this.router.navigate(['/']);
      }
    });
  }

  /** Промежуточный целевой перенос (buceTransferStartTarget). */
  public intermediateTransfer(host: TradingShellWorkerActionHost): void {
    const context: TradingShellWorkerContext = host.getContext();
    const body: { idSection: number, idSession: number } = {
      idSection: Number(context.sectionId),
      idSession: Number(context.sessionId),
    };

    this.archiveService.buceTransferStartTarget(context.token, body).subscribe((): void => {
      this.toastService.onShowToast({
        message: getTranslateResultByCurrentLang(
          context.currentLang,
          'trading.transferEndMess'
        ),
        type: 'success',
      });
      host.closeSubmissionPopup();
    });
  }

  /** Открывает popup допуска; при повторном допуске подгружает buceGetAdmissionOptions. */
  private openAdmission(
    context: ReturnType<TradingShellWorkerActionHost['getContext']>,
    host: TradingShellWorkerActionHost
  ): void {
    if (context.sessionInfo?.isAdmissionFinished) {
      this.accessService
        .buceGetAdmissionOptions(
          context.token,
          context.sectionId,
          context.sessionId
        )
        .subscribe((res: GetAdmissionOptionsResponse): void => {
          host.patchAdmissionForm({
            isAdmissionControlViols:
              res.admissionOptions[0].isAdmissionControlViols,
            isAdmissionControlDeposit:
              res.admissionOptions[0].isAdmissionControlDeposit,
            isAdmissionBySpecialRules:
              res.admissionOptions[0].isAdmissionBySpecialRules,
          });
        });
    }

    host.openAdmissionPopup(
      getTranslateResultByCurrentLang(
        context.currentLang,
        'trading.admissionToExchangeTrading'
      )
    );
  }

  /** Запускает пересчёт биржевого сбора (tradingUpdateExchFee) и toast успеха. */
  private runExchangeFeeCalculator(
    context: ReturnType<TradingShellWorkerActionHost['getContext']>,
    host: TradingShellWorkerActionHost
  ): void {
    this.transactionService
      .tradingUpdateExchFee(context.token, {
        idSection: Number(context.sectionId),
        idSession: Number(context.sessionId),
      })
      .subscribe((): void => {
        this.toastService.onShowToast({
          message: getTranslateResultByCurrentLang(
            context.currentLang,
            'trading.calcExchangeFeeMess'
          ),
          type: 'success',
        });
        host.markCalcFeeFinished();
      });
  }
}
