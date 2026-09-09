import { Component, OnInit, inject, input, output } from '@angular/core';
import { TradingService, DemandService, DataRefreshService } from '@services';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User } from '@classes';
import { TranslateModule, TranslateService  } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DX_MODULES } from '@constants';
import { ResultPopupComponent } from '../result-popup/result-popup.component';
import {
  SessionIds,
  SessionInfo,
} from '../../../features/trading/pages/deposit/shared/interfaces';

@Component({
  selector: 'app-restore-offer-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
    ResultPopupComponent,
  ],
  templateUrl: './restore-offer-popup.component.html',
  styleUrls: ['./restore-offer-popup.component.scss'],
})
export class RestoreOfferPopupComponent implements OnInit {
  private readonly DemandService = inject(DemandService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dataRefreshService = inject(DataRefreshService);
  private readonly translate = inject(TranslateService);
  public readonly tradingService = inject(TradingService);

  public restorePopup = input.required<boolean>();
  public restorePopupType = input.required<string>();
  public choosenOffers = input.required<any>();
  public admissionOptions = input.required<any>();
  public sessionIds = input.required<SessionIds>();
  public sessionInfo = input.required<SessionInfo>();

  public close = output<boolean>();

  restoreForm: any = this.formBuilder.group({
    violationsControl: [false],
    depositControl: [false],
    depositCalculation: [false],
  });

  disabledDepositControl: boolean = false;
  disabledDepositCalculation: boolean = false;

  user: User;

  public isVisibleToast: boolean = false;
  message: string = ' ';

  resultPopup: boolean = false;
  resultData;
  sessionsParam; //для передачи на форму результата

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.sessionsParam = Object.assign(this.sessionInfo(), this.sessionIds());
  }

  onShowing(e) {
    if (this.admissionOptions()) {
      this.restoreForm
        .get('violationsControl')
        ?.patchValue(this.admissionOptions().isAdmissionControlViols);
      this.restoreForm
        .get('depositControl')
        ?.patchValue(this.admissionOptions().isAdmissionControlDeposit);
      if (this.restoreForm.get('depositControl')?.value == true) {
        this.restoreForm.get('depositCalculation')?.patchValue(true);
        this.disabledDepositCalculation = true;
      } else {
        this.restoreForm.get('depositCalculation')?.patchValue(false);
        this.disabledDepositCalculation = true;
        this.disabledDepositControl = true;
      }
    }
  }

  activateOffer() {
    const body = {
      idDirection: this.choosenOffers()[0].directionId,
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      demandOfferIds: this.choosenOffers().map((x) => x.idDemandOffer),

      isControlViolations: this.restoreForm.get('violationsControl')?.value,
      isControlDeposit: this.restoreForm.get('depositControl')?.value,
      isLockDeposit: this.restoreForm.get('depositCalculation')?.value,
    };

    this.DemandService.activateInactive(this.user?.token, body).subscribe(
      (res) => {
        this.sessionsParam = Object.assign(this.sessionInfo(), this.sessionIds());
        this.resultPopup = true;
        this.resultData = res.activationResults;
        // Подсчёт успешных и неуспешных
        const successCount = this.resultData.filter((r) => r.isSuccess).length;
        const failureCount = this.resultData.filter((r) => !r.isSuccess).length;
        this.resultData.rejectedCount = successCount;
        this.resultData.failureCount = failureCount;
        this.dataRefreshService.triggerRefresh();
        this.closePopup();
      }
    );
  }

  onChangeControlSwitcher(e, type: string) {
    if (type == 'depositControl') {
      e.value == false
        ? (this.disabledDepositCalculation = false)
        : (this.disabledDepositCalculation = true);
      e.value == false
        ? this.restoreForm.get('depositCalculation')?.patchValue(true)
        : this.restoreForm.get('depositCalculation')?.patchValue(true);
    }
  }

  public restoreOffer(): void {
    const offer: any = this.choosenOffers()[0];
    const lotNumber: number =
      offer?.demandOfferInfo?.lotNumber ?? offer?.lotNumber;

    const body = {
      idDirection: offer.directionId,
      idSection: this.sessionIds().sectionId,
      idSession: this.sessionIds().sessionId,
      idDemandOffer: offer.idDemandOffer,
      isControlViolations: this.restoreForm.get('violationsControl')?.value,
      isControlDeposit: this.restoreForm.get('depositControl')?.value,
      isLockDeposit: this.restoreForm.get('depositCalculation')?.value,
    };

    this.DemandService.restoreRejected(this.user?.token, body).subscribe(() => {
      this.message = this.translate.instant(
        'trading.offersTable.offerRestoreMess',
        { lotNumber }
      );
      this.isVisibleToast = true;
      this.dataRefreshService.triggerRefresh();
      this.closePopup();
    });
  }

  closePopup() {
    this.close.emit(false);
  }
}
