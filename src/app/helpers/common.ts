import { ERROR_MESSAGES } from './../shared/constants/api.constants';

export const getErrorMessageByCode = (
  errorCode: number,
  lang: string
): string | null => {
  const messages = ERROR_MESSAGES[errorCode];
  return messages ? messages[lang] || null : null;
};

export const setPrecision = (value: number, precisionValue: number): string => {
  return Number(value).toLocaleString('ru', {
    minimumFractionDigits: precisionValue,
    maximumFractionDigits: precisionValue,
  });
}