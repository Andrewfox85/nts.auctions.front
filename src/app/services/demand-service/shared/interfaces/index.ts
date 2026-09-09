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
  owner: DemandOfferOwner;
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

export interface DemandOfferList {
  idDemandOffer: number;
  idDemandOfferParent: number;
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
  owner: DemandOfferOwner;
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
}
export interface DemandOfferListResponse {
  demandsOffers: DemandOfferList[];
  fields: Field[];
}

export interface GetListDemoffResponse {
  demandOffers: DemandOffer[];
  fields: Field[];
}

export interface WatchedAddRequest {
  idSection: number;
  idSession: number;
  idDirection: number;
  idDemandOffer: number;
}

export interface WatchedDeleteRequest {
  idSection: number;
  idSession: number;
  idDemandOffer: number;
}

export interface DemandOfferWatchedAddRequest {
  idSection: number;
  idSession: number;
  idDirection: number;
  idDemandOffer: number;
}

export interface DemandOfferWatchedDeleteRequest {
  idSection: number;
  idSession: number;
  idDemandOffer: number;
}

export interface DemandsOffersRejectRequest {
  idDirection: number;
  idSection: number;
  idSession: number;
  listDemandsOffers: number[];
  rejectionText: string;
}

export interface DemandsOffersRejectResponse {
  isSuccessful: boolean;
  rejectedCount: number;
  failureCount: number;
  listFailures: {
    id: number;
    reason: string;
  }[];
}

export interface RestoreRejectedDemandOfferRequest {
  idDirection: number;
  idSection: number;
  idSession: number;
  idDemandOffer: number;
  isControlViolations: boolean;
  isControlDeposit: boolean;
  isLockDeposit: boolean;
}

export interface TradingUpdateDetailsResponse {
  goodDetails: GoodDetail[];
}

export interface GoodDetail {
  idDemandOfferGood: number;
  priceParams: PriceParams;
  summaryLot: SummaryLot;
}

export interface PriceParams {
  priceWithoutVat: number;
  priceAdjustment: number;
  vatAmount: number;
  totalAmount: number;
}

export interface SummaryLot {
  lotSummaryPriceWithoutVat: number;
  lotSummaryVatAmount: number;
  lotSummaryTotalAmount: number;
  lotSummaryTotalStart: number;
}

export interface OptSetActiveModeBody {
  idSection: number;
  idSession: number;
  activeMode: number;
}

export interface GeneralInfo {
  idDemandOffer: number;
  idDemandOfferParent: number;
  dateCreate: number;
  directionId: number;
  directionName: string;
  statusId: number;
  statusName: string;
  idModel: number;
  firmName: string;
  branchId: number;
  branchName: string;
  idClientContractType: number;
  clientId: number;
  clientName: string;
  lotNumber: number;
  idDeliveryScheduleType: number;
  detailsImportDomestic: string;
  detailsExportForeign: string;
  concatedDeliveryPeriod: string;
  concatedPaymentConditions: string;
  rejectionReason: string;
  isCanReject: boolean;
  isCanRestoreRejected: boolean;
  pricingTypeId: number;
  isAllowedFilesPrivate: boolean;
  isAllowedFilesPublic: boolean;
  concatedMarketTypes: string;
  isWatched: boolean;
  isCanCalculateDeposit: boolean;
  traderFullName: string;
  traderTelephone: string;
  traderEmail: string;
  bidDateFinish: number;
  bidIsMyLeading: boolean;
  isCombinedMarketTypes: boolean;
  bidNumber: number;
  bidId: number;
  isMinPriceMainBasis: boolean;
  isInactiveByPriceCorridor: boolean;
  isInactiveByPriceQuotate: boolean;
  isInactiveByUnreliable: boolean;
  isExistCounterOffer: boolean;
  buyerInfo: BuyerInfo;
  isIndividualPriceStepUsed: boolean;
  purchasePurpose: string;
}

export interface BuyerInfo {
  idFirm: number;
  concatedFirmName: string;
  idClientContractType: number;
  concatedClientName: string;
  branchName: string;
  idTrader: number;
  traderName: string;
  traderTelephone: string;
  traderEmail: string;
}

export interface Good {
  goodValues: GoodValue[];
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGoodName: number;
  idGood: number;
  goodName: string;
  goodDescription: string;
  goodsSpecifications: GoodsSpecification[];
  properties: GoodProperty[];
  unitId: number;
  unitName: string;
}

export interface GoodValue {
  idReference: number;
  referenceName: string;
  listValues: ReferenceValue[];
  isAllowAnalogs: boolean;
}

export interface ReferenceValue {
  idValue: number;
  valueName: string;
}

export interface GoodsSpecification {
  idDemandOfferGood: number;
  idInterfaceField: number;
  fieldValueNumber: number;
  fieldValueString: string;
  fieldName: string;
  fieldPrecision: number;
  controlFieldType: string;
  fieldValue: string;
  blockId: number;
  isVirtual: boolean;
}

export interface GoodProperty {
  propertyName: string;
  propertyValue: string;
}

export interface DeliveryCondition {
  idDemandOffer: number;
  idDemandOfferGood: number;
  isMain: boolean;
  idBasisLink: number;
  idBasisValue: number;
  idPlaceLink: number;
  idPlaceValue: number;
  placeName: string;
  placeDetails: string;
  priceWithoutVat: number;
  priceAdjustment: number;
  concatedCondition: string;
  priceCorridorLeftBound: number;
  priceCorridorRightBound: number;
  priceStartWithoutVat: number;
  priceStartAdjustment: number;
  minPriceWithoutVat: number;
}

export interface OfferFullInfoResponse {
  serverTime: number;
  generalInfo: GeneralInfo;
  goods: Good[];
  deliveryConditions: DeliveryCondition[];
  deliveryPeriod: DeliveryPeriodDemand;
  paymentCond: PaymentCondDemand;
  documents: Documents[];
}

export interface PaymentCondDemand {
  idDemandOffer: number;
  idPaymentType: number;
  idDayType: string | null;
  idShipmentVolume: number;
  firstPaymentMomentId: number;
  firstPercent: number;
  firstPeriodValueNumber: number | null;
  firstPeriodValueDate: number | null;
  secondPaymentMomentId: number;
  secondPercent: number;
  secondPeriodValueNumber: number | null;
  thirdPeriodValueNumber: number | null;
}

export interface DeliveryPeriodDemand {
  idDemandOffer: number;
  idDeliveryMoment: number;
  idDeliveryType: number;
  periodTypeValue: number;
  dateBegin: number | null;
  dateEnd: number | null;
}

export interface Documents {
  idDemandOffer: number;
  idDocument: number;
  filename: string;
  uploadDate: number;
  isPrivate: boolean;
}
export interface EditOfferBody {
  currentOffer: OfferDetails;
  remainsOffer: OfferDetails;
}

export interface OfferDetails {
  idDirection: number;
  idSection: number;
  setDemandOffer: SetDemandOffer;
  goods: OfferGood[];
  payCondFull: PayCondFull;
  paymentPart: PaymentPart;
  deliveryPeriod: DeliveryPeriod;
  delivConditions: DeliveryCondition[];
  delivScope: DeliveryScope[];
  delivSchPeriods: DeliverySchedulePeriod[];
  idVatPercent: number;
  idVatQuote: number;
  rules: OfferRules;
}

export interface SetDemandOffer {
  idDemandOffer: number;
  idSession: number;
  idModel: number;
  idFirmClient: number;
  idClientContractType: number;
  idBranch: number;
  idCurrency: number;
  vatPercent: number;
  idPriceAdjustment: number;
  isPriceAdjusted: boolean;
  idFinance: number;
  detailsImportDomestic: string;
  detailsExportForeign: string;
  listDeletedDocuments: number[];
  idDeliveryScheduleType: number;
}

export interface OfferGood {
  idGood: number;
  idGoodFromFront: number;
  nsiGoodValues: NsiGoodValue[];
  idGoodName: number;
  idGoodGroup: number;
  idNomenclature: number;
  properties?: GoodPropertyValue[];
  priceWithoutVat?: number;
  priceAdjustment?: number;
  volume?: number;
  periodVolume?: number;
  minPriceWithoutVat?: number;
  locationService?: number;
}

export interface GoodPropertyValue {
  idInterfaceField: number;
  fieldValueNumber: number;
  fieldValueString: string;
  listFieldValues?: number[] | string;
}

export interface PayCondFull {
  idPaymentType: number;
  idDayType: string;
  idShipmentVolume: number;
  idPaymentMoment: number;
  periodValueNumber: number;
  periodValueDate: number;
}

export interface PaymentPart {
  idDayType: string;
  idShipmentVolume: number;
  idPaymentMomentPrepay: number;
  firstPercent: number;
  firstPeriodValueNumber: number;
  idPaymentMomentDelay: number;
  secondPercent: number;
  secondPeriodValueNumber: number;
  thirdPeriodValueNumber: number;
}

export interface DeliveryPeriod {
  idDeliveryMoment: number;
  idPeriodType: number;
  periodTypeValue: number;
  dateBegin: number;
  dateEnd: number;
}

export interface OfferDeliveryCondition {
  goods: OfferGood[];
  isMain: boolean;
  idBasisLink: number;
  idBasisValue: number;
  idPlaceLink: number;
  idPlaceValue: number;
  placeDetails: string;
}

export interface DeliveryScope {
  goods: OfferGood[];
  idFirmClient: number;
}

export interface DeliverySchedulePeriod {
  goods: OfferGood[];
  periodDateBegin: number;
  periodDateEnd: number;
  idPeriod: number;
}

export interface DeliverySchedulePeriodGraded {
  periodDateBegin: number;
  periodDateEnd: number;
  idPeriod: number;
  periodVolume: number;
}

export interface OfferRules {
  model: string;
  modelId: number;
  values: string;
  sessionsParams: string;
  generalParams: string;
  demandParams: string;
}

export interface EditDemandBody {
  currentDemand: DemandDetails;
  remainsDemand: DemandDetails;
}
export interface DemandDetails {
  idDirection: number;
  idSection: number;
  setDemandOffer: SetDemandOffer;
  goods: DemandGood[];
  payCondFull: PayCondFull;
  paymentPart: PaymentPart;
  deliveryPeriod: DeliveryPeriod;
  delivConditions: DemandDeliveryCondition[];
  delivScope: DemandDeliveryScope[];
  delivSchPeriods: DemandSchedulePeriod[];
  idVatPercent: number;
  idVatQuote: number;
  rules: OfferRules;
}

export interface DemandGood {
  idGood: number;
  idGoodFromFront: number;
  nsiGoodValues: NsiGoodValue[];
  idGoodName: number;
  idGoodGroup: number;
  idNomenclature: number;
  minPriceWithoutVat: number;
  locationService: number;
  properties?: GoodProperty[];
  priceWithoutVat?: number;
  priceAdjustment?: number;
  volume?: number;
  periodVolume?: number;
}

export interface DemandDeliveryCondition {
  goods: DemandGood[];
  isMain: boolean;
  idBasisLink: number;
  idBasisValue: number;
  idPlaceLink: number;
  idPlaceValue: number;
  placeDetails: string;
}

export interface DemandDeliveryScope {
  goods: DemandGood[];
  idFirmClient: number;
}

export interface DemandSchedulePeriod {
  goods: DemandGood[];
  periodDateBegin: number;
  periodDateEnd: number;
  idPeriod: number;
}

export interface SetDemandOffer {
  idDemandOffer: number;
  idSession: number;
  idModel: number;
  idFirmClient: number;
  idClientContractType: number;
  idBranch: number;
  idCurrency: number;
  vatPercent: number;
  idPriceAdjustment: number;
  isPriceAdjusted: boolean;
  idFinance: number;
  detailsImportDomestic: string;
  detailsExportForeign: string;
  listDeletedDocuments: number[];
  idDeliveryScheduleType: number;
}

export interface NsiGoodValue {
  idReference: number;
  listValues: number[];
  isAllowAnalogs: boolean;
}
export interface EditOfferDemandResponse {
  idDemandOfferCurrent: number;
  lotNumberCurrent: number;
  idDemandOfferRemains: number;
  lotNumberRemains: number;
}

export interface OfferBiddingProcessResponse {
  offerBiddingProcess: OfferBiddingItem[];
}

export interface OfferBiddingItem {
  idOffer: number;
  idFirm: number;
  dateTimeActivate: number;
  dateTimeDeActivate: number;
  nameOffer: string;
  statusName: string;
  descriptionExtended: string;
  concatedNameFirm: string;
  nameClientContractType: string;
  concatedNameFirmClient: string;
  nameBranch: string;
  traderFio: string;
  maklerFio: string;
  isSystemForming: boolean;
  nameCurrency: string;
  nameUnit: string;
  priceWithoutVat: number;
  priceAdjustment: number;
  vatAmount: number;
  vatPercent: number;
  totalVolume: number;
  totalAmount: number;
  lotGoodsNumber: number;
  lotGoodsBasisesNumber: number;
  concatedDeliveryPeriodRu: string;
  concatedPaymentConditionsRu: string;
  concatedDeliveryConditionRu: string;
  isDiffPaymentConditions: boolean;
  isDiffDeliveryPeriod: boolean;
  isDiffDeliveryConditions: boolean;
  isDiffCurrency: boolean;
  isDiffVolume: boolean;
  diffPriceTrend: number;
  isCounterBid: boolean;
  transactionNumber: string;
  nameFinanceSources: string;
  directionName: string;
  nameSessionPeriod: string;
  isEditedTransaction: boolean;
  transactionWithRestoration: number;
}

export interface DemandBiddingProcessResponse {
  demandBiddingProcess: DemandBiddingItem[];
}

export interface DemandBiddingItem {
  idDemand: number;
  idFirm: number;
  dateTimeActivate: number;
  dateTimeDeActivate: number;
  nameDemand: string;
  statusName: string;
  descriptionExtended: string;
  concatedNameFirm: string;
  nameClientContractType: string;
  concatedNameFirmClient: string;
  nameBranch: string;
  traderFio: string;
  maklerFio: string;
  isSystemForming: boolean;
  nameCurrency: string;
  nameUnit: string;
  priceWithoutVat: number;
  priceAdjustment: number;
  vatAmount: number;
  vatPercent: number;
  totalVolume: number;
  totalAmount: number;
  lotGoodsNumber: number;
  lotGoodsBasisesNumber: number;
  concatedDeliveryPeriodRu: string;
  concatedPaymentConditionsRu: string;
  concatedDeliveryConditionRu: string;
  isDiffPaymentConditions: boolean;
  isDiffDeliveryPeriod: boolean;
  isDiffDeliveryConditions: boolean;
  isDiffCurrency: boolean;
  isDiffVolume: boolean;
  diffPriceTrend: number;
  isCounterBid: boolean;
  transactionNumber: string;
  nameFinanceSources: string;
  directionName: string;
  nameSessionPeriod: string;
  isEditedTransaction: boolean;
  transactionWithRestoration: number;
  goodDescriptionBrief: string;
}
export interface OptSetAnalogRulesBody {
  idSection: number;
  idSession: number;
  isActive: boolean;
}

export interface IAnalogProperty {
  idProperty: number;
  idValue: number;
  propertyName: string;
  propertyValue: string;
}
export interface IAnalogGood {
  idCatalogGood: number;
  idGoodName: number;
  goodName: string;
  properties: IAnalogProperty[];
}
export interface IAnalogGoodsResponse {
  goods: IAnalogGood[];
}
