export interface Options {
  priceUpPoints: null;
  timeDemoff: null;
  timeBid: null;
  priceDownPoints: null;
  timeDowngrade: null;
}

export interface SessionInfo {
  admissionWas: null | boolean;
  datetimeBegin: number;
  datetimeEnd: number;
  datetimeRemaind: null | number;
  idAuctionType: number;
  idPricingType: number;
  idSessionPeriod: number;
  isActive: boolean;
  isAdmissionFinished: boolean;
  isAllowedTargetedTransact: boolean;
  isAnaloguesBySpecialRules: boolean;
  isFinished: boolean;
  isPaused: boolean;
  options: Options;
  sectionId: string;
  sectionName: string;
  sessionId: string;
  sessionName: string;
  sessionPeriod: string;
  sessionStageId: number;
  sessionStageName: string;
  sessionStatusId: number;
}

export interface SessionIds {
  sectionId: string;
  sessionId: string;
}

export interface Deposit {
  clientId: number | null;
  clientNameShort: string | null;
  clientRegNumber: number | null;
  currencyId: number;
  currencyName: string;
  currencyPrecision: number;
  depositSumFreeCurr: number;
  depositSumFreeTotal: number;
  depositSumLockCurr: number;
  directionId: number;
  directionName: string;
  firmId: number;
  firmNameShort: string;
  firmRegNumber: string;
  isControlAllowedToChange: boolean;
  isControlDeposit: boolean;
}

export interface Body {
  idSection: string;
  idSession: string;
  idFirm?: number;
  idFirmClient?: number;
  isControlDeposit?: string;
  directionId?: number;
  isActive?: boolean;
}
