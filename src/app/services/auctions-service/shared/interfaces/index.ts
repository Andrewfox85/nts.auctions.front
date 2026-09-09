export interface DemandOffer {
  id: number;
  parentId: number;
  directionId: number;
  directionName: string;
  statusId: number;
  statusName: string;
  rejectionDate: number;
  rejectionDateString: string;
  rejectionReason: string;
  modelInfo: ModelInfo;
  goodInfo: GoodInfo;
  demandOfferInfo: DemandOfferInfo;
  priceParams: PriceParams;
  demoffOwner: DemandOfferOwner;
  goods: DemandOfferGood[];
  isCanCalculateDeposit: boolean;
  isWatched: boolean;
  isCanReject: boolean;
  isCanRestoreRejected: boolean;
  modelMarketTypes: string;
  isEditedInTrading: boolean;
  isExistCounterOffer: boolean;
  isIndividualPriceStepUsed: boolean;
}

export interface ModelInfo {
  id: number;
  isSupportMarketDomestic: boolean;
  isSupportMarketForeign: boolean;
  isSupportMarketExport: boolean;
  isSupportMarketImport: boolean;
}

export interface GoodInfo {
  isComposite: boolean;
  isMultibasis: boolean;
  isPriceAdjusted: boolean;
}

export interface DemandOfferInfo {
  lotNumber: number;
  conditionsPayment: string;
  conditionsDelivery: string;
  concatedConditionsDelivery: string;
  conditionsDeliveryPeriod: string;
}

export interface PriceParams {
  currencyName: string;
  currencyPrecision: number;
  idPriceAdjustment: number;
  vatPercent: number;
}

export interface DemandOfferOwner {
  clientContractType: number;
  concatedClientName: string;
  branchName: string;
  idFirm: number;
  concatedFirmName: string;
  idTrader: number;
  traderName: string;
}

export interface DemandOfferGood {
  idDemandOffer: number;
  idDemandOfferGood: number;
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGood: number;
  goodName: string;
  idGoodName: number;
  goodDescription: string;
  goodVolume: number;
  goodUnitName: string;
  priceWithoutVat: number;
  vatAmount: number;
  totalAmount: number;
  lotSummaryVolume: number;
  lotSummaryVolumeUnit: string;
  lotSummaryPriceWithoutVat: number;
  lotSummaryVatAmount: number;
  lotSummaryTotalAmount: number;
  dynamicFields: Record<string, string>;
  priceAdjustment: number;
  lotSummaryTotalStart: number;
}

export interface Field {
  fieldName: string;
  showName: string;
}

export interface DemandOfferResponse {
  demandOffers: DemandOffer[];
  fields: Field[];
  serverTime: number;
}

export interface GetListDemoffResponse {
  demandOffers: DemandOffer[];
  fields: Field[];
  serverTime: number;
}

export interface TradingUpdateMasterResponse {
  info: TradingUpdateInfo[];
  serverTime: number;
}

export interface TradingUpdateInfo {
  bidDateFinish: number;
  bidIsMyLeading: boolean;
  isExistCounterOffer: boolean;
  bidNumberOfBidders: number;
}

export interface BuceTradingListResponse {
  demandOffers: DemandOfferList[];
  fields: Field[];
  serverTime: number;
}

export interface GetTradingListResponse {
  demandOffers: DemandOfferList[];
  fields: Field[];
  serverTime: number;
}

export interface DemandOfferList {
  idDemandOffer: number;
  idDemandOfferParent: number;
  directionId: number;
  directionName: string;
  modelInfo: ModelInfo;
  goodInfo: GoodInfo;
  demandOfferInfo: DemandOfferInfo;
  priceParams: PriceParams;
  demoffOwner: DemandOfferOwner;
  goods: DemandOfferGood[];
  isCanCalculateDeposit: boolean;
  isWatched: boolean;
  isMine?: boolean;
  isCanReject: boolean;
  bidDateFinish: number;
  isEditedInTrading: boolean;
  isExistCounterOffer: boolean;
  isIndividualPriceStepUsed: boolean;
  bidNumberOfBidders: number;
  isAvailableAnalogList: boolean;
  isAllowAnalogs: boolean;
}
