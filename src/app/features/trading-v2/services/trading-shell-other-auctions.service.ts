/**
 * Список других сессий и переход в main-page-v2 в новой вкладке.
 */
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { getAuctionPath } from '@helpers';
import { CommonService, TradingService } from '@services';
import { GlobalStore } from '@store';
import { ISessionLogin, ISessionState } from '../../../views/homepage/interfaces';
import { EnglishUpgradingAuctionStore } from '../../../views/english-upgrading-auction/store';
import { map, switchMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface TradingShellOtherAuctionsSection {
  id: number;
  name: string;
}

export interface TradingShellOtherAuctionsSession {
  sectionId: number;
  sessionId: number;
  sessionName: string;
}

export interface TradingShellOtherAuctionsListResult {
  sections: TradingShellOtherAuctionsSection[];
  sessions: TradingShellOtherAuctionsSession[];
}

@Injectable({ providedIn: 'root' })
export class TradingShellOtherAuctionsService {
  private readonly router = inject(Router);
  private readonly commonService = inject(CommonService);
  private readonly tradingService = inject(TradingService);
  private readonly globalStore = inject(GlobalStore);
  private readonly auctionStore = inject(EnglishUpgradingAuctionStore);

  /** Загружает список сессий и группирует их по секциям. */
  public loadSessionsList(token: string): Observable<TradingShellOtherAuctionsListResult> {
    return this.commonService.GetListSessions(token).pipe(
      map((res: { sessions: TradingShellOtherAuctionsSession[] }) => {
        const sessions = res.sessions ?? [];
        const sections = [
          ...new Map(
            sessions.map((session) => [
              session.sectionId,
              { id: session.sectionId, name: (session as any).sectionName },
            ])
          ).values(),
        ];

        return { sections, sessions };
      })
    );
  }

  /** Фильтрует сессии секции, исключая текущую торговую сессию. */
  public filterSessionsForSection(
    sessions: TradingShellOtherAuctionsSession[],
    sectionId: number | undefined,
    currentSessionId: string
  ): TradingShellOtherAuctionsSession[] {
    return sessions.filter(
      (item) =>
        item.sectionId == sectionId && String(item.sessionId) !== String(currentSessionId)
    );
  }

  /** Login + open main-page-v2 в новой вкладке. */
  public openTradingInNewTab(
    token: string,
    sectionId: number,
    sessionId: number,
    destroyRef: DestroyRef
  ): void {
    this.commonService
      .SessionLogin(token, sectionId, sessionId)
      .pipe(
        tap((res: ISessionLogin) => {
          this.tradingService.sectionId = sectionId;
          this.tradingService.sessionId = sessionId;
          this.tradingService.isExistsViolations = res.isExistsViolations;
          this.tradingService.idDirection = res.idDirection;
        }),
        switchMap(() =>
          this.commonService.GetSessionState(token, sectionId, sessionId)
        ),
        map((stateRes: ISessionState) => stateRes.sessionStates[0].idAuctionType),
        tap((idAuctionType: number) => {
          this.globalStore.setMainSessionInfo({
            sectionId,
            sessionId,
            idAuctionType,
          });
          this.auctionStore.setIdAuctionType(idAuctionType);
        }),
        map((idAuctionType: number) => getAuctionPath(idAuctionType)),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe({
        next: (auctionRootPath: string) => {
          const url = this.router.serializeUrl(
            this.router.createUrlTree(
              ['/auctions/', auctionRootPath, 'main-page-v2'],
              {
                queryParams: {
                  isExistsViolations: this.tradingService.isExistsViolations,
                  idDirection: this.tradingService.idDirection,
                  idSection: sectionId,
                  idSession: sessionId,
                },
              }
            )
          );
          window.open(url, '_blank');
        },
        error: (error) =>
          console.error('TradingShellOtherAuctions: openTradingInNewTab failed', error),
      });
  }
}
