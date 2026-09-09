import { IdDirection } from '@constants';
import { TranslateService } from '@ngx-translate/core';

export type DxGridFilterExpression = string[] | string;

export type RegistrationsTraderGridFilterParams = {
  traderName?: string | null;
  statusName?: string | null;
  directionName?: string | null;
};

export function resolveDirectionName(
  directionId: number | null | undefined,
  translate: TranslateService
): string {
  if (directionId === IdDirection.sale) {
    return translate.instant('filters.directionSale');
  }

  if (directionId === IdDirection.buy) {
    return translate.instant('filters.directionBuy');
  }

  return '';
}

export function buildRegistrationsTraderGridFilter(
  params: RegistrationsTraderGridFilterParams
): DxGridFilterExpression[] | DxGridFilterExpression {
  const filters: DxGridFilterExpression[] = [];

  if (params.traderName) {
    filters.push(['traderName', '=', params.traderName]);
  }

  if (params.statusName) {
    filters.push(['statusName', 'contains', params.statusName]);
  }

  if (params.directionName) {
    filters.push(['directionName', '=', params.directionName]);
  }

  if (!filters.length) {
    return null;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  const combined: DxGridFilterExpression[] = [];
  const AND: string = 'and';

  filters.forEach((filter: DxGridFilterExpression, index: number): void => {
    if (index > 0) {
      combined.push(AND);
    }
    combined.push(filter);
  });

  return combined;
}
