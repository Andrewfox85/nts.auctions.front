/**
 * Обновление TradingShellStore: runtime-флаги и частичные patch.
 */
import { inject, Injectable } from '@angular/core';
import { TradingShellStore } from '../../../store/trading-shell';
import { TradingShellState } from '../models/trading-shell-state.model';
import { resolveTradingShellRuntimeFlags } from '../utils/trading-shell-session-flags.util';

export interface TradingShellRuntimeFlagsPatch {
  directTabs: boolean;
  directSession: boolean;
  isTrading: boolean;
  disableTabs: boolean;
  disableTransferBtn: boolean;
}

@Injectable({ providedIn: 'root' })
export class TradingShellStatePublisherService {
  private readonly shellStore = inject(TradingShellStore);

  /** Вычисляет runtime-флаги shell из sessionInfo. */
  public resolveRuntimeFlags(sessionInfo: unknown): TradingShellRuntimeFlagsPatch {
    return resolveTradingShellRuntimeFlags(sessionInfo);
  }

  /** Инициализирует store или патчит частичное состояние. */
  public initOrPatch(patch: Partial<TradingShellState>): void {
    this.shellStore.initOrPatch(patch);
  }

  /** Пересчитывает и записывает runtime-флаги в store; возвращает patch. */
  public applyRuntimeFlags(sessionInfo?: unknown): TradingShellRuntimeFlagsPatch {
    const info = sessionInfo ?? this.shellStore.snapshot().sessionInfo;
    const flags: TradingShellRuntimeFlagsPatch = this.resolveRuntimeFlags(info);

    this.shellStore.update({
      directTabs: flags.directTabs,
      directSession: flags.directSession,
      isTrading: flags.isTrading,
      disableTabs: flags.disableTabs,
      disableTransferBtn: flags.disableTransferBtn,
    });

    return flags;
  }

  /** Алиас initOrPatch для частичной публикации состояния. */
  public publishPartial(patch: Partial<TradingShellState>): void {
    this.shellStore.initOrPatch(patch);
  }

  /** Очищает TradingShellStore. */
  public clear(): void {
    this.shellStore.clear();
  }

  /** Возвращает текущий snapshot состояния shell. */
  public snapshot(): TradingShellState {
    return this.shellStore.snapshot();
  }
}
