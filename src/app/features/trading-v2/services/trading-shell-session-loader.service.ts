/**
 * Загрузка начального состояния сессии и проверка привилегий worker при входе в торги.
 */
import { inject, Injectable } from '@angular/core';
import { User } from '@classes';
import { CommonService } from '@services';
import { ApiStore } from '@store';
import { IApiDataSection } from '@interfaces';
import {
  TradingShellSessionLoadContext,
  TradingShellSessionLoaderHost,
  TradingShellWorkerPrivileges,
} from '../models/trading-shell-session-loader.model';
import { resolveSessionLoadViolationsPopup } from '../utils/trading-shell-violations-popup.util';
import { TradingShellRemainderTimerService } from './trading-shell-remainder-timer.service';

@Injectable({ providedIn: 'root' })
export class TradingShellSessionLoaderService {
  private readonly commonService: CommonService = inject(CommonService);
  private readonly apiStore = inject(ApiStore);
  private readonly remainderTimer: TradingShellRemainderTimerService = inject(TradingShellRemainderTimerService);

  /** Определяет workerPrivileges и privilegesObserver по секции и checkPrivileges. */
  public resolveWorkerPrivileges(user: User, sectionId: string): TradingShellWorkerPrivileges {
    if (!user?.IsWorker) {
      return { workerPrivileges: false, privilegesObserver: false };
    }

    const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();
    const sectionDescription: string = sectionsArray.find(
      (el: IApiDataSection): boolean => Number(el.id) === Number(sectionId)
    )?.description;

    let workerPrivileges: boolean = this.commonService.checkPrivileges(
      'TradingEditItem' + sectionDescription
    );
    let privilegesObserver: boolean = this.commonService.checkPrivileges(
      'TradingGetList' + sectionDescription
    );

    if (privilegesObserver && workerPrivileges) {
      privilegesObserver = false;
    }

    return { workerPrivileges, privilegesObserver };
  }

  /** Запрашивает GetSessionState, мержит sessionInfo, таймер и popup нарушений. */
  public loadInitialSessionState(host: TradingShellSessionLoaderHost): void {
    const context: TradingShellSessionLoadContext = host.getLoadContext();

    this.commonService
      .GetSessionState(context.token, context.sectionId, context.sessionId)
      .subscribe((res: any): void => {
        if (res.sessionStates?.[0]) {
          host.setAuctionType(res.sessionStates[0].idAuctionType);
        }

        if (res.sessionStates != null && res.warningMessage == null) {
          const merged = { ...context.sessionInfo, ...res.sessionStates[0] };
          host.mergeSessionInfo(merged);
          this.remainderTimer.start(merged);
        }

        if (res.sessionStates == null && res.warningMessage == null) {
          host.navigateHome();
          return;
        }

        host.applyViolationsPatch(
          resolveSessionLoadViolationsPopup(res.sessionStates, res.warningMessage)
        );

        if (res.sessionStates != null) {
          host.onSessionReady();
        }

        host.onLoadComplete();
      });
  }
}
