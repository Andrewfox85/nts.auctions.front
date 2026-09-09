import {
  EXCEL_DATE_OFFSET_1900,
  SECONDS_IN_MINUTE,
  MINUTES_IN_HOUR,
  MS_IN_SECOND,
  HOURS_IN_DAY,
  ONE_MS,
} from '../constants';

export function convertExcelSerialDateToMs(excelDate: number): number {
  return (
    (excelDate - EXCEL_DATE_OFFSET_1900) *
      HOURS_IN_DAY *
      SECONDS_IN_MINUTE *
      MINUTES_IN_HOUR *
      MS_IN_SECOND +
    ONE_MS
  );
}
