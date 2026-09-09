import { User } from '@classes';
import {
  Component,
  inject,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnInit,
} from '@angular/core';
import {
  termsConditionsPaymentConst,
  AMOUNT_OF_DEFERMENT_40,
  FULL_PERCENT,
  timberTicket,
  AMOUNT_OF_DEFERMENT_100,
  DEFAULT_DEFERMENT_PERIOD_NUMBER,
  DEFAULT_DEFERMENT_PERIOD_NUMBER_2
} from '@constants';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { toOADate, upperCaseFirstLetter } from '@helpers';
import {
  CommonService,
  TradingService,
  SubmissionService,
  OfferFullInfoResponse,
} from '@services';
import { convertExcelSerialDateToMs } from '../../../../views/homepage/helpers';
import { TranslateModule } from '@ngx-translate/core';
import {
  DxScrollViewModule,
  DxValidationGroupModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxTooltipModule,
  DxButtonModule,
  DxTextBoxModule,
  DxDropDownBoxModule,
  DxTreeViewModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxCheckBoxModule,
  DxPopupModule,
} from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { DxValidationGroupComponent } from 'devextreme-angular';
import {
  IDeadlineParamsReset,
  ITermsConditionsPayment,
  IDayTypePaymentConfig,
  IPaymentCondition,
  IMomentDetail,
  IPaymentVolume,
  IOutputEvent,
  ISessionIds,
} from './interfaces/index';
import { PAYMENT_TERMS } from './../../../../shared/enums/index';
import { PaymentTermConcatedResponse, DeterminePaymentCondResponse } from './../../../../services/submission-service/shared/interfaces/index';

@Component({
  selector: 'app-payment-condition-edit',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DxScrollViewModule,
    DxValidationGroupModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxTooltipModule,
    DxButtonModule,
    DxTextBoxModule,
    DxDropDownBoxModule,
    DxTreeViewModule,
    DxDateBoxModule,
    DxNumberBoxModule,
    DxCheckBoxModule,
    DxPopupModule,
  ],
  templateUrl: './payment-condition-edit.component.html',
  styleUrl: './payment-condition-edit.component.scss',
})
export class PaymentConditionEditComponent implements OnInit {
  @Input() fullInfo: OfferFullInfoResponse;
  @Input() user: User;
  @Input() sessionIds: ISessionIds;
  @Input() termsConditionsPayment: ITermsConditionsPayment[];

  @Input() deliveryTermConcated: string;
  @Input() changeDeliveryPeriodForm: boolean;

  @Output() save = new EventEmitter<IOutputEvent>();
  @Output() close = new EventEmitter<boolean>();
  @Output() deadlinesChanged = new EventEmitter<IOutputEvent>();
  @Output() paymentTermConcatedChange = new EventEmitter<IOutputEvent>();
  @Output() deadlineErrorMessChange = new EventEmitter<string>();
  @Output() deadlineParamsReset = new EventEmitter<IDeadlineParamsReset>();

  @ViewChild('termsPayment', { static: false })
  public validationGroup: DxValidationGroupComponent;

  private readonly formBuilder = inject(FormBuilder);
  public readonly commonService = inject(CommonService);
  private readonly tradingService = inject(TradingService);
  private readonly submissionService = inject(SubmissionService);

  public dateSessionPlusDay: Date = new Date();
  public dateSession: Date = new Date();

  public termsConditionsPaymentValue: IPaymentCondition[] = [];

  public termsPaymentForm = this.formBuilder.group({
    termsPayment: [],
    volume: [],
    prepaymentAmount: [],
    momentPrepayment: [],
    prepaymentPeriod: [],
    prepaymentPeriodNumber: [],
    prepaymentPeriodDate: [],
    defermentAmount: [],
    momentDelay: [],
    defermentPeriodNumber: [],
    defermentPeriodDate: [],
    defermentAmount2: [],
    momentDelay2: [],
    defermentPeriod2: [],
    dayTypeId: [],
  });

  public readonly PAYMENT_TERMS = PAYMENT_TERMS;
  public readonly termsConditionsPaymentConst = termsConditionsPaymentConst;
  public readonly timberTicketConst = timberTicket;
  public isEditedTermsPayment: boolean = false;
  public dayTypePaymentConfig: IDayTypePaymentConfig[];
  public momentPrepayment: IMomentDetail;
  public momentDelay: IMomentDetail;
  public readOnlyDefermentAmount: boolean = true;
  public paymentTermConcated: string;
  public termsConditions: IPaymentCondition;
  public volumeTerms: IPaymentVolume[] = [];
  public volumeTermsPayment: IPaymentVolume;
  public termsConditionsFilter: ITermsConditionsPayment[]; //условия оплаты отфильторованные по условиям оплаты из пересечения
  public termsConditionsVolumesFilter: ITermsConditionsPayment[]; //условия оплаты отфильторованные по условиям оплаты и объему из пересечения

  public timberTicket: boolean = false; //до выдачи лесорубочного билета

  public momentPrepaymentValues: IMomentDetail[] = [];
  public momentDelayValues: IMomentDetail[] = [];
  public dayType: string[] = []; //тип дней (календарные/банковские) в выбранном условии

  public ngOnInit(): void {
    this.dateSessionPlusDay.setDate(this.dateSessionPlusDay.getDate() + 1);
    this.changePaymentCond();
  }

  private convertDate(date: number): number | null {
    return date ? convertExcelSerialDateToMs(date) : null;
  }

  get isPaymentDeferment(): boolean {
    return (
      Number(this.termsPaymentForm.controls.termsPayment?.value) ===
      termsConditionsPaymentConst.paymentDeferment
    );
  }

  get isPartialPrepayment(): boolean {
    return (
      Number(this.termsPaymentForm.controls.termsPayment?.value) ===
      termsConditionsPaymentConst.partialPrepayment
    );
  }

  get isPrepayment100(): boolean {
    return (
      Number(this.termsPaymentForm.controls.termsPayment?.value) ===
      termsConditionsPaymentConst.prepayment100
    );
  }

  get isPaymentThroughExchange(): boolean {
    return (
      Number(this.termsPaymentForm.controls.termsPayment?.value) ===
      termsConditionsPaymentConst.paymentThroughExchange
    );
  }

  get isPrepaymentPeriod(): boolean {
    return (
      this.momentPrepayment && !this.isPaymentDeferment && !this.isTimberTicket
    );
  }

  get isDefermentAmount(): boolean {
    return this.isPartialPrepayment || this.isPaymentDeferment;
  }

  get isMomentDelay(): boolean {
    return (
      this.isPaymentDeferment ||
      (this.isPartialPrepayment &&
        this.termsPaymentForm.controls.momentPrepayment?.value)
    );
  }

  get isDefermentPeriod(): boolean {
    return (
      !this.isPrepayment100 &&
      !this.isPaymentThroughExchange &&
      !!this.momentDelay
    );
  }

  get isTimberTicket(): boolean {
    return (
      Number(this.termsPaymentForm.controls.momentPrepayment?.value) ===
      this.timberTicketConst
    );
  }

  //проверка на добавление 2 этапа при Момент предоплаты = «до выдачи лесорубочного билета»
  get conditionSecondStage(): boolean {
    return (
      this.isPartialPrepayment &&
      this.isTimberTicket &&
      FULL_PERCENT - this.termsPaymentForm.controls.prepaymentAmount?.value >
        AMOUNT_OF_DEFERMENT_40 &&
      this.termsPaymentForm.controls.defermentAmount2?.value
    );
  }

  //изменяем условия оплаты
  public changePaymentCond(): void {
    //получаем справочник календарные и банковские дни
    this.commonService
      .getByName(this.user?.token, 'daytypes')
      .subscribe((res) => {
        this.dayTypePaymentConfig = res.refbooks;
      });

    this.tradingService
      .getPaymentConfig(this.user.token, this.sessionIds.sectionId)
      .subscribe((res) => {
        this.termsConditionsPaymentValue = [];
        //получение массива условий оплаты с учетом пересечений
        res.data.forEach((item) => {
          if (
            this.termsConditionsPayment?.find(
              (el) => el.paymentConditionId == item.id
            ) &&
            !this.termsConditionsPaymentValue?.find((el) => el.id == item.id)
          ) {
            this.termsConditionsPaymentValue.push(item);
          }
        });
        //если одно значение в массиве и при этом он ранее не был заполнен
        // (для проверки при котором все поля предзаполнены (имеют только одно значение), кроме срока поставки и он сбрасывался при переходе с 3-его на этот шаг)
        if (
          this.termsConditionsPaymentValue.length === 1 &&
          !this.termsPaymentForm.controls.volume.value
        ) {
          this.termsPaymentForm.controls.termsPayment.patchValue(
            this.termsConditionsPaymentValue[0].id
          );
          this.onTermsPaymentChange(PAYMENT_TERMS.TERMS_PAYMENT);
        }

        this.termsPaymentForm.controls.termsPayment.patchValue(
          this.fullInfo.paymentCond.idPaymentType.toString()
        );
        this.onTermsPaymentChange(PAYMENT_TERMS.TERMS_PAYMENT);
        this.paymentTermConcated =
          this.fullInfo.generalInfo.concatedPaymentConditions;
      });
  }

  public onTermsPaymentChange(str: string): void {
    switch (str) {
      case PAYMENT_TERMS.TERMS_PAYMENT: {
        this.termsPaymentForm.controls.volume.reset();
        this.termsPaymentForm.controls.prepaymentAmount.reset();
        this.termsPaymentForm.controls.dayTypeId.reset();
        this.volumeTerms = [];
        this.resetDeadlineParams();

        //выбранное значение условия оплаты
        this.termsConditions = this.termsConditionsPaymentValue.find(
          (el) => el.id == this.termsPaymentForm.controls.termsPayment.value
        );
        //условия оплаты отфильторованные по условиям оплаты из пересечения
        this.termsConditionsFilter = this.termsConditionsPayment.filter(
          (el) =>
            el.paymentConditionId ==
            this.termsPaymentForm.controls.termsPayment.value
        );

        //формирование массива объема доступных для выбора
        this.termsConditions.volumes.forEach((item) => {
          if (
            this.termsConditionsFilter.find(
              (el) => el.paymentVolumeId == item.id
            ) &&
            !this.volumeTerms.find((el) => el.id == item.id)
          )
            this.volumeTerms.push(item);
        });
        //если одно значение в массиве объема
        if (this.volumeTerms.length === 1) {
          this.termsPaymentForm.controls.volume.setValue(
            this.volumeTerms[0].id
          );
          this.onTermsPaymentChange(PAYMENT_TERMS.VOLUME);
        }

        if (
          !this.termsPaymentForm.controls.volume.value &&
          !this.isEditedTermsPayment
        ) {
          this.termsPaymentForm.controls.volume.setValue(
            this.fullInfo.paymentCond.idShipmentVolume.toString()
          );
          this.onTermsPaymentChange(PAYMENT_TERMS.VOLUME);
        }
        break;
      }
      case PAYMENT_TERMS.VOLUME: {
        this.resetControls([
          'momentPrepayment',
          'prepaymentAmount',
          'momentDelay',
          'defermentPeriodDate',
          'prepaymentPeriodDate',
          'defermentAmount',
          'dayTypeId',
        ]);

        this.readOnlyDefermentAmount = true;
        this.momentPrepayment = null;
        this.momentDelay = null;
        this.resetDeadlineParams();
        this.momentDelayValues = [];
        this.momentPrepaymentValues = [];

        if (this.termsPaymentForm.controls.volume.value) {
          //выбранное значение объема
          this.volumeTermsPayment = this.termsConditions.volumes.find(
            (el) => el.id == this.termsPaymentForm.controls.volume.value
          );
          //условия оплаты отфильтрованы по условиям оплаты и объему из пересечения
          this.termsConditionsVolumesFilter = this.termsConditionsFilter.filter(
            (el) =>
              el.paymentVolumeId == this.termsPaymentForm.controls.volume.value
          );

          //Условие оплаты в форме заявки = «Предоплата 100%» или Оплата через счета биржи
          if (this.isPrepayment100 || this.isPaymentThroughExchange) {
            this.termsPaymentForm.controls.prepaymentAmount.setValue(
              FULL_PERCENT
            ); //Размер предоплаты
          }
          //Условие оплаты в форме заявки = «Отсрочка»
          if (this.isPaymentDeferment) {
            this.termsPaymentForm.controls.defermentAmount.setValue(
              FULL_PERCENT
            ); //Размер отсрочки
          }

          // «Условие оплаты» в форме заявке = «Предоплата 100%» или «Частичная предоплата»;
          if (!this.isPaymentDeferment) {
            //предоплата
            this.volumeTermsPayment.prepayMoments.forEach((item) => {
              if (
                this.termsConditionsVolumesFilter.find(
                  (el) => el.prepayMomentId == item.id
                ) &&
                !this.momentPrepaymentValues.find((el) => el.id == item.id)
              )
                this.momentPrepaymentValues.push(item);
            });
            if (!this.isEditedTermsPayment) {
              this.termsPaymentForm.controls.momentPrepayment.setValue(
                this.fullInfo.paymentCond.firstPaymentMomentId?.toString()
              );
              this.termsPaymentForm.controls.prepaymentAmount.setValue(
                this.fullInfo.paymentCond?.firstPercent
              );
              this.onTermsPaymentChange(PAYMENT_TERMS.MOMENT_PREPAYMENT);
              break;
            }
            if (this.momentPrepaymentValues.length === 1) {
              this.termsPaymentForm.controls.momentPrepayment.setValue(
                this.momentPrepaymentValues[0].id
              );
              this.onTermsPaymentChange(PAYMENT_TERMS.MOMENT_PREPAYMENT);
              break;
            }
          } else {
            //отсрочка
            this.volumeTermsPayment.delayMoments.forEach((item) => {
              if (
                this.termsConditionsVolumesFilter.find(
                  (el) => el.delayMomentId == item.id
                ) &&
                !this.momentDelayValues.find((el) => el.id == item.id)
              )
                this.momentDelayValues.push(item);
            });

            if (
              (!this.termsPaymentForm.controls.momentDelay.value ||
                !this.termsPaymentForm.controls.defermentAmount.value) &&
              !this.isEditedTermsPayment
            ) {
              if (!this.isTimberTicket)
                this.termsPaymentForm.controls.momentDelay.setValue(
                  this.fullInfo.paymentCond.firstPaymentMomentId?.toString()
                );
              this.onTermsPaymentChange(PAYMENT_TERMS.MOMENT_DELAY);
              break;
            }

            if (this.momentDelayValues.length === 1) {
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.momentDelayValues[0].id
              );
              this.onTermsPaymentChange(PAYMENT_TERMS.MOMENT_DELAY);
              break;
            }
          }
        }
        break;
      }
      case PAYMENT_TERMS.MOMENT_PREPAYMENT: {
        this.resetControls([
          'prepaymentPeriodNumber',
          'prepaymentPeriodDate',
          'dayTypeId',
        ]);

        this.resetDeadlineParams();
        this.readOnlyDefermentAmount = true; //при переключении с лесорубочного надругое значение. дизейблим размер отсрочки

        this.timberTicket = false;
        if (this.termsPaymentForm.controls.momentPrepayment.value) {
          this.momentPrepayment = this.volumeTermsPayment.prepayMoments.find(
            (el) =>
              el.id == this.termsPaymentForm.controls.momentPrepayment.value
          );

          if (this.momentPrepayment?.options.applicableDayCount) {
            this.dayType = this.termsConditionsPayment.find(
              (el) =>
                el.paymentConditionId ==
                  this.termsPaymentForm.controls.termsPayment.value &&
                el.paymentVolumeId ==
                  this.termsPaymentForm.controls.volume.value &&
                el.prepayMomentId ==
                  this.termsPaymentForm.controls.momentPrepayment.value &&
                el.delayMomentId ==
                  this.termsPaymentForm.controls.momentDelay.value
            )?.dayTypeId;
            if (this.dayType?.length === 1) {
              this.termsPaymentForm.controls.dayTypeId.setValue(
                this.dayType[0]
              );
            }
          }

          if (
            !(
              this.termsPaymentForm.controls.prepaymentPeriodNumber.value ||
              this.termsPaymentForm.controls.prepaymentPeriodDate.value
            ) &&
            !this.isEditedTermsPayment &&
            this.fullInfo.paymentCond.firstPaymentMomentId !==
              this.timberTicketConst
          ) {
            let date = this.convertDate(
              this.fullInfo.paymentCond?.firstPeriodValueDate
            );

            this.termsPaymentForm.controls.prepaymentPeriodNumber?.setValue(
              this.fullInfo.paymentCond.firstPeriodValueNumber?.toString()
            );
            this.termsPaymentForm.controls.prepaymentPeriodDate?.setValue(date);
            this.termsPaymentForm.controls.dayTypeId?.setValue(
              this.fullInfo.paymentCond?.idDayType
            );

            //Условие оплаты в форме заявки = «Предоплата 100%»
            if (this.isPrepayment100 || this.isPaymentThroughExchange) {
              this.paymentTermConcated = upperCaseFirstLetter(
                this.fullInfo.generalInfo.concatedPaymentConditions
              );
            }
          }

          //«Условие оплаты» в форме заявки = «Частичная предоплата»
          if (this.isPartialPrepayment) {
            this.momentDelayValues = this.momentPrepayment.delayMoments;
            this.onPrepaymentAmountChange();
            if (
              !this.termsPaymentForm.controls.momentDelay.value &&
              !this.isEditedTermsPayment
            ) {
              this.termsPaymentForm.controls.defermentAmount.setValue(
                this.fullInfo.paymentCond.secondPercent
              );
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.fullInfo.paymentCond.secondPaymentMomentId?.toString()
              );
              this.onTermsPaymentChange(PAYMENT_TERMS.MOMENT_DELAY);
              break;
            }
            if (this.momentDelayValues.length === 1) {
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.momentDelayValues[0].id
              );
              this.onTermsPaymentChange(PAYMENT_TERMS.MOMENT_DELAY);
              break;
            }
          }
          //формирование строки для «Условие оплаты» в форме заявке = «Предоплата 100%» и Момент предоплаты = «до выдачи лесорубочного билета»
          if (
            (this.isPrepayment100 || this.isPaymentThroughExchange) &&
            this.isTimberTicket
          ) {
            this.timberTicket = true;
            this.getPaymentTermConcatedString();
          }
        }

        break;
      }
      case PAYMENT_TERMS.MOMENT_DELAY: {
        this.resetControls([
          'defermentPeriodNumber',
          'defermentPeriodDate',
          'dayTypeId',
        ]);

        this.resetDeadlineParams();

        if (this.termsPaymentForm.controls.momentDelay.value) {
          if (this.isPartialPrepayment) {
            this.momentDelay = this.momentPrepayment.delayMoments.find(
              (el) => el.id == this.termsPaymentForm.controls.momentDelay.value
            );
          } else
            this.momentDelay = this.volumeTermsPayment.delayMoments.find(
              (el) => el.id == this.termsPaymentForm.controls.momentDelay.value
            );

          if (this.momentDelay?.options.applicableDayCount) {
            this.dayType = this.termsConditionsPayment.find(
              (el) =>
                el.paymentConditionId ==
                  this.termsPaymentForm.controls.termsPayment.value &&
                el.paymentVolumeId ==
                  this.termsPaymentForm.controls.volume.value &&
                el.prepayMomentId ==
                  this.termsPaymentForm.controls.momentPrepayment.value &&
                el.delayMomentId ==
                  this.termsPaymentForm.controls.momentDelay.value
            )?.dayTypeId;
            if (this.dayType?.length === 1) {
              this.termsPaymentForm.controls.dayTypeId.setValue(
                this.dayType[0]
              );
            }
          }

          if (
            !(
              this.termsPaymentForm.controls.defermentPeriodNumber.value ||
              this.termsPaymentForm.controls.defermentPeriodDate.value
            ) &&
            !this.isEditedTermsPayment
          ) {
            if (
              this.fullInfo.paymentCond?.idPaymentType !==
              termsConditionsPaymentConst.partialPrepayment
            ) {
              //если это предоплата или отсрочка
              let date = this.convertDate(
                this.fullInfo.paymentCond?.firstPeriodValueDate
              );
              this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(
                this.fullInfo.paymentCond?.firstPeriodValueNumber?.toString()
              );
              this.termsPaymentForm.controls.defermentPeriodDate?.setValue(
                date
              );
            } else {
              this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(
                this.fullInfo.paymentCond?.secondPeriodValueNumber.toString()
              );
            }
            this.termsPaymentForm.controls.dayTypeId?.setValue(
              this.fullInfo.paymentCond?.idDayType
            );
            this.paymentTermConcated = upperCaseFirstLetter(
              this.fullInfo.generalInfo.concatedPaymentConditions
            );
          }
        }

        //«Момент предоплаты» = «до выдачи лесорубочного билета»
        if (this.isTimberTicket && this.isEditedTermsPayment) {
          this.termsPaymentForm.controls.defermentPeriodNumber.setValue(DEFAULT_DEFERMENT_PERIOD_NUMBER);
          this.termsPaymentForm.controls.momentDelay2.setValue(
            this.momentDelayValues[0].id
          );
          this.termsPaymentForm.controls.defermentPeriod2.setValue(DEFAULT_DEFERMENT_PERIOD_NUMBER_2);
        }
        if (
          this.isTimberTicket &&
          !(
            this.termsPaymentForm.controls.momentDelay2.value ||
            this.termsPaymentForm.controls.defermentPeriod2.value
          ) &&
          !this.isEditedTermsPayment
        ) {
          this.termsPaymentForm.controls.momentDelay.setValue(
            this.fullInfo.paymentCond.secondPaymentMomentId?.toString()
          );
          this.termsPaymentForm.controls.momentDelay2.setValue(
            this.fullInfo.paymentCond.secondPaymentMomentId?.toString()
          );
          this.termsPaymentForm.controls.defermentAmount.setValue(
            this.fullInfo.paymentCond.secondPercent
          );
          this.termsPaymentForm.controls.prepaymentAmount.setValue(
            this.fullInfo.paymentCond.firstPercent
          );
          this.termsPaymentForm.controls.defermentPeriodNumber.setValue(
            this.fullInfo.paymentCond?.secondPeriodValueNumber
          );
          this.termsPaymentForm.controls.defermentPeriod2.setValue(
            this.fullInfo.paymentCond?.thirdPeriodValueNumber
          );
          this.termsPaymentForm.controls.dayTypeId?.setValue(
            this.fullInfo.paymentCond?.idDayType
          );
          this.timberTicket = true;
          this.onChangedefermentAmount();
        }

        break;
      }
    }
  }

  private resetDeadlineParams(): void {
    this.paymentTermConcated = '';
    this.deadlineParamsReset.emit({
      deadlineDelivery: null,
      deadlinePayment: null,
    });
  }

  private resetControls(controlNames: string[]): void {
    controlNames.forEach((controlName) => {
      this.termsPaymentForm.controls[controlName]?.setValue(null);
    });
  }

  public onPrepaymentAmountChange(): void {
    //Условие оплаты в форме заявки = «Частичная предоплата» и (или) «Момент предоплаты» = «до выдачи лесорубочного билета»;
    if (this.isPartialPrepayment && this.isTimberTicket) {
      let value =
        AMOUNT_OF_DEFERMENT_100 -
        this.termsPaymentForm.controls.prepaymentAmount?.value;

      //«Размер отсрочки» <= 40%, то поле недоступно для изменения и содержит рассчитанное значение
      if (value <= AMOUNT_OF_DEFERMENT_40) {
        this.termsPaymentForm.controls.defermentAmount.setValue(value);
        this.readOnlyDefermentAmount = true;
      }
      //«Размер отсрочки» >40% (оплата может быть произведена в один или два этапа), то поле заполняется значением по умолчанию - 40% и остается доступным для редактирования
      else {
        this.termsPaymentForm.controls.defermentAmount.setValue(
          AMOUNT_OF_DEFERMENT_40
        );
        this.readOnlyDefermentAmount = false;
        this.termsPaymentForm.controls.defermentAmount2.setValue(
          value - this.termsPaymentForm.controls.defermentAmount.value
        );
      }
      this.termsPaymentForm.controls.momentDelay2.setValue(
        this.termsPaymentForm.controls.momentDelay.value
      );
    } else
      this.termsPaymentForm.controls.defermentAmount.setValue(
        FULL_PERCENT - this.termsPaymentForm.controls.prepaymentAmount?.value
      );
    if (
      !(
        this.isPartialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }

  public onChangedefermentAmount(): void {
    let defermentAmount2 =
    FULL_PERCENT -
      this.termsPaymentForm.controls.prepaymentAmount?.value -
      this.termsPaymentForm.controls.defermentAmount.value;
    if (defermentAmount2 >= 0)
      this.termsPaymentForm.controls.defermentAmount2.setValue(
        defermentAmount2
      );
    else {
      this.conditionSecondStage;
      this.termsPaymentForm.controls.defermentAmount2.setValue(null);
      this.termsPaymentForm.controls.prepaymentAmount.patchValue(
        FULL_PERCENT - this.termsPaymentForm.controls.defermentAmount.value
      );
    }

    if (
      !(
        this.isPartialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }

  public changeDayType(e): void {
    this.termsPaymentForm.controls.dayTypeId.setValue(e.value);
  }

  public getPaymentTermConcatedString(): void {
    let IdPaymentCondition: number;
    if (
      this.validationGroup?.instance.validate().isValid ||
      (this.timberTicket && this.validationGroup?.instance.validate().isValid)
    ) {
      this.submissionService
        .determinePaymentCondId(
          this.user?.token,
          this.termsPaymentForm.controls.termsPayment?.value,
          this.termsPaymentForm.controls.volume?.value,
          this.termsPaymentForm.controls.momentPrepayment?.value || null,
          this.termsPaymentForm.controls.momentDelay?.value || null
        )
        .subscribe((res: DeterminePaymentCondResponse) => {
          IdPaymentCondition = res.id;

          const firstPeriodValueNumber: number | null = this.isPaymentDeferment
            ? this.termsPaymentForm.controls.defermentPeriodNumber?.value ??
              null
            : this.termsPaymentForm.controls.prepaymentPeriodNumber?.value ??
              null;

          const firstPercent: number = !this.isPaymentDeferment
            ? this.termsPaymentForm.controls.prepaymentAmount?.value
            : 0;

          const rawDate: number = this.isPaymentDeferment
            ? this.termsPaymentForm.controls.defermentPeriodDate?.value
            : this.termsPaymentForm.controls.prepaymentPeriodDate?.value;

          const firstPeriodValueDate: number | null = rawDate
            ? toOADate(rawDate)
            : null;

          const secondPercent: number | null =
            !this.isPrepayment100 || !this.isPaymentThroughExchange
              ? this.termsPaymentForm.controls.defermentAmount?.value ?? null
              : null;

          const secondPeriodValueNumber: number | null = this.isPartialPrepayment
            ? this.termsPaymentForm.controls.defermentPeriodNumber?.value ??
              null
            : null;

          const thirdPeriodValueNumber: number = this.conditionSecondStage
            ? this.termsPaymentForm.controls.defermentPeriod2?.value ?? null
            : null;

          this.submissionService
            .getPaymentTermConcated(
              this.user.token,
              this.termsPaymentForm.controls.termsPayment?.value,
              IdPaymentCondition,
              firstPeriodValueNumber,
              firstPercent,
              firstPeriodValueDate,
              secondPercent,
              secondPeriodValueNumber,
              thirdPeriodValueNumber,
              this.termsPaymentForm.controls.dayTypeId?.value || null
            )
            .subscribe((res: PaymentTermConcatedResponse) => {
              this.paymentTermConcated = upperCaseFirstLetter(res.result);

              this.paymentTermConcatedChange.emit({
                paymentTermConcated: this.paymentTermConcated,
                formValue: this.termsPaymentForm.getRawValue(),
              });

              //если форма условия оплаты открыта, то смотрим открыт ли срок поставки
              const hasDelivery: boolean = !!this.deliveryTermConcated;
              const hasPayment: boolean = !!this.paymentTermConcated;

              if (
                hasPayment &&
                (hasDelivery || !this.changeDeliveryPeriodForm)
              ) {
                this.deadlinesChanged.emit({
                  formValue: this.termsPaymentForm.getRawValue(),
                  paymentTermConcated: this.paymentTermConcated,
                  conditionSecondStage: this.conditionSecondStage,
                });
              }

              this.timberTicket = false;
            });
        });
    }
  }

  public savePaymentCondForm(): void {
    this.save.emit({
      formValue: this.termsPaymentForm.getRawValue(),
      conditionSecondStage: this.conditionSecondStage,
    });
  }

  public closePaymentCondForm(): void {
    this.isEditedTermsPayment = false;
    this.termsPaymentForm.controls.termsPayment.reset();
    this.deadlineErrorMessChange.emit('');
    this.close.emit(false);
  }
}
