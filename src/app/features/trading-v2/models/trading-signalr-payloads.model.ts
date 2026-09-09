/**
 * Типы payload событий SignalR для торгов v2.
 */

/** Произвольный payload hub-события. */
export type SignalrHubPayload = unknown;

/** Payload события смены состояния сессии. */
export interface SignalrChangeSessionStatePayload {
  idSession: string | number;
}

/** Payload события смены роли трейдера. */
export interface SignalrChangedTraderRolePayload {
  idDirection: number;
}

/** Строка входящего сообщения для worker. */
export interface WorkerInboxMessageRow {
  idStatus: number;
  isInbox: boolean;
}

/** Ответ API со списком сообщений worker. */
export interface WorkerMessagesListResponse {
  messages: WorkerInboxMessageRow[];
}

/** Строка входящего сообщения для трейдера. */
export interface TraderInboxMessageRow {
  isInbox: boolean;
}

/** Ответ API со списком чатов трейдера. */
export interface TraderChatListResponse {
  messages: TraderInboxMessageRow[];
}

/** Payload с идентификатором сообщения маклера. */
export interface MaklerMessageIdPayload {
  idMessage?: number;
  idMessageNew?: number;
}

/** Payload ответа маклера трейдеру. */
export interface MaklerReplyForTraderPayload {
  message: Record<string, unknown>;
  idMessageSource: number;
}

/** Payload системных сообщений трейдера за период. */
export interface TraderSystemMessagesByPeriodPayload {
  messages: Record<string, unknown>[];
  idSection: number;
  idSession: number;
  idTrader: number;
}
