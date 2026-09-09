import { ID_COMPOSITE_LOT_AVAILABILITY } from '@enums';
import { DxGridColumnState, DxGridState } from '@interfaces';
import { HiddenLotDisplayMode } from '../hidden-lot-grid-columns.util';
import { TableDataField } from './table-data-field.enum';

export enum TradingGridStatePage {
  Offers = 'offers',
  Auctions = 'auctions',
  Deals = 'deals',
}

export type ResolveOffersGridStateParams = {
  hasSessionInfo: boolean;
  idCompositeLotAvailability: ID_COMPOSITE_LOT_AVAILABILITY;
  rawState: DxGridState | null;
};

export function buildTradingGridStateKey(
  page: TradingGridStatePage,
  mode: HiddenLotDisplayMode,
  stateKey: string
): string {
  const modeSuffix: string = resolveTradingGridStateKeySuffix(mode);
  return `${page}_mode_${modeSuffix}_${stateKey}`;
}

export function resolveTradingGridStateKeySuffix(mode: HiddenLotDisplayMode): string {
  return mode === HiddenLotDisplayMode.ExtendedWithoutNames
    ? 'extended_simple_only'
    : 'all';
}

export function resolveOffersGridStateForDx(params: ResolveOffersGridStateParams): DxGridState | null {
  if (!params.hasSessionInfo) {
    return null;
  }

  return sanitizeTradingGridStateFromLs(
    params.rawState,
    params.idCompositeLotAvailability
  );
}

export function sanitizeTradingGridStateFromLs(
  rawState: DxGridState | null,
  idCompositeLotAvailability: ID_COMPOSITE_LOT_AVAILABILITY
): DxGridState | null {
  if (rawState === null) {
    return null;
  }

  if (
    idCompositeLotAvailability === ID_COMPOSITE_LOT_AVAILABILITY.SIMPLE_ONLY
  ) {
    return forceNamesHiddenInGridState(rawState);
  }

  return rawState;
}

export function forceNamesHiddenInGridState(state: DxGridState): DxGridState {
  const columns: DxGridColumnState[] = (state.columns ?? []).map(
    (column: DxGridColumnState): DxGridColumnState => {
      if (column.dataField !== TableDataField.Names) {
        return column;
      }

      return {
        ...column,
        visible: false,
        showInColumnChooser: false,
      };
    }
  );

  return {
    ...state,
    columns,
  };
}
