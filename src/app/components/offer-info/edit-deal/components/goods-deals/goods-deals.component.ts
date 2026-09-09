import { Component, input, model } from '@angular/core';
import { DX_MODULES } from '@constants';
import { TranslateModule } from '@ngx-translate/core';
import { NgStyle } from '@angular/common';
import {
  RuNumberFormatPipe,
  ToNumberPipe,
  GoodAnalogDescriptionPipe,
  ActualDimensionsPipe,
} from '@pipes';
import {
  IdInterfaceField,
  MAXIMUM_GOODS_LENGTH,
  ACTUAL_SIZE_READINESS_FIELDS,
  ACTUAL_SIZE_FIELDS,
} from './../../../../../shared/constants/api.constants';
import { DisplaySpecsDirective } from './../../../../../shared/directives/display-specs-in-good-grid.directive';
import { SortActualDimensionsPipe } from './../../../../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe';

@Component({
  selector: 'app-goods-deals',
  imports: [
    TranslateModule,
    ...DX_MODULES,
    NgStyle,
    ToNumberPipe,
    RuNumberFormatPipe,
    GoodAnalogDescriptionPipe,
    ActualDimensionsPipe,
    SortActualDimensionsPipe,
    DisplaySpecsDirective,
  ],
  templateUrl: './goods-deals.component.html',
  styleUrl: './goods-deals.component.scss',
})
export class GoodsDealsComponent {
  public readonly generalInfo = input.required<any>();
  public readonly pricingType = input.required<any>();
  public readonly goods = input.required<any>();
  public readonly currencyPrecision = input.required<any>();
  public readonly goodInfo = input.required<any>();
  public readonly totalRowData = input.required<any>();
  public readonly isShowCostwithoutVat = input<any>();

  public readonly expandTable = model(false);

  public readonly IdInterfaceField = IdInterfaceField;
  public MAXIMUM_GOODS_LENGTH = MAXIMUM_GOODS_LENGTH;
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;

  public getValue(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  public getNumberCost(value): number {
    let costVAT;
    value.forEach((el) => {
      if ('costVAT' in el) {
        costVAT = el?.costVAT;
      }
    });
    return Number(costVAT);
  }

  public getAmountVAT(value): number {
    let amountVAT;
    value.forEach((el) => {
      if ('amountVAT' in el) {
        amountVAT = el?.fieldValue;
      }
    });
    return Number(amountVAT);
  }

  public changeExpandTable(): void {
    this.expandTable.set(!this.expandTable());
  }
}
