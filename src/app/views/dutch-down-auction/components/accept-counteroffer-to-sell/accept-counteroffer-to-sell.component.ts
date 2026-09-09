import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {AngularSplitModule} from "angular-split";
import {
  CounterOffersBuyerInfoComponent,
  CounterOffersSellerInfoComponent,
  CounterOfferTableComponent,
  EditLocationComponent
} from "@components";
import {DatePipe, NgClass, NgForOf, NgIf, NgStyle, NgTemplateOutlet} from "@angular/common";
import {
  DxButtonComponent,
  DxCheckBoxComponent,
  DxDataGridComponent,
  DxDateBoxComponent,
  DxListComponent,
  DxNumberBoxComponent,
  DxPopupComponent,
  DxRadioGroupComponent,
  DxScrollViewComponent,
  DxSelectBoxComponent,
  DxTemplateDirective,
  DxTooltipComponent,
  DxValidationGroupComponent,
  DxValidatorComponent
} from "devextreme-angular";
import {DxGridContextMenuLocalizationDirective} from "@directives";
import {
  DxiColumnComponent,
  DxiValidationRuleComponent,
  DxoAnimationComponent,
  DxoFormatComponent,
  DxoHeaderFilterComponent,
  DxoSelectionComponent
} from "devextreme-angular/ui/nested";
import {
  ActualDimensionsPipe,
  ExcelDatePipe,
  RuNumberFormatPipe,
  ToNumberPipe,
  ToOADatePipe,
  UpperCaseFirstLetterPipe
} from "@pipes";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {
  CommonService,
  CounterService,
  CurrencyService,
  DemandService,
  EditOfferDemandResponse,
  ErrorServiceService,
  SubmissionService,
  ToastService,
  TradingService
} from "@services";
import {PageCache, User} from "@classes";
import {FilterOption} from "../../../../features/trading/pages/messages/shared";
import {
  Field,
  ICounterOfferGood,
  IEditOfferGood,
  IEditOfferGoodsSpecifications,
  IGoodsSpecifications
} from "@interfaces";
import {IReferences} from "../../../homepage/interfaces";
import {
  DemandCountersGoodsResponse,
  DemandGood,
  ListDemandCountersResponse,
  DemandCounter
} from "../../../../services/counter-service/shared";
import {
  ACTUAL_SIZE_FIELDS,
  ACTUAL_SIZE_READINESS_FIELDS,
  auctionType,
  COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES,
  CurrentTab,
  EDITABLE_PRICE_INTERFACE_ID,
  EDITING_FIELDS,
  editingRules,
  FULL_PERCENT,
  goodRefId,
  IdDirection,
  IdInterfaceField,
  IdSessionPeriods,
  minDeliveryScheduleDaysCount,
  pricingType,
  sectionID,
  SPECIAL_FIELDS_AGRI,
  termsConditionsPaymentConst
} from "@constants";
import { convertExcelSerialDateToMs } from "../../../homepage/helpers";
import {
  getNumber,
  round,
  toOADate,
  upperCaseFirstLetter,
  checkSameUnits,
  saveWithPending,
  getVatNumber,
  getIdGood
} from "@helpers";
import RU from "@ru-translate";
import EN from "@en-translate";
import {ValueChangedEvent} from "devextreme/ui/date_box";
import {SelectionChangedEvent} from "devextreme/ui/data_grid";
import moment from "moment";
import {SECTIONS_TYPES} from "../../../../features/header/enums";
import {EditDemandOfferServiceService} from "../../../../services/edit-demand-offer-service.service";
import { SortActualDimensionsPipe } from "../../../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe";
import { ShowGoodsFieldsPipe } from "../../../../shared/pipes/showGoodsFields/show-goods-fields-pipe";
import { GoodsValuePipe } from "../../../../shared/pipes/showFieldsValue/goods-value-pipe";
import { ActualValuePipe } from "../../../../shared/pipes/showFieldsValue/actual-value-pipe";
import { DisableNumberBoxWheel } from "../../../../shared/directives/disable-number-box-wheel";
import { map, switchMap, takeUntil } from "rxjs/operators";
import { Observable, Subject, Subscription } from "rxjs";
import { OffersAdditionalInfoComponent } from '../../../../features/trading/components/offers-additional-info/offers-additional-info.component';
import { GoodSpecification } from "../submitting-counter-demand/interfaces";
import { DxCheckBoxTypes } from 'devextreme-angular/ui/check-box';
import { TCounterOffer } from './../../../../components/counter-offer-table/interfaces/index';
import { DELIVERY_SCOPE_ITEMS } from "@enums";
import {
  DisplayGoodChracteristics
} from "../../../../components/counter-offers-goods-table/display-good-chracteristics/display-good-chracteristics";
import { GetGoodIdPipe } from "../../../../shared/pipes/get-good-id/get-good-id-pipe";
@Component({
  selector: 'app-accept-counteroffer-to-sell',
  imports: [
    AngularSplitModule,
    CounterOffersSellerInfoComponent,
    DatePipe,
    DxButtonComponent,
    DxCheckBoxComponent,
    DxDataGridComponent,
    DxDateBoxComponent,
    DxGridContextMenuLocalizationDirective,
    DxListComponent,
    DxNumberBoxComponent,
    DxPopupComponent,
    DxRadioGroupComponent,
    DxScrollViewComponent,
    DxSelectBoxComponent,
    DxTemplateDirective,
    DxTooltipComponent,
    DxValidationGroupComponent,
    DxValidatorComponent,
    DxiColumnComponent,
    DxiValidationRuleComponent,
    DxoAnimationComponent,
    DxoFormatComponent,
    DxoHeaderFilterComponent,
    DxoSelectionComponent,
    EditLocationComponent,
    ExcelDatePipe,
    NgForOf,
    NgIf,
    NgTemplateOutlet,
    ReactiveFormsModule,
    RuNumberFormatPipe,
    ToNumberPipe,
    ToOADatePipe,
    TranslateModule,
    UpperCaseFirstLetterPipe,
    OffersAdditionalInfoComponent,
    CounterOffersBuyerInfoComponent,
    NgClass,
    NgStyle,
    SortActualDimensionsPipe,
    ActualDimensionsPipe,
    ShowGoodsFieldsPipe,
    GoodsValuePipe,
    ActualValuePipe,
    DisableNumberBoxWheel,
    CounterOfferTableComponent,
    DisplayGoodChracteristics,
    GetGoodIdPipe
  ],
  templateUrl: './accept-counteroffer-to-sell.component.html',
  standalone: true,
  styleUrl: './accept-counteroffer-to-sell.component.scss'
})
export class AcceptCounterofferToSellComponent implements OnChanges{
  private readonly currencyService = inject(CurrencyService);
  private readonly submissionService = inject(SubmissionService);
  private readonly demandService = inject(DemandService);
  private readonly counterService = inject(CounterService);
  private readonly tradingService = inject(TradingService);
  private readonly translate = inject(TranslateService);
  private readonly commonService = inject(CommonService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly errorServiceService = inject(ErrorServiceService);
  private readonly toastService = inject(ToastService);
  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);

  @Input() fullInfo;
  @Input() isMine;
  @Input() deliveryTerm;
  @Input() termsConditionsPayment;
  @Input() sessionIds;
  @Input() idOffer;
  @Input() deliveryConditions;
  @Input() goodsOriginal;
  @Input() editRulesIntersections;
  @Input() uniqueDeliveryScopes;
  @Input() scheduleData;
  @Input() deliveryScopes;
  @Input() deliveryBasisCommon;
  @Input() dataForModel;
  @Input() dataForReq;
  @Input() currencyIntersections;
  @Input() VatIntersections;
  @Input() financeSourceIntersections;
  @Input() isAllowAnalog: boolean = false;
  @Input({ required: true }) editRulesForSession: any[];
  @Output() onRedFlag = new EventEmitter();
  @Output() onHideRedFlag = new EventEmitter();
  @Output() requestDataBasis = new EventEmitter<{
    callback: (data: boolean) => void;
  }>(); //установлены ли красные флажки на вкладке
  @Output() requestDataSchedule = new EventEmitter<{
    callback: (data: boolean) => void;
  }>(); //установлены ли красные флажки на вкладке
  @Output() requestDataScope = new EventEmitter<{
    callback: (data: boolean) => void;
  }>(); //установлены ли красные флажки на вкладке
  @Output() saveRequestPendingChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('endValidator', { static: false })
  endValidator: DxValidatorComponent;
  @ViewChild('termsPayment', { static: false })
  validationGroup: DxValidationGroupComponent;
  @ViewChild('deliveryTerm', { static: false })
  deliveryTermValidationGroup: DxValidationGroupComponent;
  @ViewChild('goodFormValid', { static: false })
  goodFormValidationGroup: DxValidationGroupComponent;
  @ViewChild('showFilter') showFilter: ElementRef;
  @ViewChild('showFilterList') showFilterList: ElementRef;
  @Output() counterInfo = new EventEmitter<any>();

  user: User;
  cache = {} as PageCache;
  selectedRow: any; //выделенная встречка
  fullInfoOriginal: any; //массив первоначальных значений
  deliveryBasisCommonOriginal: any; //массив первоначальных значений базисов поставки
  countersGoods: any;
  counters: any;
  showDifferences: boolean = false; //чекбокс показать отличия
  sellerInformationHidden: boolean = true;
  buyerInformationHidden: boolean = true;
  isChangedCostVat = false; //изменилась ли стоимость с НДС

  currencyPrecision: any; //точность валюты
  uniqueDelConditions = []; //уникальные значения в массиве deliveryConditions
  basisValue: string; //выбранное значение для базисов
  deliveryConditionsChoose = []; //выбранный базис
  isShowNotific = false; //показывать уведомление перед кнопками, если изменили количество

  public filteredCounters: TCounterOffer[];

  VatField: any; //Ставка НДС
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
  totalRowData: any; //инфа в строку Итого по товарам
  expandTable: boolean = false;

  // редактируем срок поставки
  deliveryTermValue = [];
  deliveryTermConcated: string;
  deliveryTermType = [];
  deadlinePayment: number;
  deadlineDelivery: number;
  deadlineErrorMess: string;
  isDaysCountCorrect = false;
  DateSession: any;
  mainBasis: any; //главный базис

  OWN_FUNDS = '1'; //собственные средства

  deliveryTermForm = this.formBuilder.group({
    startDelivery: [null, [Validators.required]],
    deliveryType: [null, [Validators.required]],
    deliveryTerm: [40, [Validators.required]],
    startDate: [new Date(), [Validators.required]],
    endDate: [new Date(), [Validators.required]],
  });

  public isEditedDeliveryTerm = false; // при редактировании заявки отредактировано ли что-нибудь в срок поставки
  public isEditedTermsPayment = false; // при редактировании заявки отредактировано ли что-нибудь в срок оплаты
  public isOnSaveTermConditionWasClicked = false;
  public isOnSaveButtonWasClicked = false;

  dayTypePaymentConfig: any; //Справочник календарных и банковских дней
  isDisabledSaveButton = true; //задизейблина ли кнопка Сохранить
  public isSaveRequestPending: boolean = false; //выполняется ли запрос сохранения
  editingRules = editingRules;

  editTermCondition = false; //форма редактирования срока поставки
  editTermPayment = false; //форма редактирования условия поставки
  adjustablePrice = false;
  uniqueDeliveryTerm = [];

  DateSessionPlusDay: Date;
  deliveryPeriodOriginal: any;
  isDisabledAdjustablePrice = false; //заблокировать корректируемую цену
  isPopupClear = false; //попап окно для очистки графика поставки
  isPopupClearPrice = false; //попап окно для очистки графика поставки через корректируемую цену
  finishDelivSchPeriods = []; //массив графика поставки, который отправляется на бд
  finishDeliveryScopes = []; //массив грузоотправителей, который отправляется на бд
  finishDeliveryScopesRemain = []; //массив грузоотправителей для остаточной заявки, который отправляется на бд
  finishDeliveryBasis = []; //массив базисов, который отправляется на бд

  popupChangeBasis = false; //
  goodForm: any = this.formBuilder.group({});
  disabledBtns: boolean = false; //параметр для блокировки кнопки, так как неподходящий период или состояние
  isShowButtons = true;

  SIZE_15 = 15;
  SIZE_85 = 85;

  isEditCurrency = false;
  isEditFinanceSource = false;
  isEditVatRate = false;

  isExpandLotItems = false;     //Раскрыть товары лота
  isCloseViewGood= false;

  locationField: Field;
  isEditProductLocation = false;
  productLocations: IReferences[] = [];
  productLocationValue: string | number;
  goodLocation: IEditOfferGood;

  public readonly EDITABLE_PRICE_INTERFACE_ID = EDITABLE_PRICE_INTERFACE_ID;
  public readonly IdInterfaceField = IdInterfaceField;
  public readonly auctionType = auctionType;
  public readonly SPECIAL_FIELDS_AGRI = SPECIAL_FIELDS_AGRI;
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;

  public isDisabledSaveButtonSubscribe: Subscription;
  public changeMainBasis: Subscription;
  public changeVolume: Subscription;
  private destroy$ = new Subject<void>();

  public isSimpleBuyerAuction(): boolean {
    return (
      this.sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionIds']) {
      //изменился период или он не активен
      if (changes['sessionIds'].currentValue.session.idSessionPeriod == 3) {
        this.isShowButtons = true;
      } else this.isShowButtons = false;
      if (
        !changes['sessionIds'].currentValue.session.isActive ||
        changes['sessionIds'].currentValue.session.idSessionPeriod != 3
      ) {
        this.disabledBtns = true;
      } else this.disabledBtns = false;
    }

    if (changes['fullInfo']) {
      if (this.selectedRow) this.selectedRow.goods = null;
    }
    //обновить инфу после принятия встречного предложения
    if (
      changes['idOffer'] &&
      changes['idOffer'].previousValue != changes['idOffer'].currentValue
    ) {
      this.fullInfoOriginal = []; //массив первоначальных значений
      this.deliveryBasisCommonOriginal = []; //массив первоначальных значений базисов поставки

      this.currencyPrecision = null; //точность валюты
      this.uniqueDelConditions = []; //уникальные значения в массиве deliveryConditions
      this.isShowNotific = false; //показывать уведомление перед кнопками, если изменили количество

      this.VatField = null; //Ставка НДС
      this.totalRowData = null; //инфа в строку Итого по товарам

      // редактируем срок поставки
      this.deliveryTermValue = [];
      this.deliveryTermConcated = '';
      this.deliveryTermType = [];
      this.deadlineDelivery = null;
      this.deadlineErrorMess = '';
      this.isDaysCountCorrect = false;

      this.isEditedDeliveryTerm = false; // при редактировании заявки отредактировано ли что-нибудь в срок поставки
      this.isEditedTermsPayment = false; // при редактировании заявки отредактировано ли что-нибудь в срок оплаты
      this.isOnSaveTermConditionWasClicked = false;
      this.isOnSaveButtonWasClicked = false;

      this.isDisabledSaveButton = true; //задизейблина ли кнопка Сохранить

      this.timberTicket = false; //до выдачи лесорубочного билета

      this.fullInfoOriginal = JSON.parse(JSON.stringify(this.fullInfo));

      this.DateSession = new Date();
      this.DateSessionPlusDay = new Date(
        this.DateSession.getFullYear(),
        this.DateSession.getMonth(),
        this.DateSession.getDate() + 1
      );
      this.user = JSON.parse(localStorage.getItem('user') || '{}');
      this.cache =
        JSON.parse(sessionStorage.getItem('AUCTIONS')) ||
        JSON.parse(sessionStorage.getItem('OFFERS')) ||
        {};
      this.currencyPrecision = null;
      this.isChangedCostVat = false;

      this.isEditCurrency = false;
      this.isEditFinanceSource = false;
      this.isEditVatRate = false;

     this.getListDemandCounters();

      this.getPrecision();
      this.onInit();
    }
  }

  get isCheckBoxExpandLotItems(): boolean {
    return this.fullInfo.goods.some(good =>
      good.goodsSpecifications.some(el =>
        el.idEditRule &&
        el?.idEditRule !== editingRules.editingIsNotAvailable
      )
    );
  }

  public onCloseViewGood(good: IEditOfferGood): void {
    good.isOpened = false;
    if (this.isExpandLotItems) {
      this.isCloseViewGood = true;
      this.isExpandLotItems = false;
    }
  }

  public onOpenViewGood(good: IEditOfferGood): void {
    good.isOpened = true;
    this.isExpandLotItems = this.fullInfo.goods.every(good => good.isOpened)
  }


  public onChangedExpandLotItems(): void {
    this.fullInfo.goods.forEach(good => good.isOpened = this.isExpandLotItems)
  }

  public hideRejectedCountersGoods(event: DxCheckBoxTypes.ValueChangedEvent): void {
    this.filteredCounters = event.value
      ? this.counters.filter((counter) => !counter.goods[0].isExistDeclinedGoodInAnlg)
      : this.counters;

    this.selectedRow = this.filteredCounters?.[0];
  }

  private getDisplayCurrency(): string | number {
    if (this.isMine && this.isSimpleBuyerAuction()) {
      return '';
    }

    const cashedCurrency: number = this.cache?.filters?.displayCurrency;

    if (cashedCurrency == -1) {
      return '';
    } else {
      return cashedCurrency;
    }
  }

  private getListDemandCounters(): void {
    this.counterService
      .getListDemandCountersTrader(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idOffer,
        '',
        this.isMine
      ).pipe(
      switchMap((res: ListDemandCountersResponse) => {
        const rawCounters: DemandCounter[] = res.demandCounters;

        rawCounters.forEach((item, index) => {
          item.counterNumber = index + 1;
        });

        return this.getListDemandCountersGoods(rawCounters);
      })
    )
      .subscribe({
        next: (completedCounters: DemandCounter[]) => {

          let finalCounters: DemandCounter[] = completedCounters;

          this.counters = finalCounters; //триггерим инпут в дочерней компоненте только после того как добавили товары во встречки
          let index = this.selectedRow
            ? this.counters.findIndex(
              (el) => el.counterNumber === this.selectedRow.counterNumber
            )
            : 0;
          this.filteredCounters = [...this.counters]
          this.selectedRow = this.filteredCounters[index];
        }
      });

  }

  private getListDemandCountersGoods(rawCounters: DemandCounter[]): Observable<DemandCounter[]> {
    return this.counterService
      .getListDemandCountersGoods(
        this.user?.token,
        this.idOffer,
        ''
      )
      .pipe(
        map((res: DemandCountersGoodsResponse) => {
          this.countersGoods = res.goods;
          //добавляем товары в массив встречек
          rawCounters.forEach((counter) => {
            let findedGoods: DemandGood[] = this.countersGoods.filter(
              (good) => good.idDemandCounter === counter.idDemandCounter
            );

            //рассчитываем сумму ндс для товаров встречки
            findedGoods.forEach((good) => {
              const costWithoutVAT: number = good.volume * good.priceWithoutVat;
              good.amountVAT = counter.vatPercent
                ? costWithoutVAT * (counter.vatPercent / FULL_PERCENT)
                : 0;
            });

            counter.goods = findedGoods;
            counter.goodName = findedGoods[0]?.values?.find((item) => item.idReference === goodRefId)?.nameValue;
          });
          return rawCounters;
        })
      );
  }

  onInit(): void {
    this.deliveryPeriodOriginal = JSON.parse(
      JSON.stringify(this.fullInfo.deliveryPeriod)
    );
    if (this.scheduleData?.length > 0) {
      this.onCreateFinishPeriod();
    }
    if (this.deliveryScopes?.length > 0) {
      this.onCreateFinishScopes();
    }
    if (this.deliveryBasisCommon?.length > 0) {
      this.deliveryBasisCommonOriginal = JSON.parse(
        JSON.stringify(this.deliveryBasisCommon)
      );
      this.onCreateFinishBasis();
    }

    this.changeMainBasis = this.tradingService.changeMainBasis$.subscribe((res: any) => {
      //обновлена цена
      if (res.str != 'edit') {
        this.fullInfo.goods = res.goods;
        this.fullInfo.goods.forEach((good) => {
          const idGood: number = getIdGood(good);
          const fieldFormName: string = idGood.toString() + '_' + IdInterfaceField.priceWithoutVAT.toString();
          this.goodForm.controls[fieldFormName].patchValue(
            Number(
              this.getValue(
                good.goodsSpecifications,
                IdInterfaceField.priceWithoutVAT
              )
            )
          );
        });
        this.changeTotalCost();
      } else if (res.goods) {
        const mainDeliveryBasis = this.deliveryBasisCommon.find(el => el.isMain);
        if (!mainDeliveryBasis) return;

        const priceFieldValue = (goodsSpecification) =>
          goodsSpecification.find(el => el.idInterfaceField === IdInterfaceField.priceWithoutVAT)?.fieldValueNumber;

        mainDeliveryBasis.goods.forEach(basisGood => {
          const matchingGood = res.goods.find(
            g => g.goodsSpecifications[0]?.idDemandOfferGood === basisGood.idDemandOfferGood
          );

          if (matchingGood) {
            basisGood.cost = priceFieldValue(matchingGood.goodsSpecifications);
          }
        });
      }
    });

    this.changeVolume = this.tradingService.changeVolume$.subscribe((res: any) => {
      if (res.str != 'edit') {
        this.fullInfo.goods = res.goods;
        this.fullInfo.goods.forEach((good) => {
          const idGood: number = getIdGood(good);
          const fieldFormName: string = idGood.toString() + '_' + IdInterfaceField.quantity.toString();
          this.goodForm.controls[fieldFormName].patchValue(
            Number(
              this.getValue(good.goodsSpecifications, IdInterfaceField.quantity)
            )
          );
        });
        this.changeTotalCost();
      }
    });

    this.isDisabledSaveButtonSubscribe = this.tradingService.isDisabledSaveButton$.subscribe((res: any) => {
      this.isDisabledSaveButton = false;

      if (res.schedule) {
        //изменился график поставки
        this.scheduleData = res.schedule.scheduleData;
        this.onCreateFinishPeriod();
        this.fullInfo.generalInfo.idDeliveryScheduleType =
          res.schedule.idDeliveryScheduleType; //изменяем тип графика поставки
      }

      if (res.deliveryScope) {
        this.deliveryScopes = res.deliveryScope;
        this.onCreateFinishScopes();
      }

      if (res.deliveryConditions) {
        this.deliveryBasisCommon = res.deliveryConditions;
        this.onCreateFinishBasis();
        this.getBasisDataSource();
        if(this.deliveryBasisCommon?.length === 1){
          this.onChangeBasis({value: this.deliveryBasisCommon[0].concatedCondition});
        }
      }
    });

    this.getDeadlines();

    this.adjustablePrice =
      this.getValue(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.adjustedPrice
      ) == 'true';
    //дизейблим ли корректируемую цену
    if (this.fullInfo.deliveryPeriod.idDeliveryType == 3) {
      this.isDaysCountCorrect =
        this.getDaysCount(
          convertExcelSerialDateToMs(this.fullInfo.deliveryPeriod?.dateBegin),
          convertExcelSerialDateToMs(this.fullInfo.deliveryPeriod?.dateEnd),
          0,
          0
        ) >= minDeliveryScheduleDaysCount;
    } else {
      this.isDaysCountCorrect =
        this.getDaysCount(
          this.deliveryTermForm.controls.startDate?.value,
          null,
          this.fullInfo.deliveryPeriod.idDeliveryType == 1
            ? this.fullInfo.deliveryPeriod.periodTypeValue == null
              ? 0
              : this.fullInfo.deliveryPeriod.periodTypeValue
            : 0,
          this.fullInfo.deliveryPeriod.idDeliveryType == 2
            ? this.fullInfo.deliveryPeriod.periodTypeValue == null
              ? 0
              : this.fullInfo.deliveryPeriod.periodTypeValue
            : 0
        ) >= minDeliveryScheduleDaysCount;
    }

    let isCanSchedule = !!(
      this.fullInfo.deliveryPeriod.idDeliveryMoment == 2 &&
      this.isDaysCountCorrect &&
      this.getGoodsSpecifications(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.adjustedPrice
      )
    );
    if (!isCanSchedule) this.isDisabledAdjustablePrice = true;

    if (this.isComplexLotGrades())
      this.editProductLocation(
        this.fullInfo.goods[0],
        IdInterfaceField.productLocation
      );

    this.editDemandOfferServiceService.saveRequestPending$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.setSaveRequestPending(value);
      });
  }

  public ngOnDestroy(): void {
    this.isDisabledSaveButtonSubscribe.unsubscribe();
    this.changeMainBasis.unsubscribe();
    this.changeVolume.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  public isComplexLotGrades(): boolean {
    return (
      this.sessionIds.sectionId === sectionID.forestProducts &&
      this.dataForModel.complexLotProductTypes?.length === 1 &&
      this.dataForModel.complexLotProductTypes.find(
        (el) =>
          el.typeId === 2 &&
          el.referenceIds === COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES
      )
    );
  }

  private getPrecision(): void {
    if (!this.currencyPrecision) {
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
        });
    } else {
      this.prepareGoods();
    }
  }

  private getBasisDataSource(): void {
    if (this.deliveryBasisCommon?.length > 0) {
      this.uniqueDelConditions = [
        ...new Map(
          this.deliveryBasisCommon.map(
            (
              item //уникальные значения в массиве deliveryConditions
            ) => [item['concatedCondition'], item]
          )
        ).values(),
      ];
      this.mainBasis = this.uniqueDelConditions.find(
        (basis) => basis.isMain == true
      );
      this.basisValue = this.mainBasis?.concatedCondition;
      this.uniqueDelConditions.splice(
        this.uniqueDelConditions.indexOf(this.mainBasis),
        1
      );
      this.uniqueDelConditions.splice(0, 0, this.mainBasis);
    }
  }

  private prepareGoods(): void {
    this.getBasisDataSource();

    // добавляем в товары стоимость ндс/стоимость с/без ндс
    this.fullInfo.goods.forEach((good) => {
      good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.priceWithoutVAT
      ).fieldPrecision = this.currencyPrecision;
      const minPrice = good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.minPrice
      )
      if (minPrice)
        minPrice.fieldPrecision = this.currencyPrecision;
      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.VATrate
      );//Ставка НДС

      let blockFind = this.editDemandOfferServiceService.onFindBlock(good, this.dataForModel)
      blockFind.fields.forEach((blField) => {
        if (blField.interfaceField.isAvailableMultiSelection) {
          //ищем поле с возможностью мультивыбора
          //находим все значения поля с мультивыбором
          let multiField = good.goodsSpecifications.filter(
            (goodField) =>
              goodField.idInterfaceField == blField.interfaceField.fieldId
          );

          if (multiField?.length > 0) {
            // формируем строковые значения и значения массива
            let fieldValue = '',
              fieldValueArray = [];

            multiField.forEach((field) => {
              // формируем строку значений из всех выбранных значений по полю с мультивыбором
              fieldValue =
                fieldValueArray.length === 0
                  ? field.fieldValue.toString()
                  : fieldValue + '; ' + field.fieldValue;
              fieldValueArray.push(field.fieldValueNumber);
            });

            //удаляем все поля с этим ид
            good.goodsSpecifications = good.goodsSpecifications.filter(
              (el) => el.idInterfaceField != blField.interfaceField.fieldId
            );

            multiField[0].fieldValue = fieldValue;

            multiField[0].fieldValueArray = fieldValueArray;

            //добавляем поле с ид и значениями с мультивыбором

            good.goodsSpecifications.push(multiField[0]);
          }
        }
      });

      if(Number(this.sessionIds.sectionId) === SECTIONS_TYPES.AGRI){
        SPECIAL_FIELDS_AGRI.forEach(id => {
          const field:IEditOfferGoodsSpecifications = good.goodsSpecifications.find(field => field.idInterfaceField === id)
          if(field){
            const fieldValue = blockFind.fields.find(el => el.interfaceField.fieldId === id)
            field.dataSource = fieldValue?.selectedValues || fieldValue?.interfaceField?.allowedValues
            field.idEditRule = this.editRulesForSession.find(el=>
              el.idModelBlock === blockFind.id &&
              el.idInterfaceField === id &&
              el.idSessionPeriod === this.dataForReq?.idSessionPeriod)?.idEditRule
          }
        })
      }

      if (
        this.fullInfo.generalInfo.pricingTypeId !=
        this.pricingType.formulaWithoutQuotation
      ) {
        // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
        let count = Number(
          good.goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.quantity
          ).fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find(
            (field) =>
              field.idInterfaceField === IdInterfaceField.priceWithoutVAT
          ).fieldValueNumber
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
            fieldName:
              this.translate.store.currentLang == 'RU'
                ? RU['trading'].offersTable.costNoVAT
                : EN['trading'].offersTable.costNoVAT,
            fieldValue: costWithoutVAT,
          },
          {
            amountVAT: amountVAT,
            fieldName:
              this.translate.store.currentLang == 'RU'
                ? RU['trading'].offersTable.amountVAT
                : EN['trading'].offersTable.amountVAT,
            fieldValue: amountVAT,
          },
          {
            costVAT: costVAT,
            fieldName:
              this.translate.store.currentLang == 'RU'
                ? RU['trading'].offersTable.costVATShort
                : EN['trading'].offersTable.costVATShort,
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
        this.fullInfo.generalInfo.pricingTypeId ==
        this.pricingType.formulaWithQuotation
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
        this.fullInfo.generalInfo.pricingTypeId ==
        this.pricingType.formulaWithoutQuotation
      ) {
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.amendmentType
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }
      good.goodsSpecifications.forEach((field) => {
        const idGood: number = getIdGood(good);
        if (EDITING_FIELDS.includes(field.idInterfaceField)) {
          const fieldFormName: string = idGood.toString() + '_' + field.idInterfaceField.toString();
          this.goodForm.addControl(
            fieldFormName,
            this.formBuilder.control(null, Validators.required)
          );
          this.goodForm.controls[
            fieldFormName
            ].patchValue(
            getNumber(
              this.getValue(good.goodsSpecifications, field.idInterfaceField)
            )
          );
        }
      });
    });
    this.isExpandLotItems = this.isCheckBoxExpandLotItems;
    this.onChangedExpandLotItems()

    if (this.onSameUnits) {
      //Количество
      let volumeSum = 0,
        precision;
      this.fullInfo.goods.forEach((good) => {
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
        this.fullInfo.goods[0].unitName
      );
      this.totalForm.controls.quantityForCompare.patchValue(Number(volumeSum));
    }
    if (this.deliveryBasisCommon?.length > 0) {
      this.onChangeBasis({ value: this.basisValue }); //сразу рассчитываем с проставленным базисом
    } else this.changeTotalCost(); //сразу рассчитываем без базиса

    // получаем точность валюты
    if (
      this.fullInfo.generalInfo.pricingTypeId ==
      pricingType.formulaWithQuotation
    ) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.currency
          ).fieldValueNumber
        )
        .subscribe((res: number) => {
          this.currencyPrecision = res;
        });
    }
  }

  onSaveEditParams(e: ValueChangedEvent, idFields: number): void {
    const fieldMappings = {
      [IdInterfaceField.currency]: this.currencyIntersections,
      [IdInterfaceField.VATrate]: this.VatIntersections,
      [IdInterfaceField.financeSource]: this.financeSourceIntersections,
    } as const;

    const refName = fieldMappings[idFields];

    this.fullInfo.goods.forEach((good) => {
      let goodField = this.getGoodsSpecifications(
        good.goodsSpecifications,
        idFields
      );
      goodField.fieldValueNumber = e.value;
      goodField.fieldValue = refName.find(
        (el) => Number(el.id) === Number(e.value)
      ).name;
      if (idFields === IdInterfaceField.currency)
        good.currency = goodField.fieldValue;
    });

    if (idFields === IdInterfaceField.VATrate) {
      this.VatField = this.fullInfo.goods[0].goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.VATrate
      );

      this.changeTotalCost();
    }
    this.isDisabledSaveButton = false;
  }

  changeTotalCost() {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0,
      volumeTotal = 0;
    let vat: number = getVatNumber(this.VatField);
    if (
      this.fullInfo.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      this.fullInfo.goods.forEach((good) => {
        if (this.deliveryBasisCommon?.length > 0) {
          this.deliveryConditionsChoose.forEach((basis) => {
            basis.goods.forEach((basisGood) => {
              if (
                basisGood.idDemandOfferGood ==
                good.goodsSpecifications[0].idDemandOfferGood
              ) {
                let count = Number(
                  good.goodsSpecifications.find(
                    (field) =>
                      field.idInterfaceField === IdInterfaceField.quantity
                  ).fieldValueNumber
                ); //количество
                let priceWithoutVat = basisGood?.cost; //Цена без НДС

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
                  if (item.idInterfaceField === IdInterfaceField.quantity) {
                    volumeTotal = volumeTotal + item.fieldValueNumber;
                  }
                });

                costWithoutVatTotal = costWithoutVatTotal + costWithoutVAT;
                amountVATTotal = amountVATTotal + amountVAT;
                costVATTotal = costVATTotal + costVAT;
              }
            });
          });
        } else {
          let count = Number(
            good.goodsSpecifications.find(
              (field) => field.idInterfaceField === IdInterfaceField.quantity
            ).fieldValueNumber
          ); //количество
          let priceWithoutVat = Number(
            good.goodsSpecifications.find(
              (field) =>
                field.idInterfaceField === IdInterfaceField.priceWithoutVAT
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
            if (item.idInterfaceField === IdInterfaceField.quantity) {
              volumeTotal = volumeTotal + item.fieldValueNumber;
            }
          });

          costWithoutVatTotal = costWithoutVatTotal + costWithoutVAT;
          amountVATTotal = amountVATTotal + amountVAT;
          costVATTotal = costVATTotal + costVAT;
        }
      });
      if (
        this.totalForm.controls.costVat?.value &&
        Number(
          this.totalForm.controls.costVat?.value
            .replaceAll(/[^,\d]/g, '', '')
            .replace(/,/, '.')
        ) != costVATTotal
      ) {
        this.isChangedCostVat = true;
      }
      //  else this.isChangedCostVat = false

      this.totalForm.controls.quantity.patchValue(
        Number(volumeTotal).toLocaleString('ru', {
          maximumFractionDigits:
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.quantity
          ).fieldPrecision,
        }) +
        ' ' +
        this.fullInfo.goods[0].unitName
      );
      this.totalForm.controls.costWithoutVat.patchValue(
        Number(costWithoutVatTotal).toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
        ' ' +
        this.fullInfo.goods?.[0]?.currency
      );
      this.totalForm.controls.amountVAT.patchValue(
        Number(amountVATTotal).toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
        ' ' +
        this.fullInfo.goods?.[0]?.currency
      );
      this.totalForm.controls.costVat.patchValue(
        costVATTotal.toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
        (!this.isSimpleBuyerAuction()
          ? ' ' + this.fullInfo.goods?.[0]?.currency
          : '')
      );
      this.totalForm.controls.costVatForCompare.patchValue(costVATTotal);

      this.totalRowData = this.totalForm.value;
    }
  }

  public onCreateFinishPeriod(): void {
    this.finishDelivSchPeriods = this.editDemandOfferServiceService.onCreateFinishPeriod(this.scheduleData, this.fullInfo.goods, true);
    if (this.finishDelivSchPeriods?.length === 0 && !this.isCanSchedule()) {
      this.isDisabledAdjustablePrice = true;
    }
  }

  public onCreateFinishScopes(): void {
    const result: { finishDeliveryScopes, finishDeliveryScopesRemain } =
      this.editDemandOfferServiceService.onCreateFinishScopes(this.deliveryScopes, this.fullInfo.goods, true);
    this.finishDeliveryScopes = result.finishDeliveryScopes;
    this.finishDeliveryScopesRemain = result.finishDeliveryScopesRemain;
  }

  public onCreateFinishBasis(): void {
    this.finishDeliveryBasis = this.editDemandOfferServiceService.onCreateFinishBasis(this.deliveryBasisCommon, this.fullInfo.goods, true);
  }

  public goToBasis(): void {
    this.tradingService.goToBasis();
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.fullInfo.goods);
  }

  onChangeBasis(e) {
    this.deliveryConditionsChoose = [];
    this.deliveryConditionsChoose = this.deliveryBasisCommon.filter(
      (el) => el.concatedCondition == e.value
    );
    if (
      this.fullInfo.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      this.changeTotalCost();
    }
    if (this.deliveryConditionsChoose?.length > 0 && this.selectedRow) {
      this.compareBasis();
      this.compareGoods();
    }
  }

  getPriceFromBasisForGood(idGood) {
    let price;
    if (this.deliveryBasisCommon.length > 0)
      price =
        Number(
          this.deliveryConditionsChoose[0]?.goods?.find(
            (b) => b.idDemandOfferGood == idGood
          )?.cost
        ) || null;
    else
      price = getNumber(
        this.getValue(
          this.fullInfo.goods.find(
            (good) => good?.goodsSpecifications[0].idDemandOfferGood == idGood
          )?.goodsSpecifications,
          3
        )
      );
    return price;
  }

  getValue(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
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

  public getAmountVatCounterOffer(idDemandOfferGood: number): number {
    return this.getVolumeFromCounter(
      idDemandOfferGood
    ) * this.getPriceFromCounter(
      idDemandOfferGood
    ) * (this.selectedRow.vatPercent / 100);
  }

  public getDataFromCounterGood(idOfferGood: number, field): string {
    const good = this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood)
    return good ? good[field] as string : ''
  }

  getVolumeFromCounter(idOfferGood) {
    return this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.volume;
  }

  getPriceFromCounter(idOfferGood) {
    return this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.priceWithoutVat;
  }

  getTotalAmountFromCounter(idOfferGood) {
    return this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.totalAmount;
  }

  public onRowSelected(row): void {
    this.selectedRow = row;
    this.onCancelChanges();

    this.tradingService.sendConcatedDeletedClients(
      this.selectedRow.concatedDeletedClients
    );
    this.counterInfo.emit(this.selectedRow);
  }

  minFieldValue(data: IEditOfferGoodsSpecifications, idGood: number): number {
    return this.editRuleInIntersections(data.idInterfaceField) ==
    editingRules.increaseValue
      ? this.getGoodsSpecifications(
        this.getOriginalGood(idGood).goodsSpecifications,
        data.idInterfaceField
      ).fieldValueNumber
      : data.idInterfaceField == IdInterfaceField.minPrice
        ? 0.1
        : 0;
  }

  maxFieldValue(data: IEditOfferGoodsSpecifications, idGood: number): number {
    return this.editRuleInIntersections(data.idInterfaceField) ==
    editingRules.decreaseValue
      ? this.getGoodsSpecifications(
        this.getOriginalGood(idGood)?.goodsSpecifications,
        data.idInterfaceField
      )?.fieldValueNumber
      : null;
  }

  editRuleInIntersections(id) {
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField == id)
        ?.idEditRule || editingRules.editingIsNotAvailable
    );
  }

  public checkQuantityNotZero(): boolean {
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField === IdInterfaceField.quantity)
        ?.isCheckQuantityNotZero || false
    );
  }

  getValueInEditParam(idField: number): string {
    return this.getGoodsSpecifications(
      this.fullInfo.goods[0].goodsSpecifications,
      idField
    )?.fieldValueNumber.toString();
  }

  onCloseEditParams(idField: number): void {
    if (idField === IdInterfaceField.currency) this.isEditCurrency = false;
    if (idField === IdInterfaceField.VATrate) this.isEditVatRate = false;
    if (idField === IdInterfaceField.financeSource)
      this.isEditFinanceSource = false;
  }

  public toggleIsEditFinanceSource(): void {
    this.isEditFinanceSource = true
  }

  onCancelChangesEditParams(idField: number): void {
    let previousValue = this.getGoodsSpecifications(
      this.fullInfoOriginal.goods[0].goodsSpecifications,
      idField
    );
    const object = {
      value: previousValue.fieldValueNumber.toString(),
      previousValue: undefined,
      event: undefined,
    } as ValueChangedEvent;
    this.onSaveEditParams(object, idField);
    this.onCloseEditParams(idField);
  }

  getVolumeCompare(idOfferGood) {
    return this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.volumeMatch;
  }

  public getFieldCompare(idOfferGood: number, field: string): boolean {
    const good = this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )
    return good ? good[field] : true
  }

  getPriceCompare(idOfferGood) {
    return this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.priceWithoutVatMatch;
  }

  getCostVatCompare(idOfferGood) {
    return this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.costVatMatch;
  }

  getGoodsSpecifications(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications?.find(
      (el) => el.idInterfaceField == idInterfaceField
    );
  }

  getPriceAdjustmentFromCounter(idOfferGood) {
    return this.selectedRow.goods.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.priceAdjustment;
  }

  public get editablePriceInterfaceExists(): boolean {
    return !!this.fullInfo.goods[0].goodsSpecifications.find(
      (it: IGoodsSpecifications) =>
        it.idInterfaceField === EDITABLE_PRICE_INTERFACE_ID
    );
  }

  getpriceAdjustmentCompare(idOfferGood) {
    return this.selectedRow.goods.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.priceAdjusktmentMatch;
  }

  get isShowFinanceSorce(): boolean {
    return !this.showDifferences && this.getValue(
      this.fullInfo.goods[0].goodsSpecifications,
      IdInterfaceField.financeSource
    )
  }

  get isCanEditFinanceSource() {
    let disabled = false;

    if (this.dataForReq?.idSessionPeriod !== IdSessionPeriods.offersAdjustment) {
      return disabled;
    } else {
      if (
        !this.getValue(
          this.fullInfo.goods[0].goodsSpecifications,
          IdInterfaceField.okrb007
        )
      ) {
        let financeSource = this.getValueInEditParam(
          IdInterfaceField.financeSource
        );

        if (financeSource) {
          if (financeSource === this.OWN_FUNDS) {
            disabled = true;
          }
        }
      }
    }

    return disabled;
  }

  public makeArrayAndCompareForSpecialFields(): void {
    const specMap = this.fullInfo?.goods.reduce((acc, item) => {
      const id = item.goodsSpecifications?.[0]?.idDemandOfferGood;
      if (id) {
        acc[id] = item.goodsSpecifications;
      }
      return acc;
    }, {});

    this.selectedRow.goods = this.selectedRow?.goods.map((good) => {
      const specs = (specMap[good.idDemandGood] || []).map((spec) => {
        switch (spec.idInterfaceField) {
          case IdInterfaceField.expirationDate:
            return { ...spec, fieldValue: good.expirationName };
          case IdInterfaceField.wholesaleMarkup:
            return { ...spec, fieldValue: good.tradeDiscountName };
          default:
            return spec;
        }
      });

      return { ...good, goodsSpecifications: specs };
    });
  }

  public compareFields(): void {
    if (this.isSpecialFields()) {
      this.makeArrayAndCompareForSpecialFields();
    }
    this.selectedRow.paymentConditionsMatch =
      this.fullInfo.generalInfo.concatedPaymentConditions ===
      this.selectedRow?.concatedPaymentConditions;
    this.selectedRow.deliveryPeriodMatch =
      this.fullInfo.generalInfo.concatedDeliveryPeriod ===
      this.selectedRow.concatedDeliveryPeriod;
    this.selectedRow.totalAmountMatch =
      this.totalRowData?.costVatForCompare === this.selectedRow.totalAmount;
    this.selectedRow.totalVolumeMatch =
      this.totalRowData?.quantityForCompare === this.selectedRow.totalVolume;
    this.selectedRow.priceAdjustedMatch =
      this.selectedRow.isPriceAdjusted !== null
        ? Boolean(
        this.getValue(
          this.fullInfo.goods[0].goodsSpecifications,
          IdInterfaceField.adjustedPrice
        )
      ) === this.selectedRow.isPriceAdjusted
        : false;
    this.compareBasis();
    this.compareGoods();

    this.selectedRow.currencyMatch =
      this.getValue(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.currency
      ) === this.selectedRow.currencyName;

    const vatString = this.getValue(
      this.fullInfo.goods[0].goodsSpecifications,
      IdInterfaceField.VATrate
    );
    const vat = Number(vatString.replace('%', ''))
    const vatNumber = vat || vat === 0 ? vat : null;
    this.selectedRow.vatMatch = vatNumber === this.selectedRow.vatPercent;
  }

  compareGoods() {
    if (this.selectedRow.goods?.length > 0) {
      this.selectedRow.goods.forEach((counterGood) => {
        let matchingGood = this.fullInfo.goods.find((good) =>
          good.goodsSpecifications.some(
            (spec) =>
              spec.idDemandOfferGood ===
              (counterGood.idOfferGood || counterGood.idDemandGood)
          )
        );
        if (matchingGood) {
          let volume = matchingGood.goodsSpecifications.find(
            (spec) =>
              spec.idDemandOfferGood ===
              (counterGood.idOfferGood || counterGood.idDemandGood) &&
              spec.idInterfaceField === IdInterfaceField.quantity
          );
          counterGood.volumeMatch =
            volume.fieldValueNumber === counterGood.volume;

          let price; //цену/поправка первый раз сравниаем из goods, при смене базисов берем хар-ки из базисов
          if (this.deliveryConditionsChoose.length > 0)
            price =
              Number(
                this.deliveryConditionsChoose[0].goods?.find(
                  (b) =>
                    b.idDemandOfferGood ==
                    (counterGood.idOfferGood || counterGood.idDemandGood)
                )?.cost
              ) || null;
          else
            price = matchingGood.goodsSpecifications.find(
              (spec) =>
                spec.idDemandOfferGood ===
                (counterGood.idOfferGood || counterGood.idDemandGood) &&
                spec.idInterfaceField === IdInterfaceField.priceWithoutVAT
            ).fieldValueNumber;

          counterGood.priceWithoutVatMatch =
            price === counterGood.priceWithoutVat;

          let priceAdjustment: number | null;
          if (this.deliveryConditionsChoose.length > 0) {
            priceAdjustment =
              Number(
                this.deliveryConditionsChoose?.find(b =>
                  b.idDemandOfferGood ===
                  (counterGood.idOfferGood || counterGood.idDemandGood)
                )?.priceAdjustment
              ) || null;
          } else {
            priceAdjustment = matchingGood.goodsSpecifications?.find(spec =>
              spec.idDemandOfferGood ===
              (counterGood.idOfferGood || counterGood.idDemandGood) &&
              spec.idInterfaceField === IdInterfaceField.amendment
            )?.fieldValueNumber || null;
          }

          counterGood.priceAdjustmentMatch =
            priceAdjustment === counterGood.priceAdjustment;

          let costVat = matchingGood.goodsSpecifications.find(
            (spec) => 'costVAT' in spec
          );
          counterGood.costVatMatch =
            costVat?.fieldValue === counterGood.totalAmount;

          const expiration = matchingGood.goodsSpecifications.find(       //срок годности
            (spec) =>
              spec.idDemandOfferGood ===
              (counterGood.idOfferGood || counterGood.idDemandGood) &&
              spec.idInterfaceField === IdInterfaceField.expirationDate
          )?.fieldValueNumber;
          if (expiration)
            counterGood.expirationMatch = expiration === counterGood?.expirationDateId

          const wholesaleMarkup = matchingGood.goodsSpecifications.find(       //Оптовая надбавка
            (spec) =>
              spec.idDemandOfferGood ===
              (counterGood.idOfferGood || counterGood.idDemandGood) &&
              spec.idInterfaceField === IdInterfaceField.wholesaleMarkup
          )?.fieldValueNumber;
          if (wholesaleMarkup)
            counterGood.wholesaleMarkupMatch = wholesaleMarkup === counterGood?.tradeDiscountId
        }
      });
    }
  }

  compareBasis() {
    if (this.selectedRow)
      this.selectedRow.deliveryConditionMatch =
        this.deliveryConditionsChoose[0]?.concatedCondition ===
        this.selectedRow?.concatedDeliveryCondition;
  }

  public isSpecialFields(): boolean {
    const result = this.fullInfo.goods[0].goodsSpecifications.filter((field) =>
      SPECIAL_FIELDS_AGRI.includes(field.idInterfaceField)
    );
    return this.selectedRow.goods?.length > 0 &&
      this.sessionIds.sectionId == SECTIONS_TYPES.AGRI &&
      this.sessionIds.session.idAuctionType ===
      auctionType.simpleBuyerAuction
      && result?.length > 0;
  }

  public editTermConditions(): void {
    if (!this.isCanSchedule()) this.isDisabledAdjustablePrice = true;
    this.editTermCondition = true;
    this.tradingService
      .getModelsDeliveryConfig(this.user?.token)
      .subscribe((res: any) => {
        //дополнение массива deliveryTerm названиями периодов и срока поставки
        this.deliveryTerm.forEach((item) => {
          let termData = res.data.find((n) => n.id == item.deliveryStartId);
          item.deliveryStartName = termData.name;
          let terms = termData.terms.find((t) => t.id == item.deliveryTermId);
          item.deliveryTermName = terms.name;
          item.endDeliveryDateValue = terms.options.endDeliveryDate;
          item.startDeliveryDateValue = terms.options.startDeliveryDate;
        });

        this.uniqueDeliveryTerm = [
          ...new Map(
            this.deliveryTerm.map(
              (
                item //уникальные значения в массиве по названию начало поставки
              ) => [item['deliveryStartId'], item]
            )
          ).values(),
        ];

        this.deliveryTermForm.controls.startDelivery.patchValue(
          this.fullInfo.deliveryPeriod.idDeliveryMoment?.toString()
        );
        this.deliveryTermStartChange('deliveryStart');
        let dateBegin: any = this.fullInfo.deliveryPeriod?.dateBegin
          ? convertExcelSerialDateToMs(this.fullInfo.deliveryPeriod?.dateBegin)
          : null;
        let dateEnd: any = this.fullInfo.deliveryPeriod?.dateEnd
          ? convertExcelSerialDateToMs(this.fullInfo.deliveryPeriod?.dateEnd)
          : null;

        this.deliveryTermForm.controls.startDate.patchValue(dateBegin);
        this.deliveryTermForm.controls.endDate.patchValue(dateEnd);
        this.deliveryTermConcated =
          this.fullInfo.generalInfo.concatedDeliveryPeriod;
      });
  }

  isDate() {
    return this.deliveryTermType.find(
      (el) =>
        el.deliveryTermId.toString() ==
        this.deliveryTermForm.controls.deliveryType.value
    );
  }

  deliveryTermStartChange(str) {
    // this.schedule =[];
    switch (str) {
      case 'deliveryStart': {
        //фильтрация deliveryTermType в соответствие с тем, что выбрано в "Начало поставки"
        this.deliveryTermType = this.deliveryTerm.filter(
          (el) =>
            el.deliveryStartId ==
            this.deliveryTermForm.controls?.startDelivery?.value
        );
        //очистка всей формы
        this.deliveryTermForm.controls.deliveryType.reset();
        this.deliveryTermForm.get('startDate').setValue(null);
        this.deliveryTermForm.get('endDate').setValue(null);
        this.deliveryTermForm.get('deliveryTerm').reset();
        this.deliveryTermConcated = '';
        /* this.deadlineDelivery = null;
         this.deadlinePayment = null;*/

        //если найдена всего одна запись - сразу отображается заполненый select-box
        if (this.deliveryTermType.length == 1) {
          this.deliveryTermForm.controls.deliveryType.patchValue(
            this.deliveryTermType[0].deliveryTermId
          );
        }
        if (
          !this.deliveryTermForm.controls.deliveryType.value &&
          !this.isEditedDeliveryTerm
        ) {
          this.deliveryTermForm.controls.deliveryType.patchValue(
            this.fullInfo.deliveryPeriod.idDeliveryType?.toString() || null
          );
          this.deliveryTermStartChange('deliveryType');
        }

        break;
      }
      case 'deliveryType': {
        if (
          this.deliveryTermForm.controls.deliveryType.value != null &&
          this.isEditedDeliveryTerm &&
          this.isCanSchedule() &&
          this.adjustablePrice
        )
          this.tradingService.editDeliveryParams({
            deliveryType: this.deliveryTermForm.controls.deliveryType.value,
          });

        //очищаются все значения
        this.deliveryTermValue = [];
        this.deliveryTermForm.get('startDate').setValue(null);
        this.deliveryTermForm.get('endDate').setValue(null);
        this.deliveryTermForm.get('deliveryTerm').setValue(null);
        this.deliveryTermConcated = '';
        /*this.deadlineDelivery = null;
        this.deadlinePayment = null;*/

        //если период «Календарные дни» или «Месяцы»
        if (
          this.deliveryTermForm.controls.deliveryType.value == 1 ||
          this.deliveryTermForm.controls.deliveryType.value == 2
        ) {
          let during =
            this.translate.store.currentLang == 'RU'
              ? RU['editOffer'].during
              : EN['editOffer'].during;
          if (this.deliveryTermForm.controls.deliveryType?.value == 1) {
            //дни
            //формирование массива "В течение Х дней"
            let days = this.deliveryTermType.find(
              (el) =>
                el.deliveryTermId ==
                this.deliveryTermForm.controls.deliveryType?.value
            ).dayValues;
            for (let i = 0; i < days.length; i++) {
              this.deliveryTermValue.push({
                id: days[i],
                value:
                  during +
                  ' ' +
                  days[i] +
                  ' ' +
                  (this.translate.store.currentLang == 'RU'
                    ? RU['editOffer'].calendarDays
                    : EN['editOffer'].calendarDays),
              });
            }
          }
          if (this.deliveryTermForm.controls.deliveryType?.value == 2) {
            //месяца
            // формирование массива "В течение Х месяцев"
            let months = this.deliveryTermType.find(
              (el) =>
                el.deliveryTermId ==
                this.deliveryTermForm.controls.deliveryType?.value
            ).monthValues;
            for (let i = 0; i < months.length; i++) {
              this.deliveryTermValue.push({
                id: months[i],
                value:
                  during +
                  ' ' +
                  months[i] +
                  ' ' +
                  (this.translate.store.currentLang == 'RU'
                    ? RU['editOffer'].months
                    : EN['editOffer'].months),
              });
            }
          }
          if (
            !this.deliveryTermForm.controls.deliveryTerm.value &&
            !this.isEditedDeliveryTerm
          ) {
            this.deliveryTermForm.controls.deliveryTerm.patchValue(
              this.fullInfo.deliveryPeriod.periodTypeValue
            );
          }

          this.deliveryTermValue.sort((a, b) => a.id - b.id); //сортировка по id

          if (this.deliveryTermValue.length == 1) {
            this.deliveryTermForm.controls.deliveryTerm.patchValue(
              this.deliveryTermValue[0].id
            );

            this.onCreateString();
          }
        }
        break;
      }
    }
  }

  private onCreateString(e?, str?): void {
    /*if(this.deliverySchedule?.length == 0 || this.disabledButtonSchedule()) this.schedule = []*/
    if (
      (this.deliveryTermForm.controls.endDate.value != null ||
        this.deliveryTermForm.controls.deliveryTerm.value != null) &&
      this.isEditedDeliveryTerm &&
      this.isCanSchedule() &&
      this.adjustablePrice
    )
      this.tradingService.editDeliveryParams({
        deliveryPeriodInDays:
          this.deliveryTermForm.controls.deliveryType.value == 3
            ? this.deliveryTermForm.controls.endDate.value
            : this.deliveryTermForm.controls.deliveryTerm.value,
      });

    if (
      this.deliveryTermForm.controls.startDate.value != null &&
      this.isEditedDeliveryTerm &&
      this.isCanSchedule() &&
      this.adjustablePrice
    )
      this.tradingService.editDeliveryParams({
        deliveryStartDate: this.deliveryTermForm.controls.startDate.value,
      });

    if (this.deliveryTermForm.controls.startDelivery.value == 3) {
      //если начало поставки «Начало поставки не задано»
      if (this.deliveryTermForm.controls.endDate.value) {
        //проверка заполнение поля «Дата окончания поставки»
        this.GetDeliveryTermConcated();
      }
    } else {
      //если начало поставки «С даты регистрации договора на бирже», «С даты начала поставки», «С даты поступления предоплаты»
      switch (this.deliveryTermForm.controls.deliveryType.value) {
        case '1':
        case '2': {
          //если период «Календарные дни» или «Месяцы»
          if (this.deliveryTermForm.controls.deliveryTerm.value) {
            //проверка заполнение поля срок поставки
            this.deliveryTermForm.controls.startDelivery.value == 2 &&
            !this.deliveryTermForm.controls.startDate?.value
              ? null
              : this.GetDeliveryTermConcated();

            this.isDaysCountCorrect =
              this.getDaysCount(
                this.deliveryTermForm.controls.startDate?.value,
                this.deliveryTermForm.controls.endDate?.value,
                this.deliveryTermForm.controls.deliveryType.value == '1'
                  ? this.deliveryTermForm.controls.deliveryTerm.value == null
                    ? 0
                    : this.deliveryTermForm.controls.deliveryTerm.value
                  : 0,
                this.deliveryTermForm.controls.deliveryType.value == '2'
                  ? this.deliveryTermForm.controls.deliveryTerm.value == null
                    ? 0
                    : this.deliveryTermForm.controls.deliveryTerm.value
                  : 0
              ) >= minDeliveryScheduleDaysCount;
          }
          break;
        }
        case '3': {
          //если Период "Дата"
          if (
            this.deliveryTermForm.controls.startDate?.value &&
            this.deliveryTermForm.controls.endDate?.value
          ) {
            //проверка заполнения полей «Дата начала поставки» и «Дата окончания поставки»
            this.GetDeliveryTermConcated();

            this.isDaysCountCorrect =
              this.getDaysCount(
                this.deliveryTermForm.controls.startDate?.value,
                this.deliveryTermForm.controls.endDate?.value,
                0,
                0
              ) >= minDeliveryScheduleDaysCount;
          }
          break;
        }
      }
    }
  }

  GetDeliveryTermConcated() {
    this.submissionService
      .getDeliveryTermConcated(
        this.user?.token,
        this.deliveryTermForm.controls.startDelivery.value,
        this.deliveryTermForm.controls.deliveryType.value,
        this.deliveryTermForm.controls.deliveryTerm?.value,
        this.deliveryTermForm.controls.startDate?.value
          ? toOADate(this.deliveryTermForm.controls.startDate?.value)
          : null,
        this.deliveryTermForm.controls.endDate?.value
          ? toOADate(this.deliveryTermForm.controls.endDate?.value)
          : null
      )
      .subscribe((res) => {
        this.deliveryTermConcated = upperCaseFirstLetter(res.result);
        if (
          this.deliveryTermConcated != null &&
          this.isEditedDeliveryTerm &&
          this.isCanSchedule() &&
          this.adjustablePrice
        ) {
          this.tradingService.editDeliveryParams({
            concatedStringDeliveryTerm: this.deliveryTermConcated,
          });
        }
        //если открыто срок поставки, то смотрим открыт ли условия оплаты
        if (
          this.deliveryTermConcated?.length > 0 &&
          ((this.paymentTermConcated?.length > 0 && this.editTermPayment) ||
            !this.editTermPayment)
        ) {
          this.getDeadlines();
        }
      });
  }

  isCanSchedule() {
    //может ли быть график поставки
    if (!this.editTermCondition) {
      if (this.fullInfo.deliveryPeriod.idDeliveryType == 3) {
        this.isDaysCountCorrect =
          this.getDaysCount(
            this.fullInfo.deliveryPeriod.idDeliveryMoment.toString(),
            convertExcelSerialDateToMs(this.fullInfo.deliveryPeriod?.dateEnd),
            0,
            0
          ) >= minDeliveryScheduleDaysCount;
      } else {
        this.isDaysCountCorrect =
          this.getDaysCount(
            this.deliveryTermForm.controls.startDate?.value,
            null,
            this.fullInfo.deliveryPeriod.idDeliveryType == 1
              ? this.fullInfo.deliveryPeriod.periodTypeValue == null
                ? 0
                : this.fullInfo.deliveryPeriod.periodTypeValue
              : 0,
            this.fullInfo.deliveryPeriod.idDeliveryType == 2
              ? this.fullInfo.deliveryPeriod.periodTypeValue == null
                ? 0
                : this.fullInfo.deliveryPeriod.periodTypeValue
              : 0
          ) >= minDeliveryScheduleDaysCount;
      }
    }
    return !!(
      this.deliveryTerm.length > 0 &&
      ((this.editTermCondition &&
          this.deliveryTermForm.controls.startDelivery?.value &&
          this.deliveryTermForm.controls.startDelivery?.value == 2 &&
          this.deliveryTermForm.controls.deliveryType.value &&
          this.isDaysCountCorrect &&
          (this.deliveryTermForm.controls.deliveryType.value == 3
            ? this.deliveryTermForm.controls.endDate.value
            : this.deliveryTermForm.controls.deliveryTerm.value) &&
          (this.deliveryTermForm.controls.endDate.value
            ? this.deliveryTermForm.controls.endDate.value >=
            this.deliveryTermForm.controls.startDate.value
            : true)) ||
        (!this.editTermCondition &&
          this.fullInfo.deliveryPeriod.idDeliveryMoment == 2 &&
          this.isDaysCountCorrect)) &&
      this.getGoodsSpecifications(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.adjustedPrice
      )
    );
  }

  public isClearSchedule(str, e?): void {
    switch (str) {
      case 'deliveryStart': {
        this.deliveryTermStartChange('deliveryStart');
        break;
      }
      case 'deliveryType': {
        this.deliveryTermStartChange('deliveryType');
        break;
      }
      case 'startDate': {
        this.onCreateString(e, 'startDate');
        this.deliveryTermForm.controls.deliveryType.value == 3
          ? this.endValidator?.instance.validate()
          : null;
        break;
      }
      case 'endDate': {
        this.onCreateString(e, 'endDate');
        break;
      }
      case 'deliveryTerm': {
        this.onCreateString(e, 'deliveryTerm');
        break;
      }
    }

    if (this.isEditedDeliveryTerm) {
      if (
        this.finishDelivSchPeriods.length > 0 &&
        !(this.isCanSchedule() && this.adjustablePrice)
      ) {
        this.isPopupClear = true;
      }
      if (this.finishDelivSchPeriods.length == 0 && this.isCanSchedule()) {
        this.isDisabledAdjustablePrice = false;
      }
      if (this.finishDelivSchPeriods.length == 0 && !this.isCanSchedule()) {
        this.isDisabledAdjustablePrice = true;
        this.adjustablePrice = false;
      }
    }
  }

  onChangedAdjustablePrice(e) {
    this.isDisabledSaveButton = false;
    if (e.value && this.isCanSchedule()) {
      const body = this.editTermCondition
        ? {
          returnSchedule: [],
          deliveryType: this.deliveryTermForm.controls.deliveryType.value,
          deliveryPeriodInDays:
            this.deliveryTermForm.controls.deliveryType.value == 3
              ? this.deliveryTermForm.controls.endDate.value
              : this.deliveryTermForm.controls.deliveryTerm.value,
          deliveryStartDate: this.deliveryTermForm.controls.startDate.value,
          concatedStringDeliveryTerm: this.deliveryTermConcated,
        }
        : {
          returnSchedule: [],
          deliveryType:
            this.fullInfo.deliveryPeriod.idDeliveryType.toString(),
          deliveryPeriodInDays:
            this.fullInfo.deliveryPeriod.idDeliveryType == 3
              ? this.fullInfo.deliveryPeriod?.dateEnd
                ? convertExcelSerialDateToMs(
                  this.fullInfo.deliveryPeriod?.dateEnd
                )
                : null
              : this.fullInfo.deliveryPeriod.periodTypeValue,
          deliveryStartDate: this.fullInfo.deliveryPeriod?.dateBegin
            ? convertExcelSerialDateToMs(
              this.fullInfo.deliveryPeriod?.dateBegin
            )
            : null,
          concatedStringDeliveryTerm:
          this.fullInfo.generalInfo.concatedDeliveryPeriod,
        };
      this.tradingService.editDeliveryParams(body);
      this.onRedFlag.emit();
    }
    if (!e.value) {
      if (this.finishDelivSchPeriods.length > 0 && this.isCanSchedule()) {
        this.isPopupClearPrice = true;
        this.onHideRedFlag.emit();
      } else {
        this.tradingService.editDeliveryParams({ schedule: [] });
        this.onHideRedFlag.emit();
        this.scheduleData = [];
        this.onCreateFinishPeriod();
      }
      this.fullInfo.generalInfo.idDeliveryScheduleType = null;
    }
  }

  isViewPlaceOfWork(good): boolean {
    return (
      this.fullInfo.generalInfo.directionId === IdDirection.buy &&
      this.getGoodsSpecifications(
        good.goodsSpecifications,
        IdInterfaceField.placeOfWork
      ) &&
      this.editRuleInIntersections(IdInterfaceField.placeOfWork) ==
      editingRules.selectFromDirectory
    );
  }

  isViewLocation(good): boolean {
    return (
      !this.isComplexLotGrades() &&
      this.fullInfo.generalInfo.directionId === IdDirection.sale &&
      good.isCanEditProductLocation &&
      this.editRuleInIntersections(IdInterfaceField.productLocation) ==
      editingRules.selectFromDirectory
    );
  }

  public resultEditLocation(event: { value: string | number }): void {
    if (event) {
      this.productLocationValue = event.value;
      this.onContinueEditProductLocation();
    } else {
      this.onCancelEditLocation();
    }
  }

  public onDeleteSchedule(): void {
    if (this.isPopupClear) {
      this.adjustablePrice = false;
      this.isDisabledAdjustablePrice = true;
    }
    this.isPopupClear = false;
    this.isPopupClearPrice = false;
    this.tradingService.editDeliveryParams({ schedule: [] });
    this.finishDelivSchPeriods = [];
    if (this.isCanSchedule() && this.adjustablePrice) {
      this.onHideRedFlag.emit();
    }
  }

  public onCancelSchedule(): void {
    if (this.isPopupClear) {
      this.isEditedDeliveryTerm = false;

      this.deliveryTermForm.controls.startDelivery.patchValue(
        this.fullInfo.deliveryPeriodOriginal.idDeliveryMoment?.toString()
      );
      this.deliveryTermForm.controls.deliveryType.patchValue(
        this.fullInfo.deliveryPeriodOriginal.idDeliveryType.toString()
      );
      this.deliveryTermForm.controls.deliveryTerm.patchValue(
        this.fullInfo.deliveryPeriodOriginal.periodTypeValue
      );
      let dateBegin: any = this.fullInfo.deliveryPeriod?.dateBegin
        ? convertExcelSerialDateToMs(
          this.fullInfo.deliveryPeriodOriginal?.dateBegin
        )
        : null;
      let dateEnd: any = this.fullInfo.deliveryPeriod?.dateEnd
        ? convertExcelSerialDateToMs(
          this.fullInfo.deliveryPeriodOriginal?.dateEnd
        )
        : null;
      this.deliveryTermForm.controls.startDate.patchValue(dateBegin);
      this.deliveryTermForm.controls.endDate.patchValue(dateEnd);
      this.deliveryTermConcated =
        this.fullInfo.generalInfo.concatedDeliveryPeriod;
      this.onHideRedFlag.emit();
    }
    if (this.isPopupClearPrice) this.adjustablePrice = true;
    this.isPopupClear = false;
    this.isPopupClearPrice = false;
  }

  public onSaveTermCondition(e): void {
    let result = e.validationGroup.validate();

    if (result.isValid) {
      this.isEditedDeliveryTerm = false;

      this.editTermCondition = false;

      this.isOnSaveTermConditionWasClicked = true;

      this.fullInfo.deliveryPeriod.idDeliveryMoment = Number(
        this.deliveryTermForm.controls.startDelivery.value
      );

      this.fullInfo.deliveryPeriod.idDeliveryType = Number(
        this.deliveryTermForm.controls.deliveryType.value
      );

      this.fullInfo.deliveryPeriod.periodTypeValue = Number(
        this.deliveryTermForm.controls.deliveryTerm?.value
      );

      this.fullInfo.deliveryPeriod.dateBegin = this.deliveryTermForm.controls
        .startDate?.value
        ? toOADate(this.deliveryTermForm.controls.startDate?.value)
        : null;

      this.fullInfo.deliveryPeriod.dateEnd = this.deliveryTermForm.controls
        .endDate?.value
        ? toOADate(this.deliveryTermForm.controls.endDate?.value)
        : null;

      this.fullInfo.generalInfo.concatedDeliveryPeriod =
        this.deliveryTermConcated;
    }
  }

  validateEndDate = () => {
    return this.deliveryTermForm.controls.startDate.value;
  };

  /*  deliveryTimeCondition() {
    return (this.deliveryTermForm.controls.startDelivery.value == 1 || this.deliveryTermForm.controls.startDelivery.value == 2 || this.deliveryTermForm.controls.startDelivery.value == 4)
      && (this.deliveryTermForm.controls.deliveryType?.value == 1 || this.deliveryTermForm.controls.deliveryType?.value == 2)
  }*/

  // Получить расчетный период в днях (период вида <дата начала>-<дата окончания> --> дни; месяцы --> дни;)
  getDaysCount(startDate, endDate, daysCnt, monthCnt) {
    var daysCounter = 0;

    var _startDate = null;
    var _endDate = null;

    var _deliveryTermType = 0;

    if (daysCnt > 0) {
      _deliveryTermType = 1; // на вход пришел период в днях (ничего делать не будем - вернем обратно)
    } else if (monthCnt > 0) {
      _deliveryTermType = 2; // на вход пришел период в месяцах
    } else if (startDate != null && endDate != null) {
      _deliveryTermType = 3; // на вход пришел период вида <Дата начала>-<Дата окончания>
    }

    switch (_deliveryTermType) {
      //календарные дни
      case 1:
        if (daysCnt > 0) {
          daysCounter = daysCnt;
        }
        break;
      // месяцы
      case 2:
        if (startDate != null && monthCnt > 0) {
          _startDate = moment.unix(startDate / 1000).format('DD-MM-YYYY');

          var a = moment(_startDate, 'DD-MM-YYYY');
          var b = moment(a).add(monthCnt, 'M');

          daysCounter = b.diff(a, 'days');
        }
        break;
      //дата
      case 3:
        if (startDate != null && endDate != null) {
          _startDate = moment.unix(startDate / 1000).format('DD-MM-YYYY');
          _endDate = moment.unix(endDate / 1000).format('DD-MM-YYYY');

          daysCounter = moment(_endDate, 'DD-MM-YYYY').diff(
            moment(_startDate, 'DD-MM-YYYY'),
            'days'
          );
        }
        break;
    }
    return daysCounter;
  }

  // редактируем срок оплаты
  termsConditionsPaymentValue = [];
  termsPaymentForm = this.formBuilder.group({
    termsPayment: [],
    volume: [],
    prepaymentAmount: [],
    momentPrepayment: [],
    prepaymentPeriod: [],
    prepaymentPeriodNumber: [],
    prepaymentPeriodDate: [],
    defermentAmount: [],
    momentDelay: [],
    defermentPeriodNumber: [],
    defermentPeriodDate: [],
    defermentAmount2: [],
    momentDelay2: [],
    defermentPeriod2: [],
    dayTypeId: [],
  });

  termsConditionsPaymentConst = termsConditionsPaymentConst;

  editingTermPayment(): void {
    this.editTermPayment = true;
    //получаем справочник календарные и банковские дни
    this.commonService
      .getByName(this.user?.token, 'daytypes')
      .subscribe((res: any) => {
        this.dayTypePaymentConfig = res.refbooks;
      });

    this.tradingService
      .getPaymentConfig(this.user.token, this.sessionIds.sectionId)
      .subscribe((res: any) => {
        this.termsConditionsPaymentValue = [];
        //получение массива условий оплаты с учетом пересечений
        res.data.forEach((item) => {
          if (
            this.termsConditionsPayment?.find(
              (el) => el.paymentConditionId == item.id
            ) &&
            !this.termsConditionsPaymentValue?.find((el) => el.id == item.id)
          ) {
            this.termsConditionsPaymentValue.push(item);
          }
        });
        //если одно значение в массиве и при этом он ранее не был заполнен
        // (для проверки при котором все поля предзаполнены (имеют только одно значение), кроме срока поставки и он сбрасывался при переходе с 3-его на этот шаг)
        if (
          this.termsConditionsPaymentValue.length == 1 &&
          !this.termsPaymentForm.controls.volume.value
        ) {
          this.termsPaymentForm.controls.termsPayment.patchValue(
            this.termsConditionsPaymentValue[0].id
          );
          this.onTermsPaymentChange('termsPayment');
        }

        this.termsPaymentForm.controls.termsPayment.patchValue(
          this.fullInfo.paymentCond.idPaymentType.toString()
        );
        this.onTermsPaymentChange('termsPayment');
        this.paymentTermConcated =
          this.fullInfo.generalInfo.concatedPaymentConditions;
      });
  }

  momentPrepayment: any;
  momentDelay: any;
  readOnlyDefermentAmount = true;
  paymentTermConcated: string;
  termsConditions: any;
  volumeTerms: any = [];
  volumeTermsPayment: any;
  termsConditionsFilter: any; //условия оплаты отфильторованные по условиям оплаты из пересечения
  termsConditionsVolumesFilter: any; //условия оплаты отфильторованные по условиям оплаты и объему из пересечения

  timberTicket = false; //до выдачи лесорубочного билета

  momentPrepaymentValues = [];
  momentDelayValues = [];
  dayType = []; //тип дней (календарные/банковские) в выбранном условии

  onTermsPaymentChange(str: string) {
    switch (str) {
      case 'termsPayment': {
        this.termsPaymentForm.controls.volume.reset();
        this.termsPaymentForm.controls.prepaymentAmount.reset();
        this.termsPaymentForm.controls.dayTypeId.reset();
        this.volumeTerms = [];
        this.paymentTermConcated = '';
        /* this.deadlineDelivery = null;
         this.deadlinePayment = null;*/

        //выбранное значение условия оплаты
        this.termsConditions = this.termsConditionsPaymentValue.find(
          (el) => el.id == this.termsPaymentForm.controls.termsPayment.value
        );
        //условия оплаты отфильторованные по условиям оплаты из пересечения
        this.termsConditionsFilter = this.termsConditionsPayment.filter(
          (el) =>
            el.paymentConditionId ==
            this.termsPaymentForm.controls.termsPayment.value
        );
        //формирование массива объема доступных для выбора
        this.termsConditions.volumes?.forEach((item) => {
          if (
            this.termsConditionsFilter.find(
              (el) => el.paymentVolumeId == item.id
            ) &&
            !this.volumeTerms.find((el) => el.id == item.id)
          )
            this.volumeTerms.push(item);
        });
        //если одно значение в массиве объема
        if (this.volumeTerms.length == 1) {
          this.termsPaymentForm.controls.volume.setValue(
            this.volumeTerms[0].id
          );
          this.onTermsPaymentChange('volume');
        }

        if (
          !this.termsPaymentForm.controls.volume.value &&
          !this.isEditedTermsPayment
        ) {
          this.termsPaymentForm.controls.volume.setValue(
            this.fullInfo.paymentCond.idShipmentVolume.toString()
          );
          this.onTermsPaymentChange('volume');
        }
        break;
      }
      case 'volume': {
        this.termsPaymentForm.controls.momentPrepayment.setValue(null);
        this.termsPaymentForm.controls.prepaymentAmount.setValue(null);
        this.termsPaymentForm.controls.momentDelay.setValue(null);
        this.termsPaymentForm.controls.defermentAmount.setValue(null);
        this.termsPaymentForm.controls.dayTypeId?.setValue(null);
        this.readOnlyDefermentAmount = true;
        this.momentPrepayment = null;
        this.momentDelay = null;
        this.paymentTermConcated = '';
        /*this.deadlineDelivery = null;
        this.deadlinePayment = null;*/
        this.momentDelayValues = [];
        this.momentPrepaymentValues = [];

        if (this.termsPaymentForm.controls.volume.value) {
          //выбранное значение объема
          this.volumeTermsPayment = this.termsConditions.volumes.find(
            (el) => el.id == this.termsPaymentForm.controls.volume.value
          );

          //условия оплаты отфильтрованы по условиям оплаты и объему из пересечения
          this.termsConditionsVolumesFilter = this.termsConditionsFilter.filter(
            (el) =>
              el.paymentVolumeId == this.termsPaymentForm.controls.volume.value
          );

          //Условие оплаты в форме заявки = «Предоплата 100%» или Оплата через счета биржи
          if (
            this.termsPaymentForm.controls.termsPayment?.value ==
            termsConditionsPaymentConst.prepayment100 ||
            this.termsPaymentForm.controls.termsPayment?.value ==
            termsConditionsPaymentConst.paymentThroughExchange
          ) {
            this.termsPaymentForm.controls.prepaymentAmount.setValue(100); //Размер предоплаты
          }
          //Условие оплаты в форме заявки = «Отсрочка»
          if (
            this.termsPaymentForm.controls.termsPayment?.value ==
            termsConditionsPaymentConst.paymentDeferment
          ) {
            this.termsPaymentForm.controls.defermentAmount.setValue(100); //Размер отсрочки
          }

          // «Условие оплаты» в форме заявке = «Предоплата 100%» или «Частичная предоплата»;
          if (
            this.termsPaymentForm.controls.termsPayment?.value !=
            termsConditionsPaymentConst.paymentDeferment
          ) {
            //предоплата
            this.volumeTermsPayment.prepayMoments.forEach((item) => {
              if (
                this.termsConditionsVolumesFilter.find(
                  (el) => el.prepayMomentId == item.id
                ) &&
                !this.momentPrepaymentValues.find((el) => el.id == item.id)
              )
                this.momentPrepaymentValues.push(item);
            });
            if (!this.isEditedTermsPayment) {
              this.termsPaymentForm.controls.momentPrepayment.setValue(
                this.fullInfo.paymentCond.firstPaymentMomentId?.toString()
              );
              this.termsPaymentForm.controls.prepaymentAmount.setValue(
                this.fullInfo.paymentCond?.firstPercent
              );
              this.onTermsPaymentChange('momentPrepayment');
              break;
            }
            if (this.momentPrepaymentValues.length == 1) {
              this.termsPaymentForm.controls.momentPrepayment.setValue(
                this.momentPrepaymentValues[0].id
              );
              this.onTermsPaymentChange('momentPrepayment');
              break;
            }
          } else {
            //отсрочка
            this.volumeTermsPayment.delayMoments.forEach((item) => {
              if (
                this.termsConditionsVolumesFilter.find(
                  (el) => el.delayMomentId == item.id
                ) &&
                !this.momentDelayValues.find((el) => el.id == item.id)
              )
                this.momentDelayValues.push(item);
            });

            if (
              (!this.termsPaymentForm.controls.momentDelay.value ||
                !this.termsPaymentForm.controls.defermentAmount.value) &&
              !this.isEditedTermsPayment
            ) {
              if (this.termsPaymentForm.controls.momentPrepayment?.value != 7)
                this.termsPaymentForm.controls.momentDelay.setValue(
                  this.fullInfo.paymentCond.firstPaymentMomentId?.toString()
                );
              this.onTermsPaymentChange('momentDelay');
              break;
            }

            if (this.momentDelayValues.length == 1) {
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.momentDelayValues[0].id
              );
              this.onTermsPaymentChange('momentDelay');
              break;
            }
          }
        }
        break;
      }
      case 'momentPrepayment': {
        this.termsPaymentForm.controls.prepaymentPeriodNumber?.setValue(null);
        this.termsPaymentForm.controls.prepaymentPeriodDate?.setValue(null);
        this.termsPaymentForm.controls.dayTypeId?.setValue(null);
        this.paymentTermConcated = '';
        /* this.deadlineDelivery = null;
         this.deadlinePayment = null;*/
        this.readOnlyDefermentAmount = true; //при переключении с лесорубочного надругое значение. дизейблим размер отсрочки

        this.timberTicket = false;
        if (this.termsPaymentForm.controls.momentPrepayment.value) {
          this.momentPrepayment = this.volumeTermsPayment.prepayMoments.find(
            (el) =>
              el.id == this.termsPaymentForm.controls.momentPrepayment.value
          );

          if (this.momentPrepayment?.options.applicableDayCount) {
            this.dayType = this.termsConditionsPayment.find(
              (el) =>
                el.paymentConditionId ==
                this.termsPaymentForm.controls.termsPayment.value &&
                el.paymentVolumeId ==
                this.termsPaymentForm.controls.volume.value &&
                el.prepayMomentId ==
                this.termsPaymentForm.controls.momentPrepayment.value &&
                el.delayMomentId ==
                this.termsPaymentForm.controls.momentDelay.value
            )?.dayTypeId;

            if (this.dayType?.length == 1) {
              this.termsPaymentForm.controls.dayTypeId.setValue(
                this.dayType[0]
              );
            }
          }

          if (
            !(
              this.termsPaymentForm.controls.prepaymentPeriodNumber.value ||
              this.termsPaymentForm.controls.prepaymentPeriodDate.value
            ) &&
            !this.isEditedTermsPayment &&
            this.fullInfo.paymentCond.firstPaymentMomentId != 7
          ) {
            let date: any = this.fullInfo.paymentCond?.firstPeriodValueDate
              ? convertExcelSerialDateToMs(
                this.fullInfo.paymentCond?.firstPeriodValueDate
              )
              : null;
            this.termsPaymentForm.controls.prepaymentPeriodNumber?.setValue(
              this.fullInfo.paymentCond.firstPeriodValueNumber?.toString()
            );
            this.termsPaymentForm.controls.prepaymentPeriodDate?.setValue(date);
            this.termsPaymentForm.controls.dayTypeId?.setValue(
              this.fullInfo.paymentCond?.idDayType
            );

            //Условие оплаты в форме заявки = «Предоплата 100%»
            if (
              this.termsPaymentForm.controls.termsPayment?.value ==
              termsConditionsPaymentConst.prepayment100 ||
              this.termsPaymentForm.controls.termsPayment?.value ==
              termsConditionsPaymentConst.paymentThroughExchange
            ) {
              this.paymentTermConcated = upperCaseFirstLetter(
                this.fullInfo.generalInfo.concatedPaymentConditions
              );
            }
          }

          //«Условие оплаты» в форме заявки = «Частичная предоплата»
          if (
            this.termsPaymentForm.controls.termsPayment.value ==
            termsConditionsPaymentConst.partialPrepayment
          ) {
            this.momentDelayValues = this.momentPrepayment.delayMoments;
            //  this.termsPaymentForm.controls.prepaymentAmount.setValue(null);
            //   this.termsPaymentForm.controls.defermentAmount.setValue(null);
            this.onPrepaymentAmountChange();
            if (
              !this.termsPaymentForm.controls.momentDelay.value &&
              !this.isEditedTermsPayment
            ) {
              this.termsPaymentForm.controls.defermentAmount.setValue(
                this.fullInfo.paymentCond.secondPercent
              );
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.fullInfo.paymentCond.secondPaymentMomentId?.toString()
              );
              this.onTermsPaymentChange('momentDelay');
              break;
            }
            if (this.momentDelayValues.length == 1) {
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.momentDelayValues[0].id
              );
              this.onTermsPaymentChange('momentDelay');
              break;
            }
          }
          //формирование строки для «Условие оплаты» в форме заявке = «Предоплата 100%» и Момент предоплаты = «до выдачи лесорубочного билета»
          if (
            (this.termsPaymentForm.controls.termsPayment.value ==
              termsConditionsPaymentConst.prepayment100 ||
              this.termsPaymentForm.controls.termsPayment?.value ==
              termsConditionsPaymentConst.paymentThroughExchange) &&
            this.termsPaymentForm.controls.momentPrepayment?.value == 7
          ) {
            this.timberTicket = true;
            this.getPaymentTermConcatedString();
          }
        }

        break;
      }
      case 'momentDelay': {
        this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(null);
        this.termsPaymentForm.controls.defermentPeriodDate?.setValue(null);
        this.termsPaymentForm.controls.dayTypeId?.setValue(null);
        this.paymentTermConcated = '';
        /* this.deadlineDelivery = null;
         this.deadlinePayment = null;*/

        if (this.termsPaymentForm.controls.momentDelay.value) {
          if (
            this.termsPaymentForm.controls.termsPayment.value ==
            termsConditionsPaymentConst.partialPrepayment
          ) {
            this.momentDelay = this.momentPrepayment.delayMoments.find(
              (el) => el.id == this.termsPaymentForm.controls.momentDelay.value
            );
          } else
            this.momentDelay = this.volumeTermsPayment.delayMoments.find(
              (el) => el.id == this.termsPaymentForm.controls.momentDelay.value
            );

          if (this.momentDelay?.options.applicableDayCount) {
            this.dayType = this.termsConditionsPayment.find(
              (el) =>
                el.paymentConditionId ==
                this.termsPaymentForm.controls.termsPayment.value &&
                el.paymentVolumeId ==
                this.termsPaymentForm.controls.volume.value &&
                el.prepayMomentId ==
                this.termsPaymentForm.controls.momentPrepayment.value &&
                el.delayMomentId ==
                this.termsPaymentForm.controls.momentDelay.value
            )?.dayTypeId;

            if (this.dayType?.length == 1) {
              this.termsPaymentForm.controls.dayTypeId.setValue(
                this.dayType[0]
              );
            }
          }

          if (
            !(
              this.termsPaymentForm.controls.defermentPeriodNumber.value ||
              this.termsPaymentForm.controls.defermentPeriodDate.value
            ) &&
            !this.isEditedTermsPayment
          ) {
            if (
              this.fullInfo.paymentCond?.idPaymentType !=
              termsConditionsPaymentConst.partialPrepayment
            ) {
              //если это предоплата или отсрочка
              let date: any = this.fullInfo.paymentCond?.firstPeriodValueDate
                ? convertExcelSerialDateToMs(
                  this.fullInfo.paymentCond?.firstPeriodValueDate
                )
                : null;
              this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(
                this.fullInfo.paymentCond?.firstPeriodValueNumber?.toString()
              );
              this.termsPaymentForm.controls.defermentPeriodDate?.setValue(
                date
              );
            } else {
              this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(
                this.fullInfo.paymentCond?.secondPeriodValueNumber.toString()
              );
            }
            this.termsPaymentForm.controls.dayTypeId?.setValue(
              this.fullInfo.paymentCond?.idDayType
            );
            this.paymentTermConcated = upperCaseFirstLetter(
              this.fullInfo.generalInfo.concatedPaymentConditions
            );
          }
        }

        //«Момент предоплаты» = «до выдачи лесорубочного билета»
        if (
          this.termsPaymentForm.controls.momentPrepayment?.value == 7 &&
          this.isEditedTermsPayment
        ) {
          this.termsPaymentForm.controls.defermentPeriodNumber.setValue(30);
          this.termsPaymentForm.controls.momentDelay2.setValue(
            this.momentDelayValues[0].id
          );
          this.termsPaymentForm.controls.defermentPeriod2.setValue(60);
        }
        if (
          this.termsPaymentForm.controls.momentPrepayment?.value == 7 &&
          !(
            this.termsPaymentForm.controls.momentDelay2.value ||
            this.termsPaymentForm.controls.defermentPeriod2.value
          ) &&
          !this.isEditedTermsPayment
        ) {
          this.termsPaymentForm.controls.momentDelay.setValue(
            this.fullInfo.paymentCond.secondPaymentMomentId?.toString()
          );
          this.termsPaymentForm.controls.momentDelay2.setValue(
            this.fullInfo.paymentCond.secondPaymentMomentId?.toString()
          );
          this.termsPaymentForm.controls.defermentAmount.setValue(
            this.fullInfo.paymentCond.secondPercent
          );
          this.termsPaymentForm.controls.prepaymentAmount.setValue(
            this.fullInfo.paymentCond.firstPercent
          );
          this.termsPaymentForm.controls.defermentPeriodNumber.setValue(
            this.fullInfo.paymentCond?.secondPeriodValueNumber
          );
          this.termsPaymentForm.controls.defermentPeriod2.setValue(
            this.fullInfo.paymentCond?.thirdPeriodValueNumber
          );
          this.termsPaymentForm.controls.dayTypeId?.setValue(
            this.fullInfo.paymentCond?.idDayType
          );
          this.timberTicket = true;
          this.onChangedefermentAmount();
        }

        break;
      }
    }
  }

  //проверка на добавление 2 этапа при Момент предоплаты = «до выдачи лесорубочного билета»
  conditionSecondStage() {
    return (
      this.termsPaymentForm.controls.termsPayment?.value ==
      termsConditionsPaymentConst.partialPrepayment &&
      this.termsPaymentForm.controls.momentPrepayment?.value == 7 &&
      100 - this.termsPaymentForm.controls.prepaymentAmount?.value > 40 &&
      this.termsPaymentForm.controls.defermentAmount2?.value
    );
  }

  onPrepaymentAmountChange() {
    //Условие оплаты в форме заявки = «Частичная предоплата» и (или) «Момент предоплаты» = «до выдачи лесорубочного билета»;
    if (
      this.termsPaymentForm.controls.termsPayment?.value ==
      termsConditionsPaymentConst.partialPrepayment &&
      this.termsPaymentForm.controls.momentPrepayment?.value == 7
    ) {
      let value = 100 - this.termsPaymentForm.controls.prepaymentAmount?.value;

      //«Размер отсрочки» <= 40%, то поле недоступно для изменения и содержит рассчитанное значение
      if (value <= 40) {
        this.termsPaymentForm.controls.defermentAmount.setValue(value);
        this.readOnlyDefermentAmount = true;
      }
      //«Размер отсрочки» >40% (оплата может быть произведена в один или два этапа), то поле заполняется значением по умолчанию - 40% и остается доступным для редактирования
      else {
        this.termsPaymentForm.controls.defermentAmount.setValue(40);
        this.readOnlyDefermentAmount = false;
        this.termsPaymentForm.controls.defermentAmount2.setValue(
          value - this.termsPaymentForm.controls.defermentAmount.value
        );
      }
      this.termsPaymentForm.controls.momentDelay2.setValue(
        this.termsPaymentForm.controls.momentDelay.value
      );
    } else
      this.termsPaymentForm.controls.defermentAmount.setValue(
        100 - this.termsPaymentForm.controls.prepaymentAmount?.value
      );
    if (
      !(
        this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }

  onChangedefermentAmount() {
    let defermentAmount2 =
      100 -
      this.termsPaymentForm.controls.prepaymentAmount?.value -
      this.termsPaymentForm.controls.defermentAmount.value;
    if (defermentAmount2 >= 0)
      this.termsPaymentForm.controls.defermentAmount2.setValue(
        defermentAmount2
      );
    else {
      this.conditionSecondStage();
      this.termsPaymentForm.controls.defermentAmount2.setValue(null);
      this.termsPaymentForm.controls.prepaymentAmount.patchValue(
        100 - this.termsPaymentForm.controls.defermentAmount.value
      );
    }

    if (
      !(
        this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }

  changeDayType(e) {
    this.termsPaymentForm.controls.dayTypeId.setValue(e.value);
  }

  getPaymentTermConcatedString() {
    let IdPaymentCondition;
    if (
      this.validationGroup?.instance.validate().isValid ||
      (this.timberTicket && this.validationGroup?.instance.validate().isValid)
    ) {
      this.submissionService
        .determinePaymentCondId(
          this.user?.token,
          this.termsPaymentForm.controls.termsPayment?.value,
          this.termsPaymentForm.controls.volume?.value,
          this.termsPaymentForm.controls.momentPrepayment?.value || null,
          this.termsPaymentForm.controls.momentDelay?.value || null
        )
        .subscribe((res) => {
          IdPaymentCondition = res.id;

          this.submissionService
            .getPaymentTermConcated(
              this.user.token,
              this.termsPaymentForm.controls.termsPayment?.value,
              IdPaymentCondition,
              this.termsPaymentForm.controls.termsPayment?.value !=
              termsConditionsPaymentConst.paymentDeferment
                ? this.termsPaymentForm.controls.prepaymentPeriodNumber
                ?.value || null
                : this.termsPaymentForm.controls.defermentPeriodNumber?.value ||
                null,
              this.termsPaymentForm.controls.termsPayment?.value !=
              termsConditionsPaymentConst.paymentDeferment
                ? this.termsPaymentForm.controls.prepaymentAmount?.value
                : 0,
              this.termsPaymentForm.controls.termsPayment?.value !=
              termsConditionsPaymentConst.paymentDeferment
                ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                  ? toOADate(
                    this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                  )
                  : null
                : this.termsPaymentForm.controls.defermentPeriodDate?.value
                  ? toOADate(
                    this.termsPaymentForm.controls.defermentPeriodDate?.value
                  )
                  : null,
              this.termsPaymentForm.controls.termsPayment?.value !=
              termsConditionsPaymentConst.prepayment100 ||
              this.termsPaymentForm.controls.termsPayment?.value !=
              termsConditionsPaymentConst.paymentThroughExchange
                ? this.termsPaymentForm.controls.defermentAmount?.value || null
                : null,
              this.termsPaymentForm.controls.termsPayment?.value ==
              termsConditionsPaymentConst.partialPrepayment
                ? this.termsPaymentForm.controls.defermentPeriodNumber?.value ||
                null
                : null,
              this.conditionSecondStage()
                ? this.termsPaymentForm.controls.defermentPeriod2?.value || null
                : null,
              this.termsPaymentForm.controls.dayTypeId?.value || null
            )
            .subscribe((res) => {
              this.paymentTermConcated = upperCaseFirstLetter(res.result);

              //если форма условия оплаты открыта, то смотрим открыт ли срок поставки
              if (
                this.paymentTermConcated.length > 0 &&
                ((this.deliveryTermConcated?.length > 0 &&
                    this.editTermCondition) ||
                  !this.editTermCondition)
              ) {
                this.getDeadlines();
              }

              this.timberTicket = false;
            });
        });
    }
  }

  public getDeadlines(): void {
    let startDelivery,
      deliveryType,
      deliveryTerm,
      startDate,
      endDate,
      termsPayment,
      idMomentPrepay,
      idMomentDelay,
      idDayType,
      FirstPeriodValueNumber,
      FirstPeriodValueDate,
      SecondPeriodValueNumber,
      ThirdPeriodValueNumber;

    if (this.editTermCondition) {
      //если открыта форма редактирования Сроки поставки
      startDelivery = this.deliveryTermForm.controls.startDelivery.value;
      deliveryType = this.deliveryTermForm.controls.deliveryType.value;
      deliveryTerm = this.deliveryTermForm.controls.deliveryTerm?.value || null;
      startDate = this.deliveryTermForm.controls.startDate?.value
        ? toOADate(this.deliveryTermForm.controls.startDate?.value)
        : null;
      endDate = this.deliveryTermForm.controls.endDate?.value
        ? toOADate(this.deliveryTermForm.controls.endDate?.value)
        : null;
    } else {
      //берем значения из заявки (если сохранили данные, перезаписываем их в массив того что пришло по заявке)
      startDelivery = this.fullInfo.deliveryPeriod.idDeliveryMoment?.toString();
      deliveryType = this.fullInfo.deliveryPeriod.idDeliveryType?.toString();
      deliveryTerm = this.fullInfo.deliveryPeriod.periodTypeValue?.toString() || null;
      startDate = this.fullInfo.deliveryPeriod?.dateBegin;
      endDate = this.fullInfo.deliveryPeriod?.dateEnd;
    }

    if (this.editTermPayment) {
      //если открыта форма редактирования Условия оплаты
      termsPayment = this.termsPaymentForm.controls.termsPayment?.value;
      idMomentPrepay =
        this.termsPaymentForm.controls.termsPayment?.value !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.momentPrepayment?.value
          : null;
      idMomentDelay =
        this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.paymentDeferment ||
        this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.momentDelay?.value
          : null;
      idDayType = this.termsPaymentForm.controls.dayTypeId?.value || null;
      FirstPeriodValueNumber =
        this.termsPaymentForm.controls.termsPayment?.value !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value || null
          : this.termsPaymentForm.controls.defermentPeriodNumber?.value || null;
      FirstPeriodValueDate =
        this.termsPaymentForm.controls.termsPayment?.value !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
            ? toOADate(
              this.termsPaymentForm.controls.prepaymentPeriodDate?.value
            )
            : null
          : this.termsPaymentForm.controls.defermentPeriodDate?.value
            ? toOADate(this.termsPaymentForm.controls.defermentPeriodDate?.value)
            : null;
      SecondPeriodValueNumber =
        this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.defermentPeriodNumber?.value || null
          : null;
      ThirdPeriodValueNumber = this.conditionSecondStage()
        ? this.termsPaymentForm.controls.defermentPeriod2?.value || null
        : null;
    } else {
      termsPayment = this.fullInfo.paymentCond.idPaymentType.toString();
      idMomentPrepay =
        termsPayment != termsConditionsPaymentConst.paymentDeferment
          ? this.fullInfo.paymentCond.firstPaymentMomentId?.toString()
          : null;
      idMomentDelay =
        termsPayment == termsConditionsPaymentConst.paymentDeferment
          ? this.fullInfo.paymentCond.firstPaymentMomentId?.toString()
          : termsPayment == termsConditionsPaymentConst.partialPrepayment
            ? this.fullInfo.paymentCond.secondPaymentMomentId?.toString()
            : null;
      idDayType = this.fullInfo.paymentCond.idDayType || null;
      FirstPeriodValueNumber =
        this.fullInfo.paymentCond.firstPeriodValueNumber || null;
      FirstPeriodValueDate =
        this.fullInfo.paymentCond.firstPeriodValueDate || null;
      SecondPeriodValueNumber =
        this.fullInfo.paymentCond.secondPeriodValueNumber || null;
      ThirdPeriodValueNumber =
        this.fullInfo.paymentCond.thirdPeriodValueNumber || null;
    }

    this.submissionService
      .getPayDelivDeadlines(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        false,
        termsPayment,
        idMomentPrepay,
        idMomentDelay,
        idDayType,
        FirstPeriodValueNumber,
        FirstPeriodValueDate,
        SecondPeriodValueNumber,
        ThirdPeriodValueNumber,
        startDelivery,
        deliveryType,
        deliveryTerm,
        startDate,
        endDate
      )
      .subscribe({
        next: (res) => {
          this.deadlineErrorMess = '';
          this.deadlinePayment = res.deadlinePayment;
          this.deadlineDelivery = res.deadlineDelivery;
          this.isDisabledSaveButton = false; //разблокировали кнопку сохранить
        },
        error: (error) => {
          this.deadlineErrorMess = error.title;
        },
      });
  }

  onSaveTermPayment(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      this.isEditedTermsPayment = false;
      this.editTermPayment = false;
      this.fullInfo.paymentCond.idPaymentType =
        this.termsPaymentForm.controls.termsPayment?.value || null;
      this.fullInfo.paymentCond.idShipmentVolume =
        this.termsPaymentForm.controls.volume?.value;
      this.fullInfo.paymentCond.firstPercent =
        this.fullInfo.paymentCond.idPaymentType !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentAmount?.value
          : this.termsPaymentForm.controls.defermentAmount?.value;
      this.fullInfo.paymentCond.secondPercent =
        this.fullInfo.paymentCond.idPaymentType ==
        termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.defermentAmount?.value
          : null;
      this.fullInfo.paymentCond.firstPaymentMomentId =
        this.fullInfo.paymentCond.idPaymentType !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.momentPrepayment?.value
          : this.termsPaymentForm.controls.momentDelay?.value;
      this.fullInfo.paymentCond.secondPaymentMomentId =
        this.fullInfo.paymentCond.idPaymentType ==
        termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.momentDelay?.value
          : null;
      this.fullInfo.paymentCond.idDayType =
        this.termsPaymentForm.controls.dayTypeId?.value || null;
      this.fullInfo.paymentCond.firstPeriodValueNumber =
        this.termsPaymentForm.controls.termsPayment?.value !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value || null
          : this.termsPaymentForm.controls.defermentPeriodNumber?.value || null;
      this.fullInfo.paymentCond.firstPeriodValueDate =
        this.termsPaymentForm.controls.termsPayment?.value !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
            ? toOADate(
              this.termsPaymentForm.controls.prepaymentPeriodDate?.value
            )
            : null
          : this.termsPaymentForm.controls.defermentPeriodDate?.value
            ? toOADate(this.termsPaymentForm.controls.defermentPeriodDate?.value)
            : null;
      this.fullInfo.paymentCond.secondPeriodValueNumber =
        this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.defermentPeriodNumber?.value || null
          : null;
      this.fullInfo.paymentCond.thirdPeriodValueNumber =
        this.conditionSecondStage()
          ? this.termsPaymentForm.controls.defermentPeriod2?.value || null
          : null;
      this.fullInfo.generalInfo.concatedPaymentConditions =
        this.paymentTermConcated;
    }
  }

  calculate(idGood, idField) {
    let vat: number = getVatNumber(this.VatField),
      volumeTotal = 0,
      costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;

    let good: IEditOfferGood = this.fullInfo.goods
      .find((el) => el.idGood === idGood || el.goodsSpecifications[0].idDemandOfferGood === idGood);

    const idFromGood: number = getIdGood(good);
    const fieldFormName: string = idFromGood.toString() + '_' + idField.toString();

    good.goodsSpecifications.find(
      (el) => el.idInterfaceField == idField
    ).fieldValueNumber = Number(
      this.goodForm.controls[fieldFormName].value
    );
    good.goodsSpecifications.find(
      (el) => el.idInterfaceField == idField
    ).fieldValue = Number(
      this.goodForm.controls[fieldFormName].value
    ).toString();

    let count = Number(
      this.goodForm.controls[idFromGood.toString() + '_' + IdInterfaceField.quantity.toString()].value
    ); //количество
    let priceWithoutVat = Number(
      this.goodForm.controls[idFromGood.toString() + '_' + IdInterfaceField.priceWithoutVAT.toString()].value
    ); //Цена без НДС

    let costWithoutVAT = round(count * priceWithoutVat, this.currencyPrecision);
    let amountVAT = round(costWithoutVAT * (vat / 100), this.currencyPrecision);
    let costVAT = costWithoutVAT + amountVAT;

    good.goodsSpecifications.forEach((item) => {
      if (item.costWithoutVAT || item.costWithoutVAT == 0) {
        item.costWithoutVAT = costWithoutVAT;
        item.fieldValue = costWithoutVAT;
      }
      if (item.amountVAT || item.amountVAT == 0) {
        item.amountVAT = amountVAT;
        item.fieldValue = amountVAT;
      }
      if (item.costVAT || item.costVAT == 0) {
        item.costVAT = costVAT;
        item.fieldValue = costVAT;
      }
    });

    this.fullInfo.goods.forEach((good) => {
      good.goodsSpecifications.forEach((item) => {
        if (item.idInterfaceField === IdInterfaceField.quantity) {
          volumeTotal = volumeTotal + item.fieldValueNumber;
        }
        if (item.costWithoutVAT || item.costWithoutVAT == 0) {
          costWithoutVatTotal = costWithoutVatTotal + item.costWithoutVAT;
        }
        if (item.amountVAT || item.amountVAT == 0) {
          amountVATTotal = amountVATTotal + item.amountVAT;
        }
        if (item.costVAT || item.costVAT == 0) {
          costVATTotal = costVATTotal + item.costVAT;
        }
      });
    });
    if (
      this.totalForm.controls.costVat?.value &&
      Number(
        this.totalForm.controls.costVat?.value
          .replaceAll(/[^,\d]/g, '', '')
          .replace(/,/, '.')
      ) != costVATTotal
    ) {
      this.isChangedCostVat = true;
    }
    //else this.isChangedCostVat = false

    this.totalForm.controls.quantity.patchValue(
      Number(volumeTotal).toLocaleString('ru', {
        maximumFractionDigits: this.fullInfo.goods[0].goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.quantity
        ).fieldPrecision,
      }) +
      ' ' +
      this.fullInfo.goods[0].unitName
    );
    this.totalForm.controls.costWithoutVat.patchValue(
      Number(costWithoutVatTotal).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
      ' ' +
      this.fullInfo.goods?.[0]?.currency
    );
    this.totalForm.controls.amountVAT.patchValue(
      Number(amountVATTotal).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
      ' ' +
      this.fullInfo.goods?.[0]?.currency
    );
    this.totalForm.controls.costVat.patchValue(
      costVATTotal.toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
      (!this.isSimpleBuyerAuction()
        ? ' ' + this.fullInfo.goods?.[0]?.currency
        : '')
    );
    this.totalForm.controls.costVatForCompare.patchValue(costVATTotal);
    this.totalRowData = this.totalForm.value;

    if (idField === IdInterfaceField.quantity) {
      //количество
      this.tradingService.editVolume({
        goods: this.fullInfo.goods,
        str: 'edit',
      });
      this.isShowNotific = true;
    }
    else {
      // цена
      this.tradingService.editMainBasisInfo({
        goods: this.fullInfo.goods,
        str: 'edit',
      });
    }
    this.goodFormValidationGroup?.instance.validate()
    this.isDisabledSaveButton = false;
  }

  getOriginalGood(idGood) {
    return this.goodsOriginal?.find((el) => el.idGood == idGood);
  }

  zeroComparison = () => 0;

  minPriceComparison = (idGood: number) => {
    return (
      this.goodForm.get(
        idGood.toString() + '_' + IdInterfaceField.minPrice.toString()
      )?.value || 0
    );
  };

  minPriceCondition(data: IEditOfferGoodsSpecifications): boolean {
    return (
      this.getGoodsSpecifications(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.minPrice
      ) &&
      this.sessionIds.session.idAuctionType ===
      auctionType.simpleBuyerAuction &&
      this.fullInfo.generalInfo.directionId === IdDirection.buy
    );
  }

  public isChangeFieldValue(field: IEditOfferGoodsSpecifications, good: IEditOfferGood): boolean {
    const idGood = getIdGood(good);
    return (IdInterfaceField.expirationDate === field.idInterfaceField &&
        this.getGoodsSpecifications(
          good.goodsSpecifications,
          IdInterfaceField.expirationDate
        ).fieldValueNumber !=
        this.getGoodsSpecifications(
          this.getOriginalGood(idGood).goodsSpecifications,
          IdInterfaceField.expirationDate
        )?.fieldValueNumber)
      ||
      (IdInterfaceField.wholesaleMarkup === field.idInterfaceField &&
        this.getGoodsSpecifications(
          good.goodsSpecifications,
          IdInterfaceField.wholesaleMarkup
        )?.fieldValueNumber !=
        this.getGoodsSpecifications(
          this.getOriginalGood(idGood).goodsSpecifications,
          IdInterfaceField.wholesaleMarkup
        )?.fieldValueNumber)
  }

  public isDifferenceFieldValue(field: IEditOfferGoodsSpecifications, idDemandOfferGood: number): boolean {
    return (IdInterfaceField.expirationDate === field.idInterfaceField && !this.getFieldCompare(
        idDemandOfferGood, 'expirationMatch')) ||
      (IdInterfaceField.wholesaleMarkup === field.idInterfaceField && !this.getFieldCompare(
        idDemandOfferGood, 'wholesaleMarkupMatch'))
  }

  public onChangedFeield(e: ValueChangedEvent, field): void {
    field.fieldValueNumber = Number(e.value)
    this.isDisabledSaveButton = false;
    this.compareGoods()
  }

  public onSaveEditField(field): void {
    field.fieldValue = field.dataSource?.find(el=> el.id === field.fieldValueNumber.toString())?.name
    field.isEdit = false;
  }

  public onCancelEditField(field): void {
    field.fieldValueNumber = Number(field.dataSource?.find(el=> el.name === field.fieldValue)?.id)
    field.isEdit = false;
    this.compareGoods();
  }

  /*--- Действия по кнопкам ---*/

  popupChangeBasisType: string;
  changeBasis: any;
  changeBasisList: any;
  basisForChange: any;

  public onApplyCounterOffer(): void {
    this.popupChangeBasisType = null;
    if (this.deliveryBasisCommon?.length > 0) {
      let basis = this.deliveryBasisCommon.find(
        (el) =>
          el.idBasisLink ==
          this.selectedRow.additionalParams.deliveryCond.idBasisLink &&
          el.idBasisValue ==
          this.selectedRow.additionalParams.deliveryCond.idBasisValue &&
          el.idPlaceLink ==
          this.selectedRow.additionalParams.deliveryCond.idPlaceLink &&
          el.idPlaceValue ==
          this.selectedRow.additionalParams.deliveryCond.idPlaceValue &&
          el.specifyingLocation ==
          this.selectedRow.additionalParams.deliveryCond.placeDetails
      );
      if (!basis) {
        //нет такого базиса в заявке
        this.popupChangeBasis = true;

        if (
          this.editRuleInIntersections(37) == editingRules.changesDeliveryTerms
        ) {
          //если лот многобазисный - то меняется только список мест назначения
          if (this.deliveryBasisCommon.length > 1) {
            this.popupChangeBasisType = 'changeBasis';
            //ищем базис среди всех поданных базисов
            this.changeBasisList = this.deliveryBasisCommon.filter(
              (el) =>
                el.idBasisLink ==
                this.selectedRow.additionalParams.deliveryCond.idBasisLink &&
                el.idBasisValue ==
                this.selectedRow.additionalParams.deliveryCond.idBasisValue
            );
            this.basisForChange = this.changeBasisList[0];
          }
          //если лот однобазисный - меняется полностью базис
          if (this.deliveryBasisCommon.length == 1) {
            this.popupChangeBasisType = 'changeBasis';
            this.changeBasis = this.deliveryConditions.find(
              (el) =>
                el.linkId ==
                this.selectedRow.additionalParams.deliveryCond.idBasisLink &&
                el.valueId ==
                this.selectedRow.additionalParams.deliveryCond.idBasisValue
            );
          }
        } else if (
          this.editRuleInIntersections(37) ==
          editingRules.addingValueFromReferenceBook
        ) {
          this.popupChangeBasisType = 'addBasis';
        } else {
          this.popupChangeBasis = false;
          const errors = {
            error: true,
            errorStatus: 0,
            messageError:
              'Невозможно принять встречное предложение (неподходящие правила)',
          };
          this.errorServiceService.callErrorPopup(errors);
        }
      } else {
        this.applyAdditionalGoodParam();
        this.applyCounterOffer(basis);
      }
    } else {
      this.applyAdditionalGoodParam();
      this.applyCounterOffer();
    }
  }

  private applyCounterOffer(basis?): void {
    //принятие встречки и всех полей
    this.editTermCondition = false;
    this.editTermPayment = false;
    //условия поставки
    this.fullInfo.paymentCond = this.selectedRow.additionalParams.paymentCond;
    this.fullInfo.generalInfo.concatedPaymentConditions =
      this.selectedRow.concatedPaymentConditions;
    //срок поставки
    this.fullInfo.deliveryPeriod =
      this.selectedRow.additionalParams.deliveryPeriod;
    if (
      this.fullInfo.generalInfo.concatedDeliveryPeriod !==
      this.selectedRow.concatedDeliveryPeriod &&
      this.isCanSchedule()
    ) {
      this.tradingService.editDeliveryParams({
        concatedStringDeliveryTerm: this.selectedRow.concatedDeliveryPeriod,
      });
    }
    this.fullInfo.generalInfo.concatedDeliveryPeriod =
      this.selectedRow.concatedDeliveryPeriod;

    //в существующем базисе меняем цены и поправку
    if (basis && this.deliveryBasisCommon?.length > 0) {
      basis.goods.forEach((good) => {
        good.cost =
          this.fullInfo.generalInfo.pricingTypeId != 3
            ? this.getPriceFromCounter(good.idDemandOfferGood)
            : null;
        good.priceAdjustment =
          this.fullInfo.generalInfo.pricingTypeId != 1
            ? this.getPriceAdjustmentFromCounter(good.idDemandOfferGood)
            : null;
        if (basis.isMain) {
          if (this.deliveryBasisCommon.length === 1)
            this.onChangeBasis({ value: basis.concatedCondition });

          this.fullInfo.goods.forEach((good) => {
            this.setPriceField(good);
          });
        }
      });
      if (!basis.isMain) {
        //изменился существующий дополнительный базис
        this.tradingService.changedAdditionalBasis({
          basis: basis,
          str: 'edit',
        });
      }
      this.tradingService.editMainBasisInfo({
        goods: this.fullInfo.goods,
        str: 'edit',
      });
    }
    //Корректируемая цена
    this.adjustablePrice = this.selectedRow.isPriceAdjusted;
    this.onCreateFinishPeriod();

    this.fullInfo.goods.forEach((good) => {
      good.goodsSpecifications.find(
        (el) => el.idInterfaceField == IdInterfaceField.quantity
      ).fieldValueNumber = this.getVolumeFromCounter(
        good.goodsSpecifications[0].idDemandOfferGood
      );
      good.goodsSpecifications.find(
        (el) => el.idInterfaceField == IdInterfaceField.quantity
      ).fieldValue = this.getVolumeFromCounter(
        good.goodsSpecifications[0].idDemandOfferGood
      ).toString();
      if (
        !this.getVolumeCompare(good.goodsSpecifications[0].idDemandOfferGood)
      ) {
        this.tradingService.editVolume({
          goods: this.fullInfo.goods,
          str: 'edit',
        });
        this.isShowNotific = true;
      }
      const idGood: number = getIdGood(good);
      const fieldFormName: string = idGood.toString() + '_' + IdInterfaceField.quantity.toString();
      this.goodForm.controls[fieldFormName].patchValue(
        Number(
          this.getValue(good.goodsSpecifications, IdInterfaceField.quantity)
        )
      );

      if (this.deliveryBasisCommon?.length === 0) { //если нет базисов, устанавливаем цену со встречки
        this.setPriceField(good);
      }
    });
    this.changeTotalCost();
    this.isDisabledSaveButton = false;
    this.compareFields();
  }

  public setPriceField(good: IEditOfferGood): void {
    const demandOfferGoodId: number = good.goodsSpecifications?.[0]?.idDemandOfferGood;

    const price: number = this.getPriceFromCounter(demandOfferGoodId);
    const priceString: string = price.toString();

    const updateSpecification = (interfaceFieldId: IdInterfaceField): void => {
      const hasFieldInFullInfo: boolean = !!this.getGoodsSpecifications(
        this.fullInfo?.goods?.[0]?.goodsSpecifications,
        interfaceFieldId
      );

      if (hasFieldInFullInfo) {
        const targetSpec: GoodSpecification = this.getGoodsSpecifications(good.goodsSpecifications, interfaceFieldId);
        if (targetSpec) {
          targetSpec.fieldValueNumber = price;
          targetSpec.fieldValue = priceString;
        }

        if (interfaceFieldId === IdInterfaceField.priceWithoutVAT) {
          const idGood: number = getIdGood(good);
          const controlKey: string = `${idGood}_${IdInterfaceField.priceWithoutVAT}`;
          this.goodForm.controls[controlKey].patchValue(price);
        }
      }
    };

    updateSpecification(IdInterfaceField.priceWithoutVAT);
    updateSpecification(IdInterfaceField.amendment);
  }

  public onCancelChanges(): void {
    // нужно ли вызывать функцию при изменении количества
    let isVolumeChanged = false;

    this.fullInfo.goods.forEach((good) => {
      let findGood: IEditOfferGood;
      if (this.fullInfoOriginal.goods?.length === 1 && !this.fullInfoOriginal.goods?.[0]?.idGood) {
        findGood = this.fullInfoOriginal.goods[0];
      } else {
        findGood = this.fullInfoOriginal.goods.find(
          (g) => g.idGood === good.idGood
        );
      }

      if (
        good.goodsSpecifications.find(
          (el) => el.idInterfaceField == IdInterfaceField.quantity
        )?.fieldValueNumber !=
        findGood.goodsSpecifications.find(
          (el) => el.idInterfaceField == IdInterfaceField.quantity
        )?.fieldValueNumber
      ) {
        isVolumeChanged = true;
      }
    });

    const currentDeliveryTermFormValue =
      this.deliveryTermForm.controls.deliveryTerm.value;
    const updatedDeliveryTermValue = this.deliveryTermValue.find(
      (val) => val.id === currentDeliveryTermFormValue
    )?.value;

    if (
      this.fullInfo.generalInfo.concatedDeliveryPeriod !==
      this.fullInfoOriginal.generalInfo.concatedDeliveryPeriod &&
      this.isCanSchedule()
    ) {
      this.tradingService.editDeliveryParams({
        concatedStringDeliveryTerm:
        this.fullInfoOriginal.generalInfo.concatedDeliveryPeriod,
      });
    }

    this.fullInfo = JSON.parse(JSON.stringify(this.fullInfoOriginal));

    // todo check for issues should be same fix for other fields
    if (this.isOnSaveButtonWasClicked && this.isOnSaveTermConditionWasClicked) {
      this.fullInfo.generalInfo.concatedDeliveryPeriod =
        updatedDeliveryTermValue;
    }

    this.adjustablePrice =
      this.getValue(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.adjustedPrice
      ) == 'true';

    if (this.deliveryScopes?.length > 0) {
      this.deliveryScopes?.forEach((scope) => {
        scope[1].isDeletedScope = false;
        scope[1].forEach((good) => {
          good.volume = this.fullInfo.deliveryScopes
            .filter((el) => el.idFirmClient === Number(scope[DELIVERY_SCOPE_ITEMS.ID_SCOPE]))
            .find((g) => g.idDemandOfferGood == good.idDemandOfferGood).volume;
        });
      });

      this.tradingService.sendChangeScope(this.deliveryScopes);
    }

    if (isVolumeChanged)
      this.tradingService.editVolume({
        goods: this.fullInfo.goods,
        str: 'edit',
      });

    this.deliveryBasisCommon = JSON.parse(
      JSON.stringify(this.deliveryBasisCommonOriginal)
    );

    // this.tradingService.changeBasis(this.fullInfo.deliveryConditions)

    this.getPrecision();

    this.compareFields();

    this.isShowNotific = false;

    this.isDisabledSaveButton = true;
  }

  public applyAdditionalGoodParam(): void {
    const idCurrency = this.selectedRow?.idCurrency;
    const vatId = this.selectedRow?.idVatPercent;

    [IdInterfaceField.currency, IdInterfaceField.VATrate].forEach(
      (idField) => {
        let value =
          idField === IdInterfaceField.currency ? idCurrency : vatId;
        const object = {
          value: value,
          previousValue: undefined,
          event: undefined,
        } as ValueChangedEvent;
        this.onSaveEditParams(object, idField);
      }
    );


    this.fullInfo.goods.forEach((good) => {
      const updatedSpecifications: GoodSpecification[] = [...good.goodsSpecifications];
      SPECIAL_FIELDS_AGRI.forEach(agriField => {
        const index: number = updatedSpecifications.findIndex(spec => spec.idInterfaceField === agriField);
        if (index !== -1) {
          const goodField: GoodSpecification = updatedSpecifications[index];

          const counterDemandGood: ICounterOfferGood = this.selectedRow.goods.find(counterGood =>
            updatedSpecifications.some((spec) => spec.idDemandOfferGood === counterGood.idDemandGood)
          );

          if (counterDemandGood) {
            updatedSpecifications[index] = {
              ...goodField,
              fieldValueNumber: agriField === IdInterfaceField.expirationDate ? counterDemandGood.expirationDateId : counterDemandGood.tradeDiscountId,
              fieldValue: agriField === IdInterfaceField.expirationDate ? counterDemandGood.expirationName : counterDemandGood.tradeDiscountName
            };
          }
        }
      });
      good.goodsSpecifications = [...updatedSpecifications];
    });
  }

  public onContinueWithBasis(): void {
    this.popupChangeBasis = false;
    this.applyAdditionalGoodParam();
    //ищем базис среди основных базисов
    this.changeBasis = this.deliveryConditions.find(
      (el) =>
        el.linkId ==
        this.selectedRow.additionalParams.deliveryCond.idBasisLink &&
        el.valueId ==
        this.selectedRow.additionalParams.deliveryCond.idBasisValue
    );
    if (!this.changeBasis) {
      //не нашли в списке основных -> ищем в списке дополнительных в выбранном основном
      let additionalBases = this.deliveryConditions.find(
        (el) =>
          el.linkId == this.mainBasis.idBasisLink &&
          el.valueId == this.mainBasis.idBasisValue
      );
      this.changeBasis = additionalBases.children.find(
        (el) =>
          el.linkId ==
          this.selectedRow.additionalParams.deliveryCond.idBasisLink &&
          el.valueId ==
          this.selectedRow.additionalParams.deliveryCond.idBasisValue
      );
    }

    if (this.popupChangeBasisType == 'changeBasis') {
      //заменяем существующий
      if (this.deliveryBasisCommon?.length == 1) {
        //однобазисный лот
        this.deliveryBasisCommon = [];
        let goods = [];
        let vat,
          vatValue = this.fullInfo.goods[0].goodsSpecifications.find(
            (el) => el.idInterfaceField == IdInterfaceField.VATrate
          );
        if (vatValue.fieldValueNumber != 1) {
          vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
        } else vat = 0;

        this.fullInfo.goods.forEach((good) => {
          goods.push({
            idDemandOfferGood: good.goodsSpecifications[0].idDemandOfferGood,
            idGood: good.idGood,
            goodName: good.goodName,
            unitName: good.unitName,
            properties: good.goodDescription,
            volume: this.getVolumeFromCounter(
              good.goodsSpecifications[0].idDemandOfferGood
            ), //количество
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
              this.getPriceFromCounter(
                good.goodsSpecifications[0].idDemandOfferGood
              ),
              good.goodsSpecifications.find(
                (el) => el.idInterfaceField === IdInterfaceField.quantity
              ).fieldValueNumber,
              vat
            ),
            currencyPrecision: this.currencyPrecision,
            cost: this.getPriceFromCounter(
              good.goodsSpecifications[0].idDemandOfferGood
            ),
            volumePrecision: good.goodsSpecifications.find(
              (field) => field.idInterfaceField === IdInterfaceField.quantity
            ).fieldPrecision,
            ...(this.isSimpleBuyerAuction() && {
              minPrice:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == IdInterfaceField.minPrice
                )?.fieldValueNumber || null,
            }),
          });
        });

        let enterPlaceName = this.selectedRow.concatedDeliveryCondition
          .replace(this.changeBasis.basisName.replace(/\:/, ''), '')
          .replace(
            this.selectedRow.additionalParams.deliveryCond.placeDetails,
            ''
          );

        this.deliveryBasisCommon.push({
          placeName: [
            this.selectedRow.additionalParams.deliveryCond.idPlaceLink,
          ],
          concatedCondition: this.selectedRow.concatedDeliveryCondition,
          specifyingLocation:
          this.selectedRow.additionalParams.deliveryCond.placeDetails,
          minAddBasis: this.changeBasis.minAddBasis,
          basisName: null,
          enterPlaceName: enterPlaceName,
          isMain: this.changeBasis.level == 1,
          idBasisLink:
          this.selectedRow.additionalParams.deliveryCond.idBasisLink,
          idBasisValue:
          this.selectedRow.additionalParams.deliveryCond.idBasisValue,
          idPlaceLink:
          this.selectedRow.additionalParams.deliveryCond.idPlaceLink,
          idPlaceValue:
          this.selectedRow.additionalParams.deliveryCond.idPlaceValue,
          minAddBasisPlaces: this.changeBasis.minAddBasisPlaces,
          contradictoryValueId: this.changeBasis.contradictoryValueId,
          contradictoryBasisName: this.changeBasis.contradictoryBasisName,
          isRequiredPlace: this.changeBasis.isRequiredPlace,
          isRequiredAddBasis: this.changeBasis.isRequiredAddBasis,
          placeTypeId: this.changeBasis.placeTypeId,
          parentId: this.changeBasis.parentId,
          level: this.changeBasis.level,
          hasChildren: this.changeBasis.hasChildren,
          basisId: this.changeBasis.idBasisLink,
          goods: goods,
        });
        this.setValueIfMainBasis();
        this.onChangeBasis({
          value: this.selectedRow.concatedDeliveryCondition,
        });
        this.getBasisDataSource();
      } else {
        /*//ищем базис среди основных базисов
        this.changeBasis = this.deliveryConditions.find(el=> el.linkId == this.selectedRow.additionalParams.deliveryCond.idBasisLink &&
          el.valueId == this.selectedRow.additionalParams.deliveryCond.idBasisValue)
        if(!this.changeBasis) { //не нашли в списке основных -> ищем в списке дополнительных в выбранном основном
          let additionalBases = this.deliveryConditions.find(el => el.linkId == this.mainBasis.idBasisLink &&
            el.valueId == this.mainBasis.idBasisValue)
          this.changeBasis = additionalBases.children.find(el => el.linkId == this.selectedRow.additionalParams.deliveryCond.idBasisLink &&
            el.valueId == this.selectedRow.additionalParams.deliveryCond.idBasisValue)
        }*/
        let basis =
          this.changeBasisList?.length == 1
            ? this.changeBasisList[0]
            : this.basisForChange;

        let findBasis = this.deliveryBasisCommon.find(
          (el) =>
            el.idBasisLink == basis.idBasisLink &&
            el.idBasisValue == basis.idBasisValue &&
            el.idPlaceLink == basis.idPlaceLink &&
            el.idPlaceValue == basis.idPlaceValue &&
            el.specifyingLocation == basis.specifyingLocation
        );

        let vat,
          vatValue = this.fullInfo.goods[0].goodsSpecifications.find(
            (el) => el.idInterfaceField === IdInterfaceField.VATrate
          );
        if (vatValue.fieldValueNumber != 1) {
          vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
        } else vat = 0;

        findBasis.goods.forEach((good) => {
          good.volume = this.getVolumeFromCounter(good.idDemandOfferGood);
          good.costVat = this.costVatBasis(
            this.getPriceFromCounter(good.idDemandOfferGood),
            this.getVolumeFromCounter(good.idDemandOfferGood),
            vat
          );
          good.cost = this.getPriceFromCounter(good.idDemandOfferGood);
        });
        let enterPlaceName = this.selectedRow.concatedDeliveryCondition
          .replace(this.changeBasis.basisName.replace(/\:/, ''), '')
          .replace(
            this.selectedRow.additionalParams.deliveryCond.placeDetails,
            ''
          );

        findBasis.placeName = [
          this.selectedRow.additionalParams.deliveryCond.idPlaceLink,
        ];
        findBasis.concatedCondition =
          this.selectedRow.concatedDeliveryCondition;
        findBasis.specifyingLocation =
          this.selectedRow.additionalParams.deliveryCond.placeDetails;
        findBasis.idBasisLink =
          this.selectedRow.additionalParams.deliveryCond.idBasisLink;
        findBasis.idBasisValue =
          this.selectedRow.additionalParams.deliveryCond.idBasisValue;
        findBasis.idPlaceLink =
          this.selectedRow.additionalParams.deliveryCond.idPlaceLink;
        findBasis.idPlaceValue =
          this.selectedRow.additionalParams.deliveryCond.idPlaceValue;
        findBasis.enterPlaceName = enterPlaceName;

        if (findBasis.isMain) {
          this.setValueIfMainBasis();
        }
        this.getBasisDataSource();
      }
    } else {
      //добавляем дополнительный базис
      let goods = [];
      let vat,
        vatValue = this.fullInfo.goods[0].goodsSpecifications.find(
          (el) => el.idInterfaceField === IdInterfaceField.VATrate
        );
      if (vatValue.fieldValueNumber != 1) {
        vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
      } else vat = 0;

      this.fullInfo.goods.forEach((good) => {
        goods.push({
          idDemandOfferGood: good.goodsSpecifications[0].idDemandOfferGood,
          idGood: good.idGood,
          goodName: good.goodName,
          unitName: good.unitName,
          properties: good.goodDescription,
          volume: this.getVolumeFromCounter(
            good.goodsSpecifications[0].idDemandOfferGood
          ), //количество
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
            this.getPriceFromCounter(
              good.goodsSpecifications[0].idDemandOfferGood
            ),
            good.goodsSpecifications.find(
              (el) => el.idInterfaceField === IdInterfaceField.quantity
            ).fieldValueNumber,
            vat
          ),
          currencyPrecision: this.currencyPrecision,
          cost: this.getPriceFromCounter(
            good.goodsSpecifications[0].idDemandOfferGood
          ),
          volumePrecision: good.goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.quantity
          ).fieldPrecision,
          ...(this.isSimpleBuyerAuction() && {
            minPrice:
              good.goodsSpecifications?.find(
                (el) => el.idInterfaceField == IdInterfaceField.minPrice
              )?.fieldValueNumber || null,
          }),
        });
      });

      let enterPlaceName = this.selectedRow.concatedDeliveryCondition
        .replace(this.changeBasis.basisName.replace(/\:/, ''), '')
        .replace(
          this.selectedRow.additionalParams.deliveryCond.placeDetails,
          ''
        );

      this.deliveryBasisCommon.push({
        placeName: [this.selectedRow.additionalParams.deliveryCond.idPlaceLink],
        concatedCondition: this.selectedRow.concatedDeliveryCondition,
        specifyingLocation:
        this.selectedRow.additionalParams.deliveryCond.placeDetails,
        minAddBasis: this.changeBasis.minAddBasis,
        basisName: null,
        enterPlaceName: enterPlaceName,
        isMain: false,
        idBasisLink: this.selectedRow.additionalParams.deliveryCond.idBasisLink,
        idBasisValue:
        this.selectedRow.additionalParams.deliveryCond.idBasisValue,
        idPlaceLink: this.selectedRow.additionalParams.deliveryCond.idPlaceLink,
        idPlaceValue:
        this.selectedRow.additionalParams.deliveryCond.idPlaceValue,
        minAddBasisPlaces: this.changeBasis.minAddBasisPlaces,
        contradictoryValueId: this.changeBasis.contradictoryValueId,
        contradictoryBasisName: this.changeBasis.contradictoryBasisName,
        isRequiredPlace: this.changeBasis.isRequiredPlace,
        isRequiredAddBasis: this.changeBasis.isRequiredAddBasis,
        placeTypeId: this.changeBasis.placeTypeId,
        parentId: this.changeBasis.parentId,
        level: this.changeBasis.level,
        hasChildren: this.changeBasis.hasChildren,
        basisId: this.changeBasis.idBasisLink,
        goods: goods,
      });
      this.getBasisDataSource();
    }
    this.popupChangeBasisType = null;
    this.tradingService.changeBasis(this.deliveryBasisCommon);
    this.applyCounterOffer();
  }

  setValueIfMainBasis() {
    this.fullInfo.goods.forEach((good) => {
      if (
        this.getGoodsSpecifications(
          this.fullInfo.goods[0].goodsSpecifications,
          IdInterfaceField.priceWithoutVAT
        )
      ) {
        this.getGoodsSpecifications(
          good.goodsSpecifications,
          IdInterfaceField.priceWithoutVAT
        ).fieldValueNumber = this.getPriceFromCounter(
          good.goodsSpecifications[0].idDemandOfferGood
        );
        this.getGoodsSpecifications(
          good.goodsSpecifications,
          IdInterfaceField.priceWithoutVAT
        ).fieldValue = this.getPriceFromCounter(
          good.goodsSpecifications[0].idDemandOfferGood
        ).toString();
      }
      if (
        this.getGoodsSpecifications(
          this.fullInfo.goods[0].goodsSpecifications,
          IdInterfaceField.amendment
        )
      ) {
        this.getGoodsSpecifications(
          good.goodsSpecifications,
          IdInterfaceField.amendment
        ).fieldValueNumber = this.getPriceFromCounter(
          good.goodsSpecifications[0].idDemandOfferGood
        );
        this.getGoodsSpecifications(
          good.goodsSpecifications,
          IdInterfaceField.amendment
        ).fieldValue = this.getPriceFromCounter(
          good.goodsSpecifications[0].idDemandOfferGood
        ).toString();
      }

      if (
        !this.getPriceCompare(good.goodsSpecifications[0].idDemandOfferGood)
      ) {
        const idGood: number = getIdGood(good);
        const fieldFormName: string = idGood.toString() + '_' + IdInterfaceField.priceWithoutVAT.toString();
        this.goodForm.controls[fieldFormName].patchValue(
          Number(this.getValue(good.goodsSpecifications, IdInterfaceField.priceWithoutVAT))
        );
      }
    });
  }

  costVatBasis(priceWithoutVat, volume, vat) {
    return (
      Math.round(
        (volume * priceWithoutVat + (volume * priceWithoutVat * vat) / 100) *
        100
      ) / 100
    );
  }

  editProductLocation(good: IEditOfferGood, fieldId: number): void {
    this.goodLocation = Object.assign(good, { fieldId: fieldId });
    let blockFind = this.editDemandOfferServiceService.onFindBlock(good, this.dataForModel)
    this.locationField = blockFind.fields.find(
      (el) => el.interfaceField.fieldId == fieldId
    );
    if (
      this.locationField.interfaceField.fieldId ===
      IdInterfaceField.productLocation
    ) {
      if (this.locationField.interfaceField.referenceId) {
        this.commonService
          .getById(
            this.user?.token,
            this.locationField.interfaceField.referenceId,
            this.sessionIds.sectionId
          )
          .subscribe((res: any) => {
            this.productLocations = res.data;
          });
      }
      this.productLocationValue =
        this.getGoodsSpecifications(good.goodsSpecifications, fieldId)
          ?.fieldValue || null;
    } else {
      this.productLocations = this.locationField.selectedValues
        ? this.locationField.selectedValues
        : this.locationField.interfaceField.allowedValues;

      this.productLocationValue = this.getGoodsSpecifications(
        good.goodsSpecifications,
        fieldId
      )?.fieldValueNumber.toString();
    }
  }

  public onContinueEditProductLocation(): void {
    let field: IEditOfferGoodsSpecifications =
      this.goodLocation.goodsSpecifications.find(
        (field) => field.idInterfaceField === this.goodLocation.fieldId
      );
    let fieldValueNumber, fieldValue;
    if (!field) {
      field = {
        idDemandOfferGood:
        this.goodLocation.goodsSpecifications[0].idDemandOfferGood,
        fieldValueNumber: null,
        fieldValue: null,
        idInterfaceField: this.locationField.interfaceField.fieldId,
        fieldValueString: null,
        fieldName: this.locationField.interfaceField.fieldName,
        fieldPrecision: this.locationField.interfaceField.fieldPrecision,
        controlFieldType: this.locationField.interfaceField.controlFieldType,
        blockId: this.locationField.interfaceField.blockId,
        isVirtual: false,
      };
      this.goodLocation.goodsSpecifications.push(field);
    }
    if (field.idInterfaceField === IdInterfaceField.productLocation) {
      fieldValueNumber = null;
      fieldValue = this.productLocationValue;
    } else {
      fieldValueNumber = Number(this.productLocationValue);
      fieldValue = this.productLocations.find(
        (el) => el.id == this.productLocationValue
      ).name;
    }
    field.fieldValueNumber = fieldValueNumber;
    field.fieldValue = fieldValue;
    if (
      this.isComplexLotGrades() &&
      this.fullInfo.generalInfo.directionId === IdDirection.sale
    ) {
      for (let i = 1; i < this.fullInfo.goods.length; i++) {
        let goodField = this.fullInfo.goods[i].goodsSpecifications.find(
          (field) => field.idInterfaceField == 22
        );
        goodField.fieldValueNumber = fieldValueNumber;
        goodField.fieldValue = fieldValue;
      }
    } else {
      this.onCancelEditLocation();
    }
    this.isDisabledSaveButton = false;
  }

  public onCancelEditLocation(): void {
    this.productLocations = [];
    this.productLocationValue = null;
    this.goodLocation = null;
    this.locationField = null;
    this.isEditProductLocation = false;
  }

  public onSave(): void {
    this.isOnSaveButtonWasClicked = true;
    this.editDemandOfferServiceService.userTokenSubject.next(this.user?.token);
    this.editDemandOfferServiceService.goodsSubject.next(this.fullInfo.goods);
    this.editDemandOfferServiceService.generalInfoSubject.next(this.fullInfo.generalInfo);
    this.editDemandOfferServiceService.VatFieldSubject.next(this.VatField);
    this.editDemandOfferServiceService.editTermPaymentSubject.next(this.editTermPayment);
    this.editDemandOfferServiceService.termsPaymentFormSubject.next(this.termsPaymentForm);
    this.editDemandOfferServiceService.paymentCondSubject.next(this.fullInfo.paymentCond);
    this.editDemandOfferServiceService.deliveryBasisCommonSubject.next(this.deliveryBasisCommon);
    this.editDemandOfferServiceService.adjustablePriceSubject.next(this.adjustablePrice);
    this.editDemandOfferServiceService.goodsOriginalSubject.next(this.goodsOriginal);
    this.editDemandOfferServiceService.deliveryScopesSubject.next(this.deliveryScopes);
    this.editDemandOfferServiceService.momentPrepaymentSubject.next(this.momentPrepayment);
    this.editDemandOfferServiceService.deliveryTermFormSubject.next(this.deliveryTermForm);
    this.editDemandOfferServiceService.dataForModelSubject.next(this.dataForModel);
    this.editDemandOfferServiceService.finishDelivSchPeriodsSubject.next(this.finishDelivSchPeriods);
    this.editDemandOfferServiceService.editTermConditionSubject.next(this.editTermCondition);
    this.editDemandOfferServiceService.deliveryPeriodValueSubject.next(this.fullInfo.deliveryPeriod);
    this.editDemandOfferServiceService.uniqueDeliveryScopesSubject.next(this.uniqueDeliveryScopes);
    this.editDemandOfferServiceService.sessionIdsSubject.next(this.sessionIds);

    this.editDemandOfferServiceService.onSave(
      this.requestDataScope,
      this.requestDataBasis,
      this.requestDataSchedule,
      this.sessionIds.idSessionPeriod,
      this.validationGroup,
      this.deliveryTermValidationGroup,
      this.deadlineErrorMess,
      this.goodFormValidationGroup
    )
  }

  private setSaveRequestPending(pending: boolean): void {
    this.isSaveRequestPending = pending;
    this.saveRequestPendingChange.emit(pending);
  }
}
