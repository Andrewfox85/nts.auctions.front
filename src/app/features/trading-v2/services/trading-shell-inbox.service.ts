/**
 * Счётчик непрочитанных сообщений inbox для badge в shell торгов v2.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class TradingShellInboxService {
  private readonly count$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  public readonly countChanges$: Observable<number> = this.count$.asObservable();

  /** Устанавливает точное значение счётчика непрочитанных. */
  public setCount(count: number): void {
    this.count$.next(count);
  }

  /** Показывает badge с минимальным значением (1 непрочитанное). */
  public showUnreadBadge(): void {
    this.count$.next(1);
  }

  /** Сбрасывает счётчик непрочитанных в ноль. */
  public reset(): void {
    this.count$.next(0);
  }
}
