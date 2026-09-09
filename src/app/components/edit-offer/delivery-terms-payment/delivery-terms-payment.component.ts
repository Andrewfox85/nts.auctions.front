import { Component, EventEmitter, Input, Output } from '@angular/core';
import { timberTicket, termsConditionsPaymentConst } from '@constants';
import {
  DxDateBoxComponent,
  DxNumberBoxComponent,
  DxSelectBoxComponent,
  DxValidatorComponent,
} from 'devextreme-angular';
import { DxiValidationRuleComponent } from 'devextreme-angular/ui/nested';
import { NgTemplateOutlet } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DelayMoment, PrepayMoment } from '@interfaces';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { DisableNumberBoxWheel } from "../../../shared/directives/disable-number-box-wheel";

@Component({
  selector: 'app-delivery-terms-payment',
  templateUrl: './delivery-terms-payment.component.html',
  styleUrl: './delivery-terms-payment.component.scss',
  imports: [
    DxDateBoxComponent,
    DxNumberBoxComponent,
    DxSelectBoxComponent,
    DxValidatorComponent,
    DxiValidationRuleComponent,
    NgTemplateOutlet,
    ReactiveFormsModule,
    TranslateModule,
    DisableNumberBoxWheel
  ],
  standalone: true,
})
export class DeliveryTermsPaymentComponent {
  @Input({ required: true }) termsPaymentForm: FormGroup;

  @Input({ required: true }) termsConditionsPaymentValue: any[] = [];

  @Input({ required: true }) volumeTerms: any[] = [];

  @Input({ required: true }) momentPrepaymentValues: any[] = [];

  @Input({ required: true }) momentDelayValues: any[] = [];

  @Input({ required: true }) dayTypePaymentConfig: any[] = [];

  @Input({ required: true }) momentPrepayment: PrepayMoment;

  @Input({ required: true }) momentDelay: DelayMoment;

  @Input({ required: true }) DateSession: Date;

  @Input({ required: true }) dayType = [];

  @Input({ required: true }) readOnlyDefermentAmount: boolean = true;

  @Input({ required: true }) returnTermsPaymentChange!: (field: string) => void;

  @Input({ required: true }) returnChangedefermentAmount!: () => void;

  @Input({ required: true }) returnPrepaymentAmountChange!: () => void;

  @Input({ required: true }) conditionSecondStage!: () => boolean;

  @Output() isEditedTermsPayment = new EventEmitter<boolean>();

  @Output() termsPaymentChanged = new EventEmitter<{
    field: string;
  }>();
  @Output() getConcatedString = new EventEmitter<any>();

  @Output() changedFermentAmount = new EventEmitter<any>();

  @Output() prepaymentAmountChange = new EventEmitter<any>();

  public readonly timberTicket = timberTicket;
  public readonly termsConditionsPaymentConst = termsConditionsPaymentConst;

  public onTermsPaymentChange(field: string) {
    this.termsPaymentChanged.emit({ field });
  }

  public getPaymentTermConcatedString() {
    this.getConcatedString.emit();
  }

  public onChangedefermentAmount() {
    this.changedFermentAmount.emit();
  }

  public onPrepaymentAmountChange() {
    this.prepaymentAmountChange.emit();
  }

  public changeDayType(e: ValueChangedEvent): void {
    this.termsPaymentForm.controls['dayTypeId'].setValue(e.value);
  }
}
