/**
 * Вычисление runtime-флагов shell по состоянию сессии (торги, direct, блокировка вкладок).
 */
import { IdSessionPeriods, sessionStage, statusSession } from '@constants';

/** Проверяет, идут ли торги (не этап applicationsSaleOpen и допустимый период). */
export function isTradingSession(
  sessionInfo: {
    sessionStageId?: number;
    idSessionPeriod?: number;
    isPaused?: boolean;
    isActive?: boolean;
    isFinished?: boolean;
    datetimeRemaind?: number | string;
  }
): boolean {
  if (!sessionInfo) {
    return false;
  }

  return (
    sessionInfo.sessionStageId != sessionStage.applicationsSaleOpen &&
    (sessionInfo.idSessionPeriod !== IdSessionPeriods.pretrading ||
      (sessionInfo.idSessionPeriod === IdSessionPeriods.pretrading &&
        sessionInfo.isPaused &&
        sessionInfo.datetimeRemaind != null) ||
      (sessionInfo.idSessionPeriod === IdSessionPeriods.pretrading &&
        (sessionInfo.isActive || sessionInfo.isFinished)))
  );
}

/** Проверяет direct-сессию (целевые сделки после завершения перевода). */
export function isDirectSession(
  sessionInfo: {
    isAllowedTargetedTransact?: boolean;
    sessionStageId?: number;
    sessionStatusId?: number;
    datetimeEnd?: unknown;
  }
): boolean {
  if (!sessionInfo) {
    return false;
  }

  return (
    Boolean(sessionInfo.isAllowedTargetedTransact) &&
    sessionInfo.sessionStageId === sessionStage.transferAuctionCompleted &&
    sessionInfo.sessionStatusId === statusSession.bidding &&
    sessionInfo.datetimeEnd !== null
  );
}

/** Проверяет, нужны ли direct-вкладки (offers/deals вместо trading). */
export function shouldUseDirectTabs(
  sessionInfo: {
    sessionStageId?: number;
    sessionStatusId?: number;
    datetimeEnd?: unknown;
  }
): boolean {
  if (!sessionInfo) {
    return false;
  }

  return (
    sessionInfo.sessionStageId === sessionStage.transferAuctionCompleted &&
    sessionInfo.sessionStatusId === statusSession.bidding &&
    sessionInfo.datetimeEnd != null
  );
}

/** Набор runtime-флагов UI shell, вычисляемых из sessionInfo. */
export interface TradingShellRuntimeFlags {
  directTabs: boolean;
  directSession: boolean;
  isTrading: boolean;
  disableTabs: boolean;
  disableTransferBtn: boolean;
}

/** Агрегирует все runtime-флаги shell по данным сессии. */
export function resolveTradingShellRuntimeFlags(
  sessionInfo: {
    sessionStageId?: number;
    sessionStatusId?: number;
    idSessionPeriod?: number;
    isPaused?: boolean;
    isActive?: boolean;
    isFinished?: boolean;
    datetimeRemaind?: number | string;
    isAllowedTargetedTransact?: boolean;
    datetimeEnd?: unknown;
  }
): TradingShellRuntimeFlags {
  const directTabs: boolean = shouldUseDirectTabs(sessionInfo);

  const isArchivedBlocked: boolean =
    sessionInfo?.sessionStageId === sessionStage.transferAuctionCompleted &&
    (sessionInfo?.sessionStatusId === statusSession.inProcessArchived ||
      sessionInfo?.sessionStatusId === statusSession.notArchived);

  return {
    directTabs,
    directSession: isDirectSession(sessionInfo),
    isTrading: isTradingSession(sessionInfo),
    disableTabs: isArchivedBlocked && !directTabs,
    disableTransferBtn:
      sessionInfo?.sessionStageId === sessionStage.transferAuctionCompleted &&
      sessionInfo?.sessionStatusId === statusSession.inProcessArchived,
  };
}
