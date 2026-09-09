import { ID_COMPOSITE_LOT_AVAILABILITY } from '@enums';

export interface ISession {
  sectionId: number;
  sectionName: string;
  sessionDatetime: number;
  sessionId: number;
  sessionName: string;
  sessionStageId: number;
  sessionStageName: string;
}

export interface ISessions {
  sessions: ISession[];
}

export interface Section {
  id: number;
  name: string;
}

export interface IReferences {
  id: number;
  name: string;
}

export interface IDisplaySession extends ISession {
  formattedTime: string;
}

export interface FilteredData {
  sessionsForDisplay: IDisplaySession[];
  sections: Section[];
  filterTab: number;
}

export interface TabItemClickEvent {
  itemIndex: number;
}

export interface ISessionLogin {
  isExistsViolations: boolean;
  idDirection: number | null;
}

export interface ISessionState {
  sessionStates: ISessionStateConfig[];
  warningMessage: string;
}

export interface ISessionStateConfig {
  sectionName: string;
  sectionNameEn: string;
  sessionName: string;
  sessionNameEn: string;
  datetimeBegin: number;
  sessionStageId: number;
  sessionStageName: string;
  sessionStageNameEn: string;
  sessionPeriod: string;
  sessionPeriodEn: string;
  isAdmissionFinished: boolean;
  isFinished: boolean;
  isPaused: boolean;
  isActive: boolean;
  datetimeRemaind: number;
  options: ISessionStateConfigOptions;
  idPricingType: number;
  idAuctionType: number;
  idSessionPeriod: number;
  admissionWas: boolean;
  isAllowedTargetedTransact: boolean;
  sessionStatusId: number;
  datetimeEnd: number;
  idDemoffActivationMode: number;
  isAllowedLocationGood: boolean;
  isAllowedAnalogues: boolean;
  idCompositeLotAvailability: ID_COMPOSITE_LOT_AVAILABILITY;
}

export interface ISessionStateConfigOptions {
  priceUpPoints: number;
  timeDemoff: number;
  timeBid: number;
  priceDownPoints: number;
  timeDowngrade: number;
}

export interface INsiGoodValues {
  idReference: number;
  isAllowAnalogs: boolean;
  listValues: null;
  referenceName?: string;
}
