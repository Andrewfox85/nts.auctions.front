export interface ICounterOffer {
  idOfferCounter: number;
  isMine: boolean;
  currencyName: string;
  currencyPrecision: number;
  totalAmount: number;
  goodUnitName: string;
  totalVolume: number;
  dateCreate: number;
  isPriceAdjusted: boolean;
  concatedDeliveryPeriod: string;
  concatedPaymentConditions: string;
  concatedDeliveryCondition: string;
  concatedDeletedClients: string | null;
  counterNumber: number;
  paymentConditionsMatch: boolean;
  deliveryPeriodMatch: boolean;
  totalAmountMatch: boolean;
  totalVolumeMatch: boolean;
  priceAdjustedMatch: boolean;
  deliveryConditionMatch: boolean;
  goods: ICounterOfferGood[];
  additionalParams: any | null;
  firmCounterUnique: number;
  goodName?: string;
  idDemandCounter: number;
  vatPercent?: number;
}

export interface IDemandCounterOffer
  extends Omit<ICounterOffer, 'idOfferCounter'> {
  idDemandCounter: number;
}
export interface ICounterOfferGood {
  idOfferCounter: number;
  idOfferGood: number;
  volume: number;
  priceWithoutVat: number;
  priceAdjustment: number;
  totalAmount: number;
  isExistDeclinedGoodInAnlg: boolean;
  idGood: number;
}

export type TCounterOffer = ICounterOffer | IDemandCounterOffer;