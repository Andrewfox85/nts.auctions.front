export interface IDeadlineParamsReset {
  deadlineDelivery: number;
  deadlinePayment: number;
}

export interface IDeliveryPeriodForm {
  startDelivery: string;
  deliveryType: string;
  deliveryTerm: number;
  startDate: number | Date;
  endDate: number | Date;
}

export interface IOutputDeliveryPeriodEvent {
  formValue: IDeliveryPeriodForm;
  deliveryTermConcated?: string;
}

export interface IAdjustablePriceOutput {
  adjustablePrice: boolean;
  isDisabledAdjustablePrice: boolean;
}

export interface IUniqueDeliveryTerm {
    deliveryStartId: string;
    deliveryTermId: string;
    dayValues: number[];
    monthValues: number[];
    startDeliveryDate: string;
    endDeliveryDate: string;
    deliveryStartName: string;
    deliveryTermName: string;
    endDeliveryDateValue: string;
    startDeliveryDateValue: string;
}

export interface IDeliveryTermValue {
  id: number;
  value: string;
}