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
import { IdInterfaceField, minDeliveryScheduleDaysCount } from '@constants';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  toOADate,
  upperCaseFirstLetter,
  getTranslateResultByCurrentLang,
} from '@helpers';
import {
  TradingService,
  SubmissionService,
  OfferFullInfoResponse,
  SubmitCounterService,
} from '@services';
import { convertExcelSerialDateToMs } from '../../../../views/homepage/helpers';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  DxValidationGroupModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxButtonModule,
  DxTextBoxModule,
  DxDropDownBoxModule,
  DxDateBoxModule,
  DxNumberBoxModule,
} from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { DxValidatorComponent } from 'devextreme-angular';
import {
  IDeadlineParamsReset,
  IOutputDeliveryPeriodEvent,
  IAdjustablePriceOutput,
  IUniqueDeliveryTerm,
  IDeliveryTermValue,
} from './interfaces/index';
import {
  ID_DELIVERY_TYPE,
  ID_START_DELIVERY,
  DELIVERY_TERMS
} from './../../../../shared/enums/index';
import { IGoodsSpecifications } from '@interfaces';
import { DeliveryTermConcatedResponse } from './../../../../services/submission-service/shared/interfaces/index';


@Component({
  selector: 'app-delivery-period-edit',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DxValidationGroupModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxButtonModule,
    DxTextBoxModule,
    DxDropDownBoxModule,
    DxDateBoxModule,
    DxNumberBoxModule,
  ],
  templateUrl: './delivery-period-edit.component.html',
  styleUrl: './delivery-period-edit.component.scss',
})
export class DeliveryPeriodEditComponent implements OnInit {
  @Input() fullInfo: OfferFullInfoResponse;
  @Input() user: User;
  @Input() deliveryTerm: IUniqueDeliveryTerm[];
  @Input() paymentTermConcated: string;
  @Input() changePaymentCondForm: boolean;

  @Output() save = new EventEmitter<IOutputDeliveryPeriodEvent>();
  @Output() close = new EventEmitter<boolean>();
  @Output() deadlinesChanged = new EventEmitter<IOutputDeliveryPeriodEvent>();
  @Output() deliveryTermConcatedChange =
    new EventEmitter<IOutputDeliveryPeriodEvent>();
  @Output() deadlineErrorMessChange = new EventEmitter<string>();
  @Output() adjustablePriceChange = new EventEmitter<IAdjustablePriceOutput>();
  @Output() deadlineParamsReset = new EventEmitter<IDeadlineParamsReset>();

  @ViewChild('endValidator', { static: false })
  public endValidator: DxValidatorComponent;

  private readonly formBuilder = inject(FormBuilder);
  private readonly tradingService = inject(TradingService);
  private readonly submissionService = inject(SubmissionService);
  private readonly translate = inject(TranslateService);
  private readonly submitCounterService = inject(SubmitCounterService);

  public dateSessionPlusDay: Date = new Date();
  public dateSession: Date = new Date();

  public deliveryTermValue: IDeliveryTermValue[] = [];
  public deliveryTermConcated: string;
  public deliveryTermType: IUniqueDeliveryTerm[] = [];
  public isDaysCountCorrect: boolean = false;
  public isEditedDeliveryTerm: boolean = false;
  public uniqueDeliveryTerm: IUniqueDeliveryTerm[] = [];

  public readonly DELIVERY_TERMS = DELIVERY_TERMS;

  public deliveryTermForm = this.formBuilder.group({
    startDelivery: [null as string, [Validators.required]],
    deliveryType: [null as string, [Validators.required]],
    deliveryTerm: [40, [Validators.required]],
    startDate: [new Date() as Date | number, [Validators.required]],
    endDate: [new Date() as Date | number, [Validators.required]],
  });

  get isDeliveryTime(): boolean {
    return (
      Number(this.deliveryTermForm.controls.startDelivery.value) !==
        ID_START_DELIVERY.NO_DELIVERY_START &&
      (Number(this.deliveryTermForm.controls.deliveryType?.value) ===
        ID_DELIVERY_TYPE.DAY ||
        Number(this.deliveryTermForm.controls.deliveryType?.value) ===
          ID_DELIVERY_TYPE.MONTH)
    );
  }

  get isDateType(): boolean {
    return (
      Number(this.deliveryTermForm.controls.deliveryType.value) ===
      ID_DELIVERY_TYPE.DATE
    );
  }

  public ngOnInit(): void {
    this.dateSessionPlusDay.setDate(this.dateSessionPlusDay.getDate() + 1);
    this.changeDeliveryPeriod();
  }

  public isDate(): IUniqueDeliveryTerm {
    return this.deliveryTermType.find(
      (el) =>
        el.deliveryTermId.toString() ==
        this.deliveryTermForm.controls.deliveryType.value
    );
  }

  private convertDate(date: number): number | null {
    return date ? convertExcelSerialDateToMs(date) : null;
  }

  //заполняем форму срок поставки
  public changeDeliveryPeriod(): void {
    this.tradingService
      .getModelsDeliveryConfig(this.user?.token)
      .subscribe((res: any) => {
        //дополнение массива deliveryTerm названиями периодов и срока поставки
        this.deliveryTerm.forEach((item) => {
          let termData = res.data.find((n) => n.id == item.deliveryStartId);
          item.deliveryStartName = termData.name;
          let terms = termData.terms.find((t) => t.id == item.deliveryTermId);
          item.deliveryTermName = terms.name;
          item.endDeliveryDateValue = terms.options.endDeliveryDate;
          item.startDeliveryDateValue = terms.options.startDeliveryDate;
        });

        this.uniqueDeliveryTerm = [
          ...new Map<string, IUniqueDeliveryTerm>(
            this.deliveryTerm.map(
              (
                item //уникальные значения в массиве по названию начало поставки
              ) => [item['deliveryStartId'], item]
            )
          ).values(),
        ];

        this.deliveryTermForm.controls.startDelivery.patchValue(
          this.fullInfo.deliveryPeriod.idDeliveryMoment?.toString()
        );
        this.deliveryTermStartChange(DELIVERY_TERMS.DELIVERY_START);
        let dateBegin: number = this.convertDate(
          this.fullInfo.deliveryPeriod?.dateBegin
        );
        let dateEnd: number = this.convertDate(this.fullInfo.deliveryPeriod?.dateEnd);

        this.deliveryTermForm.controls.startDate.patchValue(dateBegin);
        this.deliveryTermForm.controls.endDate.patchValue(dateEnd);
        this.deliveryTermConcated =
          this.fullInfo.generalInfo.concatedDeliveryPeriod;
      });
  }

  public deliveryTermStartChange(str: string): void {
    switch (str) {
      case DELIVERY_TERMS.DELIVERY_START: {
        this.handleDeliveryStartChange();
        break;
      }
      case DELIVERY_TERMS.DELIVERY_TYPE: {
        this.handleDeliveryTypeChange();
        break;
      }
    }
  }

  private handleDeliveryStartChange(): void {
    //фильтрация deliveryTermType в соответствии с тем, что выбрано в "Начало поставки"
    this.deliveryTermType = this.deliveryTerm.filter(
      (el) =>
        el.deliveryStartId ==
        this.deliveryTermForm.controls?.startDelivery?.value
    );
    this.deliveryTermForm.controls.deliveryType.reset();
    this.resetForm();

    //если найдена всего одна запись - сразу отображается заполненый select-box
    if (this.deliveryTermType.length === 1) {
      this.deliveryTermForm.controls.deliveryType.patchValue(
        this.deliveryTermType[0].deliveryTermId
      );
    }
    if (
      !this.deliveryTermForm.controls.deliveryType.value &&
      !this.isEditedDeliveryTerm
    ) {
      this.deliveryTermForm.controls.deliveryType.patchValue(
        this.fullInfo.deliveryPeriod.idDeliveryType?.toString() || null
      );
      this.deliveryTermStartChange(DELIVERY_TERMS.DELIVERY_TYPE);
    }
  }

  private handleDeliveryTypeChange(): void {
    this.deliveryTermValue = [];
    this.resetForm();

    const deliveryType: number = Number(
      this.deliveryTermForm.controls.deliveryType.value
    );

    //если период «Календарные дни» или «Месяцы»
    if (
      deliveryType === ID_DELIVERY_TYPE.DAY ||
      deliveryType === ID_DELIVERY_TYPE.MONTH
    ) {
      const termConfig = this.deliveryTermType.find(
        (el) => Number(el.deliveryTermId) === deliveryType
      );

      const during: string = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'editOffer.during'
      );

      const isDay: boolean = deliveryType === ID_DELIVERY_TYPE.DAY;
      const values: number[] = isDay ? termConfig.dayValues : termConfig.monthValues;
      const unitKey: string = isDay ? 'editOffer.calendarDays' : 'editOffer.months';
      const unitLabel: string = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        unitKey
      );

      //формирование массива "В течение Х дней"/"В течение Х месяцев"
      for (const value of values) {
        this.deliveryTermValue.push({
          id: value,
          value: `${during} ${value} ${unitLabel}`,
        });
      }

      if (
        !this.deliveryTermForm.controls.deliveryTerm.value &&
        !this.isEditedDeliveryTerm
      ) {
        this.deliveryTermForm.controls.deliveryTerm.patchValue(
          this.fullInfo.deliveryPeriod.periodTypeValue
        );
      }

      this.deliveryTermValue.sort((a, b) => a.id - b.id); //сортировка по id
      if (this.deliveryTermValue.length === 1) {
        this.deliveryTermForm.controls.deliveryTerm.patchValue(
          this.deliveryTermValue[0].id
        );
        this.onCreateString();
      }
    }
  }

  private resetForm(): void {
    this.deliveryTermForm.get('startDate').setValue(null);
    this.deliveryTermForm.get('endDate').setValue(null);
    this.deliveryTermForm.get('deliveryTerm').reset();
    this.deliveryTermConcated = '';

    this.deadlineParamsReset.emit({
      deadlineDelivery: null,
      deadlinePayment: null,
    });
  }

  public onCreateString(): void {
    if (
      Number(this.deliveryTermForm.controls.startDelivery.value) ===
      ID_START_DELIVERY.NO_DELIVERY_START
    ) {
      //если начало поставки «Начало поставки не задано»
      if (this.deliveryTermForm.controls.endDate.value) {
        //проверка заполнение поля «Дата окончания поставки»
        this.getDeliveryTermConcated();
      }
    } else {
      //если начало поставки «С даты регистрации договора на бирже», «С даты начала поставки», «С даты поступления предоплаты»
      switch (Number(this.deliveryTermForm.controls.deliveryType.value)) {
        case ID_DELIVERY_TYPE.DAY:
        case ID_DELIVERY_TYPE.MONTH: {
          //если период «Календарные дни» или «Месяцы»
          if (this.deliveryTermForm.controls.deliveryTerm.value) {
            //проверка заполнение поля срок поставки
            Number(this.deliveryTermForm.controls.startDelivery.value) ===
              ID_START_DELIVERY.FROM_START_DATE_DELIVERY &&
            !this.deliveryTermForm.controls.startDate?.value
              ? null
              : this.getDeliveryTermConcated();

            const isDay: boolean =
              Number(this.deliveryTermForm.controls.deliveryType.value) ===
              ID_DELIVERY_TYPE.DAY;

            const isMonth: boolean =
              Number(this.deliveryTermForm.controls.deliveryType.value) ===
              ID_DELIVERY_TYPE.MONTH;

            const deliveryTerm: number =
              this.deliveryTermForm.controls.deliveryTerm.value ?? 0;

            const days: number = isDay ? deliveryTerm : 0;
            const months: number = isMonth ? deliveryTerm : 0;

            this.isDaysCountCorrect =
              this.submitCounterService.getDaysCount(
                this.deliveryTermForm.controls.startDate?.value,
                this.deliveryTermForm.controls.endDate?.value,
                days,
                months
              ) >= minDeliveryScheduleDaysCount;
          }
          break;
        }
        case ID_DELIVERY_TYPE.DATE: {
          //если Период "Дата"
          if (
            this.deliveryTermForm.controls.startDate?.value &&
            this.deliveryTermForm.controls.endDate?.value
          ) {
            //проверка заполнения полей «Дата начала поставки» и «Дата окончания поставки»
            this.getDeliveryTermConcated();

            this.isDaysCountCorrect =
              this.submitCounterService.getDaysCount(
                this.deliveryTermForm.controls.startDate?.value,
                this.deliveryTermForm.controls.endDate?.value,
                0,
                0
              ) >= minDeliveryScheduleDaysCount;
          }
          break;
        }
      }
    }

    if (this.isEditedDeliveryTerm) {
      if (this.isDaysCountCorrect) {
        this.adjustablePriceChange.emit({
          adjustablePrice:
            this.getValue(
              this.fullInfo.goods[0].goodsSpecifications,
              IdInterfaceField.adjustedPrice
            ) === 'true',
          isDisabledAdjustablePrice: false,
        });
      } else {
        this.adjustablePriceChange.emit({
          adjustablePrice: false,
          isDisabledAdjustablePrice: true,
        });
      }
    }
  }

  public getValue(
    goodsSpecifications: IGoodsSpecifications[],
    idInterfaceField: number
  ): string | number {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  private getDeliveryTermConcated(): void {
    this.submissionService
      .getDeliveryTermConcated(
        this.user?.token,
        Number(this.deliveryTermForm.controls.startDelivery.value),
        Number(this.deliveryTermForm.controls.deliveryType.value),
        this.deliveryTermForm.controls.deliveryTerm?.value,
        this.deliveryTermForm.controls.startDate?.value
          ? toOADate(this.deliveryTermForm.controls.startDate?.value)
          : null,
        this.deliveryTermForm.controls.endDate?.value
          ? toOADate(this.deliveryTermForm.controls.endDate?.value)
          : null
      )
      .subscribe((res: DeliveryTermConcatedResponse) => {
        this.deliveryTermConcated = upperCaseFirstLetter(res.result);

        this.deliveryTermConcatedChange.emit({
          deliveryTermConcated: this.deliveryTermConcated,
          formValue: this.deliveryTermForm.getRawValue(),
        });

        if (this.deliveryTermConcated != null) {
          this.tradingService.editDeliveryParams({
            concatedStringDeliveryTerm: this.deliveryTermConcated,
          });
        }
        //если открыто срок поставки, то смотрим открыт ли условия оплаты
        const hasDelivery: boolean = !!this.deliveryTermConcated;
        const hasPayment: boolean = !!this.paymentTermConcated;

        if (hasDelivery && (hasPayment || !this.changePaymentCondForm)) {
          this.deadlinesChanged.emit({
            formValue: this.deliveryTermForm.getRawValue(),
            deliveryTermConcated: this.deliveryTermConcated,
          });
        }
      });
  }

  public validateEndDate = (): number | Date => {
    return this.deliveryTermForm.controls.startDate.value;
  };

  public saveDeliveryPeriodForm(): void {
    this.save.emit({
      formValue: this.deliveryTermForm.getRawValue(),
    });
  }

  public closeDeliveryPeriodForm(): void {
    this.isEditedDeliveryTerm = false;
    this.deadlineErrorMessChange.emit('');
    this.deliveryTermForm.get('startDelivery').setValue(null);
    this.deliveryTermForm.get('deliveryType').setValue(null);
    this.deliveryTermForm.get('deliveryTerm').setValue(null);
    this.close.emit(false);
  }
}
