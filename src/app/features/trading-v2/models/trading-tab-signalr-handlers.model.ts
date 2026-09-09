/**
 * Обработчики SignalR, регистрируемые страницами вкладок торгов v2.
 */

/** Обработчики вкладки «Заявки». */
export interface OffersSignalrHandlers {
  getUpdateDataSource?(data: unknown): void;
  getDemandsOffersTradingUpdateStatus?(data: unknown): void;
  getUpdateOffer?(data: unknown): void;
  getUpdateDemands?(data: unknown): void;
  getAddLots?(data: unknown): void;
  updateOfferStatus?(data: unknown): void;
  getUpdateDataSourceDirect?(data: unknown): void;
  getOffersTargetedExclude?(data: unknown): void;
  getDirectData?(): void;
}

/** Обработчики вкладки «Торги». */
export interface AuctionsSignalrHandlers {
  getDemandsOffersTradingUpdateStatus?(data: unknown): void;
  getDemandsOffersTradingReinstate?(data: unknown): void;
  getDemandsOffersTradingExclude?(data: unknown): void;
}

/** Обработчики вкладки «Трейдеры». */
export interface TradersSignalrHandlers {
  getUpdateDataSource?(data: unknown): void;
}

/** Обработчики вкладки «Сообщения». */
export interface MessagesSignalrHandlers {
  getMessageAsWorker?(idMessage: number): void;
  getMessageAsMakler?(idMessage: number): void;
  getSystemMessageWorker?(data: unknown): void;
  onUpdateMessages?(data: unknown): void;
}
