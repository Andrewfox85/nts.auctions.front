import { Injectable } from '@angular/core';
import { toOADate } from '@helpers';
import {
  termsConditionsPaymentConst,
  timberTicket,
  DEFAULT_DEFERMENT_PERIOD_NUMBER_2,
  AgreementType,
  role
} from '@constants';
import {
  DeliveryPeriod,
  PayCondFull,
  PaymentPart,
  DeliveryPeriodDemand,
  PaymentCondDemand,
} from './demand-service/shared/interfaces/index';
import { ITermsPaymentForm } from './../features/trading/components/payment-condition-edit/interfaces/index';
import { ID_DELIVERY_TYPE } from '@enums';
import moment from 'moment';
import { IDeliveryPeriodForm } from './../features/trading/components/delivery-period-edit/interfaces/index';
import { FormGroup } from '@angular/forms';
import { BranchesFirm } from './bid-service/shared/interfaces/index';

export interface ParticipantData {
  IdFirmClient: number | null;
  IdBranch: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class SubmitCounterService {
  //-----------------формирование информации о продавце/покупателе для отправки----------------------//

  public buildParticipantData(
    form: FormGroup,
    currentListBranch: BranchesFirm[]
  ): ParticipantData {
    return {
      IdFirmClient: this.buildFirmClient(form),
      IdBranch: this.buildBranch(form, currentListBranch),
    };
  }

  private buildFirmClient(form: FormGroup): number | null {
    if (form.get('participant')?.value !== role.broker) {
      return null;
    }

    if (form.get('contractType')?.value === AgreementType.Commission) {
      return null;
    }

    if (form.get('contractType')?.value === AgreementType.Agency) {
      return form.get('brokerClient')?.value;
    }

    return null;
  }

  private buildBranch(
    form: FormGroup,
    listBranch: BranchesFirm[]
  ): number | null {
    if (form.get('participant')?.value === role.visitor) {
      //регистрация со струкрутным была отклонена (ранее этим структурным подалась встречка)
      if (
        form.get('listBranch')?.value &&
        (!listBranch || listBranch.length === 0)
      ) {
        return null;
      }

      return form.get('listBranch')?.value;
    }

    if (form.get('contractType')?.value === AgreementType.Agency) {
      return form.get('listClientBranch')?.value;
    }

    return null;
  }

  //-----------------формирование срока поставки для отправки----------------------//

  public buildDeliveryPeriod(
    changeDeliveryPeriodForm: boolean,
    deliveryTermForm: IDeliveryPeriodForm,
    deliveryPeriod: DeliveryPeriodDemand
  ) {
    return changeDeliveryPeriodForm && deliveryTermForm
      ? this.buildFromForm(deliveryTermForm)
      : this.buildFromInfo(deliveryPeriod);
  }

  private buildFromForm(deliveryTermForm: IDeliveryPeriodForm): DeliveryPeriod {
    return {
      idDeliveryMoment: Number(deliveryTermForm?.startDelivery),
      idPeriodType: Number(deliveryTermForm?.deliveryType),
      periodTypeValue: deliveryTermForm?.deliveryTerm,
      dateBegin: deliveryTermForm?.startDate
        ? toOADate(deliveryTermForm?.startDate)
        : null,
      dateEnd: deliveryTermForm?.endDate
        ? toOADate(deliveryTermForm?.endDate)
        : null,
    };
  }

  private buildFromInfo(deliveryPeriod: DeliveryPeriodDemand): DeliveryPeriod {
    return {
      idDeliveryMoment: deliveryPeriod.idDeliveryMoment,
      idPeriodType: deliveryPeriod.idDeliveryType,
      periodTypeValue: deliveryPeriod.periodTypeValue,
      dateBegin: deliveryPeriod.dateBegin,
      dateEnd: deliveryPeriod.dateEnd,
    };
  }

  //-----------формирование условий оплаты для отправки------//
  public buildPaymentConditions(
    changePaymentCondForm: boolean,
    termsPaymentForm: ITermsPaymentForm,
    paymentCond: PaymentCondDemand
  ) {
    const source =
      changePaymentCondForm && termsPaymentForm
        ? this.getPaymentFormValues(termsPaymentForm)
        : this.getPaymentInfoValues(paymentCond);

    const isPartialPrepayment =
      Number(source.idPaymentType) ===
      termsConditionsPaymentConst.partialPrepayment;

    return {
      payCondFullObj: !isPartialPrepayment
        ? this.buildFullPaymentObject(source)
        : null,

      paymentPartObj: isPartialPrepayment
        ? this.buildPartialPaymentObject(source)
        : null,
    };
  }

  private buildFullPaymentObject(source: any): PayCondFull {
    const isDeferment =
      Number(source.idPaymentType) ===
      termsConditionsPaymentConst.paymentDeferment;

    const isPrepaymentMoment =
      Number(source.idPaymentType) ===
        termsConditionsPaymentConst.prepayment100 ||
      Number(source.idPaymentType) ===
        termsConditionsPaymentConst.paymentThroughExchange;

    let idPaymentMoment: number;

    const dateSource: number = !isDeferment
      ? source.prepaymentPeriodDate
      : source.defermentPeriodDate;

    let periodValueDate: number;

    if (source.idPaymentMoment) {  //из заявки
      idPaymentMoment = Number(source.idPaymentMoment);
      periodValueDate = dateSource;
    } else {                     //инфа из заполненной формы
      idPaymentMoment = Number(
        isPrepaymentMoment ? source.momentPrepayment : source.momentDelay
      );
      periodValueDate = this.getPeriodDate(dateSource);
    }

    return {
      idPaymentType: Number(source.idPaymentType),
      idDayType: source.idDayType || null,
      idShipmentVolume: Number(source.idShipmentVolume),
      idPaymentMoment: idPaymentMoment,
      periodValueNumber: !isDeferment
        ? source.prepaymentPeriodNumber || null
        : source.defermentPeriodNumber || null,
      periodValueDate: periodValueDate,
    };
  }

  private buildPartialPaymentObject(source: any): PaymentPart {
    const isTimberTicket = Number(source.momentPrepayment) === timberTicket;

    return {
      idDayType: source.idDayType || null,
      idShipmentVolume: source.idShipmentVolume,
      idPaymentMomentPrepay: source.momentPrepayment,
      firstPercent: source.prepaymentAmount,
      firstPeriodValueNumber: !isTimberTicket
        ? source.prepaymentPeriodNumber
        : null,
      idPaymentMomentDelay: source.momentDelay,
      secondPercent: source.defermentAmount,
      secondPeriodValueNumber: source.defermentPeriodNumber || null,
      thirdPeriodValueNumber:
        isTimberTicket &&
        source.prepaymentAmount < DEFAULT_DEFERMENT_PERIOD_NUMBER_2
          ? source.defermentPeriod2
          : null,
    };
  }

  private getPeriodDate(date: number): number | null {
    return date ? toOADate(date) : null;
  }

  private getPaymentFormValues(termsPaymentForm: ITermsPaymentForm) {
    return {
      idPaymentType: termsPaymentForm.termsPayment,
      idDayType: termsPaymentForm.dayTypeId,
      idShipmentVolume: termsPaymentForm.volume,
      momentPrepayment: termsPaymentForm.momentPrepayment,
      momentDelay: termsPaymentForm.momentDelay,
      prepaymentPeriodNumber: termsPaymentForm.prepaymentPeriodNumber,
      defermentPeriodNumber: termsPaymentForm.defermentPeriodNumber,
      prepaymentPeriodDate: termsPaymentForm.prepaymentPeriodDate,
      defermentPeriodDate: termsPaymentForm.defermentPeriodDate,
      prepaymentAmount: termsPaymentForm.prepaymentAmount,
      defermentAmount: termsPaymentForm.defermentAmount,
      defermentPeriod2: termsPaymentForm.defermentPeriod2,
    };
  }

  private getPaymentInfoValues(paymentCond: PaymentCondDemand) {
    return {
      idPaymentType: paymentCond.idPaymentType,
      idDayType: paymentCond.idDayType,
      idShipmentVolume: paymentCond.idShipmentVolume,
      momentPrepayment: paymentCond.firstPaymentMomentId,
      momentDelay: paymentCond.secondPaymentMomentId,
      prepaymentPeriodNumber: paymentCond.firstPeriodValueNumber,
      defermentPeriodNumber: paymentCond.secondPeriodValueNumber || paymentCond.firstPeriodValueNumber,
      prepaymentPeriodDate: paymentCond.firstPeriodValueDate,
      defermentPeriodDate: paymentCond.firstPeriodValueDate,
      prepaymentAmount: paymentCond.firstPercent,
      defermentAmount: paymentCond.secondPercent,
      defermentPeriod2: paymentCond.thirdPeriodValueNumber,
      idPaymentMoment: paymentCond.firstPaymentMomentId, //специально возвращаем idPaymentMoment, чтобы был признак того, что данные берутся не из формы, а из самой заявки
    };
  }

  // Получить расчетный период в днях (период вида <дата начала>-<дата окончания> --> дни; месяцы --> дни;)
  public getDaysCount(
    startDate,
    endDate,
    daysCnt: number,
    monthCnt: number
  ): number {
    let daysCounter = 0;

    let _startDate = null;
    let _endDate = null;

    let _deliveryTermType = 0;

    if (daysCnt > 0) {
      _deliveryTermType = ID_DELIVERY_TYPE.DAY; // на вход пришел период в днях (ничего делать не будем - вренем обратно)
    } else if (monthCnt > 0) {
      _deliveryTermType = ID_DELIVERY_TYPE.MONTH; // на вход пришел период в месяцах
    } else if (startDate != null && endDate != null) {
      _deliveryTermType = ID_DELIVERY_TYPE.DATE; // на вход пришел период вида <Дата начала>-<Дата окончания>
    }

    switch (_deliveryTermType) {
      //календарные дни
      case ID_DELIVERY_TYPE.DAY:
        if (daysCnt > 0) {
          daysCounter = daysCnt;
        }
        break;
      // месяцы
      case ID_DELIVERY_TYPE.MONTH:
        if (startDate != null && monthCnt > 0) {
          _startDate = moment.unix(startDate / 1000).format('DD-MM-YYYY');

          let a = moment(_startDate, 'DD-MM-YYYY');
          let b = moment(a).add(monthCnt, 'M');

          daysCounter = b.diff(a, 'days');
        }
        break;
      //дата
      case ID_DELIVERY_TYPE.DATE:
        if (startDate != null && endDate != null) {
          _startDate = moment.unix(startDate / 1000).format('DD-MM-YYYY');
          _endDate = moment.unix(endDate / 1000).format('DD-MM-YYYY');

          daysCounter = moment(_endDate, 'DD-MM-YYYY').diff(
            moment(_startDate, 'DD-MM-YYYY'),
            'days'
          );
        }
        break;
    }

    return daysCounter;
  }
}
