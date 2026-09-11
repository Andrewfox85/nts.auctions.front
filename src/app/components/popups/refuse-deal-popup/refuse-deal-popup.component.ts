import {
  Component,
  inject,
  output,
  input,
  signal,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { TransactionService } from '@services';
import {
  FormsModule,
  ReactiveFormsModule,
  Validators,
  UntypedFormBuilder,
} from '@angular/forms';
import {
  DxButtonModule,
  DxFormModule,
  DxPopupModule,
  DxTextAreaModule,
} from 'devextreme-angular';
import { User } from '@classes';
import { CONDITIONS_REFUSE, PARAMETR_FOR_RETURN } from '@constants';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TransactionTerminateBody } from '../../../services/transaction-service/shared';
import { EMPTY_STRING } from '@constants';
import { IRefuseForm } from './interfaces';

@Component({
  selector: 'app-refuse-deal-popup',
  imports: [
    CommonModule,
    TranslateModule,
    DxPopupModule,
    DxTextAreaModule,
    DxFormModule,
    DxButtonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './refuse-deal-popup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefuseDealPopupComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly formBuilder = inject(UntypedFormBuilder);

  public readonly refusePopup = input.required<boolean>();
  public readonly choosenDeals = input.required<any>(); //It's impossible
  public readonly sessionIds = input.required<{
    sectionId: string;
    sessionId: string;
  }>();

  public readonly close = output<boolean>();
  public readonly closeRes = output<boolean>();

  public readonly user: User = JSON.parse(localStorage.getItem('user') || '{}');
  public readonly CONDITIONS_REFUSE = CONDITIONS_REFUSE;
  public readonly PARAMETR_FOR_RETURN = PARAMETR_FOR_RETURN;

  public readonly refuseForm = this.formBuilder.group({
    condRefuse: [CONDITIONS_REFUSE.WITH_RETURN],
    parameterForReturn: [PARAMETR_FOR_RETURN.CURR_PRICE],
    reason: [EMPTY_STRING, Validators.required],
  });

  public readonly sectionId = computed(
    (): number => +this.sessionIds()?.sectionId
  );
  public readonly sessionId = computed(
    (): number => +this.sessionIds()?.sessionId
  );

  public readonly resultPopup = signal(false);
  public resultData: IRefuseForm;
  public dealNumberForRes: { dealNumber: string };

  public refuseReason = EMPTY_STRING;
  private pendingResultPopup = false;

  public refuseDeal(): void {
    const body: TransactionTerminateBody = this.buildTerminationBody();

    this.transactionService
      .transactionTerminate(this.user?.token, body)
      .subscribe(() => this.handleTerminationResult());
  }

  public closePopup(): void {
    this.refuseForm.setValue(this.processFormValue());
    this.refuseReason = EMPTY_STRING;
    this.close.emit(false);
  }

  public closeResultPopup(): void {
    this.resultPopup.set(false);
    this.closeRes.emit(false);
  }

  public onRefusePopupHidden(): void {
    if (!this.pendingResultPopup) {
      return;
    }

    this.pendingResultPopup = false;
    this.resultPopup.set(true);
  }

  private buildTerminationBody(): TransactionTerminateBody {
    const needReinstateOffer = this.isReinstateNeeded();
    const isByCurrentPrice = this.getIsByCurrentPrice(needReinstateOffer);

    return {
      idSection: this.sectionId(),
      idSession: this.sessionId(),
      idTransaction: this.choosenDeals()?.[0]?.idTransaction ?? EMPTY_STRING,
      terminationReason: this.refuseForm.get('reason')?.value ?? EMPTY_STRING,
      isNeedReinstate: needReinstateOffer,
      isByCurrentPrice: isByCurrentPrice,
    };
  }

  private isReinstateNeeded(): boolean {
    return (
      this.refuseForm.get('condRefuse')?.value === CONDITIONS_REFUSE.WITH_RETURN
    );
  }

  private getIsByCurrentPrice(needReinstateOffer: boolean): boolean | null {
    if (!needReinstateOffer) return null;

    return (
      this.refuseForm.get('parameterForReturn')?.value ===
      PARAMETR_FOR_RETURN.CURR_PRICE
    );
  }

  private handleTerminationResult(): void {
    this.resultData = this.refuseForm?.getRawValue();
    this.dealNumberForRes = {
      dealNumber:
        this.choosenDeals()?.[0]?.transactionInfo?.transactionNumber ??
        EMPTY_STRING,
    };
    this.pendingResultPopup = true;
    this.closePopup();
    this.transactionService.triggerEdit();
  }

  private processFormValue(): IRefuseForm {
    return {
      condRefuse: CONDITIONS_REFUSE.WITH_RETURN,
      parameterForReturn: PARAMETR_FOR_RETURN.CURR_PRICE,
      reason: null,
    };
  }
}
