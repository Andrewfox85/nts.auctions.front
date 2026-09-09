import { STATUS_DOUMENTS } from '../enums';
import { ExportRequest } from '../../../shared/interfaces';
import { SECONDS_IN_DAY, SECONDS_IN_HOUR, SECONDS } from '../constants';

export function processStatusDocument(request: ExportRequest): STATUS_DOUMENTS {
  const hasExport = Boolean(request.dateExport);
  const hasFailure = Boolean(request.dateFailure);

  if (hasExport) return STATUS_DOUMENTS.DOWNLOAD;
  if (hasFailure) return STATUS_DOUMENTS.ERROR;
  return STATUS_DOUMENTS.IS_BEING_FORMED;
}

export function convertExcelDateToString(excelDate: number): string {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelEpoch.getTime() + excelDate * millisecondsPerDay);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}


export function formatTime(seconds: number): string {
  const days: number = Math.floor(seconds / SECONDS_IN_DAY);
  const hours: number = Math.floor((seconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
  const minutes: number = Math.floor(((seconds % SECONDS_IN_DAY) % SECONDS_IN_HOUR) / SECONDS);
  const secs: number = Math.floor(seconds % SECONDS);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

export function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

