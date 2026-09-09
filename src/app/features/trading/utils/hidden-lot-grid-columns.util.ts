import type dxDataGrid from 'devextreme/ui/data_grid';
import { ID_COMPOSITE_LOT_AVAILABILITY } from '@enums';
import { TableDataField } from './grid-columns/table-data-field.enum';

/**
 * Оптимизация чекбокса «Скрыть товары лотов»:
 * - в шаблоне нет [visible]="!isHiddenLot" (иначе Angular пересобирает все dxi-column и подвисает UI);
 * - видимость колонок меняется через API грида columnOption в одном beginUpdate/endUpdate.
 */

export enum HiddenLotDisplayMode {
  Minimal = 'minimal',
  Extended = 'extended',
  ExtendedWithoutNames = 'extendedWithoutNames',
}

export const HIDDEN_LOT_NAMES_FIELD: string = TableDataField.Names;

export const HIDDEN_LOT_EXTENDED_FIELDS: readonly string[] = [
  TableDataField.Desc,
  TableDataField.Vol,
  TableDataField.Units,
  TableDataField.Amendment,
  TableDataField.Quotation,
  TableDataField.Prices,
  TableDataField.AmountVAT,
  TableDataField.TotalAmount,
];

export const HIDDEN_LOT_MINIMAL_VISIBLE_FIELDS: readonly string[] = [
  TableDataField.GoodsLotSummaryVolume,
  TableDataField.PriceParamsCurrencyName,
];

export type DynamicLotField = {
  fieldName: string;
  visible?: boolean;
};

export type HiddenLotGridColumnsParams = {
  mode: HiddenLotDisplayMode;
  extendedFields: readonly string[];
  workerFields?: readonly string[];
  isWorker?: boolean;
  dynamicFields?: DynamicLotField[];
  minimalVisibleFields?: readonly string[];
  lastApplied: HiddenLotDisplayMode | null;
};

/** Чекбокс скрыт только для сессий с простыми лотами. */
export function isHiddenLotCheckboxVisible(
  idCompositeLotAvailability: ID_COMPOSITE_LOT_AVAILABILITY | null | undefined
): boolean {
  return idCompositeLotAvailability !== ID_COMPOSITE_LOT_AVAILABILITY.SIMPLE_ONLY;
}

export function resolveHiddenLotDisplayMode(
  idCompositeLotAvailability: ID_COMPOSITE_LOT_AVAILABILITY,
  isHiddenLot: boolean
): HiddenLotDisplayMode {
  if (idCompositeLotAvailability === ID_COMPOSITE_LOT_AVAILABILITY.SIMPLE_ONLY) {
    return HiddenLotDisplayMode.ExtendedWithoutNames;
  }

  return isHiddenLot ? HiddenLotDisplayMode.Minimal : HiddenLotDisplayMode.Extended;
}

export function shouldFilterSimpleLotsOnly(mode: HiddenLotDisplayMode): boolean {
  return mode === HiddenLotDisplayMode.Minimal;
}

export function applyHiddenLotGridColumnsVisibility(
  grid: dxDataGrid,
  params: HiddenLotGridColumnsParams
): HiddenLotDisplayMode {
  if (!grid) {
    return params.lastApplied;
  }

  const { mode }: HiddenLotGridColumnsParams = params;

  if (params.lastApplied === mode) {
    return mode;
  }

  const showExtended: boolean = mode !== HiddenLotDisplayMode.Minimal;
  const showNamesInChooser: boolean = mode !== HiddenLotDisplayMode.ExtendedWithoutNames;
  const showNames: boolean = resolveNamesVisible(mode);

  grid.beginUpdate();

  grid.columnOption(HIDDEN_LOT_NAMES_FIELD, 'visible', showNames);
  grid.columnOption(HIDDEN_LOT_NAMES_FIELD, 'showInColumnChooser', showNamesInChooser);

  if (mode === HiddenLotDisplayMode.ExtendedWithoutNames) {
    grid.endUpdate();
    return mode;
  }

  for (const dataField of params.extendedFields) {
    grid.columnOption(dataField, 'visible', showExtended);
  }

  if (params.isWorker && params.workerFields?.length) {
    for (const dataField of params.workerFields) {
      grid.columnOption(dataField, 'visible', showExtended);
    }
  }

  for (const dynamicField of params.dynamicFields ?? []) {
    grid.columnOption(dynamicField.fieldName, 'visible', showExtended);
  }

  if (mode === HiddenLotDisplayMode.Minimal) {
    for (const dataField of params.minimalVisibleFields ?? []) {
      grid.columnOption(dataField, 'visible', true);
    }
  }

  grid.endUpdate();

  return mode;
}

function resolveNamesVisible(mode: HiddenLotDisplayMode): boolean {
  return mode === HiddenLotDisplayMode.Extended;
}
