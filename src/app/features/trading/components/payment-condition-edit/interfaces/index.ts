export interface IDeadlineParamsReset {
  deadlineDelivery: number;
  deadlinePayment: number;
}

export interface ITermsConditionsPayment {
  dayTypeId: string[];
  delayMomentId: string;
  paymentConditionId: string;
  paymentVolumeId: string;
  prepayMomentId: string;
}

export interface IDayTypePaymentConfig {
  id: string;
  name: string;
  description: string;
}

export interface IPaymentCondition {
  id: string;
  name: string;
  volumes: IPaymentVolume[];
}

export interface IPaymentVolume {
  id: string;
  name: string;
  delayValue: string;
  prepayValue: string;
  delayMoments: IMomentDetail[];
  prepayMoments: IMomentDetail[];
}

export interface IMomentDetail {
  id: string;
  name: string;
  termHint: string;
  delayMoments: IMomentDetail[];
  options: IMomentOptions;
}

export interface IMomentOptions {
  date: boolean ;
  dayOfMonth: boolean;
  applicableDayCount: boolean;
}

export interface ITermsPaymentForm {
  termsPayment: string;
  volume: string;
  prepaymentAmount: number;
  momentPrepayment: string;
  prepaymentPeriod: string ;
  prepaymentPeriodNumber: number;
  prepaymentPeriodDate: Date | number;
  defermentAmount: number;
  momentDelay: string;
  defermentPeriodNumber: number;
  defermentPeriodDate: Date | number;
  defermentAmount2: number;
  momentDelay2: string;
  defermentPeriod2: string;
  dayTypeId: string[];
}

export interface IOutputEvent {
  formValue: ITermsPaymentForm;
  paymentTermConcated?: string;
  conditionSecondStage?: boolean;
}

export interface ISessionIds {
  sectionId: string;
  sessionId: string;
}