import { Component, Input, inject } from '@angular/core';
import {
  DX_MODULES,
  pricingType,
  auctionType,
  ACTUAL_SIZE_FIELDS,
  ACTUAL_SIZE_READINESS_FIELDS,
  IdInterfaceField,
  goodRefId,
  NG_REF_ID,
  TG_REF_ID
} from '@constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgStyle, NgFor } from '@angular/common';
import { getNumber } from '@helpers';
import {
  IGoodsSpecifications,
  ICounterOfferSelectedRow,
  IValuesGoodAnalog
} from '@interfaces';
import { DisplaySpecsDirective } from './../../shared/directives/display-specs-in-good-grid.directive';
import { ToNumberPipe, RuNumberFormatPipe, GoodAnalogDescriptionPipe, ActualDimensionsPipe } from '@pipes';
import { SortActualDimensionsPipe } from "../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe";
import { ShowGoodsFieldsPipe } from "../../shared/pipes/showGoodsFields/show-goods-fields-pipe";
import { ActualValuePipe } from "../../shared/pipes/showFieldsValue/actual-value-pipe";
import { GoodsValuePipe } from "../../shared/pipes/showFieldsValue/goods-value-pipe";
import { DisplayGoodChracteristics } from "./display-good-chracteristics/display-good-chracteristics";

@Component({
  selector: 'app-counter-offers-goods-table',
  standalone: true,
  imports: [
    ...DX_MODULES,
    TranslateModule,
    NgStyle,
    NgFor,
    ToNumberPipe,
    RuNumberFormatPipe,
    GoodAnalogDescriptionPipe,
    ActualDimensionsPipe,
    SortActualDimensionsPipe,
    ShowGoodsFieldsPipe,
    ActualValuePipe,
    GoodsValuePipe,
    DisplaySpecsDirective,
    DisplayGoodChracteristics
  ],
  templateUrl: './counter-offers-goods-table.component.html',
  styleUrl: './counter-offers-goods-table.component.scss',
})

export class CounterOffersGoodsTableComponent {
  @Input({ required: true }) sessionIds: any;
  @Input({ required: true }) fullInfo: any;
  @Input({ required: true }) deliveryConditionsChoose: any[];
  @Input({ required: true }) currencyPrecision: any;
  @Input({ required: true }) selectedRow: ICounterOfferSelectedRow;
  @Input({ required: true }) totalRowData: any;
  @Input({ required: true }) goodInfo: boolean;
  @Input({ required: true }) isSpecialFields: boolean;
  @Input({ required: true }) showDifferences: boolean;
  @Input({ required: true }) onSameUnits: boolean;
  @Input({ required: true }) getValue: (
    goodsSpecifications: IGoodsSpecifications[],
    idInterfaceField: number
  ) => string;

  public readonly pricingType = pricingType;
  protected readonly auctionType = auctionType;
  public readonly IdInterfaceField = IdInterfaceField;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;
  public readonly NG_REF_ID = NG_REF_ID;
  public readonly TG_REF_ID = TG_REF_ID;

  public expandTable: boolean = false;

  public getPriceFromBasisForGood(idGood: number): number | null {
    let price;

    if (this.fullInfo?.deliveryConditions?.length > 0) {
      price =
        Number(
          this.deliveryConditionsChoose?.find(
            (it) => it.idDemandOfferGood == idGood
          )?.priceWithoutVat
        ) || null;
    } else {
      price = getNumber(
        this.getValue(
          this.fullInfo.goods.find(
            (good) => good?.goodsSpecifications[0].idDemandOfferGood == idGood
          )?.goodsSpecifications,
          3
        )
      );
    }

    return price;
  }

  public getNumberCost(value: any[]): number {
    let costVAT;

    value.forEach((it) => {
      if ('costVAT' in it) {
        costVAT = it?.costVAT;
      }
    });

    return Number(costVAT);
  }

  public getValueFromCounter(idGood: number, key): number {
    const good = this.selectedRow.goods.find(
      (good) => good.idOfferGood === idGood || good.idDemandGood === idGood
    );
    return good?.[key]
  }

  public getCompareValue(idGood: number, key): boolean {
    const good = this.selectedRow.goods.find(
      (good) => good.idOfferGood === idGood || good.idDemandGood === idGood
    );
    return good?.[key]
  }

  protected readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
}
