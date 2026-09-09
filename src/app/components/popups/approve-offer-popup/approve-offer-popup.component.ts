import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { User } from '@classes';
import { TradingService } from '@services';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService, TargetedService } from '@services';
import { CommonModule } from '@angular/common';
import { DX_MODULES } from '@constants';
import { getTranslateResultByCurrentLang } from '@helpers';

@Component({
  selector: 'app-approve-offer-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './approve-offer-popup.component.html',
  styleUrls: ['./approve-offer-popup.component.scss'],
})
export class ApproveOfferPopupComponent implements OnInit {
  @Input() approvePopup;
  @Input() choosenOffers;
  @Input() sessionIds;
  @Output() close = new EventEmitter<any>();

  private readonly targetedService = inject(TargetedService);

  user: User;

  admissionOptions: any;

  approveForm: any = this.formBuilder.group({
    violationsControlSeller: [false],
    depositControlSeller: [false],
    depositCalculationSeller: [false],
    violationsControlBuyer: [false],
    depositControlBuyer: [false],
    depositCalculationBuyer: [false],
  });

  disabledDepositControlSeller: boolean = false;
  disabledDepositCalculationSeller: boolean = false;

  disabledDepositControlBuyer: boolean = false;
  disabledDepositCalculationBuyer: boolean = false;

  constructor(
    private tradingService: TradingService,
    private formBuilder: FormBuilder,
    public translate: TranslateService,
    public toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  onShowing(e) {
    this.targetedService
      .offersBuceGetOptions(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId
      )
      .subscribe((res) => {
        this.admissionOptions = res.options[0];

        if (this.admissionOptions) {
          this.approveForm
            .get('violationsControlSeller')
            ?.patchValue(
              this.admissionOptions?.sellerOptions?.isControlViolations
            );
          this.approveForm
            .get('depositControlSeller')
            ?.patchValue(
              this.admissionOptions?.sellerOptions?.isControlDeposit
            );
          this.approveForm
            .get('violationsControlBuyer')
            ?.patchValue(
              this.admissionOptions?.buyerOptions?.isControlViolations
            );
          this.approveForm
            .get('depositControlBuyer')
            ?.patchValue(this.admissionOptions?.buyerOptions?.isControlDeposit);

          if (this.admissionOptions?.isExistOptionsDifference) {
            this.approveForm
              .get('depositCalculationSeller')
              ?.patchValue(this.admissionOptions?.sellerOptions?.isLockDeposit);
            this.approveForm
              .get('depositCalculationBuyer')
              ?.patchValue(this.admissionOptions?.buyerOptions?.isLockDeposit);
          } else {
            if (this.approveForm.get('depositControlSeller')?.value == true) {
              this.approveForm
                .get('depositCalculationSeller')
                ?.patchValue(true);
              //   this.disabledDepositCalculationSeller = true
            } else {
              this.approveForm
                .get('depositCalculationSeller')
                ?.patchValue(false);
              this.disabledDepositCalculationSeller = true;
              //   this.disabledDepositControlSeller = true;
            }

            if (this.approveForm.get('depositControlBuyer')?.value == true) {
              this.approveForm.get('depositCalculationBuyer')?.patchValue(true);
              //    this.disabledDepositCalculationBuyer = true
            } else {
              this.approveForm
                .get('depositCalculationBuyer')
                ?.patchValue(false);
              this.disabledDepositCalculationBuyer = true;
              //   this.disabledDepositControlBuyer = true;
            }
          }
        }
      });
  }

  onChangeControlSwitcher(e, type: string) {
    if (type == 'depositControlSeller') {
      e.value == false
        ? (this.disabledDepositCalculationSeller = false)
        : (this.disabledDepositCalculationSeller = true);
      e.value == false
        ? this.approveForm.get('depositCalculationSeller')?.patchValue(true)
        : this.approveForm.get('depositCalculationSeller')?.patchValue(true);
    }

    if (type == 'depositControlBuyer') {
      e.value == false
        ? (this.disabledDepositCalculationBuyer = false)
        : (this.disabledDepositCalculationBuyer = true);
      e.value == false
        ? this.approveForm.get('depositCalculationBuyer')?.patchValue(true)
        : this.approveForm.get('depositCalculationBuyer')?.patchValue(true);
    }
  }

  approveOffer() {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      isBuyerControlViolations: this.approveForm.get('violationsControlBuyer')
        ?.value,
      isBuyerControlDeposit: this.approveForm.get('depositControlBuyer')?.value,
      isBuyerLockDeposit: this.approveForm.get('depositCalculationBuyer')
        ?.value,
      isSellerControlViolations: this.approveForm.get('violationsControlSeller')
        ?.value,
      isSellerControlDeposit: this.approveForm.get('depositControlSeller')
        ?.value,
      isSellerLockDeposit: this.approveForm.get('depositCalculationSeller')
        ?.value,
    };

    this.targetedService
      .offersBuceApprove(this.user?.token, body)
      .subscribe((res) => {
        const translations = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.directOffersTab.approvalOffersMess');
        const translateMessage = (
          template: string,
          params: { [key: string]: any }
        ) => {
          return template.replace(
            /{{\s*([^{}\s]*)\s*}}/g,
            (_, key) => params[key] ?? ''
          );
        };
        let message = translateMessage(translations, {
          numberProcessed: res.numberProcessed,
          all: res.numberTotal,
        });
        this.toastService.onShowToast({ message: message, type: 'success' });
        this.closePopup();
      });
  }

  closePopup() {
    this.close.emit(false);
  }
}
