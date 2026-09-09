import { IParticipant } from '@services';
import { NewTabType } from '../enums';

export interface INewTabData extends IParticipant {
  type: NewTabType;
  status: string | number;
  direction: number;
}
export interface TransactionData {
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
  exchangeFeeInfo: ExchangeFeeInfo;
  dateTerminate: number;
  terminationReason: string;
  idOffer: number;
  goods: GoodDetails[];
  mainName: string;
  names: string[];
  desc: string[];
  vol: string[];
  units: string[];
  prices: string[];
  amountVAT: string[];
  totalAmount: string[];
  place: (string | null)[];
}

interface TransactionInfo {
  transactionNumber: string;
  transactionDatetime: number;
  isGovernmentPurchase: boolean;
}
interface ModelInfo {
  idModel: number;
  modelMarketTypes: string;
  isSupportMarketDomestic: boolean;
  isSupportMarketForeign: boolean;
  isSupportMarketExport: boolean;
  isSupportMarketImport: boolean;
}
interface GoodInfo {
  isComposite: boolean;
  isMultibasis: boolean;
  isPriceAdjusted: boolean;
}
interface DemandOfferInfo {
  lotNumber: number;
  conditionsPayment: string;
  conditionsDelivery: string;
  conditionsDeliveryPeriod: string;
}
interface PriceParams {
  currencyName: string;
  currencyPrecision: number;
  idPriceAdjustment: null | number;
  vatPercent: number;
}

interface SummaryLot {
  summaryVolume: number;
  summaryVolumeUnit: string;
  summaryPriceWithoutVat: number;
}

interface BuyerInfo {
  buyerIsUnreliable: boolean;
  buyerIdFirm: number;
  buyerConcatedFirmName: string;
  buyerIdClientContractType: null | number;
  buyerConcatedClientName: null | string;
  buyerBranchName: null | string;
  buyerIdTrader: number;
  buyerTraderName: string;
}
interface SellerInfo {
  sellerIsUnreliable: boolean;
  sellerIdFirm: number;
  sellerConcatedFirmName: string;
  sellerIdClientContractType: null | number;
  sellerConcatedClientName: null | string;
  sellerBranchName: null | string;
  sellerIdTrader: number;
  sellerTraderName: string;
}

interface ExchangeFeeInfo {
  exchFeeBuyerPercent: number;
  exchFeeBuyerTotalAmount: number;
  exchFeeBuyerCurrencyName: string;
  exchFeeBuyerCurrencyPrec: number;
  exchFeeSellerPercent: number;
  exchFeeSellerTotalAmount: number;
  exchFeeSellerCurrencyName: string;
  exchFeeSellerCurrencyPrec: number;
}

export interface GoodDetails {
  idTransaction: number;
  idDemandOffer: number;
  idGood: number;
  goodNomenclatureGroupName: string;
  goodGroupName: string;
  goodInfo: {
    goodName: string;
    goodDescription: string;
    goodVolume: number;
    goodUnitName: string;
    goodLocation: null | string;
  };
  priceParams: {
    priceWithoutVat: number;
    priceAdjustment: null | number;
    vatAmount: number;
    totalAmount: number;
  };
  summaryLot: {
    summaryVatAmount: number;
    summaryTotalAmount: number;
  };
  exchangeFeeInfo: {
    exchFeeBuyerTotalAmount: number;
    exchFeeBuyerRateDetails: string;
    exchFeeBuyerCurrencyName: string;
    exchFeeBuyerCurrencyPrec: number;
    exchFeeSellerTotalAmount: number;
    exchFeeSellerRateDetails: string;
    exchFeeSellerCurrencyName: string;
    exchFeeSellerCurrencyPrec: number;
  };
}
