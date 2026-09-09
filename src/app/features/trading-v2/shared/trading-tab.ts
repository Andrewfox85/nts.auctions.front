/**
 * Идентификаторы вкладок торгов v2 и утилиты проверки пути.
 */

/** Перечисление вкладок торгового shell v2. */
export enum TradingTab {
  TRADING = 'trading',
  OFFERS = 'offers',
  REGISTRATION = 'registration',
  TRADERS = 'traders',
  DEPOSIT = 'deposit',
  DEALS = 'deals',
  MESSAGES = 'messages',
  SETTING = 'setting',
}

/** Упорядоченный список путей child-маршрутов shell. */
export const TRADING_V2_TAB_PATHS: TradingTab[] = [
  TradingTab.TRADING,
  TradingTab.OFFERS,
  TradingTab.REGISTRATION,
  TradingTab.TRADERS,
  TradingTab.DEPOSIT,
  TradingTab.DEALS,
  TradingTab.MESSAGES,
  TradingTab.SETTING,
];

/** Вкладки, доступные к навигации с «Трейдеров». */
export type TradingTradersNavigationTargetTab =
  | TradingTab.OFFERS
  | TradingTab.REGISTRATION;

/** Проверяет, что значение — зарегистрированный путь вкладки v2. */
export function isTradingV2TabPath(value: TradingTab): boolean {
  return (TRADING_V2_TAB_PATHS).includes(value);
}
