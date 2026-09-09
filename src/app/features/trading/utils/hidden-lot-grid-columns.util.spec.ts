import {
  applyHiddenLotGridColumnsVisibility,
  HiddenLotDisplayMode,
} from './hidden-lot-grid-columns.util';

describe('applyHiddenLotGridColumnsVisibility', () => {
  it('preserves user column visibility for sessions with simple lots only', () => {
    const grid = jasmine.createSpyObj('dxDataGrid', [
      'beginUpdate',
      'columnOption',
      'endUpdate',
    ]);

    const result = applyHiddenLotGridColumnsVisibility(grid, {
      mode: HiddenLotDisplayMode.ExtendedWithoutNames,
      extendedFields: ['desc', 'prices'],
      workerFields: ['priceSteps'],
      isWorker: true,
      dynamicFields: [{ fieldName: 'dynamicField' }],
      minimalVisibleFields: ['summaryVolume'],
      lastApplied: null,
    });

    expect(grid.columnOption.calls.allArgs()).toEqual([
      ['names', 'visible', false],
      ['names', 'showInColumnChooser', false],
    ]);
    expect(grid.beginUpdate).toHaveBeenCalledTimes(1);
    expect(grid.endUpdate).toHaveBeenCalledTimes(1);
    expect(result).toBe(HiddenLotDisplayMode.ExtendedWithoutNames);
  });
});
