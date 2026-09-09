import { DxGridState } from '@interfaces';
import { DxGridFilterExpression } from "./registrations-trader-grid-filter.util";

export function applyFilterValueToGridState(
  state: DxGridState | null,
  filterValue: DxGridFilterExpression[] | DxGridFilterExpression | null
): DxGridState | null {
  if (!filterValue || filterValue.length === 0) {
    return state;
  }

  if (!state) {
    return { filterValue } as DxGridState;
  }

  return {
    ...state,
    filterValue,
  };
}
