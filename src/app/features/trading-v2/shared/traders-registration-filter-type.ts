/**
 * Типы фильтра регистраций на вкладке «Трейдеры».
 */

/** Варианты фильтра списка регистраций трейдеров. */
export enum TradersRegistrationFilterType {
  REGS_ACTIVE = 'regsActive',
  REGS_INACTIVE = 'regsInactive',
  REGS_DECLINED = 'regsDeclined',
}

const REGISTRATION_FILTER_TYPE_VALUES: string[] = Object.values(TradersRegistrationFilterType);

/** Проверяет, является ли строка допустимым значением фильтра регистраций. */
export function isTradersRegistrationFilterType(type: string): boolean {
  return REGISTRATION_FILTER_TYPE_VALUES.includes(type);
}
