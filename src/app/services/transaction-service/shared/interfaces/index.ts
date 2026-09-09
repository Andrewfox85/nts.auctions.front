export interface Transaction {
  idTransaction: number;
  isWatched: boolean;
  transactionInfo: TransactionInfo;
  modelInfo: ModelInfo;
  goodInfo: GoodInfo;
  demandOfferInfo: DemandOfferInfo;
  priceParams: PriceParams;
  summaryLot: SummaryLot;
  buyerInfo: BuyerInfo;
  sellerInfo: SellerInfo;
  dateTerminate: number;
  terminationReason: string;
}

export interface TransactionInfo {
  transactionNumber: string;
  transactionDatetime: number;
  isGovernmentPurchase: boolean;
}

export interface ModelInfo {
  idModel: number;
  modelMarketTypes: string;
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
  conditionsDeliveryPeriod: string;
}

export interface PriceParams {
  currencyName: string;
  currencyPrecision: number;
  idPriceAdjustment: number;
  vatPercent: number;
}

export interface SummaryLot {
  summaryVolume: number;
  summaryVolumeUnit: string;
  summaryPriceWithoutVat: number;
}

export interface BuyerInfo {
  buyerIsUnreliable?: boolean;
  buyerIdFirm: number;
  buyerConcatedFirmName: string;
  buyerIdClientContractType: number;
  buyerConcatedClientName: string;
  buyerBranchName: string;
  buyerIdTrader: number;
  buyerTraderName: string;
}

export interface SellerInfo {
  sellerIsUnreliable?: boolean;
  sellerIdFirm: number;
  sellerConcatedFirmName: string;
  sellerIdClientContractType: number;
  sellerConcatedClientName: string;
  sellerBranchName: string;
  sellerIdTrader: number;
  sellerTraderName: string;
}

export interface ExchangeFeeInfo {
  exchFeeBuyerPercent: number;
  exchFeeBuyerTotalAmount: number;
  exchFeeBuyerCurrencyName: string;
  exchFeeBuyerCurrencyPrec: number;
  exchFeeSellerPercent: number;
  exchFeeSellerTotalAmount: number;
  exchFeeSellerCurrencyName: string;
  exchFeeSellerCurrencyPrec: number;
}

export interface TransactionWorker extends Transaction {
  exchangeFeeInfo: ExchangeFeeInfo;
  idOffer: number;
}

export interface TransactionListWorkerResponse {
  transactions: TransactionWorker[];
}

export interface TransactionListResponse {
  transactions: Transaction[];
}

export interface Good {
  idTransaction: number;
  idDemandOffer: number;
  idGood: number;
  goodNomenclatureGroupName: string;
  goodGroupName: string;
  goodInfo: GoodListInfo;
  priceParams: PriceGoodsParams;
  summaryLot: SummaryGoodLot;
  exchangeFeeInfo?: ExchangeFeeGoodInfo;
}

export interface GoodListInfo {
  goodName: string;
  goodDescription: string;
  goodVolume: number;
  goodUnitName: string;
}

export interface PriceGoodsParams {
  priceWithoutVat: number;
  priceAdjustment: number;
  vatAmount: number;
  totalAmount: number;
}

export interface SummaryGoodLot {
  summaryVatAmount: number;
  summaryTotalAmount: number;
}

export interface ExchangeFeeGoodInfo {
  exchFeeBuyerTotalAmount: number;
  exchFeeBuyerRateDetails: string;
  exchFeeBuyerCurrencyName: string;
  exchFeeBuyerCurrencyPrec: number;
  exchFeeSellerTotalAmount: number;
  exchFeeSellerRateDetails: string;
  exchFeeSellerCurrencyName: string;
  exchFeeSellerCurrencyPrec: number;
}

export interface GoodWorker extends Good {
  exchangeFeeInfo: ExchangeFeeGoodInfo;
}

export interface TransactionGoodsListWorkerResponse {
  goods: GoodWorker[];
}

export interface TransactionGoodsListResponse {
  goods: Good[];
}

export interface SetTransactionsBody {
  idSection: number;
  idSession: number;
}

export interface SetTransactionsResponse {
  numberTransactions: number;
}

export interface UpdateExchFeeBody {
  idSection: number;
  idSession: number;
  idTransaction?: number;
}

export interface TransactionGeneral {
  idTransaction: number;
  idDemandOffer: number;
  idModel: number;
  isWatched: boolean;
  transactionInfo: TransactionInfo;
  goodInfo: GeneralGoodInfo;
  transactionCond: TransactionConditions;
  priceParams: GeneralPriceParams;
  buyerInfo: GeneralBuyerInfo;
  sellerInfo: GeneralSellerInfo;
  exchangeFeeInfo: ExchangeFeeInfo;
  pricingTypeId: number;
  isAllowedFilesPrivate: boolean;
  isAllowedFilesPublic: boolean;
  concatedMarketTypes: string;
  dateTerminate: number;
  terminationReason: string;
  currencyId: number;
}

export interface GeneralBuyerInfo {
  buyerIsUnreliable: boolean;
  buyerIdFirm: number;
  buyerConcatedFirmName: string;
  buyerIdClientContractType: number;
  buyerConcatedClientName: string;
  buyerBranchName: string;
  buyerIdTrader: number;
  buyerTraderName: string;
  buyerTraderTelephone: string;
  buyerTraderEmail: string;
}

export interface GeneralSellerInfo {
  sellerIsUnreliable: boolean;
  sellerIdFirm: number;
  sellerConcatedFirmName: string;
  sellerIdClientContractType: number;
  sellerConcatedClientName: string;
  sellerBranchName: string;
  sellerIdTrader: number;
  sellerTraderName: string;
  sellerTraderTelephone: string;
  sellerTraderEmail: string;
}

export interface TransactionInfo {
  transactionNumber: string;
  transactionDatetime: number;
  modelMarketTypes: string;
  transactionMarketType: string;
  financeSource: string;
}

export interface GeneralGoodInfo {
  lotNumber: number;
  isComposite: boolean;
}

export interface TransactionConditions {
  conditionsPayment: string;
  conditionsDelivery: string;
  conditionsDeliveryPeriod: string;
  transactionDetails: string;
  idDeliveryScheduleType: number;
}

export interface GeneralPriceParams {
  currencyName: string;
  currencyPrecision: number;
  isPriceAdjusted: boolean;
  idPriceAdjustment: number;
  vatPercent: number;
}

export interface GeneralGood {
  goodValues: GoodReference[];
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

export interface GoodReference {
  idReference: number;
  referenceName: string;
  listValues: ReferenceValue[];
  isAllowAnalogs: boolean;
}

export interface ReferenceValue {
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
  idDemandOfferGood: number;
  idFirmClient: number;
  firmClientName: string;
  volume: number;
}

export interface DeliverySchedulePeriod {
  idDemandOfferGood: number;
  periodDateBegin: number;
  periodDateEnd: number;
  periodVolume: number;
}

export interface Document {
  idDocument: number;
  filename: string;
  uploadDate: number;
  isPrivate: boolean;
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
}

export interface TransactionFullInfoResponse {
  transactionGeneral: TransactionGeneral;
  goods: GeneralGood[];
  deliveryScopes: DeliveryScope[];
  delivSchPeriods: DeliverySchedulePeriod[];
  documents: Document[];
  deliveryConditions: DeliveryCondition[];
}

export interface DocumentResponse {
  content: string;
  fileName: string;
}

export interface TransactionTerminateBody {
  idSection: number;
  idSession: number;
  idTransaction: number;
  terminationReason: string;
  isNeedReinstate: boolean;
  isByCurrentPrice: boolean;
}

export interface TransactionRestoreBody {
  idSection: number;
  idSession: number;
  idTransaction: number;
}

export interface TransactStat {
  unitName: string;
  transactionNumber: number;
  exchFeeBuyerTotalAmount: number;
  exchFeeSellerTotalAmount: number;
}

export interface TransactStatsResponse {
  transactStats: TransactStat[];
}

export interface Seller {
  idFirmClient: number;
  concatedNameFirmClient: string;
  idBranch: number;
  nameBranch: string;
}

export interface FirmClient {
  idFirmClient: number;
  concatedNameFirmClient: string;
  idBranch: number;
  nameBranch: string;
}

export type TransactionEditType = 'buyersList' | 'sellersList';

export type EntityTransactionEditResponse = Record<
  TransactionEditType,
  FirmClient[]
>;

export interface TransactionEditCommon {
  idSection: number;
  idSession: number;
  idTransaction: number;
  textReason: string;
}

export interface TransactionEditBuyer extends TransactionEditCommon {
  buyerIdClientNew: number;
  buyerIdBranchNew?: number;
}

export interface TransactionEditSeller extends TransactionEditCommon {
  sellerIdClientNew: number;
  sellerIdBranchNew?: number;
  vatPercent: number;
}

export interface TransactionEditBuyerForm {
  buyerIdClientNew: number | null;
  buyerIdBranchNew?: number | null;
  textReason: string | null;
}

export interface TransactionEditSellerForm  {
  sellerIdClientNew: number | null;
  sellerIdBranchNew?: number | null;
  vatPercent: number | null;
  textReason: string | null;
}
