import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { User, PageCache } from '@classes';
import {
  auctionType,
  IdDirection,
  pricingType,
  sessionStage,
  statusOffersFilters,
  IdSessionPeriods,
  IdActivationMode,
  ACTUAL_SIZE_READINESS_FIELDS,
  ACTUAL_SIZE_FIELDS,
  AgreementType,
  MAXIMUM_GOODS_LENGTH,
  IdInterfaceField
} from '@constants';
import { FormBuilder } from '@angular/forms';
import {
  PopupSidebarService,
  CommonService,
  TradingService,
  AppConfigService,
  DemandService,
  AccessService,
  CurrencyService,
  BidService,
  TargetedService,
  DataRefreshService,
  EditPriceStepService
} from '@services';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  CheckActivationModeComponent,
  EditPriceStepPopupComponent,
  RejectionOfferPopupComponent,
  RestoreOfferPopupComponent,
  DeleteOfferPopupComponent,
  ResultPopupComponent
} from '@components';
import { getNumber, round, getTranslateResultByCurrentLang, checkSameUnits, getVatNumber } from '@helpers';
import {
  UpperCaseFirstLetterPipe,
  ActualDimensionsPipe,
  ToNumberPipe,
  RuNumberFormatPipe,
  GoodAnalogDescriptionPipe
} from '@pipes';
import { TradingRemovingleadBidPayload } from '../../services/bid-service/shared';
import {
  DxScrollViewModule,
  DxTooltipModule,
  DxSelectBoxModule,
  DxPopupModule,
  DxToastModule,
} from 'devextreme-angular';
import { ID_DIRECTION_TRADER_ROLE } from '@enums';
import { ApiStore, GlobalStore } from '@store';
import { LocalStorageService } from '@shared-services';
import { SortActualDimensionsPipe } from '../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe';
import { DisplaySpecsDirective } from './../../shared/directives/display-specs-in-good-grid.directive';
import { IApiDataSection } from '@interfaces';
import { OffersAdditionalInfoComponent } from '../../features/trading/components/offers-additional-info/offers-additional-info.component';
@Component({
  selector: 'app-main-info',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DxScrollViewModule,
    DxTooltipModule,
    DxSelectBoxModule,
    DxPopupModule,
    DxToastModule,
    CheckActivationModeComponent,
    DeleteOfferPopupComponent,
    EditPriceStepPopupComponent,
    RestoreOfferPopupComponent,
    RejectionOfferPopupComponent,
    UpperCaseFirstLetterPipe,
    ActualDimensionsPipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    SortActualDimensionsPipe,
    ResultPopupComponent,
    GoodAnalogDescriptionPipe,
    DisplaySpecsDirective,
    OffersAdditionalInfoComponent
  ],
  templateUrl: './main-info.component.html',
  styleUrls: ['./main-info.component.scss'],
})
export class MainInfoComponent implements OnInit {
  private readonly demandService = inject(DemandService);
  private readonly accessService = inject(AccessService);
  private readonly currencyService = inject(CurrencyService);
  private readonly bidService = inject(BidService);
  private readonly targetedService = inject(TargetedService);
  private readonly commonService = inject(CommonService);
  private readonly translate = inject(TranslateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly tradingService = inject(TradingService);
  private readonly popupSidebarService = inject(PopupSidebarService);
  private readonly config = inject(AppConfigService);
  private readonly router = inject(Router);
  private readonly globalStore = inject(GlobalStore);
  private readonly apiStore = inject(ApiStore);
  private readonly dataRefreshService = inject(DataRefreshService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly editPriceStepService = inject(EditPriceStepService);

  user: User;

  @Input() generalInfo;
  @Input() goods;
  @Input() documents;
  @Input() deliveryConditions;
  @Input() uniqueDeliveryScopes;
  @Input() sessionIds;
  @Input() sessionInfo;
  @Input() isMine;
  @Input() idDirectionRole;
  @Input() isAllowAnalog: boolean;
  @Output() totalBlockData = new EventEmitter<Object>();

  public readonly statusOffersFilters = statusOffersFilters;
  public readonly IdSessionPeriods = IdSessionPeriods;
  public readonly IdActivationMode = IdActivationMode;
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;
  public readonly MAXIMUM_GOODS_LENGTH = MAXIMUM_GOODS_LENGTH;
  public readonly AgreementType = AgreementType;
  public readonly IdInterfaceField = IdInterfaceField;

  public offerGeneralHidden = false;
  public sellerInformationHidden = true;
  public buyerInformationHidden = true;
  public buySaleCond = false;

  public expandTable = false;

  pricingType = pricingType;
  VatField: any; //Ставка НДС
  uniqueDelConditions = []; //уникальные значения в массиве deliveryConditions
  basisValue: string; //выбранное значение для базисов
  deliveryConditionsChoose = []; //выбранный базис
  privileges: boolean = false;
  cache = {} as PageCache;
  currencyPrecision: any; //точность валюты
  quoteCurrencyPrecision: any; //точность валюты

  totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  restorePopupType: string;

  rejectionPopup: boolean = false;
  resultPopup: boolean = false;
  resultData;
  sessionsParam; //для передачи на форму результата

  admissionOptions: any;
  restorePopup: boolean = false;
  isVisibleToast = false;
  message: string = ' ';

  goodInfo = false;
  viewInfoGood = null;
  totalRowData: any; //инфа в строку Итого по товарам

  fullInfo: any = [];

  isVisibleRemoveBidPopup: boolean = false;
  deletePopup: boolean = false;
  directSession: boolean = false;

  protected readonly IdDirection = IdDirection;
  protected readonly auctionType = auctionType;
  protected readonly sessionStage = sessionStage;


  public ngOnInit(): void {
    const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();
    let sectionDescription: string = sectionsArray.find(
      (el: IApiDataSection): boolean => Number(el.id) === Number(this.sessionIds.sectionId)
    )?.description;
    sectionDescription = 'TradingEditItem' + sectionDescription;
    this.privileges = this.commonService.checkPrivileges(sectionDescription);
  }

  public ngOnChanges(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.cache = JSON.parse(sessionStorage.getItem('AUCTIONS')) || {};
    this.currencyPrecision = null;
    this.getPrecision();

    if (
      this.sessionInfo.sessionInfo.isAllowedTargetedTransact &&
      this.sessionInfo.sessionInfo.sessionStageId == 7 &&
      this.sessionInfo.sessionInfo.sessionStatusId == 4 &&
      this.sessionInfo.sessionInfo.datetimeEnd != null
    ) {
      this.directSession = true;
    } else {
      this.directSession = false;
    }
  }

  public onSellerInformationChange(): void {
    this.sellerInformationHidden = !this.sellerInformationHidden;
  }

  public onBuyerInformationChange(): void {
    this.buyerInformationHidden = !this.buyerInformationHidden;
  }

  private getPrecision(): void {
    if (!this.currencyPrecision)
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          )?.fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
          this.prepareGoods();
        });
    else this.prepareGoods();
  }

  prepareGoods() {
    if (this.deliveryConditions?.length > 0) {
      this.uniqueDelConditions = [
        ...new Map(
          this.deliveryConditions.map(
            (
              item //уникальные значения в массиве deliveryConditions
            ) => [item['concatedCondition'], item]
          )
        ).values(),
      ];
      let main = this.uniqueDelConditions.find((basis) => basis.isMain == true);
      this.basisValue = main?.concatedCondition;
      this.uniqueDelConditions.splice(
        this.uniqueDelConditions.indexOf(main),
        1
      );
      this.uniqueDelConditions.splice(0, 0, main);
    }

    //добавляем в товары стоимость ндс/стоимость с/без ндс
    this.goods.forEach((good) => {
      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField == 5
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
          good.goodsSpecifications.find((field) => field.idInterfaceField == 1)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField == 3)
            .fieldValueNumber
        ); //Цена без НДС
        let vat: number = getVatNumber(this.VatField);

        let costWithoutVAT = round(
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
          (field) => field.idInterfaceField == 4
        ).fieldValue,
      }); //добавляем каждому товару Валюта

      if (
        this.generalInfo.pricingTypeId == this.pricingType.formulaWithQuotation
      ) {
        let quoteCurrency = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 55
        ).fieldValue; //Валюта котировки
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 53
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
          (field) => field.idInterfaceField == 53
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }
    });

    this.totalForm.controls.vat.patchValue(this.VatField.fieldValue); //Ставка НДС (%)
    if (this.onSameUnits) {
      //Количество
      let volumeSum = 0,
        precision;
      this.goods.forEach((good) => {
        let volume = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 1
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
    if (this.deliveryConditions?.length > 0) {
      this.onChangeBasis({ value: this.basisValue }); //сразу рассчитываем с проставленным базисом
    } else this.changeTotalCost(); //сразу рассчитываем без базиса

    //получаем точность валюты
    if (this.generalInfo.pricingTypeId == pricingType.formulaWithQuotation) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          ).fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
        });
    }
  }

  getValue(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  getValueNumber(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValueNumber;
  }

  getNumberCost(value) {
    let costVAT;
    value.forEach((el) => {
      if ('costVAT' in el) {
        costVAT = el?.costVAT;
      }
    });
    return Number(costVAT);
  }

  getAmountVAT(value) {
    let amountVAT;
    value.forEach((el) => {
      if ('amountVAT' in el) {
        amountVAT = el?.fieldValue;
      }
    });
    return Number(amountVAT);
  }

  changeTotalCost() {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat: number = getVatNumber(this.VatField);
    if (this.generalInfo.pricingTypeId != pricingType.formulaWithoutQuotation) {
      this.goods.forEach((good) => {
        if (this.deliveryConditions?.length > 0) {
          this.deliveryConditionsChoose.forEach((basis) => {
            if (
              basis.idDemandOfferGood ==
              good.goodsSpecifications[0].idDemandOfferGood
            ) {
              let count = Number(
                good.goodsSpecifications.find(
                  (field) => field.idInterfaceField == 1
                ).fieldValueNumber
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
          let count = Number(
            good.goodsSpecifications.find(
              (field) => field.idInterfaceField == 1
            ).fieldValueNumber
          ); //количество
          let priceWithoutVat = Number(
            good.goodsSpecifications.find(
              (field) => field.idInterfaceField == 3
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
        }
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
    }
  }

  getDataFromBasis(good, idField) {
    let find = this.deliveryConditionsChoose?.find(
      (b) =>
        b.idDemandOfferGood == good.goodsSpecifications[0].idDemandOfferGood
    );
    if (idField == 3) {
      //Цена без НДС
      return find.priceWithoutVat;
    } else {
      //Поправка
      return find.priceAdjustment;
    }
  }

  onChangeBasis(e) {
    this.deliveryConditionsChoose = [];
    this.deliveryConditionsChoose = this.deliveryConditions.filter(
      (el) => el.concatedCondition == e.value
    );
    if (this.generalInfo.pricingTypeId != pricingType.formulaWithoutQuotation) {
      this.changeTotalCost();
    }
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.goods);
  }

  onOpenRejectionOffer() {
    this.rejectionPopup = true;
  }

  closeRejectionPopup(event) {
    this.rejectionPopup = event;
  }

  popupIsActivatedTransferToBids = false;

  //проверяет текущее состояние режима активации заявок в связке с торговым периодом
  checkActivationMode(type: string) {
    this.commonService
      .CheckActivationMode(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.generalInfo.directionId == IdDirection.sale ? 1 : 0,
        this.generalInfo.directionId == IdDirection.buy ? 1 : 0
      )
      .then((res: any) => {
        if (res.isCanBeActivated && type === 'restore') {
          this.popupIsActivatedTransferToBids = true;
        } else this.checkAdmissionProcessed(type);
      });
  }

  // выполнялась ли процедура допуска и получение его параметров если выполнялась
  public checkAdmissionProcessed(type: string): void {
    this.accessService
      .isAdmissionProcessed(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId
      )
      .subscribe((res) => {
        if (res === true) {
          this.accessService
            .buceGetAdmissionOptions(
              this.user?.token,
              this.sessionIds.sectionId,
              this.sessionIds.sessionId
            )
            .subscribe((res) => {
              this.admissionOptions = res.admissionOptions[0];
              this.restorePopup = true;
              this.restorePopupType = type;
            });
        } else {
          type === 'restore' ? this.restoreOffer() : this.activateOffer();
        }
      });
  }

  activateOffer(): void {
    const body = {
      idDirection: this.generalInfo.directionId,
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      demandOfferIds: [this.generalInfo.idDemandOffer],
      isControlViolations: true,
      isControlDeposit: true,
      isLockDeposit: true,
    };

    this.demandService
      .activateInactive(this.user?.token, body)
      .subscribe((res) => {
        if (res) {
          this.sessionsParam = Object.assign(this.sessionInfo, this.sessionIds);
          this.resultPopup = true;
          this.resultData = res.activationResults;
          // Подсчёт успешных и неуспешных
          const successCount = this.resultData.filter(
            (r) => r.isSuccess
          ).length;
          const failureCount = this.resultData.filter(
            (r) => !r.isSuccess
          ).length;
          this.resultData.rejectedCount = successCount;
          this.resultData.failureCount = failureCount;
          this.resultData.chooseOffers = [
            {
              idSession: this.sessionIds.sessionId,
            },
          ];
          this.dataRefreshService.triggerRefresh();
        }
      });
  }

  restoreOffer() {
    if (!this.directSession) {
      //неадресная заявка
      const body = {
        idDirection: this.generalInfo.directionId,
        idSection: this.sessionIds.sectionId,
        idSession: this.sessionIds.sessionId,
        idDemandOffer: this.generalInfo.idDemandOffer,
        isControlViolations: true,
        isControlDeposit: true,
        isLockDeposit: true,
      };

      this.demandService
        .restoreRejected(this.user?.token, body)
        .subscribe(() => {
          this.isVisibleToast = true;
          this.message = this.translate.instant(
            'trading.offersTable.offerRestoreMess',
            { lotNumber: this.generalInfo.lotNumber }
          );
        });
    } else {
      const body = {
        idSection: this.sessionIds.sectionId,
        idSession: this.sessionIds.sessionId,
        idOffer: this.generalInfo.idOffer,
      };

      this.targetedService
        .offersBuceRestoreReject(this.user?.token, body)
        .subscribe((res) => {
          this.isVisibleToast = true;
          this.message = this.translate.instant(
            'trading.offersTable.offerRestoreMess',
            { lotNumber: this.generalInfo.lotNumber }
          );
        });
    }
  }

  closeRestorePopup(event) {
    this.restorePopup = event;
  }

  getPriceFromBasisForGood(idGood) {
    let price;
    if (this.deliveryConditions.length > 0)
      price =
        Number(
          this.deliveryConditionsChoose?.find(
            (b) => b.idDemandOfferGood == idGood
          )?.priceWithoutVat
        ) || null;
    else
      price = getNumber(
        this.getValue(
          this.goods.find(
            (good) => good?.goodsSpecifications[0].idDemandOfferGood == idGood
          )?.goodsSpecifications,
          3
        )
      );
    return price;
  }

  public getMinPriceFromBasisForGood(idGood: number): number {
    let minPrice: number | null;

    if (this.deliveryConditions.length > 0) {
      minPrice =
      Number(
        this.deliveryConditionsChoose?.find(
          (b) => b.idDemandOfferGood === idGood
        )?.minPriceWithoutVat
      ) || null;
    } else {
      minPrice = getNumber(
        this.getValue(
          this.goods.find(
            (good) => good?.goodsSpecifications[0].idDemandOfferGood === idGood
          )?.goodsSpecifications,
          IdInterfaceField.minPrice
        )
      );
    }

    return minPrice;
  }

  onViewInfo(good) {
    this.viewInfoGood = good.idGood;
    this.goodInfo = false;
  }

  openType: string; //какого формата открыто окно

  get isViewSendCounterofferButton(): boolean {
    return (
      !this.user.IsWorker &&
      !this.isMine &&
      !this.generalInfo.bidDateFinish &&
      !this.getRoleToAction &&
      this.sessionInfo.isActive &&
      this.sessionInfo.idSessionPeriod == IdSessionPeriods.trading
    );
  }

  get getRoleToAction(): boolean {
    return (
      (this.sessionInfo?.sessionInfo.idAuctionType ===
        auctionType.simpleSellerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.SALE) ||
      (this.sessionInfo?.sessionInfo.idAuctionType ===
        auctionType.simpleBuyerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.PURCHASE)
    );
  }

  onOpenSubmitCounterOffer(idOffer: number, idDirection: number) {
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    this.demandService
      .getDemandOfferFullInfo(
        this.user?.token,
        idDirection,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        idOffer,
        2,
        displayCurrency
      )
      .subscribe((res) => {
        this.globalStore.setSessionInfo(this.sessionInfo.sessionInfo);
        this.fullInfo = res;
        let dataForReq = Object.assign(this.sessionInfo.sessionInfo, this.sessionIds);
        this.openType = 'submitCounterOffers';
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'submitCounterOffers',
          idOffer: idOffer,
          idDirection: idDirection,
          fullInfo: Object.assign(this.fullInfo, {
            filterIdCurrency: displayCurrency,
          }),
          isAllowAnalog: this.isAllowAnalog,
        });
        this.tradingService.changedOpenTypeSidebar(this.openType);
      });
  }

  public removeLeadBid(): void {
    const body: TradingRemovingleadBidPayload = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      idDemandOffer: this.generalInfo.idDemandOffer,
      idBid: this.generalInfo.bidId,
    };

    this.bidService
      .tradingRemovingLeadBid(this.user?.token, body)
      .subscribe(() => {
        this.isVisibleRemoveBidPopup = false;
      });
  }

  isDisabledEditButton(): boolean {
    return (
      ((this.generalInfo.directionId === IdDirection.sale &&
        (this.sessionInfo?.sessionInfo.idAuctionType ===
          auctionType.simpleSellerAuction ||
          this.sessionInfo?.sessionInfo.idAuctionType ===
            auctionType.reverseWholesaleAuction)) ||
        (this.generalInfo.directionId === IdDirection.buy &&
          this.sessionInfo?.sessionInfo.idAuctionType ===
            auctionType.simpleBuyerAuction)) &&
      this.sessionInfo?.sessionInfo.sessionStageId ===
        sessionStage.transferAuctionCompleted &&
      ((this.sessionInfo.idSessionPeriod === IdSessionPeriods.pretrading &&
        (this.generalInfo.statusId === statusOffersFilters.active ||
          this.generalInfo.statusId === statusOffersFilters.unactive)) ||
        (this.sessionInfo.idSessionPeriod ===
          IdSessionPeriods.offersAdjustment &&
          this.generalInfo.statusId === statusOffersFilters.active))
    );
  }

  public editOfferWorker(idOffer: number, direction: number): void {
    this.demandService.workerEditOffer(
      idOffer,
      this.sessionInfo.sessionInfo,
      this.sessionIds,
      this.generalInfo.idModel,
      this.generalInfo.modelMarketTypes,
      direction
    );
  }

  onEditOffer(idOffer, idDirection) {
    this.demandService
      .getDemandOfferFullInfo(
        this.user?.token,
        idDirection,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        idOffer,
        1,
        '',
        true
      )
      .subscribe((res) => {
        this.fullInfo = res;
        const editingWithDirection: string =
          this.generalInfo.directionId === IdDirection.sale
            ? getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.editingSalesRequest')
            : getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.editingPurchaseOrders');

        const lotLabel: string = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.lot');
        let name: string = `${editingWithDirection}: ${lotLabel} №${this.generalInfo.lotNumber}`;

        let dataForReq = Object.assign(
          { name: name },
          this.sessionInfo.sessionInfo,
          this.sessionIds
        );
        this.openType = 'editOffer';
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'editOffer',
          idOffer: idOffer,
          idDirection: idDirection,
          fullInfo: this.fullInfo,
        });
        this.tradingService.changedOpenTypeSidebar(this.openType);
      });
  }

  editDirectOffer(idOffer) {
    this.demandService.editDirectOffer(
      idOffer,
      this.sessionInfo.sessionInfo,
      this.sessionIds,
      this.generalInfo.idModel,
      this.generalInfo.modelMarketTypes
    );
  }

  get isViewSubmitBidToBuyButton(): boolean {
    return (
      !this.user.IsWorker &&
      !this.isMine &&
      (this.sessionInfo.idSessionPeriod === IdSessionPeriods.trading ||
        this.sessionInfo.idSessionPeriod ==
          IdSessionPeriods.tradingAndResult) &&
      !this.getRoleToAction &&
      this.sessionInfo.isActive
    );
  }

  onOpenSubmitBidToBuy(idOffer: number, idDirection: number) {
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    this.demandService
      .getDemandOfferFullInfo(
        this.user?.token,
        idDirection,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        idOffer,
        2,
        displayCurrency
      )
      .subscribe((res) => {
        this.fullInfo = res;
        let dataForReq = Object.assign(
          this.sessionInfo.sessionInfo,
          this.sessionIds
        );
        this.openType = 'submitBidToBuy';
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'submitBidToBuy',
          idOffer: idOffer,
          idDirection: idDirection,
          fullInfo: Object.assign(this.fullInfo, {
            filterIdCurrency: displayCurrency,
          }),
        });
        this.tradingService.changedOpenTypeSidebar(this.openType);
      });
  }

  infoForPriceStep: any = [];
  editPriceStepPopup: boolean = false;

  onOpenEditPriceStep(idOffer: number, idDirection: number) {
    this.infoForPriceStep = {
      idDemandOffer: idOffer,
      idDirection: idDirection,
      pricingTypeId: this.generalInfo.pricingTypeId,
      deliveryConditions: this.deliveryConditions,
      goods: this.goods,
      currencyPrecision: this.currencyPrecision,
      volumePrecision: this.goods[0].goodsSpecifications.find(
        (field) => field.idInterfaceField == 1
      ).fieldPrecision,
      quoteCurrencyPrecision: this.currencyPrecision || null,
    };

    this.editPriceStepService.prepareDeliveryConditions(
      this.infoForPriceStep,
      this.goods[0].goodsSpecifications.find((el) => el.idInterfaceField == IdInterfaceField.VATrate)?.fieldValueNumber || null
    );

    this.editPriceStepPopup = true;
  }

  closeEditPriceStepPopup(event: boolean): void {
    this.editPriceStepPopup = event;
    const currentTab =
      this.sessionInfo?.sessionInfo?.idSessionPeriod ===
      this.IdSessionPeriods.pretrading
        ? this.IdActivationMode.pretradingPeriod
        : this.IdActivationMode.anyPeriod;

    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    this.demandService
      .getDemandOfferFullInfo(
        this.user?.token,
        this.generalInfo.directionId,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.generalInfo.idDemandOffer,
        currentTab,
        displayCurrency
      )
      .subscribe((res) => {
        this.goods.forEach((good) => {
          let newGood = res.goods.find((ng) => ng.idGood === good.idGood);
          if (newGood) {
            good.goodsSpecifications.forEach((spec) => {
              if (spec.idInterfaceField === 64) {
                let newSpec = newGood.goodsSpecifications.find(
                  (ns) => ns.idInterfaceField === 64
                );
                if (newSpec) {
                  spec.fieldValueNumber = newSpec.fieldValueNumber;
                }
              }
            });
          }
        });
      });
  }

  public onOpenDeleteOffer(): void {
    this.deletePopup = true;
  }

  public closeDeletePopup(event): void {
    this.deletePopup = event;
  }
}
