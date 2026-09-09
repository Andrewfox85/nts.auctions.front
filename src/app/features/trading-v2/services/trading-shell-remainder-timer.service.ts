/**
 * Обратный отсчёт datetimeRemaind сессии (поведение как в v1 trading).
 */
import { Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TradingShellRemainderTimerService {
  private subscription?: Subscription;

  /** Запускает секундный таймер до окончания сессии; обновляет datetimeRemaind и флаги. */
  public start(sessionInfo: { datetimeRemaind?: number; isActive?: boolean; isFinished?: boolean } | null): void {
    this.stop();

    if (!sessionInfo?.datetimeRemaind || sessionInfo.datetimeRemaind <= 0) {
      return;
    }

    if (!sessionInfo.isActive) {
      return;
    }

    const endTimestampSec: number = new Date().getTime() / 1000 + sessionInfo.datetimeRemaind;

    this.subscription = interval(1000).subscribe((): void => {
      if (sessionInfo.datetimeRemaind != 0) {
        sessionInfo.datetimeRemaind = Number(
          (endTimestampSec - new Date().getTime() / 1000).toFixed(0)
        );
      } else {
        this.stop();
        sessionInfo.isFinished = true;
        sessionInfo.isActive = false;
      }
    });
  }

  /** Останавливает таймер обратного отсчёта. */
  public stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }
}
