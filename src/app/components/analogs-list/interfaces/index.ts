export interface DynamicColumns {
    caption: string;
    dataField: string;
}

export interface DynamicColumns {
    caption: string;
    dataField: string;
}

export interface DemandCounter {
    idDemandCounter: number;
    isMine: boolean;
    currencyName: string;
    currencyPrecision: number;
    totalAmount: number;
    goodUnitName: string;
    totalVolume: number;
    dateCreate: number;
    isPriceAdjusted: boolean | null;
    concatedDeliveryPeriod: string;
    concatedPaymentConditions: string;
    concatedDeliveryCondition: string;
    concatedDeletedClients: string | null;
    vatPercent: number;
    idVatPercent: number;
    idCurrency: number;
    counterNumber: number;
    currencyMatch: boolean;
    vatMatch: boolean;
    paymentConditionsMatch: boolean;
    deliveryPeriodMatch: boolean;
    totalAmountMatch: boolean;
    totalVolumeMatch: boolean;
    priceAdjustedMatch: boolean;
    deliveryConditionMatch: boolean;
    additionalParams: AdditionalParams;
    goods: DemandGood[];
  }
  
  export interface AdditionalParams {
    deliveryPeriod: DeliveryPeriod;
    deliveryCond: DeliveryCondition;
    paymentCond: PaymentCondition;
  }
  
  export interface DeliveryPeriod {
    idDeliveryMoment: number;
    idDeliveryType: number;
    periodTypeValue: number;
    dateBegin: number;
    dateEnd: number | null;
  }
  
  export interface DeliveryCondition {
    idBasisLink: number;
    idBasisValue: number;
    idPlaceLink: number;
    idPlaceValue: number;
    placeDetails: string | null;
  }
  
  export interface PaymentCondition {
    idPaymentType: number;
    idDayType: number | null;
    idShipmentVolume: number;
    firstPaymentMomentId: number;
    firstPercent: number;
    firstPeriodValueNumber?: number | null;
    firstPeriodValueDate: number;
    secondPaymentMomentId?: number | null;
    secondPercent?: number | null;
    secondPeriodValueNumber?: number | null;
    thirdPeriodValueNumber?: number | null;
  }

  export interface DemandGood {
    idDemandCounter: number;
    idDemandGood: number;
    volume: number;
    priceWithoutVat: number;
    priceAdjustment: number;
    totalAmount: number;
    idGood: number;
    values: GoodValue[];
  }

  export interface GoodValue {
    idReference: number;
    nameReference: string;
    idValue: number;
    nameValue: string;
    valueMatch?: boolean;
  }

  export interface ReferenceValue {
    idReference: number;
    nameReference: string;
    idValue: number;
  }  
  export interface AnalogListItem {
    idGood: number;
    idGroupNomenclature: number;
    nomenclatureGroup: string;
    idGroupGood: number;
    groupGood: string;
    idNameGood: number;
    nameGood: string;
    idStatus: number;
    isExistByDemand: boolean;
    isExistByCounter: boolean;
    isMine: boolean;
    admission: boolean;
    changed: boolean;
    needToSave: boolean;
    values: ReferenceValue[];
  }
  
  export type DynamicAttributes = Record<string, string>;
  
  export type AnalogList = AnalogListItem & DynamicAttributes;

  
  