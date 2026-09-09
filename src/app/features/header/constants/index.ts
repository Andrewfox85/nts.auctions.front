import { REPORT_TYPES } from '../enums';

export const REPORT_TYPE_KEYS: Record<REPORT_TYPES, string> = {
  [REPORT_TYPES.TRADING_COURSE_FOR_MIA]: 'report-types.tradingCourseForMia',
  [REPORT_TYPES.TRANSACTIONS_FOR_MIA_MTD]: 'report-types.transactionsForMiaMtd',
  [REPORT_TYPES.BIDS_FOR_TRADING_SESSION]: 'report-types.bidsForTradingSession',
  [REPORT_TYPES.UNCONSUMED_AMOUNTS]: 'report-types.unconsumedAmounts',
  [REPORT_TYPES.TRADING_COURSE_FOR_EAC]: 'report-types.tradingCourseForEac',
  [REPORT_TYPES.SUPPLY_CATALOGUE]: 'report-types.supplyCatalogue',
  [REPORT_TYPES.DEMAND_CATALOGUE]: 'report-types.demandCatalogue',
  [REPORT_TYPES.OFFERS_MANAGEMENT]: 'report-types.offersManagement',
};

export const   LANGUAGE_ARRAY = [
  { name: 'РУС', value: 'RU' },
  { name: 'EN', value: 'EN' },
];

export const RU_LANG = 'ru';

export const SECONDS_IN_DAY: number = 86400;

export const SECONDS_IN_HOUR: number = 3600;

export const SECONDS: number = 60;
