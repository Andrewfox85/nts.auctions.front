/**
 * Сбор и фильтрация query-параметров торговой сессии v2 по дереву маршрутов.
 */
import { ActivatedRoute, Params } from '@angular/router';

/** Ключи query-параметров, сохраняемых при навигации между вкладками. */
export const TRADING_V2_SESSION_QUERY_KEYS: string[] = [
  'idSection',
  'idSession',
  'idDirection',
  'isExistsViolations',
];

/** Объединяет queryParams от текущего маршрута и всех родителей. */
export function collectRouteQueryParams(route: ActivatedRoute): Params {
  const merged: Params = {};
  let current: ActivatedRoute = route;

  while (current) {
    Object.assign(merged, current.snapshot.queryParams);
    current = current.parent;
  }

  return merged;
}

/** Возвращает только параметры сессии из объединённого дерева маршрутов. */
export function getTradingSessionQueryParams(route: ActivatedRoute): Params {
  const all: Params = collectRouteQueryParams(route);
  const params: Params = {};

  for (const key of TRADING_V2_SESSION_QUERY_KEYS) {
    if (all[key] != null && all[key] !== '') {
      params[key] = all[key];
    }
  }

  return params;
}
