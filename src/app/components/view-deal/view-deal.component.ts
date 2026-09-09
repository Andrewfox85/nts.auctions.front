import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  output,
} from '@angular/core';
import { DxScrollViewModule, DxTooltipModule } from 'devextreme-angular';
import { User } from '@classes';
import {
  ACTUAL_SIZE_FIELDS,
  ACTUAL_SIZE_READINESS_FIELDS,
  IdInterfaceField,
  pricingType,
  AgreementType
} from '@constants';
import { FormBuilder } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  PopupSidebarService,
  CurrencyService,
  TransactionService,
} from '@services';
import { CommonModule } from '@angular/common';
import {
  RestoreDealPopupComponent,
  RefuseDealPopupComponent,
} from '@components';
import { downloadFile, round, getTranslateResultByCurrentLang, checkSameUnits, getVatNumber } from '@helpers';
import { ActualDimensionsPipe, RuNumberFormatPipe, ToNumberPipe, GoodAnalogDescriptionPipe } from '@pipes';
import { HomePageStore } from '../../views/homepage/store';
import { AUCTION_TYPE } from '@enums';
import { AdditionalInfoDealComponent, GoodsDealsComponent, TermsDealComponent } from '@components';

@Component({
  selector: 'app-view-deal',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DxScrollViewModule,
    DxTooltipModule,
    RestoreDealPopupComponent,
    RefuseDealPopupComponent,
    ActualDimensionsPipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    GoodAnalogDescriptionPipe,
    AdditionalInfoDealComponent,
    GoodsDealsComponent,
    TermsDealComponent
  ],
  templateUrl: './view-deal.component.html',
  styleUrls: ['./view-deal.component.scss'],
})
export class ViewDealComponent implements OnInit {
  private readonly currencyService = inject(CurrencyService);
  private readonly transactionService = inject(TransactionService);

  private readonly homePageStore = inject(HomePageStore);

  private readonly idActionType = this.homePageStore.idAuctionType();
  public readonly IdInterfaceField = IdInterfaceField;

  public readonly isShowCostwithoutVat = signal(false);
  public readonly onHeddienMainPopup = output();
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;
  public readonly AgreementType = AgreementType;

  public user: User;
  @Input() fullInfo;
  @Input() idOffer;
  @Input() sessionIds;

  public offerGeneralHidden: boolean = false;
  public sellerInformationHidden: boolean = false;
  public addInfo: boolean = false;
  public generalInfo: any;
  public goods: any;
  public documents: any;

  public readonly pricingType = pricingType;
  public expandTable: boolean = false;

  public VatField: any; //Ставка НДС
  public currencyPrecision: any; //точность валюты
  public quoteCurrencyPrecision: any; //точность валюты
  public totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  public goodInfo: boolean = false;
  public viewInfoGood: number = null;
  public totalRowData: any; //инфа в строку Итого по товарам

  public refusePopup: boolean = false;
  public restorePopup: boolean = false;
  public resultPopup: boolean = false;

  constructor(
    public translate: TranslateService,
    private formBuilder: FormBuilder,
    private popupSidebarService: PopupSidebarService
  ) {}

  //провереям договор продаца/покупателя для отображения кнопки редактирования сделки
  get isCommisionContractType(): boolean {
    return (
      (this.idActionType === AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION &&
        this.generalInfo?.buyerInfo?.buyerIdClientContractType ===
          AgreementType.Commission) ||
      (this.idActionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION &&
        this.generalInfo?.sellerInfo?.sellerIdClientContractType ===
          AgreementType.Commission)
    );
  }

  ngOnInit(): void {}

  public ngOnChanges(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.generalInfo = this.fullInfo?.transactionGeneral;
    this.goods = this.fullInfo?.goods;
    this.documents = this.fullInfo?.documents;

    const isMinPrice = this.goods?.[0]?.goodsSpecifications.find(
      (el) => el.idInterfaceField === this.IdInterfaceField.minPrice
    );
    this.isShowCostwithoutVat.update(
      () => this.idActionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION && isMinPrice
    );
    this.getPrecision();
  }

  private getPrecision(): void {
    if (!this.currencyPrecision)
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.currency
          )?.fieldValueNumber
        )
        .subscribe((res: number) => {
          this.currencyPrecision = res;
          this.prepareGoods();
        });
    else this.prepareGoods();
  }

  public prepareGoods(): void {
    //добавляем в товары стоимость ндс/стоимость с/без ндс
    this.goods.forEach((good) => {
      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.VATrate
      ); //Ставка НДС
      good.isOpened = false; //для открытия подробного просмотра в таблице
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
        this.generalInfo.pricingTypeId !=
        this.pricingType.formulaWithoutQuotation
      ) {
        // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
        let count = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.quantity)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.priceWithoutVAT)
            .fieldValueNumber
        ); //Цена без НДС
        let vat: number = getVatNumber(this.VatField);

        let costWithoutVAT: number = round(
          count * priceWithoutVat,
          this.currencyPrecision
        );
        let amountVAT = round(
          costWithoutVAT * (vat / 100),
          this.currencyPrecision
        );
        let costVAT = costWithoutVAT + amountVAT;

        good.goodsSpecifications.push(
          {
            costWithoutVAT: costWithoutVAT,
            fieldName: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.costNoVAT'),
            fieldValue: costWithoutVAT,
          },
          {
            amountVAT: amountVAT,
            fieldName: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.amountVAT'),
            fieldValue: amountVAT,
          },
          {
            costVAT: costVAT,
            fieldName: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.costVATShort'),
            fieldValue: costVAT,
          }
        );
      }

      Object.assign(good, {
        currency: good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.currency
        ).fieldValue,
      }); //добавляем каждому товару Валюта

      if (
        this.generalInfo.pricingTypeId == this.pricingType.formulaWithQuotation
      ) {
        let quoteCurrency = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.quoteCurrency
        ).fieldValue; //Валюта котировки
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.amendmentType
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, {
          quoteCurrency: quoteCurrency,
          priceAdjustment: priceAdjustment,
        });
      }
      if (
        this.generalInfo.pricingTypeId ==
        this.pricingType.formulaWithoutQuotation
      ) {
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.amendmentType
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }
    });

    this.totalForm.controls.vat.patchValue(this.VatField.fieldValue); //Ставка НДС (%)

    if (this.onSameUnits) {
      //общее количество
      let volumeSum = 0,
        precision;
      this.goods.forEach((good) => {
        let volume = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.quantity
        );
        volumeSum = volumeSum + volume.fieldValueNumber;
        precision = volume.fieldPrecision;
      });
      this.totalForm.controls.quantity.patchValue(
        Number(volumeSum).toLocaleString('ru', {
          maximumFractionDigits: precision,
        }) +
          ' ' +
          this.goods[0].unitName
      );
    }
    this.setTotalCost();

    //получаем точность валюты
    if (this.generalInfo.pricingTypeId == pricingType.formulaWithQuotation) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.currency
          ).fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
        });
    }
  }

  public setTotalCost(): void {
    //рассчитываем стоимость с НДС
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat: number = getVatNumber(this.VatField);

    if (this.generalInfo.pricingTypeId != pricingType.formulaWithoutQuotation) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.currency
          )?.fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
          this.goods.forEach((good) => {
            let count = Number(
              good.goodsSpecifications.find(
                (field) => field.idInterfaceField === IdInterfaceField.quantity
              ).fieldValueNumber
            ); //количество
            let priceWithoutVat = Number(
              good.goodsSpecifications.find(
                (field) => field.idInterfaceField === IdInterfaceField.priceWithoutVAT
              ).fieldValueNumber
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
          });

          this.totalForm.controls.costWithoutVat.patchValue(
            Number(costWithoutVatTotal).toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.goods[0].currency
          );
          this.totalForm.controls.amountVAT.patchValue(
            Number(amountVATTotal).toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.goods[0].currency
          );
          this.totalForm.controls.costVat.patchValue(
            costVATTotal.toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.goods[0].currency
          );

          this.totalRowData = this.totalForm.value;
        });
    }
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.goods);
  }

  public onViewInfo(good): void {
    this.viewInfoGood = good.idGood;
    this.goodInfo = false;
  }

  public getNumberFee(int: number): number {
    return Number(int);
  }

  public downloadDoc(file): void {
    this.transactionService
      .getTransactDocContent(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.generalInfo.idTransaction,
        file.idDocument
      )
      .subscribe((res) => {
        downloadFile(res.content, file.filename);
      });
  }

  public onOpenRefusePopup(): void {
    this.refusePopup = true;
  }

  public closeRefusePopup(event: boolean): void {
    this.refusePopup = event;
  }

  public closeRefuseResultPopup(event: boolean): void {
    this.onHeddienMainPopup.emit();
    this.resultPopup = event;
  }

  public onOpenRestorePopup(): void {
    this.restorePopup = true;
  }

  //todo обновлять инфу
  public closeRestorePopup(event: boolean): void {
    this.restorePopup = event;
  }

  public onDealRestored(event): void {
    const transactionId = event.transactionId;
    this.transactionService
      .getTransactionFullInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        transactionId
      )
      .subscribe((res) => {
        this.fullInfo = res;
      });
  }

  public onOpenEditDeal(): void {
    let dataForReq = Object.assign(this.sessionIds);
    this.popupSidebarService.onShowPopupSidebar({
      dataForReq: dataForReq,
      type: 'editDeal',
    });

    this.transactionService
      .getTransactionFullInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.generalInfo.idTransaction
      )
      .subscribe((res) => {
        this.fullInfo = res;
        let dataForReq = Object.assign(this.sessionIds);
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'editDeal',
          idOffer: this.generalInfo.idTransaction,
          fullInfo: this.fullInfo,
        });
      });
  }
}
