/**
 * Чтение query-параметров сессии и bootstrap TradingShellStore до рендера shell.
 */
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Params } from '@angular/router';
import { User } from '@classes';
import { TradingShellStore } from '@store';

/** Нормализованные query-параметры торговой сессии. */
export interface TradingShellQueryParams {
  sectionId: string;
  sessionId: string;
  idDirectionRole: number | null;
  isExistsViolations: boolean | string | null;
}

/** Извлекает idSection, idSession и связанные параметры из snapshot маршрута. */
export function readTradingSessionQueryParams(route: ActivatedRouteSnapshot): TradingShellQueryParams {
  const params: Params = route.queryParams;

  return {
    sectionId: params['idSection'] ?? '',
    sessionId: params['idSession'] ?? '',
    idDirectionRole: params['IdDirection'] ?? null,
    isExistsViolations: params['isExistsViolations'] ?? null,
  };
}

/** Стартовая инициализация store до рендера shell. */
export function bootstrapTradingShellStoreFromRoute(route: ActivatedRouteSnapshot): void {
  const shellStore: InstanceType<typeof TradingShellStore> = inject(TradingShellStore);
  const user: User = JSON.parse(localStorage.getItem('user') || '{}') as User;
  const query: TradingShellQueryParams = readTradingSessionQueryParams(route);

  shellStore.initOrPatch({
    user,
    sectionId: query.sectionId,
    sessionId: query.sessionId,
    idDirectionRole: query.idDirectionRole,
    isExistsViolations: query.isExistsViolations,
  });
}
