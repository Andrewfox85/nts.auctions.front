import { Component, inject, Input } from '@angular/core';
import {
  ACTUAL_SIZE_READINESS_FIELDS,
  auctionType,
  goodRefId,
  IdInterfaceField,
  NG_REF_ID,
  TG_REF_ID
} from "@constants";
import {
  ICounterOfferGood,
  ICounterOfferSelectedRow,
  IEditOfferGood, IEditOfferGoodsSpecifications,
  IGoodsSpecifications,
  IValuesGoodAnalog
} from "@interfaces";
import { DisplayRefs } from "../../../views/dutch-down-auction/components/submitting-counter-demand/interfaces";
import {
  makeDemandRefs
} from "../../../views/dutch-down-auction/components/submitting-counter-demand/utils/display-string-refs.util";
import { GoodValue } from "../../submitting-counter-offer/interfaces";
import {
  ActualValuePipe,
  GoodsValuePipe,
  RuNumberFormatPipe,
  ShowGoodsFieldsPipe,
  SortActualDimensionsPipe
} from "@pipes";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { DisplaySpecsDirective } from "@directives";
import { SessionIds } from "../../../services/edit-demand-offer-service.service";
import { OfferFullInfoResponse } from "@services";

@Component({
  selector: 'app-display-good-chracteristics',
  imports: [
    ActualValuePipe,
    SortActualDimensionsPipe,
    ShowGoodsFieldsPipe,
    GoodsValuePipe,
    TranslateModule,
    RuNumberFormatPipe,
    DisplaySpecsDirective
  ],
  templateUrl: './display-good-chracteristics.html',
  styleUrl: './display-good-chracteristics.scss',
  standalone: true
})
export class DisplayGoodChracteristics {
  @Input({ required: true }) good: any;
  @Input({ required: true }) showDifferences: boolean;
  @Input({ required: true }) fullInfo: OfferFullInfoResponse;
  @Input({ required: true }) isSpecialFields: boolean;
  @Input({ required: true }) sessionIds: SessionIds;
  @Input({ required: true }) getValue: (
    goodsSpecifications: IGoodsSpecifications[],
    idInterfaceField: number
  ) => string;
  @Input({ required: true }) currencyPrecision: number;
  @Input({ required: true }) selectedRow: ICounterOfferSelectedRow;

  private translate: TranslateService = inject(TranslateService);
  protected readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  protected readonly auctionType = auctionType;
  protected readonly IdInterfaceField = IdInterfaceField;

  //для аналогов строим строку значений хар-к для каждого справочника
  public get getDemandRefs(): DisplayRefs[] {
    return makeDemandRefs(
      this.fullInfo?.goods[0]?.goodValues,
      this.translate.store.currentLang
    );
  }

  //объединяем оба массива и оставляем уникальные элементы
  //если справочник уже был добавлен из заявки (с прочерками) то перезаписываем его полноценными данными из встречки
  //если справочник уникален для заявки или для встречки - просто добавляем
  public get getCounterRefsRefs(): IValuesGoodAnalog[] {
    const skip: Set<number> = new Set([NG_REF_ID, TG_REF_ID]);
    const demandValues: GoodValue[] = this.fullInfo?.goods?.[0]?.goodValues ?? [];
    const counterValues: IValuesGoodAnalog[] = this.selectedRow?.goods?.[0]?.values ?? [];
    const fromCounter: IValuesGoodAnalog[] = counterValues.filter((item) => !skip.has(item.idReference));
    const counterRefIds: Set<number> = new Set(fromCounter.map((item) => item.idReference));

    const fromDemandOnly: IValuesGoodAnalog[] = demandValues
      .filter(
        (item) =>
          !skip.has(item.idReference) && !counterRefIds.has(item.idReference)
      )
      .map((item) => ({
        idReference: item.idReference,
        nameReference: item.referenceName,
        idValue: null,
        nameValue: '-',
      }));
    return [...fromCounter, ...fromDemandOnly].sort(
      (a, b) =>
        Number(b.idReference === goodRefId) -
        Number(a.idReference === goodRefId)
    );
  }

  public getPropValueFromDemand(idRef: number): string {
    return this.getDemandRefs.find((el) => el.idReference === idRef)?.value;
  }

  public compareSpecsFromCounter(goodValue: number | string, counterValue: number | string): boolean {
    return goodValue === counterValue;
  }

  public getSpecsFromCounter(idGood: number, idField: number): string | number {
    const good: ICounterOfferGood = this.selectedRow.goods.find(
      (good) => good.idOfferGood === idGood || good.idDemandGood === idGood
    );

    const value: IEditOfferGoodsSpecifications = good?.goodsSpecifications.find(
      (spec) => spec.idInterfaceField === idField
    );

    return value?.fieldValue ?? '';
  }

  public getAmountVAT(value: IEditOfferGoodsSpecifications[]): number {
    let amountVAT: number | string = 0;

    value.forEach((el) => {
      if ('amountVAT' in el) {
        amountVAT = el?.fieldValue;
      }
    });

    return Number(amountVAT);
  }

  public getCompareValue(idGood: number, key): boolean {
    const good: ICounterOfferGood = this.selectedRow.goods.find(
      (good) => good.idOfferGood === idGood || good.idDemandGood === idGood
    );
    return good?.[key];
  }

  public getValueFromCounter(idGood: number, key: string): number {
    const good: ICounterOfferGood = this.selectedRow.goods.find(
      (good) => good.idOfferGood === idGood || good.idDemandGood === idGood
    );
    return good?.[key];
  }
}
