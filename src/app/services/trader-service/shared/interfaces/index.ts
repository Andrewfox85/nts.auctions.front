interface INumberStats {
  numberActivated: number;
  numberInactive: number;
  numberDeclined: number;
}

export interface IParticipant {
  firmId: number;
  firmName: string;
  traderId: number;
  traderFullName: string;
  telephoneForSMS: string;
  email: string;
  loginDatetime: number;
  regsSale: INumberStats;
  regsBuy: INumberStats;
  demoffSale: INumberStats;
  demoffBuy: INumberStats;
  isWaitingForGiasSync: boolean;
}

export interface IGetListParticipantsResponse {
  participants: IParticipant[];
}

export interface IDirection {
  id: number;
  name: string;
}

export interface IGetTraderDirectionsResponse {
  directions: IDirection[];
}

export interface ITraderCastOutBody {
  idSection: number;
  idSession: number;
  idTrader: number;
  reasonText: string;
  isCastBuyerOut: boolean;
  isCastSellerOut: boolean;
}

export interface ITraderCastOutResponse {
  numberDeclinedRegistr: number;
  numberDeclinedDemoff: number;
  numberActiveRegistr: number;
  numberActiveDemoff: number;
}

interface ITrader {
  id: number;
  name: string;
}

export interface IGetListFirmTradersResponse {
  traders: ITrader[];
}

export interface ITraderChangeOwnerBody {
  idSection: number;
  idSession: number;
  idTraderFrom: number;
  idTraderTo: number;
}

export interface ITraderChangeOwnerResponse {
  numberDemoffTotalBuy: number;
  numberDemoffTransfBuy: number;
  numberDemoffTotalSell: number;
  numberDemoffTransfSell: number;
  numberRegsTotalBuy: number;
  numberRegsTransfBuy: number;
  numberRegsTotalSell: number;
  numberRegsTransfSell: number;
  logFilterSelected: string[];
  logPreprocessing: string[];
  logExecution: string[];
}

export interface IBuceTraderGetNumbersResponse {
  traderNumbers: [
    {
      regsSale: INumberStats;
      regsBuy: INumberStats;
      demoffSale: INumberStats;
      demoffBuy: INumberStats;
    }
  ];
}

export interface IBucePriceStepsBody {
  idSection: number;
  idSession: number;
  idDirection: number;
  idDemandOffer: number;
  listGoods: number[];
  listPrices: number[];
}

export interface IBucePeriodsUpdatePriceStepBody {
  idSection: number;
  idSession: number;
}
