import { Injectable } from '@angular/core';
import {
  IdInterfaceField,
  CURRENCY_PRECISION,
  FULL_PERCENT,
  NO_BASIS,
  DELIVERY_COND_BLOCK,
} from '@constants';
import { round, groupByConcatedCondition } from '@helpers';
import {
  Good,
  GoodValue,
  GoodsSpecification,
} from './demand-service/shared/interfaces/index';

interface IGoodDeliveryDetails {
  goodId: number;
  goodGroupId: number;
  goodNomenclatureId: number;
  goodNameId: number;
  goodValues: GoodValue[];
  goodName: string;
  unitId: number;
  unitName: string;
  properties: string;
  volume: number;
  quotation: number;
  quoteCurrency: string;
  amendment: number;
  priceAdjustment: number;
  currency: string;
  currencyId: number;
  vat: number;
  costVat: number;
}

@Injectable({
  providedIn: 'root',
})
export class EditPriceStepService {
  constructor() {}

  public prepareDeliveryConditions(data: any, vatPercent: number): void {
    //когда базисы есть - привязываем товары к ним
    if (
      data?.deliveryConditions?.length > 0 &&
      !data?.deliveryConditions[DELIVERY_COND_BLOCK.CONCATED_CONDITION][
        DELIVERY_COND_BLOCK.COND_INFO
      ]
    ) {
      data.deliveryConditions.forEach((basis) => {
        data.goods.forEach((good) => {
          if (
            good.goodsSpecifications[0].idDemandOfferGood ===
            basis.idDemandOfferGood
          ) {
            Object.assign(
              basis,
              this.mapGoodFields(good, basis.priceWithoutVat, vatPercent)
            );
          }
        });
      });

      let mainBasis: any = data.deliveryConditions.find((el) => el.isMain);
      data.deliveryConditions = [
        mainBasis,
        ...data.deliveryConditions.filter((item) => item !== mainBasis),
      ];

      //сгруппированы поля по concatedCondition
      data.deliveryConditions = groupByConcatedCondition(data.deliveryConditions ?? []);
      data.deliveryConditions = Object.entries(data.deliveryConditions);
      //если базисов нет создаем структуру c "пустым" базисом
    } else if (
      data?.goods?.length > 0 &&
      data.deliveryConditions.length === 0
    ) {
      const emptyConditions: any = data.goods.map((good) => {
        // создаем "пустой" базис на основе товара
        const emptyBasis: any = {
          idDemandOfferGood: good.goodsSpecifications[0]?.idDemandOfferGood,
          concatedCondition: NO_BASIS,
          priceWithoutVat: this.getValue(
            good.goodsSpecifications,
            IdInterfaceField.priceWithoutVAT,
            'fieldValueNumber'
          ) as number,
        };

        return Object.assign(
          emptyBasis,
          this.mapGoodFields(good, emptyBasis.priceWithoutVat, vatPercent)
        );
      });

      const grouped: any = groupByConcatedCondition(emptyConditions);
      data.deliveryConditions = Object.entries(grouped);
    }
  }

  private mapGoodFields(
    good: Good,
    priceWithoutVat: number,
    vat: number
  ): IGoodDeliveryDetails {
    return {
      goodId: good.idGood,
      goodGroupId: good.idGoodGroup,
      goodNomenclatureId: good.idNomenclatureGroup,
      goodNameId: good.idGoodName,
      goodValues: good.goodValues,
      goodName: good.goodName,
      unitId: good.unitId,
      unitName: good.unitName,
      properties: good.goodDescription,
      volume: this.getValue(
        good.goodsSpecifications,
        IdInterfaceField.quantity,
        'fieldValueNumber'
      ) as number,
      quotation:
        (this.getValue(
          good.goodsSpecifications,
          IdInterfaceField.quotation,
          'fieldValue'
        ) as number) || null,
      quoteCurrency:
        (this.getValue(
          good.goodsSpecifications,
          IdInterfaceField.quoteCurrency,
          'fieldValue'
        ) as string) || null,
      amendment:
        (this.getValue(
          good.goodsSpecifications,
          IdInterfaceField.amendment,
          'fieldValue'
        ) as number) || null,
      priceAdjustment:
        (this.getValue(
          good.goodsSpecifications,
          IdInterfaceField.amendmentType,
          'fieldValueNumber'
        ) as number) || null,
      currency: this.getValue(
        good.goodsSpecifications,
        IdInterfaceField.currency,
        'fieldValue'
      ) as string,
      currencyId: this.getValue(
        good.goodsSpecifications,
        IdInterfaceField.currency,
        'fieldValueNumber'
      ) as number,
      vat: vat,
      costVat: this.costVatBasis(
        priceWithoutVat,
        good.goodsSpecifications.find(
          (el) => el.idInterfaceField == IdInterfaceField.VATrate
        ),
        this.getValue(
          good.goodsSpecifications,
          IdInterfaceField.quantity,
          'fieldValueNumber'
        ) as number
      ),
    };
  }

  private getValue(
    specs: GoodsSpecification[],
    idField: number,
    prop: string
  ): string | number {
    const found: GoodsSpecification = specs.find(
      (field) => field.idInterfaceField == idField
    );
    return found ? found[prop] : null;
  }

  private costVatBasis(
    priceWithoutVat: number,
    vatBasis: any,
    volume: number
  ): number {
    let vat: number;
    if (vatBasis.fieldValueNumber != 1) {
      vat = Number(vatBasis.fieldValue.replace(/[^0-9]/g, ''));
    } else {
      vat = 0;
    }
    return (
      round(volume * priceWithoutVat, CURRENCY_PRECISION) +
      round((volume * priceWithoutVat * vat) / FULL_PERCENT, CURRENCY_PRECISION)
    );
  }
}
