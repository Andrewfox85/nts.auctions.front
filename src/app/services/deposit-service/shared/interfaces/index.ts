export interface SessionDepositInfo {
  clientId: number;
  clientRegNumber: string;
  clientNameShort: string;
  depositSumFreeTotal: number;
  depositSumFreeCurr: number;
  depositSumLockCurr: number;
  currencyId: number;
  currencyName: string;
  currencyPrecision: number;
  isControlDeposit: boolean;
  isMaxDepositPayed: boolean;
  firmId: number;
  firmRegNumber: string;
  firmNameShort: string;
}

export interface Deposit {
  clientId: number;
  clientRegNumber: string;
  clientNameShort: string;
  depositSumFreeTotal: number;
  depositSumFreeCurr: number;
  depositSumLockCurr: number;
  currencyId: number;
  currencyName: string;
  currencyPrecision: number;
  isControlDeposit: boolean;
  isMaxDepositPayed: boolean;
}

export interface DepositDetail {
  firmRegNumber: string;
  firmNameShort: string;
  clientRegNumber: string;
  clientNameShort: string;
  depositSumFree: number;
  depositSumCalc: number;
  currencyName: string;
  currencyPrecision: number;
  currencyId: number;
}

export interface SessionDepositListResponse {
  deposits: SessionDepositInfo[];
}

export interface GetListDepositResponse {
  deposits: Deposit[];
}

export interface ChangeDepositControlRequest {
  idSection: number;
  idSession: number;
  idFirm: number;
  idFirmClient: number;
  isControlDeposit: boolean;
}

export interface GetDepositDetailsResponse {
  demoffDetails: DepositDetail[];
}
