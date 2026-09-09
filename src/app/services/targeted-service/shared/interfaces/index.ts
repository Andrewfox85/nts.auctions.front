export interface TargetedOffer {
  idOffer: number;
  statusId: number;
  statusName: string;
  rejectionDate: number;
  rejectionDateString: string;
  rejectionReason: string;
  modelInfo: ModelInfo;
  goodInfo: GoodInfo;
  offerInfo: OfferInfo;
  priceParams: PriceParams;
  offerOwner: OfferOwner;
  offerBuyer: OfferBuyer;
  goods: Good[];
  isCanCalculateDeposit: boolean;
  isWatched: boolean;
  modelMarketTypes: string;
  isMine: boolean;
  isUnreliableSeller: boolean;
  isUnreliableBuyer: boolean;
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

export interface OfferInfo {
  lotNumber: number;
  conditionsPayment: string;
  conditionsDelivery: string;
  concatedConditionsDelivery: string;
  conditionsDeliveryPeriod: string;
}

export interface PriceParams {
  currencyName: string;
  currencyPrecision: number;
  vatPercent: number;
}

export interface OfferOwner {
  sellerContractTypeId: number;
  sellerConcatedClientName: string;
  sellerBranchName: string;
  sellerFirmId: number;
  sellerConcatedFirmName: string;
  sellerIdTrader: number;
  sellerTraderName: string;
}

export interface OfferBuyer {
  buyerContractTypeId: number;
  buyerConcatedClientName: string;
  buyerBranchName: string;
  buyerFirmId: number;
  buyerConcatedFirmName: string;
}

export interface Good {
  idOffer: number;
  idOfferGood: number;
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
  lotSummaryTotalStart: number;
}

export interface Field {
  fieldName: string;
  showName: string;
}

export interface TargetedOfferResponse {
  offers: TargetedOffer[];
  fields: Field[];
}

export interface GeneralInfo {
  idOffer: number;
  dateCreate: number;
  statusId: number;
  statusName: string;
  idModel: number;
  lotNumber: number;
  idDeliveryScheduleType: number;
  detailsImportDomestic: string;
  detailsExportForeign: string;
  concatedDeliveryPeriod: string;
  concatedPaymentConditions: string;
  rejectionReason: string;
  pricingTypeId: number;
  isAllowedFilesPrivate: boolean;
  isAllowedFilesPublic: boolean;
  concatedMarketTypes: string;
  isWatched: boolean;
  isCanCalculateDeposit: boolean;
  isMinPriceMainBasis: boolean;
  buyerInfo: BuyerInfo;
  sellerInfo: SellerInfo;
  isMine: boolean;
  idOfferBasedOn: number;
  idOfferGoodMain: number;
}

export interface BuyerInfo {
  idFirm: number;
  concatedFirmName: string;
  idClientContractType: number;
  concatedClientName: string;
  branchName: string;
  clientId: number;
  branchId: number;
}

export interface SellerInfo {
  firmName: string;
  branchId: number;
  branchName: string;
  idClientContractType: number;
  clientId: number;
  clientName: string;
  traderFullName: string;
  traderTelephone: string;
  traderEmail: string;
  firmId: number;
}

export interface GoodItem {
  goodValues: GoodValue[];
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGoodName: number;
  idGood: number;
  goodName: string;
  goodDescription: string;
  goodsSpecifications: GoodSpecification[];
  properties: GoodProperty[];
  unitId: number;
  unitName: string;
}

export interface GoodValue {
  idReference: number;
  referenceName: string;
  listValues: ValueItem[];
  isAllowAnalogs: boolean;
}

export interface ValueItem {
  idValue: number;
  valueName: string;
}

export interface GoodSpecification {
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

export interface DeliveryScope {
  idDemandOffer: number;
  idDemandOfferGood: number;
  idFirmClient: number;
  volume: number;
  firmClientName: string;
}

export interface DeliveryScopeGrades {
  idDemandOffer: number;
  idFirmClient: number;
  firmClientName: string;
  volume: number;
}

export interface DeliverySchedulePeriod {
  idDemandOffer: number;
  idDemandOfferGood: number;
  periodDateBegin: number;
  periodDateEnd: number;
  periodVolume: number;
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
  concatedCondition: string;
}

export interface DeliveryPeriod {
  idDemandOffer: number;
  idDeliveryMoment: number;
  idDeliveryType: number;
  periodTypeValue: number;
  dateBegin: number;
  dateEnd: number;
}

export interface PaymentCondition {
  idDemandOffer: number;
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

export interface DocumentItem {
  idDemandOffer: number;
  idDocument: number;
  filename: string;
  uploadDate: number;
  isPrivate: boolean;
}

export interface TargetedOfferFullInfoResponse {
  serverTime: number;
  generalInfo: GeneralInfo;
  goods: GoodItem[];
  deliveryScopes: DeliveryScope[];
  delivSchPeriods: DeliverySchedulePeriod[];
  deliveryConditions: DeliveryCondition[];
  deliveryPeriod: DeliveryPeriod;
  paymentCond: PaymentCondition;
  documents: DocumentItem[];
}

export interface DepositBody {
  idSection: string;
  idSession: string;
  idFirm?: number;
  idFirmClient?: number;
  isControlDeposit?: string;
  directionId?: number;
  isActive?: boolean;
}

export interface WatchedBody {
  idSection: number;
  idSession: number;
  idOffer: number;
}

export interface OffersDeleteBody {
  idSection: number;
  idSession: number;
  idOffer: number;
}

export interface OffersCheckedBody {
  idSection: number;
  idSession: number;
  listOffers: number[];
}

export interface OffersResponse {
  numberProcessed: number;
}

export interface OffersRejectBody {
  idSection: number;
  idSession: number;
  listOffers: number[];
  rejectionText: string;
}

export interface OffersRestoreBody {
  idSection: number;
  idSession: number;
  idOffer: number;
}

export interface OptionItem {
  isExistOptionsDifference: boolean;
  buyerOptions: PartyOptions;
  sellerOptions: PartyOptions;
}

export interface PartyOptions {
  isControlViolations: boolean;
  isControlDeposit: boolean;
  isLockDeposit: boolean;
  isBySpecialRules: boolean;
}

export interface OffersOptionsResponse {
  options: OptionItem[];
}

export interface OffersApproveBody {
  idSection: number;
  idSession: number;
  isBuyerControlViolations: boolean;
  isBuyerControlDeposit: boolean;
  isBuyerLockDeposit: boolean;
  isSellerControlViolations: boolean;
  isSellerControlDeposit: boolean;
  isSellerLockDeposit: boolean;
}

export interface OffersApproveResponse {
  numberTotal: number;
  numberProcessed: number;
}
export interface CommonVolumes {
  volumes: CommonVolume[];
}

export interface CommonVolume {
  volumeAvailable: number;
  volumeRemaining: number;
  nameUnit: string;
}

export interface QuotePositionVolumes {
  volumes: QuoteVolume[];
  fields: Field[];
}

export interface QuoteVolume {
  volumeAvailable: number;
  volumeRemaining: number;
  nameUnit: string;
  namePayment: string;
  nameBasis: string;
  nameClarification: string;
  namePlace: string;
  dynamicFields: Record<string, string>;
}

export interface TimberVolumeResponse {
  typeVolumeControl: number;
  commonVolumes: CommonVolumes;
  quotePosVolumes: QuotePositionVolumes;
}
