import { IGoodsSpecifications } from '@interfaces';
import { Component, OnInit, Input, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  DX_MODULES,
  pricingType,
  auctionType,
  ACTUAL_SIZE_READINESS_FIELDS,
  ACTUAL_SIZE_FIELDS,
  AgreementType,
  IdDirection,
  IdInterfaceField
} from '@constants';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '@classes';
import { CurrencyService } from '@services';
import { getNumber, round, getTranslateResultByCurrentLang, checkSameUnits, getVatNumber } from '@helpers';
import {
  UpperCaseFirstLetterPipe,
  ActualDimensionsPipe,
  ToNumberPipe,
  RuNumberFormatPipe,
  GoodAnalogDescriptionPipe,
  CheckDifferencesPipe,
  SortActualDimensionsPipe,
  ShowGoodsFieldsPipe,
  GoodsValuePipe,
  ActualValuePipe,
} from '@pipes';
import { DisplaySpecsDirective } from './../../shared/directives/display-specs-in-good-grid.directive';
import { OffersAdditionalInfoComponent } from '../../features/trading/components/offers-additional-info/offers-additional-info.component';

@Component({
  selector: 'app-compare-main-info',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    UpperCaseFirstLetterPipe,
    ActualDimensionsPipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    SortActualDimensionsPipe,
    DisplaySpecsDirective,
    GoodAnalogDescriptionPipe,
    ShowGoodsFieldsPipe,
    GoodsValuePipe,
    ActualValuePipe,
    OffersAdditionalInfoComponent,
    CheckDifferencesPipe,
  ],
  templateUrl: './compare-main-info.component.html',
  styleUrls: ['./compare-main-info.component.scss'],
})
export class CompareMainInfoComponent implements OnInit {
  private readonly currencyService = inject(CurrencyService);

  public readonly IdInterfaceField = IdInterfaceField;

  public readonly auctionType = auctionType;
  public readonly IdDirection = IdDirection;
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;

  @Input() fullInfo;
  @Input() fullInfoParent;
  @Input() sessionIds;
  @Input() idOffer;
  @Input() uniqueDeliveryScopes;

  user: User;

  currencyPrecision: any; //точность валюты
  uniqueDelConditions = []; //уникальные значения в массиве deliveryConditions
  basisValue: string; //выбранное значение для базисов
  deliveryConditionsChoose = []; //выбранный базис

  uniqueDelConditionsParent = []; //уникальные значения в массиве deliveryConditions
  basisValueParent: string; //выбранное значение для базисов
  deliveryConditionsChooseParent = []; //выбранный базис

  VatField: any; //Ставка НДС
  VatFieldParent: any; //Ставка НДС
  pricingType = pricingType;
  totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
    costVatForCompare: [],
    quantityForCompare: [],
  });
  goodInfo = false;
  viewInfoGood = null;
  totalRowData: any; //инфа в строку Итого по товарам
  expandTable: boolean = false;

  totalFormParent = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
    costVatForCompare: [],
    quantityForCompare: [],
  });
  totalRowDataParent: any; //инфа в строку Итого по товарам

  public showDifferences: boolean = false; //чекбокс показат отличия
  public sellerInformationHidden: boolean = true;
  public buyerInformationHidden: boolean = true;

  public readonly AgreementType = AgreementType;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currencyPrecision = null;
    this.getPrecision();
  }

  private getPrecision(): void {
    if (!this.currencyPrecision)
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.currency
          )?.fieldValueNumber
        )
        .subscribe((res: number) => {
          this.currencyPrecision = res;
          this.prepareGoods();
          this.prepareGoodsParent();
          this.compareFields();
        });
    else {
      this.prepareGoods();
      this.prepareGoodsParent();
      this.compareFields();
    }

    //если у родителя есть необязательная незаполненная хар-ка, которая появляется у ребенка - добавляем ее по индексу в том же порядке с пустым значением
    this.compareGoodsSpecs();
  }

  private compareGoodsSpecs(): void {
    const parentGoods = this.fullInfoParent.goods;
    const childGoods = this.fullInfo.goods;

    childGoods.forEach((childGood, goodIndex) => {
      const parentGood = parentGoods[goodIndex];

      const parentSpecMap = new Map(
        parentGood.goodsSpecifications.map((item) => [item.idInterfaceField, item])
      );

      childGood.goodsSpecifications.forEach((childItem, specIndex) => {
        if (!parentSpecMap.has(childItem.idInterfaceField)) {
          const newItem = {
            ...childItem,
            fieldValue: null,
            fieldValueNumber: null,
            fieldValueString: null,
          };

          parentGood.goodsSpecifications.splice(specIndex, 0, newItem);
        }
      });
    });
  }

  prepareGoodsParent() {
    this.processConditions(this.fullInfoParent.deliveryConditions, true);

    this.VatFieldParent = this.processGoodsForm(this.fullInfoParent, this.totalFormParent);

    this.fullInfoParent.goods.forEach((good) => {
      good.isOpened =
        this.fullInfoParent.generalInfo.directionId === IdDirection.buy; //в понижении открываем сразу
    });

    if (this.fullInfoParent.deliveryConditions?.length > 0) {
      this.onChangeBasisParent({ value: this.basisValueParent }); //сразу рассчитываем с проставленным базисом
    } else this.changeTotalCostParent(); //сразу рассчитываем без базиса
  }

  deletedGoods() {
    return this.fullInfoParent.goods.filter(
      (parent) =>
        !this.fullInfo.goods.find((current) => current.idGood == parent.idGood)
    );
  }

  prepareGoods() {
    this.processConditions(this.fullInfo.deliveryConditions, false);

    //если при редактировании товары обнулили(удалили), добавляем в текущие товары удаленный товар из родителя с 0
    if (this.deletedGoods()?.length > 0) {
      this.deletedGoods().forEach((deletedItem) => {
        const updatedItem = JSON.parse(JSON.stringify(deletedItem));

        updatedItem.goodsSpecifications.forEach((spec) => {
          if (
            spec.idInterfaceField === IdInterfaceField.quantity ||
            spec.idInterfaceField === IdInterfaceField.priceWithoutVAT
          ) {
            spec.fieldValueNumber = 0;
            spec.fieldValue = '0';
          }
        });

        const indexInParent = this.fullInfoParent.goods.findIndex(
          (item) => item.idGood === updatedItem.idGood
        );

        if (indexInParent !== -1) {
          this.fullInfo.goods.splice(indexInParent, 0, updatedItem);
        }
      });
    }

    this.VatField = this.processGoodsForm(this.fullInfo, this.totalForm);

    if (this.fullInfo.deliveryConditions?.length > 0) {
      this.onChangeBasis({ value: this.basisValue }); //сразу рассчитываем с проставленным базисом
    } else this.changeTotalCost(); //сразу рассчитываем без базиса

    //получаем точность валюты
    if (
      this.fullInfo.generalInfo.pricingTypeId ==
      pricingType.formulaWithQuotation
    ) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          ).fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
        });
    }
  }

  private processConditions(conditions, isParent: boolean): void {
    if (conditions?.length > 0) {
      const uniqueMap = [
        ...new Map(
          conditions.map((item) => [item['concatedCondition'], item])
        ).values(),
      ] as any[];

      const mainIndex = uniqueMap.findIndex((item) => item.isMain);
      let main = null;

      if (mainIndex !== -1) {
        [main] = uniqueMap.splice(mainIndex, 1);
        uniqueMap.unshift(main);
      }

      if (isParent) {
        this.uniqueDelConditionsParent = uniqueMap;
        this.basisValueParent = main?.concatedCondition;
      } else {
        this.uniqueDelConditions = uniqueMap;
        this.basisValue = main?.concatedCondition;
      }
    }
  }

  private processGoodsForm(info, totalForm): void {
    let vatField;

    info.goods.forEach((good) => {
      //Ставка НДС
      vatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.VATrate
      );

      //ищем поля с мультивыбором, группируя по idInterfaceField
      let groupFields = good.goodsSpecifications.reduce(function (r, a) {
        //сгруппированы поля по idInterfaceField
        r[a.idInterfaceField] = r[a.idInterfaceField] || [];
        r[a.idInterfaceField].push(a);
        return r;
      }, {});
      //получаем idInterfaceField, по тем полям, где выбрано больше одного значения
      let idMultiFields = Object.keys(groupFields).filter(
        (key) => Array.isArray(groupFields[key]) && groupFields[key].length > 1
      );

      idMultiFields.forEach((id) => {
        for (let i = 1; i < groupFields[id]?.length; i++) {
          groupFields[id][0].fieldValue =
            groupFields[id][0].fieldValue +
            '; ' +
            groupFields[id][i].fieldValue; //формируем строку значений из всех выбранных значений по полю с мультивыбором
        }
        groupFields[id] = [groupFields[id][0]]; //из массива данных с одинаковым idInterfaceField, делаем одно поле, в котором fieldValue включает в себя все выбранные значения
      });
      good.goodsSpecifications = Object.values(groupFields).flat(); //массив с индивидуальными idInterfaceField

      if (
        info.generalInfo.pricingTypeId !==
        this.pricingType.formulaWithoutQuotation
      ) {
        let count = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.quantity)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.priceWithoutVAT)
            .fieldValueNumber
        ); //Цена без НДС

        let vat: number = getVatNumber(vatField);

        const costWithoutVAT = round(
          count * priceWithoutVat,
          this.currencyPrecision
        );
        const amountVAT = round(
          costWithoutVAT * (vat / 100),
          this.currencyPrecision
        );
        const costVAT = costWithoutVAT + amountVAT;

        good.goodsSpecifications.push(
          {
            costWithoutVAT: costWithoutVAT,
            fieldName: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.offersTable.costNoVAT'
            ),
            fieldValue: costWithoutVAT,
          },
          {
            amountVAT: amountVAT,
            fieldName: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.offersTable.amountVAT'
            ),
            fieldValue: amountVAT,
          },
          {
            costVAT: costVAT,
            fieldName: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.offersTable.costVATShort'
            ),
            fieldValue: costVAT,
          }
        );
      }

      Object.assign(good, {
        currency: good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.currency)
          ?.fieldValue,
      }); //добавляем каждому товару Валюта

      const priceAdjustment = good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.amendmentType
      )?.fieldValueNumber;

      if (
        info.generalInfo.pricingTypeId == this.pricingType.formulaWithQuotation
      ) {
        let quoteCurrency = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.quoteCurrency
        )?.fieldValue;

        Object.assign(good, {
          quoteCurrency: quoteCurrency,
          priceAdjustment: priceAdjustment,
        });
      } else if (
        info.generalInfo.pricingTypeId ==
        this.pricingType.formulaWithoutQuotation
      ) {
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }
    });

    totalForm.controls.vat.patchValue(vatField.fieldValue);

    if (this.onSameUnits(info.goods)) {
      let volumeSum = 0;
      let precision;

      info.goods.forEach((good) => {
        const volume = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.quantity
        );
        volumeSum = volumeSum + volume.fieldValueNumber;
        precision = volume.fieldPrecision;
      });

      totalForm.controls.quantity.patchValue(
        Number(volumeSum).toLocaleString('ru', {
          maximumFractionDigits: precision,
        }) +
          ' ' +
          info.goods[0].unitName
      );

      totalForm.controls.quantityForCompare.patchValue(volumeSum);
    }

    return vatField;
  }

  public onSameUnits(data): boolean {
    return checkSameUnits(data);
  }

  onChangeBasisParent(e) {
    this.deliveryConditionsChooseParent = [];
    this.deliveryConditionsChooseParent =
      this.fullInfoParent.deliveryConditions.filter(
        (el) => el.concatedCondition == e.value
      );
    if (
      this.fullInfoParent.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      this.changeTotalCostParent();
    }
  }

  onChangeBasis(e) {
    this.deliveryConditionsChoose = [];
    this.deliveryConditionsChoose = this.fullInfo.deliveryConditions.filter(
      (el) => el.concatedCondition == e.value
    );
    if (
      this.fullInfo.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      this.changeTotalCost();
    }
  }

  public changeTotalCost(): void {
    this.calculateCosts(
      this.fullInfo,
      this.totalForm,
      this.VatField,
      this.deliveryConditionsChoose
    );

    this.totalRowData = this.totalForm.value;
  }

  public changeTotalCostParent(): void {
    this.calculateCosts(
      this.fullInfoParent,
      this.totalFormParent,
      this.VatFieldParent,
      this.deliveryConditionsChooseParent
    );

    this.totalRowDataParent = this.totalFormParent.value;
  }

  private calculateCosts(info, form, vatField, selectedBasis): void {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat: number = getVatNumber(this.VatField);

    if (info.generalInfo.pricingTypeId != pricingType.formulaWithoutQuotation) {
      info.goods.forEach((good) => {
        if (info.deliveryConditions?.length > 0) {
          selectedBasis.forEach((basis) => {
            if (
              basis.idDemandOfferGood ==
              good.goodsSpecifications[0].idDemandOfferGood
            ) {
              let count = this.getValueNumber(
                good.goodsSpecifications,
                IdInterfaceField.quantity
              ); //количество
              let priceWithoutVat = basis?.priceWithoutVat; //Цена без НДС

              let costWithoutVAT = round(
                count * priceWithoutVat,
                this.currencyPrecision
              );
              let amountVAT = round(
                costWithoutVAT * (vat / 100),
                this.currencyPrecision
              );
              let costVAT = costWithoutVAT + amountVAT;

              good.goodsSpecifications.forEach((item) => {
                if (item.costWithoutVAT) {
                  item.costWithoutVAT = costWithoutVAT;
                  item.fieldValue = costWithoutVAT;
                }
                if (item.amountVAT || item.amountVAT == 0) {
                  item.amountVAT = amountVAT;
                  item.fieldValue = amountVAT;
                }
                if (item.costVAT) {
                  item.costVAT = costVAT;
                  item.fieldValue = costVAT;
                }
              });

              costWithoutVatTotal = costWithoutVatTotal + costWithoutVAT;
              amountVATTotal = amountVATTotal + amountVAT;
              costVATTotal = costVATTotal + costVAT;
            }
          });
        } else {
          let count = this.getValueNumber(
            good.goodsSpecifications,
            IdInterfaceField.quantity
          ); //количество
          let priceWithoutVat = this.getValueNumber(
            good.goodsSpecifications,
            IdInterfaceField.priceWithoutVAT
          ); //Цена без НДС

          let costWithoutVAT = round(
            count * priceWithoutVat,
            this.currencyPrecision
          );
          let amountVAT = round(
            costWithoutVAT * (vat / 100),
            this.currencyPrecision
          );
          let costVAT = costWithoutVAT + amountVAT;

          good.goodsSpecifications.forEach((item) => {
            if (item.costWithoutVAT) {
              item.costWithoutVAT = costWithoutVAT;
              item.fieldValue = costWithoutVAT;
            }
            if (item.amountVAT || item.amountVAT == 0) {
              item.amountVAT = amountVAT;
              item.fieldValue = amountVAT;
            }
            if (item.costVAT) {
              item.costVAT = costVAT;
              item.fieldValue = costVAT;
            }
          });

          costWithoutVatTotal = costWithoutVatTotal + costWithoutVAT;
          amountVATTotal = amountVATTotal + amountVAT;
          costVATTotal = costVATTotal + costVAT;
        }
      });

      form.controls.costWithoutVat.patchValue(
        Number(costWithoutVatTotal).toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
          ' ' +
          info.goods?.[0]?.currency
      );
      form.controls.amountVAT.patchValue(
        Number(amountVATTotal).toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
          ' ' +
          info.goods?.[0]?.currency
      );
      form.controls.costVat.patchValue(
        costVATTotal.toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
          ' ' +
          info.goods?.[0]?.currency
      );

      form.controls.costVatForCompare.patchValue(costVATTotal);
    }
  }

  onViewInfo(good) {
    this.viewInfoGood = good.idGood;
    this.goodInfo = false;
  }

  getValue(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  public getValueNumber(
    goodsSpecifications: IGoodsSpecifications[],
    idInterfaceField: number
  ): number {
    return Number(
      goodsSpecifications.find((el) => el.idInterfaceField == idInterfaceField)
        ?.fieldValueNumber
    );
  }

  getGoodsSpecifications(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    );
  }

  public getValueParent(idGood: number, idField: number): number {
    return getNumber(
      this.getValue(
        this.fullInfoParent.goods.find(
          (good) => good?.goodsSpecifications[0].idDemandOfferGood == idGood
        )?.goodsSpecifications,
        idField
      )
    );
  }

  public getValueChild(idGood: number, idField: number): number {
    return getNumber(
      this.getValue(
        this.fullInfo.goods.find((good) => good?.idGood == idGood)
          ?.goodsSpecifications,
        idField
      )
    );
  }

  public getCurrency(idGood): void {
    return this.getValue(
      this.fullInfo.goods.find((good) => good?.idGood == idGood)
        ?.goodsSpecifications,
      IdInterfaceField.currency
    );
  }

  public getAmountVAT(idGood: number, isParent: boolean): number {
    const data = isParent ? this.fullInfoParent : this.fullInfo;

    let amountVAT;

    const findedGood = data.goods.find((good) => {
      return isParent
        ? good?.goodsSpecifications[0]?.idDemandOfferGood == idGood
        : good?.idGood == idGood;
    });

    findedGood?.goodsSpecifications.forEach((el) => {
      if ('amountVAT' in el) {
        amountVAT = el?.fieldValue;
      }
    });

    return Number(amountVAT);
  }

  public getNumberCost(idGood: number, isParent: boolean): number {
    const data = isParent ? this.fullInfoParent : this.fullInfo;

    let costVAT;

    const findedGood = data.goods.find((good) => {
      return isParent
        ? good?.goodsSpecifications[0]?.idDemandOfferGood == idGood
        : good?.idGood == idGood;
    });

    findedGood?.goodsSpecifications.forEach((el) => {
      if ('costVAT' in el) {
        costVAT = el?.costVAT;
      }
    });

    return Number(costVAT);
  }

  findGood(good) {
    return this.fullInfo.goods.find((el) => el.idGood == good.idGood);
  }

  compareFields() {
    this.fullInfo.generalInfo.deliveryConditionMatch =
      this.uniqueDelConditionsParent[0]?.concatedCondition ===
      this.uniqueDelConditions[0]?.concatedCondition;
    this.fullInfo.generalInfo.paymentConditionsMatch =
      this.fullInfoParent.generalInfo.concatedPaymentConditions ===
      this.fullInfo.generalInfo.concatedPaymentConditions;
    this.fullInfo.generalInfo.deliveryPeriodMatch =
      this.fullInfoParent.generalInfo.concatedDeliveryPeriod ===
      this.fullInfo.generalInfo.concatedDeliveryPeriod;
    this.fullInfo.generalInfo.totalAmountMatch =
      this.totalRowDataParent?.costVatForCompare ===
      this.totalRowData?.costVatForCompare;
    this.fullInfo.generalInfo.totalVolumeMatch =
      this.totalRowDataParent?.quantityForCompare ===
      this.totalRowData?.quantityForCompare;
    this.fullInfo.generalInfo.priceAdjustedMatch =
      this.getValue(
        this.fullInfoParent.goods[0].goodsSpecifications,
        IdInterfaceField.adjustedPrice
      ) ==
      this.getValue(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.adjustedPrice
      );
    this.compareGoods();
  }

  compareGoods() {
    if (this.fullInfo.goods?.length > 0) {
      this.fullInfo.goods.forEach((good) => {
        let matchingGoodParent = this.fullInfoParent.goods.find(
          (goodP) => goodP.idGood === good.idGood
        );
        let matchingGood = this.fullInfo.goods.find(
          (g) => g.idGood === good.idGood
        );

        if (matchingGoodParent && matchingGood) {
          good.volumeMatch = this.compareValueNumber(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.quantity
          );

          good.priceWithoutVatMatch = this.compareValueNumber(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.priceWithoutVAT
          );

          good.priceAdjustmentMatch = this.compareValueNumber(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.amendment
          );

          good.costVatMatch =
            matchingGoodParent.goodsSpecifications.find(
              (spec) => 'costVAT' in spec
            )?.fieldValue ===
            matchingGood.goodsSpecifications.find((spec) => 'costVAT' in spec)
              ?.fieldValue;

          good.vatMatch = this.compareValueNumber(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.VATrate
          );

          good.amountVATMatch =
            matchingGoodParent.goodsSpecifications.find(
              (spec) => 'amountVAT' in spec
            )?.fieldValue ===
            matchingGood.goodsSpecifications.find((spec) => 'amountVAT' in spec)
              ?.fieldValue;

          good.placeMatch = this.compareSpecMatch(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.productLocation
          );
          good.minPriceMatch = this.compareSpecMatch(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.minPrice
          );
          good.placeOfWorkMatch = this.compareSpecMatch(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.placeOfWork
          );
          good.financeSourceMatch = this.compareSpecMatch(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.financeSource
          );
          good.currencyMatch = this.compareSpecMatch(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.currency
          );
          good.expirationDateMatch = this.compareSpecMatch(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.expirationDate
          );
          good.wholesaleMarkupMatch = this.compareSpecMatch(
            matchingGoodParent?.goodsSpecifications,
            matchingGood?.goodsSpecifications,
            IdInterfaceField.wholesaleMarkup
          );
        }
      });
    }
  }

  private compareSpecMatch(
    parentSpecs: IGoodsSpecifications[],
    childSpecs: IGoodsSpecifications[],
    idInterfaceField: number
  ): boolean {
    return (
      this.getValue(parentSpecs, idInterfaceField) === this.getValue(childSpecs, idInterfaceField)
    );
  }

  private compareValueNumber(
    parentSpecs: IGoodsSpecifications[],
    childSpecs: IGoodsSpecifications[],
    idInterfaceField: number
  ): boolean {
    return (
      this.getValueNumber(parentSpecs, idInterfaceField) === this.getValueNumber(childSpecs, idInterfaceField)
    );
  }

  public getCompareValue(idGood: number, key: string): boolean {
    return this.fullInfo.goods.find((good) => good?.idGood === idGood)?.[key];
  }
}
