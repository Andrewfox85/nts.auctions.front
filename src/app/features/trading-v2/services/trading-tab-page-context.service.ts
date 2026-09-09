/**
 * View-model для tab-page: данные shell store, готовые к рендеру v1-вкладок.
 */
import { computed, inject, Injectable, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, Observable } from 'rxjs';
import { INewTabData } from '../../trading/interfaces';
import { User } from '@classes';
import { TradingShellState } from '../models/trading-shell-state.model';
import { TradingShellStore } from '@store';


export interface TradingTabPageViewModel {
  user: User;
  sessionInfo: any;
  sessionIds: { sectionId: string; sessionId: string };
  isAdmissionFinished: boolean;
  isFromTraders: boolean;
  dataForFilter: INewTabData | null;
  idDirectionRole: number | null;
  isCalcFeeFinished: boolean;
  isIntermediateTransfer: boolean;
}

@Injectable()
export class TradingTabPageContextService {
  private readonly shellStore = inject(TradingShellStore);
  private readonly shellSnapshot: Signal<TradingShellState> = computed(() =>
    this.shellStore.snapshot()
  );

  public readonly viewModel$: Observable<TradingTabPageViewModel> = toObservable(
    this.shellSnapshot
  ).pipe(
    map((state: TradingShellState) => this.toViewModel(state)),
    filter((viewModel: TradingTabPageViewModel): boolean => viewModel != null)
  );

  /** Маппит TradingShellState в view-model; null пока сессия не готова. */
  private toViewModel(state: TradingShellState): TradingTabPageViewModel | null {
    if (
      !state?.isSessionReady ||
      !state.sessionInfo ||
      !state.sectionId ||
      !state.sessionId
    ) {
      return null;
    }

    const tradersFilter: INewTabData = state.tradersNavigationFilter;

    return {
      user: state.user,
      sessionInfo: state.sessionInfo,
      sessionIds: {
        sectionId: state.sectionId,
        sessionId: state.sessionId,
      },
      isAdmissionFinished: state.isAdmissionFinished,
      isFromTraders: tradersFilter != null,
      dataForFilter: tradersFilter,
      idDirectionRole: state.idDirectionRole,
      isCalcFeeFinished: state.isCalcFeeFinished,
      isIntermediateTransfer: state.isIntermediateTransfer,
    };
  }
}
