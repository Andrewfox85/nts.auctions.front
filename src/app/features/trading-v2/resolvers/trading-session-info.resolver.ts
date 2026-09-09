/**
 * Resolver: загрузка GetSessionState и bootstrap TradingShellStore перед shell.
 */
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CommonService } from '@services';
import { TradingShellStore } from '@store';
import { ISessionState, ISessionStateConfig } from '../../../views/homepage/interfaces';
import { TradingShellPlatformSyncService } from '@trading-v2';
import {
  bootstrapTradingShellStoreFromRoute,
  readTradingSessionQueryParams,
  TradingShellQueryParams,
} from '../utils/trading-shell-route-bootstrap.util';

/** Загружает sessionInfo по query-параметрам и инициализирует store. */
export const tradingV2SessionInfoResolver: ResolveFn<ISessionStateConfig> = (
  route: ActivatedRouteSnapshot,
  _: RouterStateSnapshot
): Observable<ISessionStateConfig | null> => {
  const commonService: CommonService = inject(CommonService);
  const platformSync: TradingShellPlatformSyncService = inject(TradingShellPlatformSyncService);
  const router: Router = inject(Router);
  const shellStore = inject(TradingShellStore);

  bootstrapTradingShellStoreFromRoute(route);

  const { sectionId, sessionId }: TradingShellQueryParams = readTradingSessionQueryParams(route);
  const idSection: number = Number(sectionId);
  const idSession: number = Number(sessionId);
  const sessionKey: string = JSON.parse(localStorage.getItem('user') || '{}').token;

  if (isNaN(idSection) || isNaN(idSession)) {
    router.navigate(['/']);
    return of(null);
  }

  return commonService.GetSessionState(sessionKey, idSection, idSession).pipe(
    map((res: ISessionState): ISessionStateConfig | null => {
      if (res?.sessionStates?.length > 0) {
        return res.sessionStates[0];
      }

      router.navigate(['/']);
      return null;
    }),
    tap((sessionInfo: ISessionStateConfig | null): void => {
      if (sessionInfo) {
        shellStore.initOrPatch({ sessionInfo });
        platformSync.syncFromShell(shellStore.snapshot());
      }
    }),
    catchError((err) => {
      console.error('Resolver: Error loading session info from API:', err);
      router.navigate(['/error-page']);
      return of(null);
    })
  );
};
