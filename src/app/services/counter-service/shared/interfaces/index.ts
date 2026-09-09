export interface OfferCounterWorker {
  idOfferCounter: number;
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
  buyerConcatedFirmName: string;
  buyerIdClientContractType: number;
  buyerConcatedClientName: string;
  buyerBranchName: string;
  buyerTraderName: string;
  concatedDeletedClients: string;
}

export interface ListOfferCountersWorkerResponse {
  offerCounters: OfferCounterWorker[];
}

export interface DeliveryPeriod {
  idDeliveryMoment: number;
  idDeliveryType: number;
  periodTypeValue: number;
  dateBegin: number;
  dateEnd: number;
}

export interface DeliveryCond {
  idBasisLink: number;
  idBasisValue: number;
  idPlaceLink: number;
  idPlaceValue: number;
  placeDetails: string;
}

export interface PaymentCond {
  idPaymentType: number;
  idDayType: string;
  idShipmentVolume: number;
  firstPaymentMomentId: number;
  firstPercent: number;
  firstPeriodValueNumber: number;
  firstPeriodValueDate: number;
  secondPaymentMomentId: number;
  secondPercent: number;
  secondPeriodValueNumber: number;
  thirdPeriodValueNumber: number;
}

export interface AdditionalParams {
  deliveryPeriod: DeliveryPeriod;
  deliveryCond: DeliveryCond;
  paymentCond: PaymentCond;
}

export interface OfferCounter {
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
  additionalParams: AdditionalParams;
  concatedDeletedClients: string;
  counterNumber: number;
  goods: OfferGood[];
}

export interface ListOfferCountersResponse {
  offerCounters: OfferCounter[];
}

export interface OfferGood {
  idOfferCounter: number;
  idOfferGood: number;
  volume: number;
  priceWithoutVat: number;
  priceAdjustment: number;
  totalAmount: number;
}

export interface OfferCountersGoodsResponse {
goods: OfferGood[];
}

export interface OfferCounterDeleteBody {
  idOffer: number;
  idOfferCounter: number;
}

export interface DemandCounterWorker {
  idDemandCounter: number;
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
  buyerConcatedFirmName: string;
  buyerIdClientContractType: number;
  buyerConcatedClientName: string;
  buyerBranchName: string;
  buyerTraderName: string;
  concatedDeletedClients: string;
  vatPercent: number;
}

export interface ListDemandCountersWorkerResponse {
  demandCounters: DemandCounterWorker[];
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
  isPriceAdjusted: boolean;
  concatedDeliveryPeriod: string;
  concatedPaymentConditions: string;
  concatedDeliveryCondition: string;
  additionalParams: AdditionalParams;
  concatedDeletedClients: string;
  vatPercent: number;
  counterNumber: number;
  goods: DemandGood[];
  goodName: string;
}

export interface ListDemandCountersResponse {
  demandCounters: DemandCounter[];
}

export interface DemandGood {
  idDemandCounter: number;
  idDemandGood: number;
  volume: number;
  priceWithoutVat: number;
  priceAdjustment: number;
  totalAmount: number;
  amountVAT: number;
  values: Value[];
}

export interface DemandCountersGoodsResponse {
  goods: DemandGood[];
}

export interface DemandCounterDeleteBody {
  idDemand: number;
  idDemandCounter: number;
}

export interface AddToGeneralCatalogBody {
  idSection: number;
  idNomenclatureGroup: number;
  idGoodGroup: number;
  idGoodName: number;
  listProperty: number[];
  listClients?: number[];
  idModel: number;
}

export interface AddToGeneralCatalogResponse {
  idGood: number;
  isGoodWasReallyAdded: boolean;
}

export interface AnalogListResponse {
  analogues: Analogue[];
}

export interface Analogue {
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
  values: Value[];
}

export interface Value {
  idReference: number;
  nameReference: string;
  idValue: number;
  nameValue: string;
}

export interface DemandAnalogAcceptAndDeclineBody {
  idSection: number;
  idSession: number;
  idDemand: number;
  listGoodsAccepted: number[] | null;
  listGoodsDeclined: number[] | null;
}

export interface FilterAnalogsNameGoodResponse {
  goodNames: GoodNames[];
}

export interface GoodNames {
  id: number;
  name: string;
  idLink: number;
}

export interface FiltersReferencesTreeResponse {
  references: ReferenceItem[];
}

export interface ReferenceItem {
  rootLink: number;
  idLink: number;
  idLinkParent: number;
  idReference: number;
  referenceName: string;
  idValue: number;
  valueName: string;
  lvl: number;
}

export interface FiltersReferencesTreeBody {
  idSection: number;
  listLinks: number[];
  listPropertiesStr: number[] | null;
  listReferencesAdd: number[] | null;
}