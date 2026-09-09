export interface BranchesFirm {
  idFirmBranch: number;
  nameFull: string;
  nameShort: string;
}

export interface ListBranchesFirm {
  branchesFirms: BranchesFirm[];
  isBranchRequired: boolean;
}

export interface BranchClient {
  idFirmBranch: number;
  nameFull: string;
  nameShort: string;
}

export interface BranchClientsList {
  idClient: number;
  nameFull: string;
  nameShort: string;
  regNumber: string;
  idContractType: number;
  branchesClients: BranchClient[];
  regNumShortName: string;
  isBranchRequired: boolean;
}

export interface ListBranchesOfAllClientsResponse {
  branchesClients: BranchClientsList[];
}

export interface CheckBidderStatePayload {
  idSection: number;
  idSession: number;
  idOffer: number;
  idDemand: number;
  idContractType?: number;
  listClients?: number[];
  idBranch?: number;
}

export interface CheckBidderStateResponse {
  stateMessage: string;
  isResident: boolean;
  isNeedPurchasePurpose: boolean;
}

export interface TradingMakeBidPayload {
  idSection: number;
  idSession: number;
  idOffer?: number;
  idDemands?: number;
  buyerContractType?: number;
  buyerListClients?: number[];
  buyerIdBranch?: number;
  bidNumber: number;
  bidIdFinance?: number;
  bidIdCondition?: string;
  isMinPriceMainBasis?: boolean;
  bidListGoods?: number[];
  bidListDestination?: number[];
  bidIdPurchasePurpose?: number;
}

export interface Destination {
  idOfferGood: number;
  idDestination: number;
}

export interface LastBidInfoResponse {
  contractType: number;
  idBranch: number;
  idFinance: number;
  idCondition: string;
  isSelfCompetition: boolean;
  isTookParticipate: boolean;
  listClients: number[];
  destinations: Destination[];
  idPurchasePurpose: number;
}

export interface TradingRemovingleadBidPayload {
  idSection: number;
  idSession: number;
  idDemandOffer: number;
  idBid: number;
}

export interface TradingRemovingleadBidResponse {
  warningMessage: string;
}

export interface FinanceSource {
  id: number;
  name: string;
}

export interface TradingGetFinanceSourceResponse {
  financeSources: FinanceSource[];
}

export interface BidValue {
  idReference: number;
  nameReference: string;
  idValue: number;
  nameValue: string;
}

export interface Bid {
  idGood: number;
  idGroupNomenclature: number;
  nomenclatureGroup: string;
  idGroupGood: number;
  groupGood: string;
  idNameGood: number;
  nameGood: string;
  isMine: boolean;
  values: BidValue[];
}

export interface AnalogsBidsResponse {
  bids: Bid[];
}