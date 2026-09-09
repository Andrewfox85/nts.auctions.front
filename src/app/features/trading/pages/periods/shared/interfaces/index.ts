export interface BuceGetListOptions {
  idDemoffActivationMode: number;
  isTradingWithBuyersLimits: boolean | null;
  isTradingWithBuyersPurpose: boolean | null;
  isAnaloguesBySpecialRules: boolean | null;
}

export interface PeriodsScheduleOptions {
  priceDownPoints: null;
  priceUpPoints: null;
  timeBid: null;
  timeDemoff: null;
  timeDowngrade: null;
}

export interface PeriodsSchedule {
  canExtendFinished: boolean;
  datetimeFinish: number;
  datetimeRemaind: null;
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

export interface PeriodsSchedulesResponse {
  periodsSchedules: PeriodsSchedule[];
}
