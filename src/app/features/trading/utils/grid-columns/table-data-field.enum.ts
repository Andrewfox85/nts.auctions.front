/**
 * Единый набор dataField колонок гридов trading: auctions / offers / deals.
 * Динамические поля (`{{ i.fieldName }}`) сюда не входят.
 */
export enum TableDataField {
  // common / goods
  MainName = 'mainName',
  Names = 'names',
  Desc = 'desc',
  Vol = 'vol',
  Units = 'units',
  Amendment = 'amendment',
  Quotation = 'quotation',
  Prices = 'prices',
  AmountVAT = 'amountVAT',
  TotalAmount = 'totalAmount',
  PriceParamsCurrencyName = 'priceParams.currencyName',
  PriceParamsVatPercent = 'priceParams.vatPercent',
  IsAllowAnalogs = 'isAllowAnalogs',
  PriceSteps = 'priceSteps',

  // demand offer
  DemandOfferInfoBidDateFinish = 'demandOfferInfo.bidDateFinish',
  DemandOfferInfoLotNumber = 'demandOfferInfo.lotNumber',
  DemandOfferInfoConditionsDelivery = 'demandOfferInfo.conditionsDelivery',
  DemandOfferInfoConditionsDeliveryPeriod = 'demandOfferInfo.conditionsDeliveryPeriod',
  DemandOfferInfoConditionsPayment = 'demandOfferInfo.conditionsPayment',

  // offer (offers page)
  OfferInfoLotNumber = 'offerInfo.lotNumber',
  OfferInfoConditionsDelivery = 'offerInfo.conditionsDelivery',
  OfferInfoConditionsDeliveryPeriod = 'offerInfo.conditionsDeliveryPeriod',
  OfferInfoConditionsPayment = 'offerInfo.conditionsPayment',
  DirectionName = 'directionName',
  StatusName = 'statusName',
  ModelMarketTypes = 'modelMarketTypes',
  RejectionDateString = 'rejectionDateString',
  RejectionReason = 'rejectionReason',

  // demoff owner (auctions / offers)
  DemoffOwnerConcatedFirmName = 'demoffOwner.concatedFirmName',
  DemoffOwnerClientContractType = 'demoffOwner.clientContractType',
  DemoffOwnerConcatedClientName = 'demoffOwner.concatedClientName',
  DemoffOwnerBranchName = 'demoffOwner.branchName',
  DemoffOwnerTraderName = 'demoffOwner.traderName',

  // offer owner / buyer (offers)
  OfferOwnerSellerConcatedFirmName = 'offerOwner.sellerConcatedFirmName',
  OfferOwnerSellerContractTypeId = 'offerOwner.sellerContractTypeId',
  OfferOwnerSellerConcatedClientName = 'offerOwner.sellerConcatedClientName',
  OfferOwnerSellerBranchName = 'offerOwner.sellerBranchName',
  OfferOwnerSellerTraderName = 'offerOwner.sellerTraderName',
  OfferBuyerBuyerConcatedFirmName = 'offerBuyer.buyerConcatedFirmName',
  OfferBuyerBuyerContractTypeId = 'offerBuyer.buyerContractTypeId',
  OfferBuyerBuyerConcatedClientName = 'offerBuyer.buyerConcatedClientName',
  OfferBuyerBuyerBranchName = 'offerBuyer.buyerBranchName',

  // auctions / offers goods summary
  GoodsLotSummaryVolume = 'goods[0].lotSummaryVolume',
  GoodsLotSummaryVatAmount = 'goods[0].lotSummaryVatAmount',
  GoodsLotSummaryTotalAmount = 'goods[0].lotSummaryTotalAmount',
  LotSummaryTotalStart = 'lotSummaryTotalStart',

  // deals
  TransactionInfoTransactionNumber = 'transactionInfo.transactionNumber',
  TransactionInfoTransactionDatetime = 'transactionInfo.transactionDatetime',
  SummaryLotSummaryVolume = 'summaryLot.summaryVolume',
  GoodsSummaryLotSummaryTotalAmount = 'goods[0].summaryLot.summaryTotalAmount',
  ModelInfoModelMarketTypes = 'modelInfo.modelMarketTypes',
  Place = 'place',
  DateTerminate = 'dateTerminate',
  TerminationReason = 'terminationReason',
  SellerInfoSellerConcatedFirmName = 'sellerInfo.sellerConcatedFirmName',
  SellerInfoSellerIdClientContractType = 'sellerInfo.sellerIdClientContractType',
  SellerInfoSellerConcatedClientName = 'sellerInfo.sellerConcatedClientName',
  SellerInfoSellerBranchName = 'sellerInfo.sellerBranchName',
  SellerInfoSellerTraderName = 'sellerInfo.sellerTraderName',
  BuyerInfoBuyerConcatedFirmName = 'buyerInfo.buyerConcatedFirmName',
  BuyerInfoBuyerIdClientContractType = 'buyerInfo.buyerIdClientContractType',
  BuyerInfoBuyerConcatedClientName = 'buyerInfo.buyerConcatedClientName',
  BuyerInfoBuyerBranchName = 'buyerInfo.buyerBranchName',
  BuyerInfoBuyerTraderName = 'buyerInfo.buyerTraderName',
  ExchangeFeeInfoExchFeeSellerRateDetails = 'exchangeFeeInfo.exchFeeSellerRateDetails',
  ExchangeFeeInfoExchFeeSellerTotalAmount = 'exchangeFeeInfo.exchFeeSellerTotalAmount',
  ExchangeFeeInfoExchFeeBuyerRateDetails = 'exchangeFeeInfo.exchFeeBuyerRateDetails',
  ExchangeFeeInfoExchFeeBuyerTotalAmount = 'exchangeFeeInfo.exchFeeBuyerTotalAmount',
}
