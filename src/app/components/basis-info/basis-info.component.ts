import { Component, OnInit, Input, inject } from '@angular/core';
import { DX_MODULES, pricingType } from '@constants';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '@classes';
import { CurrencyService, SummaryFormatterService } from '@services';
import { ToNumberPipe, RuNumberFormatPipe } from '@pipes';
import { DxGridContextMenuLocalizationDirective } from '../../shared/directives';
import { IdInterfaceField } from '@constants';
import { groupByConcatedCondition } from '@helpers';

@Component({
  selector: 'app-basis-info',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    ToNumberPipe,
    RuNumberFormatPipe,
    DxGridContextMenuLocalizationDirective
  ],
  templateUrl: './basis-info.component.html',
  styleUrls: ['./basis-info.component.scss'],
})
export class BasisInfoComponent implements OnInit {
  private readonly currencyService = inject(CurrencyService);
  readonly summaryFormatterService = inject(SummaryFormatterService);

  @Input() type;
  @Input() deliveryBases;
  @Input() deliveryBasesParent;
  @Input() goods;
  @Input() pricingTypeId;
  @Input() delivCond; //для сравнения базисов первоначальный массив
  @Input() isMine: boolean = false;
  user: User;
  pricingType = pricingType;
  currencyPrecision: any; //точность валюты

  uniqueDelConditionsParent = []; //уникальные значения в массиве deliveryConditionsParent
  mainBasisParent: any;

  ngOnInit(): void {}

  ngOnChanges(): void {
    // todo avoid subscribe inside subscribe
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currencyService
      .getPrecision(
        this.user?.token,
        this.goods[0].goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.currency
        )?.fieldValueNumber
      )
      .subscribe((res) => {
        this.currencyPrecision = res;
      });
    if (this.deliveryBases.length > 0 && !this.deliveryBases[0][1]) {
      //базисы поставки
      this.deliveryBases.forEach((basis) => {
        this.goods.forEach((good) => {
          if (
            good.goodsSpecifications[0].idDemandOfferGood ==
            basis.idDemandOfferGood
          ) {
            Object.assign(basis, {
              goodName: good.goodName,
              unitName: good.unitName,
              properties: good.goodDescription,
              volume: good.goodsSpecifications.find(
                (el) => el.idInterfaceField === IdInterfaceField.quantity
              ).fieldValueNumber, //количество
              quotation:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField === IdInterfaceField.quotation
                )?.fieldValue || null, //Котировка
              quoteCurrency:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField === IdInterfaceField.quoteCurrency
                )?.fieldValue || null, //Валюта котировки
              amendment:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField === IdInterfaceField.amendment
                )?.fieldValue || null, //поправка
              priceAdjustment:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField === IdInterfaceField.amendmentType
                )?.fieldValueNumber || null, //Тип поправки
              currency: good.goodsSpecifications.find(
                (el) => el.idInterfaceField === IdInterfaceField.currency
              ).fieldValue, //Валюта
              costVat: this.costVatBasis(
                basis.priceWithoutVat,
                good.goodsSpecifications.find((el) => el.idInterfaceField === IdInterfaceField.VATrate),
                good.goodsSpecifications.find((el) => el.idInterfaceField === IdInterfaceField.quantity)
                  .fieldValueNumber
              ),
              volumePrecision: good.goodsSpecifications.find(
                (field) => field.idInterfaceField === IdInterfaceField.quantity
              ).fieldPrecision,
            });
          }
        });
      });

      let mainBasis = this.deliveryBases.find((el) => el.isMain == true);
      this.deliveryBases.splice(this.deliveryBases.indexOf(mainBasis), 1);
      this.deliveryBases.splice(0, 0, mainBasis);
      this.deliveryBases = groupByConcatedCondition(this.deliveryBases ?? []);
      this.deliveryBases = Object.entries(this.deliveryBases);
    }

    if (this.type == 'compareOffer') {
      if (this.deliveryBasesParent?.length > 0) {
        this.uniqueDelConditionsParent = [
          ...new Map(
            this.deliveryBasesParent.map(
              (
                item //уникальные значения в массиве deliveryConditionsParent
              ) => [item['concatedCondition'], item]
            )
          ).values(),
        ];
        this.mainBasisParent = this.uniqueDelConditionsParent.find(
          (basis) => basis.isMain == true
        );
        this.uniqueDelConditionsParent.splice(
          this.uniqueDelConditionsParent.indexOf(this.mainBasisParent),
          1
        );
        this.uniqueDelConditionsParent.splice(0, 0, this.mainBasisParent);
      }
    }
  }


  get isMinFieldVisible(): boolean {
    const minPriceField: boolean =
      (this.user?.IsWorker || this.isMine) &&
      !!this.goods[0].goodsSpecifications?.find(
        (it) => it.idInterfaceField === IdInterfaceField.minPrice
      );

    return (
      this.pricingTypeId !== pricingType?.formulaWithoutQuotation &&
      minPriceField
    );
  }

  costVatBasis(priceWithoutVat, vatBasis, volume) {
    let vat;
    if (vatBasis.fieldValueNumber != 1) {
      vat = Number(vatBasis.fieldValue.replace(/[^0-9]/g, ''));
    } else vat = 0;
    return (
      Math.round(
        (volume * priceWithoutVat + (volume * priceWithoutVat * vat) / 100) *
          100
      ) / 100
    );
  }

  includeBasis(basis) {
    //сравнение базиса для тэга Изменен
    let delivCond = this.delivCond.map((el) => ({
      concatedCondition: el.concatedCondition,
      idBasisLink: el.idBasisLink,
      idBasisValue: el.idBasisValue,
      idPlaceLink: el.idPlaceLink,
      idPlaceValue: el.idPlaceValue,
      isMain: el.isMain,
      placeDetails: el.placeDetails,
      placeName: el.placeName,
      priceAdjustment: el.priceAdjustment,
      priceWithoutVat: el.priceWithoutVat,
      minPriceWithoutVat: el.minPriceWithoutVat,
    }));
    let deliveryConditionsParent = this.deliveryBasesParent.map((el) => ({
      concatedCondition: el.concatedCondition,
      idBasisLink: el.idBasisLink,
      idBasisValue: el.idBasisValue,
      idPlaceLink: el.idPlaceLink,
      idPlaceValue: el.idPlaceValue,
      isMain: el.isMain,
      placeDetails: el.placeDetails,
      placeName: el.placeName,
      priceAdjustment: el.priceAdjustment,
      priceWithoutVat: el.priceWithoutVat,
      minPriceWithoutVat: el.minPriceWithoutVat,
    }));

    let arrayForComparison = delivCond.find(
      (el) => el.idBasisLink == basis.idBasisLink
    );
    let arrayParentForComparison = deliveryConditionsParent.find(
      (el) => el.idBasisLink == basis.idBasisLink
    );
    return (
      JSON.stringify(arrayForComparison) ===
      JSON.stringify(arrayParentForComparison)
    );
  }

  addedBasis(basis) {
    //сравнение базиса для тэга Добавлен
    let deliveryConditionsParent = this.deliveryBasesParent.map((el) => ({
      concatedCondition: el.concatedCondition,
      idBasisLink: el.idBasisLink,
      idBasisValue: el.idBasisValue,
      idPlaceLink: el.idPlaceLink,
      idPlaceValue: el.idPlaceValue,
      isMain: el.isMain,
      placeDetails: el.placeDetails,
      placeName: el.placeName,
      priceAdjustment: el.priceAdjustment,
      priceWithoutVat: el.priceWithoutVat,
    }));
    let addedBasis = deliveryConditionsParent.find(
      (el) => el.idBasisLink == basis.idBasisLink
    );
    return addedBasis ? false : true; //если нашли базис в родителе, значит он НЕдобавлен
  }

}
