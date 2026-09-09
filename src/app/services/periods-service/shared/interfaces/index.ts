export interface PeriodsSchedule {
  canExtendFinished: boolean;
  datetimeFinish: number;
  datetimeRemaind: number;
  datetimeStart: number;
  disableAutoStart: boolean;
  disableFinish: boolean;
  disableNext: boolean;
  disablePause: boolean;
  disableStart: boolean;
  idPeriodSchedule: number;
  isActive: boolean;
  isAutomaticStart: boolean;
  isFinished: boolean;
  isPaused: boolean;
  isTechnicalPeriod: boolean;
  nextPeriodName: string;
  periodDuration: number;
  periodId: number;
  periodName: string;
  options: PeriodsScheduleOptions;
}

export interface PeriodsScheduleOptions {
  priceDownPoints: number;
  priceUpPoints: number;
  timeBid: number;
  timeDemoff: number;
  timeDowngrade: number;
}

export interface PeriodsSchedulesResponse {
  periodsSchedules: PeriodsSchedule[];
}

export interface AvailablePeriod {
  periodId: number;
  periodName: string;
  isTechnicalPeriod: boolean;
  duration: number;
}

export interface AvailablePeriodsResponse {
  availablePeriods: AvailablePeriod[];
}

export interface AvailableOption {
  id: number;
  name: string;
  defaultValue: number;
}

export interface AvailableOptionsResponse {
  availableOptions: AvailableOption[];
}

export interface PeriodsAddPayload {
  idSection: number;
  idSession: number;
  idSessionPeriod: number;
  isAutomaticStart?: boolean;
  periodDuration?: number;
  listTradingOptions?: number[];
  listOptionValues?: number[];
}

export interface PeriodsEditPayload {
  idSection: number;
  idSession: number;
  idPeriodSchedule: number;
  isAutomaticStart?: boolean;
  periodDuration?: number;
  listTradingOptions?: number[];
  listOptionValues?: number[];
}

export interface PeriodsDeletePayoload {
  idSection: number;
  idSession: number;
}

export interface PeriodsStartPayoload {
  idSection: number;
  idSession: number;
}

export interface PeriodsPausePayload {
  idSection: number;
  idSession: number;
}

export interface PeriodsFinishPayload {
  idSection: number;
  idSession: number;
  isFixTransactions?: boolean;
}

export interface PeriodsExtendPayload {
  idSection: number;
  idSession: number;
  extraDuration: number;
}

export interface PeriodsExtendFinishedPayload {
  idSection: number;
  idSession: number;
  extraDuration: number;
}

export interface PeriodsEditoAutoStartPayoload {
  idSection: number;
  idSession: number;
  idPeriodSchedule: number;
  isAutomaticStart?: boolean;
}

export interface PeriodsEditOptionPayload {
  idSection: number;
  idSession: number;
  idTradingOption: number;
  optionValue: number;
}

export interface ManageDetailsResponse {
  permissions: Permissions[];
}

export interface Permissions {
  permissionTotal: number;
  permissionUsed: number;
  limitationsTotal: number;
}
