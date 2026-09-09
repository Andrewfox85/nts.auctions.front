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
  ViewChild,
} from '@angular/core';
import { PageCache, User } from '@classes';
import {
  ACTUAL_SIZE_FIELDS,
  ACTUAL_SIZE_READINESS_FIELDS,
  auctionType,
  COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES,
  CurrentTab,
  EDITABLE_PRICE_INTERFACE_ID,
  EDITING_FIELDS,
  editingRules,
  IdDirection,
  IdInterfaceField,
  IdSessionPeriods,
  minDeliveryScheduleDaysCount,
  pricingType,
  sectionID,
  termsConditionsPaymentConst
} from '@constants';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxListComponent,
  DxNumberBoxModule,
  DxPopupModule,
  DxRadioGroupModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxTooltipModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxValidatorComponent,
  DxValidatorModule,
} from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  CommonService,
  CounterService,
  CurrencyService,
  DeliverySchedulePeriod,
  DeliverySchedulePeriodGraded,
  DeliveryScope,
  DemandService,
  DocumentsService,
  EditOfferDemandResponse,
  ErrorServiceService,
  NsiGoodValue,
  SubmissionService,
  ToastService,
  TradingService,
} from '@services';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import RU from '@ru-translate';
import EN from '@en-translate';
import moment from 'moment/moment';
import { CommonModule } from '@angular/common';
import { AngularSplitModule } from 'angular-split';
import {
  getNumber,
  toOADate,
  upperCaseFirstLetter,
  round,
  saveWithPending,
  checkSameUnits,
  getVatNumber
} from '@helpers';
import {
  ActualDimensionsPipe,
  ExcelDatePipe,
  RuNumberFormatPipe,
  ToNumberPipe,
  ToOADatePipe,
  UpperCaseFirstLetterPipe,
} from '@pipes';
import { SelectionChangedEvent } from 'devextreme/ui/data_grid';
import { convertExcelSerialDateToMs } from '../../views/homepage/helpers';
import { ListOfferCountersResponse, ListOfferCountersWorkerResponse, } from '../../services/counter-service/shared';
import { FilterOption } from '../../features/trading/pages/messages/shared';
import { ValueChangedEvent } from 'devextreme/ui/date_box';
import { Field, IEditOfferGood, IEditOfferGoodsSpecifications, IGoodsSpecifications, } from '@interfaces';
import { DxGridContextMenuLocalizationDirective } from '../../shared/directives';
import { EditLocationComponent } from '@components';
import { IReferences } from '../../views/homepage/interfaces';
import {
  CounterOffersBuyerInfoComponent,
  CounterOffersSellerInfoComponent,
} from '../index';
import { DemandCounter } from "../analogs-list/interfaces";
import { SortActualDimensionsPipe } from "../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe";
import { ShowGoodsFieldsPipe } from "../../shared/pipes/showGoodsFields/show-goods-fields-pipe";
import { ActualValuePipe } from "../../shared/pipes/showFieldsValue/actual-value-pipe";
import { GoodsValuePipe } from "../../shared/pipes/showFieldsValue/goods-value-pipe";
import { DisableNumberBoxWheel } from "../../shared/directives/disable-number-box-wheel";
import { OffersAdditionalInfoComponent } from '../../features/trading/components/offers-additional-info/offers-additional-info.component';
import { DELIVERY_SCOPE_ITEMS, ID_DELIVERY_TYPE } from "@enums";
import { VALUE_WITHOUT_VAT_ID } from "../submitting-bet/constants";
import { DeliveryScopeGraded, ScheduleData, SchedulePeriods, ScheduleGood } from "../../services/edit-demand-offer-service.service";
import { SumVolumePipe } from "../../shared/pipes/sumVolume/sum-volume-pipe";

@Component({
  selector: 'app-counte-offer-edit',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    AngularSplitModule,
    DxScrollViewModule,
    DxDataGridModule,
    DxTooltipModule,
    DxCheckBoxModule,
    DxDateBoxModule,
    DxValidatorModule,
    DxValidationGroupModule,
    DxSelectBoxModule,
    DxButtonModule,
    DxNumberBoxModule,
    DxPopupModule,
    DxRadioGroupModule,
    ExcelDatePipe,
    UpperCaseFirstLetterPipe,
    ToOADatePipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    DxListComponent,
    DxGridContextMenuLocalizationDirective,
    EditLocationComponent,
    CounterOffersSellerInfoComponent,
    CounterOffersBuyerInfoComponent,
    OffersAdditionalInfoComponent,
    SortActualDimensionsPipe,
    ActualDimensionsPipe,
    ShowGoodsFieldsPipe,
    ActualValuePipe,
    GoodsValuePipe,
    DisableNumberBoxWheel
  ],
  templateUrl: './counte-offer-edit.component.html',
  styleUrls: ['./counte-offer-edit.component.scss'],
})
export class CounteOfferEditComponent implements OnChanges {
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
  private sumVolumePipe: SumVolumePipe = inject(SumVolumePipe);

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
  @Input() deliveryScopeGraded: DeliveryScopeGraded[];
  @Input() isSameGradedSaleOffer: boolean = false;
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
  @Output() counterInfo = new EventEmitter<DemandCounter>();
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
  goodInfo = false;
  viewInfoGood = null;
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
  public currencyForFilter = []; //фильтр валюты
  public showFilters = false;
  public selectedItemKeysFilter: FilterOption[] = []; //выбранные элементы в фильтре

  SIZE_15 = 15;
  SIZE_85 = 85;

  isEditCurrency = false;
  isEditFinanceSource = false;
  isEditVatRate = false;

  selectedItemKeys = [];
  isDropDownOpened = false;
  filterDataSourceDropDown = [];

  locationField: Field;
  isEditProductLocation = false;
  productLocations: IReferences[] = [];
  productLocationValue: string | number;
  goodLocation: IEditOfferGood;

  public readonly EDITABLE_PRICE_INTERFACE_ID = EDITABLE_PRICE_INTERFACE_ID;

  public finishDelivSchPeriodsGraded: DeliverySchedulePeriodGraded[] = []; //массив графика поставки, который отправляется на бд
  public finishDeliveryScopesGraded: DeliveryScopeGraded[] = [];
  public finishDeliveryScopesRemainGraded: DeliveryScopeGraded[] = [];

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (
      !this.showFilter?.nativeElement.contains(event.target) &&
      !this.showFilterList?.nativeElement.contains(event.target)
    ) {
      if (this.showFilters) {
        this.showFilters = false;
      }
    }
  }

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

      this.goodInfo = false;
      this.viewInfoGood = null;
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

      if (this.isSimpleBuyerAuction()) this.getCurrencyForFilter();
      else this.getCounters();

      this.getPrecision();
      this.onInit();
    }
  }

  private getCurrencyForFilter(): void {
    this.commonService
      .getByName(this.user?.token, 'currencies')
      .subscribe((res) => {
        this.currencyForFilter = res.refbooks;
        this.currencyForFilter.unshift({
          id: '-1',
          name: 'по умолчанию',
          description: null,
        });

        this.selectedItemKeysFilter = [this.currencyForFilter[0]];

        this.getListDemandCounters();
      });
  }

  getCounters(): void {
    let displayCurrency =
      this.cache?.filters?.displayCurrency && !this.isMine
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : '';
    if (this.user?.IsWorker) {
      this.counterService
        .getListOfferCountersWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer,
          displayCurrency
        )
        .subscribe((res) => {
          this.processingCountersData(res);
          //   this.compareFields();
        });
    } else {
      this.counterService
        .getListOfferCountersTrader(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer,
          displayCurrency,
          this.isMine
        )
        .subscribe((res) => {
          this.processingCountersData(res);
        });
    }
  }

  processingCountersData(
    res: ListOfferCountersResponse | ListOfferCountersWorkerResponse
  ): void {
    this.counters = res.offerCounters;
    this.counters.forEach((item, index) => {
      item.counterNumber = index + 1;
    });
    this.getListOfferCountersGoods();
    let index = this.selectedRow
      ? this.counters.findIndex(
          (el) => el.counterNumber === this.selectedRow.counterNumber
        )
      : 0;
    this.selectedRow = this.counters[index]; //сразу выбираем первую встречку в списке
    this.tradingService.sendConcatedDeletedClients(
      this.selectedRow.concatedDeletedClients
    );
  }

  private getDisplayCurrency(): string | number {
    if (this.isMine && !this.isSimpleBuyerAuction()) {
      return '';
    }

    const cashedCurrency = this.isSimpleBuyerAuction()
      ? this.selectedItemKeysFilter[0]?.id
      : this.cache?.filters?.displayCurrency;

    if (cashedCurrency == -1) {
      return '';
    } else {
      return cashedCurrency;
    }
  }

  public onCurrencyFilterChanged(e): void {
    this.getListDemandCounters();

    let displayCurrency = this.getDisplayCurrency();
    this.demandService
      .getOfferShortInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idOffer,
        CurrentTab.auctions,
        'GetDemandShortInfo',
        'IdDemand',
        String(displayCurrency)
      )
      .subscribe((res) => {
        this.fullInfo.generalInfo = res.generalInfo;
        this.fullInfo.goods = res.goods;
        this.fullInfo.deliveryConditions = res.deliveryConditions;
        this.getPrecision();
      });
  }

  private getListDemandCounters(): void {
    let displayCurrency = this.getDisplayCurrency();
    const processResult = (res) => {
      this.counters = res.demandCounters;
      this.counters.forEach((item, index) => {
        item.counterNumber = index + 1;
      });
      this.getListDemandCountersGoods();
      let index = this.selectedRow
        ? this.counters.findIndex(
            (el) => el.counterNumber === this.selectedRow.counterNumber
          )
        : 0;
      this.selectedRow = this.counters[index]; //сразу выбираем первую встречку в списке
      // this.compareFields();
    };

    if (this.user?.IsWorker) {
      this.counterService
        .getListDemandCountersWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer,
          String(displayCurrency)
        )
        .subscribe(processResult);
    } else {
      this.counterService
        .getListDemandCountersTrader(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer,
          String(displayCurrency),
          this.isMine
        )
        .subscribe(processResult);
    }
  }

  private getListDemandCountersGoods(): void {
    let displayCurrency = this.getDisplayCurrency();

    this.counterService
      .getListDemandCountersGoods(
        this.user?.token,
        this.idOffer,
        String(displayCurrency)
      )
      .subscribe((res) => {
        this.countersGoods = res.goods;
        //добавляем товары в массив встречек
        this.counters.forEach((counter) => {
          counter.goods = this.countersGoods.filter(
            (good) => good.idDemandCounter === counter.idDemandCounter
          );
        });
      });
  }

  public updateIsDisabledAdjustablePrice(value: boolean): void {
    this.isDisabledAdjustablePrice = value;
  }

  public isAdjustablePriceCheckboxDisabled(): boolean {
    return (
      this.editRuleInIntersections(IdInterfaceField.adjustedPrice) ===
      editingRules.editingIsNotAvailable ||
      this.isDisabledAdjustablePrice
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

    this.tradingService.changeMainBasis$.subscribe((res: any) => {
      //обновлена цена
      if (res.str != 'edit') {
        this.fullInfo.goods = res.goods;
        this.fullInfo.goods.forEach((good) => {
          this.goodForm.controls[good.idGood.toString() + '_3'].patchValue(
            Number(
              this.getValue(
                good.goodsSpecifications,
                IdInterfaceField.priceWithoutVAT
              )
            )
          );
        });
        this.changeTotalCost();
      } else {
        const vat: number =
          this.VatField.fieldValueNumber.toString() !== VALUE_WITHOUT_VAT_ID
            ? Number(this.VatField.fieldValue.replace(/[^0-9]/g, ''))
            : 0;
        //так как отредактировать цену можем только в основном базисе, то изменяем только основной
        let mainBasis = this.deliveryBasisCommon.find(basis => basis.isMain);
        if (mainBasis) {
          mainBasis.goods = mainBasis.goods.map((good) => {
            const goodOffer: IEditOfferGood = res.goods.find(g =>
              g.goodsSpecifications[0].idDemandOfferGood ==
              good.idDemandOfferGood
            );
            const goodVolume: number = this.getGoodsSpecifications(
              goodOffer?.goodsSpecifications,
              IdInterfaceField.quantity
            )?.fieldValueNumber;
            const goodCost: number = this.getGoodsSpecifications(
              goodOffer?.goodsSpecifications,
              IdInterfaceField.priceWithoutVAT
            )?.fieldValueNumber;
            return {
              ...good,
              cost: goodCost,
              costVat: this.costVatBasis(goodCost, goodVolume, vat),
              minPrice: this.getGoodsSpecifications(
                goodOffer?.goodsSpecifications,
                IdInterfaceField.minPrice
              )?.fieldValueNumber || null
            };
          });
        }
      }
    });

    this.tradingService.changeVolume$.subscribe((res: any) => {
      if (res.str != 'edit') {
        this.fullInfo.goods = res.goods;
        this.fullInfo.goods.forEach((good) => {
          this.goodForm.controls[good.idGood.toString() + '_1'].patchValue(
            Number(
              this.getValue(good.goodsSpecifications, IdInterfaceField.quantity)
            )
          );
        });
        this.changeTotalCost();
      }
    });

    this.tradingService.isDisabledSaveButton$.subscribe((res: any) => {
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

      if (res.deliveryScopeGraded) {
        this.deliveryScopeGraded = res.deliveryScopeGraded;
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
    if (!isCanSchedule) {
      this.updateIsDisabledAdjustablePrice(true);
    }

    if (this.isComplexLotGrades())
      this.editProductLocation(
        this.fullInfo.goods[0],
        IdInterfaceField.productLocation
      );
    this.onInitTermCondition();
  }

  isComplexLotGrades(): boolean {
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

  getListOfferCountersGoods() {
    let displayCurrency =
      this.cache?.filters?.displayCurrency && !this.isMine
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : '';
    this.counterService
      .getListOfferCountersGoods(
        this.user?.token,
        this.idOffer,
        displayCurrency
      )
      .subscribe((res) => {
        this.countersGoods = res.goods;
        //добавляем товары в массив встречек
        this.counters.forEach((counter) => {
          counter.goods = this.countersGoods.filter(
            (good) => good.idOfferCounter === counter.idOfferCounter
          );
        });
        this.compareFields();
      });
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

  public toggleShowFilters(): void {
    this.showFilters = !this.showFilters;
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
      );

      //Ставка НДС
      let blockFind;

      //смотрим к какому блоку принадлежит товар
      this.dataForModel.blocks.forEach((block) => {
        block.products
          .filter((prod) => prod.level == 3)
          .forEach((item) => {
            if (item.valueId == good.idGoodName) {
              blockFind = block;
              return;
            }
          });

        block.products
          .filter((prod) => prod.level == 2)
          .forEach((item) => {
            if (item.valueId == good.idGoodGroup) {
              blockFind = block;
              return;
            }
          });

        block.products
          .filter((prod) => prod.level == 1)
          .forEach((item) => {
            if (item.valueId == good.idNomenclatureGroup) {
              blockFind = block;
              return;
            }
          });
      });

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
        if (EDITING_FIELDS.includes(field.idInterfaceField)) {
          this.goodForm.addControl(
            good.idGood.toString() + '_' + field.idInterfaceField.toString(),
            this.formBuilder.control(null, Validators.required)
          );
          //this.getNumber(this.getValue(good.goodsSpecifications, field.idInterfaceField))
          this.goodForm.controls[
            good.idGood.toString() + '_' + field.idInterfaceField.toString()
          ].patchValue(
            getNumber(
              this.getValue(good.goodsSpecifications, field.idInterfaceField)
            )
          );
        }
      });
    });
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

      this.compareFields();
    }
  }

  public onCreateFinishPeriod(): void {
    this.finishDelivSchPeriods = [];
    this.finishDelivSchPeriodsGraded = [];
    if (!this.isSameGradedSaleOffer) {
      this.finishDelivSchPeriods = this.buildOrdinaryFinishPeriods(this.scheduleData);
    } else {
      this.finishDelivSchPeriodsGraded = this.buildGradedFinishPeriods(this.scheduleData);
    }
    this.disableAdjustablePriceIfNoSchedule();
  }

  private buildOrdinaryFinishPeriods(scheduleData): DeliverySchedulePeriod[] {
    return scheduleData.map((item) => ({
      goods: this.buildGoodsForSchedulePeriod(item.goods),
      ...this.getPeriodOaDates(item.startDate, item.endDate),
      idPeriod: Number(item.idPeriod),
    }));
  }

  private buildGradedFinishPeriods(scheduleData: ScheduleData[]): DeliverySchedulePeriodGraded[]  {
    return scheduleData.map((sch) => ({
      ...this.getPeriodOaDates(sch.startDate, sch.endDate),
      periodVolume: sch.periodVolume,
      idPeriod: Number(sch.idPeriod),
    }));
  }

  private buildGoodsForSchedulePeriod(scheduleGoods: ScheduleGood[]) {
    return scheduleGoods
      .map((el) => {
        const good: IEditOfferGood = this.fullInfo.goods.find((g) => g.idGood === el.idGood);
        return this.hasNonZeroQuantity(good)
          ? this.mapScheduleGoodToFinishItem(good, el.volume)
          : null;
      })
      .filter(Boolean);
  }

  private mapScheduleGoodToFinishItem(good: IEditOfferGood, periodVolume: number) {
    const idDemandOfferGood: number = good.goodsSpecifications?.[0]?.idDemandOfferGood;
    return {
      idGood: idDemandOfferGood,
      idGoodFromFront: idDemandOfferGood,
      nsiGoodValues: this.mapNsiGoodValues(good?.goodValues),
      idGoodName: good.idGoodName,
      idGoodGroup: good.idGoodGroup,
      idNomenclature: good.idNomenclatureGroup,
      periodVolume,
      ...(this.fullInfo.generalInfo?.directionId === IdDirection.buy && {
        minPriceWithoutVat: this.getGoodsSpecifications(
          good.goodsSpecifications,
          IdInterfaceField.minPrice
        ).fieldValueNumber,
        locationService: this.getGoodsSpecifications(
          good?.goodsSpecifications,
          IdInterfaceField.placeOfWork
        )?.fieldValueNumber,
      }),
    };
  }

  private mapNsiGoodValues(goodValues: NsiGoodValue[]): NsiGoodValue[] {
    if (!goodValues?.length) {
      return [];
    }
    return goodValues.map((gv) => ({
      idReference: gv.idReference,
      listValues: gv.listValues,
      isAllowAnalogs: gv.isAllowAnalogs,
    }));
  }

  private hasNonZeroQuantity(good: IEditOfferGood): boolean {
    if (!good) {
      return false;
    }

    return this.getGoodsSpecifications(
      good.goodsSpecifications,
      IdInterfaceField.quantity
    )?.fieldValueNumber !== 0;
  }

  private getPeriodOaDates(startDate: string, endDate: string): {
    periodDateBegin: number;
    periodDateEnd: number;
  } {
    return {
      periodDateBegin: this.toOaDateFromDotDate(startDate),
      periodDateEnd: this.toOaDateFromDotDate(endDate),
    };
  }

  private toOaDateFromDotDate(date: string): number {
    const [day, month, year] = date.split('.');
    return toOADate(Date.parse(`${month}.${day}.${year}`));
  }

  private disableAdjustablePriceIfNoSchedule(): void {
    if (
      this.finishDelivSchPeriods?.length === 0 &&
      this.finishDelivSchPeriodsGraded?.length === 0 &&
      !this.isCanSchedule()
    ) {
      this.updateIsDisabledAdjustablePrice(true);
    }
  }

  onCreateFinishScopes() {
    this.finishDeliveryScopes = [];
    this.finishDeliveryScopesRemain = [];
    this.deliveryScopes.forEach((scope) => {
      let goods = [];
      scope[1].forEach((good) => {
        let goodFromList = this.fullInfo.goods.find(
          (g) => g.idGood == good.idGood
        );
        let nsiGoodValues = [];
        if (goodFromList?.goodValues?.length > 0) {
          goodFromList?.goodValues.forEach((gv) => {
            nsiGoodValues.push({
              idReference: gv.idReference,
              listValues: gv.listValues,
              isAllowAnalogs: gv.isAllowAnalogs,
            });
          });
        }
        goods.push({
          idGood: goodFromList.goodsSpecifications[0].idDemandOfferGood,
          idGoodFromFront:
            goodFromList.goodsSpecifications[0].idDemandOfferGood,
          nsiGoodValues: nsiGoodValues,
          idGoodName: goodFromList.idGoodName,
          idGoodGroup: goodFromList.idGoodGroup,
          idNomenclature: goodFromList.idNomenclatureGroup,
          volume: good.volume,
          ...(this.fullInfo.generalInfo?.directionId == IdDirection.buy && {
            minPriceWithoutVat: this.getGoodsSpecifications(
              goodFromList.goodsSpecifications,
              IdInterfaceField.minPrice
            ).fieldValueNumber,
            locationService: this.getGoodsSpecifications(
              goodFromList.goodsSpecifications,
              IdInterfaceField.placeOfWork
            )?.fieldValueNumber,
          }),
        });
      });

      if (!scope[1].isDeletedScope)
        //если удален грузоотправитель, то в остаточную заявку выделяется
        this.finishDeliveryScopes.push({
          goods: goods,
          idFirmClient: Number(scope[0]),
        });
      else {
        this.finishDeliveryScopesRemain.push({
          goods: goods,
          idFirmClient: Number(scope[0]),
        });
      }
    });
  }

  onCreateFinishBasis() {
    this.finishDeliveryBasis = [];
    this.deliveryBasisCommon.forEach((basis) => {
      let goods = [];
      basis.goods.forEach((good) => {
        let goodFromList = this.fullInfo.goods.find(
          (g) => g.idGood == good.idGood
        );
        if (
          this.getGoodsSpecifications(
            goodFromList.goodsSpecifications,
            IdInterfaceField.quantity
          ).fieldValueNumber != 0
        ) {
          let nsiGoodValues = [];
          if (goodFromList?.goodValues?.length > 0) {
            goodFromList?.goodValues.forEach((gv) => {
              nsiGoodValues.push({
                idReference: gv.idReference,
                listValues: gv.listValues,
                isAllowAnalogs: gv.isAllowAnalogs,
              });
            });
          }
          goods.push({
            idGood: goodFromList.goodsSpecifications[0].idDemandOfferGood,
            idGoodFromFront:
              goodFromList.goodsSpecifications[0].idDemandOfferGood,
            nsiGoodValues: nsiGoodValues,
            idGoodName: goodFromList.idGoodName,
            idGoodGroup: goodFromList.idGoodGroup,
            idNomenclature: goodFromList.idNomenclatureGroup,
            priceWithoutVat: good.cost,
            priceAdjustment: good.priceAdjustment,
            ...(this.fullInfo.generalInfo?.directionId == IdDirection.buy && {
              minPriceWithoutVat: good.minPrice,
              locationService: this.getGoodsSpecifications(
                goodFromList.goodsSpecifications,
                IdInterfaceField.placeOfWork
              )?.fieldValueNumber,
            }),
          });
        }
      });

      this.finishDeliveryBasis.push({
        goods: goods,
        isMain: basis.isMain,
        idBasisLink: basis.idBasisLink,
        idBasisValue: basis.idBasisValue,
        idPlaceLink: basis.idPlaceLink,
        idPlaceValue: basis.idPlaceValue,
        placeDetails:
          basis.idPlaceLink == null && basis.idPlaceValue == null
            ? basis.enterPlaceName
            : basis.specifyingLocation,
      });
    });
  }

  goToBasis() {
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

  onViewInfo(good) {
    this.viewInfoGood = good.idGood;
    this.goodInfo = false;
  }

  public onSelectionChanged(data: SelectionChangedEvent): void {
    this.selectedRow = data.selectedRowsData[0];

    this.onCancelChanges();

    this.tradingService.sendConcatedDeletedClients(
      this.selectedRow.concatedDeletedClients
    );
    this.counterInfo.emit(this.selectedRow);
  }

  //выделяем собственную встречку
  onRowPrepared(e: any) {
    if (e.rowType === 'data') {
      if (e.key.isMine) e.rowElement.classList.add('myOffer');
    }
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

  onContentReady(e) {
    //выделяем строку
    e.component.selectRows(this.selectedRow);
  }

  //todo посомтреь ошибку с кол-вом в консоли
  getVolumeCompare(idOfferGood) {
    return this.selectedRow.goods?.find(
      (good) => (good.idOfferGood || good.idDemandGood) === idOfferGood
    )?.volumeMatch;
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

  public compareFields(): void {
    if (this.selectedRow) {
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

      const vatString = this.getValue(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.VATrate
      );
      const vatNumber = Number(vatString.replace('%', '')) || null;
      this.selectedRow.vatMatch = vatNumber === this.selectedRow.vatPercent;
    }
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

          let priceAdjustment;
          if (this.deliveryConditionsChoose.length > 0)
            priceAdjustment =
              Number(
                this.deliveryConditionsChoose?.find(
                  (b) =>
                    b.idDemandOfferGood ==
                    (counterGood.idOfferGood || counterGood.idDemandGood)
                )?.priceAdjustment
              ) || null;
          else
            priceAdjustment = matchingGood.goodsSpecifications.find(
              (spec) =>
                spec.idDemandOfferGood ===
                  (counterGood.idOfferGood || counterGood.idDemandGood) &&
                spec.idInterfaceField === IdInterfaceField.amendment
            )?.fieldValueNumber;

          counterGood.priceAdjustmentMatch =
            priceAdjustment === counterGood.priceAdjustment;

          let costVat = matchingGood.goodsSpecifications.find(
            (spec) => 'costVAT' in spec
          );
          counterGood.costVatMatch =
            costVat.fieldValue === counterGood.totalAmount;
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

  public onInitTermCondition(): void {
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
      });
  }

  public editTermConditions(): void {
    if (!this.isCanSchedule()) {
      this.updateIsDisabledAdjustablePrice(true);
    }
    this.editTermCondition = true;
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
    this.deliveryTermConcated = this.fullInfo.generalInfo.concatedDeliveryPeriod;
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
        if (
          !this.deliveryTermForm.controls.deliveryType.value &&
          !this.isEditedDeliveryTerm
        ) {
          this.deliveryTermForm.controls.deliveryType.patchValue(
            this.fullInfo.deliveryPeriod.idDeliveryType?.toString() || null
          );
          this.deliveryTermStartChange('deliveryType');
        }
        //если найдена всего одна запись - сразу отображается заполненый select-box
        const hasSingleDeliveryTermType: boolean = this.deliveryTermType?.length === 1;

        if (hasSingleDeliveryTermType) {
          this.deliveryTermForm.controls.deliveryType.patchValue(
            this.deliveryTermType[0].deliveryTermId
          );
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
      const scheduleLength: number = this.isSameGradedSaleOffer ?
        this.finishDelivSchPeriodsGraded.length :
        this.finishDelivSchPeriods.length;

      if (
        scheduleLength > 0 &&
        !(this.isCanSchedule() && this.adjustablePrice)
      ) {
        this.isPopupClear = true;
      }
      if (scheduleLength === 0 && this.isCanSchedule()) {
        this.updateIsDisabledAdjustablePrice(false);
      }
      if (scheduleLength === 0 && !this.isCanSchedule()) {
        this.updateIsDisabledAdjustablePrice(true);
        this.adjustablePrice = false;
      }
    }
  }

  private updateScheduleInfo(isReturnSchedule?: true): void {
    let deliveryPeriodInDaysCloseEdit: number | null =
      this.fullInfo.deliveryPeriod.idDeliveryType === ID_DELIVERY_TYPE.DATE
        ? (this.fullInfo.deliveryPeriod?.dateEnd
          ? convertExcelSerialDateToMs(this.fullInfo.deliveryPeriod?.dateEnd)
          : null)
        : this.fullInfo.deliveryPeriod.periodTypeValue;
    let deliveryPeriodInDaysIsEdit: number | null | Date =
      this.deliveryTermForm.controls.deliveryType.value === ID_DELIVERY_TYPE.DATE
        ? this.deliveryTermForm.controls.endDate.value
        : this.deliveryTermForm.controls.deliveryTerm.value;
    let deliveryStartDateCloseEdit: number | null =
      this.fullInfo.deliveryPeriod?.dateBegin
        ? convertExcelSerialDateToMs(this.fullInfo.deliveryPeriod?.dateBegin)
        : null;

    const body = {
      ...(isReturnSchedule && { returnSchedule: [] }),
      deliveryType: this.editTermCondition
        ? this.deliveryTermForm.controls.deliveryType.value
        : this.fullInfo.deliveryPeriod.idDeliveryType.toString(),
      deliveryPeriodInDays: this.editTermCondition
        ? deliveryPeriodInDaysIsEdit
        : deliveryPeriodInDaysCloseEdit,
      deliveryStartDate: this.editTermCondition
        ? this.deliveryTermForm.controls.startDate.value
        : deliveryStartDateCloseEdit,
      concatedStringDeliveryTerm: this.editTermCondition
        ? this.deliveryTermConcated
        : this.fullInfo.generalInfo.concatedDeliveryPeriod,
    };
    this.tradingService.editDeliveryParams(body);
  }

  onChangedAdjustablePrice(e) {
    this.isDisabledSaveButton = false;
    if (e.value && this.isCanSchedule()) {
      this.updateScheduleInfo(true);
      this.onRedFlag.emit();
    }
    if (!e.value) {
      const scheduleLength: number = this.isSameGradedSaleOffer ?
        this.finishDelivSchPeriodsGraded.length :
        this.finishDelivSchPeriods.length;

      if (scheduleLength > 0 && this.isCanSchedule()) {
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
      this.updateIsDisabledAdjustablePrice(true);
    }
    this.isPopupClear = false;
    this.isPopupClearPrice = false;
    this.tradingService.editDeliveryParams({ schedule: [] });
    this.finishDelivSchPeriods = [];
    this.finishDelivSchPeriodsGraded = [];
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
        this.termsConditions?.volumes?.forEach((item) => {
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
    let good = this.fullInfo.goods.find((el) => el.idGood == idGood);

    good.goodsSpecifications.find(
      (el) => el.idInterfaceField == idField
    ).fieldValueNumber = Number(
      this.goodForm.controls[good.idGood.toString() + '_' + idField.toString()]
        .value
    );
    good.goodsSpecifications.find(
      (el) => el.idInterfaceField == idField
    ).fieldValue = Number(
      this.goodForm.controls[good.idGood.toString() + '_' + idField.toString()]
        .value
    ).toString();

    let count = Number(
      this.goodForm.controls[good.idGood.toString() + '_1'].value
    ); //количество
    let priceWithoutVat = Number(
      this.goodForm.controls[good.idGood.toString() + '_3'].value
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
      this.fullInfo.generalInfo.concatedDeliveryPeriod =
        this.selectedRow.concatedDeliveryPeriod;
      this.updateScheduleInfo();
    } else {
      this.fullInfo.generalInfo.concatedDeliveryPeriod =
        this.selectedRow.concatedDeliveryPeriod;
    }

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

            this.goodForm.controls[good.idGood.toString() + '_' + IdInterfaceField.priceWithoutVAT].patchValue(
              Number(
                this.getValue(
                  good.goodsSpecifications,
                  IdInterfaceField.priceWithoutVAT
                )
              )
            );
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
      this.goodForm.controls[good.idGood.toString() + '_1'].patchValue(
        Number(
          this.getValue(good.goodsSpecifications, IdInterfaceField.quantity)
        )
      );

      //Корректируемая цена
      /*  if (this.getGoodsSpecifications(this.fullInfo.goods[0].goodsSpecifications, 47))
          good.goodsSpecifications.find(el => el.idInterfaceField == 47).fieldValue = this.adjustablePrice;*/
    });
    this.changeTotalCost();
    //грузоотправители
    if (this.deliveryScopes?.length > 0) {
      if (!this.isSameGradedSaleOffer) {
        let concatedDeletedClients: string[] =
          this.selectedRow.concatedDeletedClients?.split(', ');
        this.deliveryScopes.forEach((scope) => {
          if (
            concatedDeletedClients?.length > 0 &&
            concatedDeletedClients.includes(scope[0])
          ) {
            scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].isDeletedScope = true;
          }
        });
        this.tradingService.sendChangeScope(this.deliveryScopes);
        this.onCreateFinishScopes();
      }
    }
    this.isDisabledSaveButton = false;
    this.compareFields();
  }

  public onCancelChanges(): void {
    // нужно ли вызывать функцию при изменении количества
    let isVolumeChanged = false;

    this.fullInfo.goods.forEach((good) => {
      let findGood = this.fullInfoOriginal.goods.find(
        (g) => g.idGood == good.idGood
      );

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
      this.fullInfo.deliveryPeriod =
        this.fullInfoOriginal.deliveryPeriod;
      this.fullInfo.generalInfo.concatedDeliveryPeriod =
        this.fullInfoOriginal.generalInfo.concatedDeliveryPeriod;
      this.updateScheduleInfo();
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

    if (this.deliveryScopes?.length > 0 && !this.isSameGradedSaleOffer) {
      this.deliveryScopes?.forEach((scope) => {
        scope[1].isDeletedScope = false;
        scope[1].forEach((good) => {
          good.volume = this.fullInfo.deliveryScopes
            .filter((el) => el.idFirmClient === Number(scope[0]))
            .find((g) => g.idDemandOfferGood == good.idDemandOfferGood).volume;
        });
      });

      this.tradingService.sendChangeScope(this.deliveryScopes);
    }

    if (this.isSameGradedSaleOffer && this.deliveryScopeGraded?.length > 0) {
      this.deliveryScopeGraded = this.deliveryScopeGraded.map((scope) => {
        return {
          ...scope,
          isDeletedScope: false,
          volume: this.fullInfo.deliveryScopesGraded.find(el => el.idFirmClient === scope.idFirmClient)?.volume
        };
      });

      this.tradingService.sendChangeScope(this.deliveryScopeGraded);
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

  applyAdditionalGoodParam(): void {
    if (this.isSimpleBuyerAuction()) {
      let idCurrency = this.selectedRow.idCurrency;
      let vatId = this.selectedRow.idVatPercent;

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
    }
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
        this.goodForm.controls[good.idGood.toString() + '_3'].patchValue(
          Number(this.getValue(good.goodsSpecifications, 3))
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

    let blockFind;
    this.dataForModel.blocks.forEach((block) => {
      block.products
        .filter((prod) => prod.level == 3)
        .forEach((item) => {
          if (item.valueId == good.idGoodName) {
            blockFind = block;
            return;
          }
        });

      block.products
        .filter((prod) => prod.level == 2)
        .forEach((item) => {
          if (item.valueId == good.idGoodGroup) {
            blockFind = block;
            return;
          }
        });
      block.products
        .filter((prod) => prod.level == 1)
        .forEach((item) => {
          if (item.valueId == good.idNomenclatureGroup) {
            blockFind = block;
            return;
          }
        });
    });

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

  formGoodsFinishArray(item, endProperties, goodArray, isRemains?) {
    item.goodsSpecifications.forEach((field) => {
      if (!field.isVirtual && field.idInterfaceField && (field.fieldValueNumber || field.fieldValue)) {
        if (
          isRemains &&
          field.idInterfaceField === IdInterfaceField.adjustedPrice
        ) {
          field.fieldValue = 'false';
        } else if (
          !isRemains &&
          field.idInterfaceField === IdInterfaceField.adjustedPrice
        ) {
          field.fieldValue = this.adjustablePrice.toString();
        }
        //при записи в остаточный массив если поле количество - то от количества которое пришло отнимаем текущее количество
        endProperties.push({
          idInterfaceField: field.idInterfaceField,
          fieldValueNumber: !field.fieldValueArray
            ? (field.controlFieldType == 'dxSelectBox' &&
                field.idInterfaceField !== IdInterfaceField.productLocation) ||
              field.controlFieldType == 'dxNumberBox'
              ? isRemains &&
                field.idInterfaceField === IdInterfaceField.quantity
                ? this.getGoodsSpecifications(
                    this.getOriginalGood(item.idGood).goodsSpecifications,
                    IdInterfaceField.quantity
                  ).fieldValueNumber - field.fieldValueNumber
                : Number(field.fieldValueNumber)
              : null
            : null,
          fieldValueString:
            !field.fieldValueArray &&
            (field.controlFieldType == 'dxTextBox' ||
              field.controlFieldType == 'dxCheckBox' ||
              (field.controlFieldType == 'dxSelectBox' &&
                field.idInterfaceField === IdInterfaceField.productLocation))
              ? field.fieldValue
              : null,
          listFieldValues: field.fieldValueArray ? field.fieldValueArray : '',
        });
      }
    });

    let nsiGoodValues = [];
    if (item?.goodValues?.length > 0) {
      item?.goodValues.forEach((gv) => {
        nsiGoodValues.push({
          idReference: gv.idReference,
          listValues: gv.listValues,
          isAllowAnalogs: gv.isAllowAnalogs,
        });
      });
    }
    goodArray.push({
      idGood: item.goodsSpecifications[0].idDemandOfferGood,
      idGoodFromFront: item.goodsSpecifications[0].idDemandOfferGood,
      nsiGoodValues: nsiGoodValues,
      idGoodName: item.idGoodName,
      idGoodGroup: item.idGoodGroup,
      idNomenclature: item.idNomenclatureGroup,
      properties: endProperties,
      ...(this.fullInfo.generalInfo?.directionId == IdDirection.buy && {
        minPriceWithoutVat: this.getGoodsSpecifications(
          item.goodsSpecifications,
          IdInterfaceField.minPrice
        ).fieldValueNumber,
        locationService: this.getGoodsSpecifications(
          item.goodsSpecifications,
          IdInterfaceField.placeOfWork
        ).fieldValueNumber,
      }),
    });
  }

  public generatePeriods(schedule: ScheduleData[]): SchedulePeriods[]{
    let periods: SchedulePeriods[] = [];
    if (!this.isSameGradedSaleOffer) {
      schedule.forEach((item) => {
        for (let i = 0; i < item.goods.length; i++) {
          periods.push({
            number: item.numberPeriod,
            startDate: item.startDate,
            endDate: item.endDate,
            volume: item.goods[i].volume,
            unit: this.fullInfo.goods.find(
              (el) =>
                el.goodsSpecifications[0].idDemandOfferGood ==
                item.goods[i].idGood
            ).unitName,
          });
        }
      });
    } else {
      periods = this.finishDelivSchPeriodsGraded.map(item => {
        return {
          number: item.idPeriod,
          startDate: item.periodDateBegin,
          endDate: item.periodDateEnd,
          volume: item.periodVolume,
          unit: this.fullInfo.goods[0].unitName,
        };
      });
    }
    return periods;
  }

  public prepareFinishDeliveryScopes(goodCurrent, goodRemains): void {
    if (this.isSameGradedSaleOffer) {
      this.prepareGradedFinishScopes(goodCurrent, goodRemains);
    } else {
      this.prepareOrdinaryFinishScopes(goodCurrent, goodRemains);
    }
  }

  private prepareOrdinaryFinishScopes(goodCurrent, goodRemains): void {
    if (this.uniqueDeliveryScopes?.length === 1) {
      this.buildSingleScopeFinishVolumes(goodCurrent, goodRemains);
    }
    this.finishDeliveryScopesRemain = this.filterScopeGoodsByAvailable(
      this.finishDeliveryScopesRemain,
      goodRemains
    );
    this.finishDeliveryScopes = this.filterScopeGoodsByAvailable(
      this.finishDeliveryScopes,
      goodCurrent
    );
  }

  private prepareGradedFinishScopes(goodCurrent, goodRemains): void {
    if (this.deliveryScopeGraded?.length > 0) {
      const { finish, remain } = this.splitGradedScopesIntoFinishAndRemain(
        this.deliveryScopeGraded
      );
      this.finishDeliveryScopesGraded = finish;
      this.finishDeliveryScopesRemainGraded = remain;
      return;
    }
    if (this.uniqueDeliveryScopes?.length === 1) {
      this.buildSingleGradedFinishVolumes(goodCurrent, goodRemains);
    }
  }

  private buildSingleScopeFinishVolumes(goodCurrent, goodRemains): void {
    this.deliveryScopes[0][DELIVERY_SCOPE_ITEMS.SCOPE_INFO].forEach((good) => {
      good.volume = this.getGoodQuantity(
        goodCurrent.find((g) => g.idGood === good.idDemandOfferGood)
      );
    });
    this.onCreateFinishScopes();
    this.finishDeliveryScopesRemain = JSON.parse(
      JSON.stringify(this.finishDeliveryScopes)
    );
    this.finishDeliveryScopesRemain[0].goods.forEach((good) => {
      good.volume = this.getGoodQuantity(
        goodRemains.find((g) => g.idGood === good.idGood)
      );
    });
  }

  private buildSingleGradedFinishVolumes(goodCurrent, goodRemains): void {
    const idFirmClient = Number(
      this.deliveryScopes[0][DELIVERY_SCOPE_ITEMS.ID_SCOPE]
    );
    this.finishDeliveryScopesGraded = [{
      idFirmClient,
      volume: this.sumGoodsQuantity(goodCurrent),
    }];
    this.finishDeliveryScopesRemainGraded = [{
      idFirmClient,
      volume: this.sumGoodsQuantity(goodRemains),
    }];
  }

  private splitGradedScopesIntoFinishAndRemain(
    deliveryScopeGraded: DeliveryScopeGraded[]
  ): { finish: DeliveryScopeGraded []; remain: DeliveryScopeGraded [] } {
    const remain: DeliveryScopeGraded [] = deliveryScopeGraded.flatMap((scopeInfo) => {
      const originalVolume = this.getOriginalGradedScopeVolume(scopeInfo.idFirmClient);
      if (scopeInfo.isDeletedScope) {
        return [{ idFirmClient: scopeInfo.idFirmClient, volume: originalVolume }];
      }
      if (scopeInfo.volume < originalVolume) {
        return [{
          idFirmClient: scopeInfo.idFirmClient,
          volume: originalVolume - scopeInfo.volume,
        }];
      }
      return [];
    });
    const finish: DeliveryScopeGraded [] = deliveryScopeGraded
      .filter((el) => !el.isDeletedScope && el.volume !== 0)
      .map(({ idFirmClient, volume }) => ({ idFirmClient, volume }));
    return { finish, remain };
  }

  private filterScopeGoodsByAvailable(
    scopes: DeliveryScope[] | undefined,
    availableGoods: { idGood: number }[]
  ): DeliveryScope[] {
    if (!scopes?.length) {
      return scopes ?? [];
    }
    return scopes.map((scope) => ({
      ...scope,
      goods: scope.goods.filter((good) =>
        availableGoods.some((g) => g.idGood === good.idGood)
      ),
    }));
  }

  private getOriginalGradedScopeVolume(idFirmClient: number): number {
    return this.deliveryScopes
      ?.find((client) => Number(client[DELIVERY_SCOPE_ITEMS.ID_SCOPE]) === idFirmClient)
      ?.[DELIVERY_SCOPE_ITEMS.SCOPE_INFO]?.[0]?.volume || 0;
  }

  private sumGoodsQuantity(goods: {
    properties?: { idInterfaceField: number; fieldValueNumber?: number }[]
  }[]): number {
    return this.sumVolumePipe.transform(
      goods.flatMap((el) => el.properties ?? [])
        .filter((el) => el.idInterfaceField === IdInterfaceField.quantity),
      'fieldValueNumber'
    );
  }

  private getGoodQuantity(good: { properties?: { idInterfaceField: number; fieldValueNumber?: number }[] }): number {
    return good?.properties
      ?.find((el) => el.idInterfaceField === IdInterfaceField.quantity)
      ?.fieldValueNumber ?? 0;
  }

  public onSave(): void {
    this.isOnSaveButtonWasClicked = true;

    let error = false, errorMessage: string;

    if (this.editTermPayment)
      if (!this.validationGroup?.instance.validate().isValid) {
        return;
      }

    if (this.editTermCondition)
      if (!this.deliveryTermValidationGroup?.instance.validate().isValid) {
        return;
      }

    if (this.deadlineErrorMess?.length > 0) {
      const errors = {
        error: true,
        errorStatus: 0,
        messageError: this.deadlineErrorMess,
      };

      this.errorServiceService.callErrorPopup(errors);
      return;
    }

    if(!this.goodFormValidationGroup?.instance.validate().isValid)
      return;

    this.requestDataScope.emit({
      callback: (data: boolean) => {
        // Получаем данные от родителя
        if (data) {
          error = true;
          errorMessage = this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].unableSaveChanges + RU['editOffer'].adjustVolumeDistribution
            : EN['editOffer'].unableSaveChanges + EN['editOffer'].adjustVolumeDistribution
        }
      },
    });

    this.requestDataSchedule.emit({
      callback: (data: boolean) => {
        // Получаем данные от родителя
        if (data) {
          error = true;
          errorMessage = this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].unableSaveChanges + RU['editOffer'].adjustDeliverySchedule
            : EN['editOffer'].unableSaveChanges + EN['editOffer'].adjustDeliverySchedule
        }
      },
    });

    this.requestDataBasis.emit({
      callback: (data: boolean) => {
        // Получаем данные от родителя
        if (data) {
          error = true;
          errorMessage = this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].unableSaveChanges + RU['editOffer'].adjustDeliveryTerms
            : EN['editOffer'].unableSaveChanges + EN['editOffer'].adjustDeliveryTerms
        }
      },
    });

    if (error) {
      if(errorMessage?.length > 0){
        const errors = {
          error: true,
          errorStatus: 0,
          messageError: errorMessage

        };
        this.errorServiceService.callErrorPopup(errors);
      }
      return;
    } else {
      let remainsOffer,
        goodCurrent = [],
        goodRemains = [];

      this.fullInfo.goods.forEach((item) => {
        let endPropertiesCurrentOffer = [],
          endPropertiesRemainsOffer = [];
        //сравниваем текущий объем с первоначальным объемом, если объем в каком-либо товаре изменился, то на разницу этого объема отделяется новая заявка
        if (
          this.getGoodsSpecifications(
            item.goodsSpecifications,
            IdInterfaceField.quantity
          ).fieldValueNumber == 0
        ) {
          this.formGoodsFinishArray(
            item,
            endPropertiesRemainsOffer,
            goodRemains,
            true
          );
        } else if (
          this.getGoodsSpecifications(
            item.goodsSpecifications,
            IdInterfaceField.quantity
          ).fieldValueNumber ==
          this.getGoodsSpecifications(
            this.getOriginalGood(item.idGood).goodsSpecifications,
            IdInterfaceField.quantity
          ).fieldValueNumber
        ) {
          this.formGoodsFinishArray(
            item,
            endPropertiesCurrentOffer,
            goodCurrent
          );
        } else {
          this.formGoodsFinishArray(
            item,
            endPropertiesCurrentOffer,
            goodCurrent
          );
          this.formGoodsFinishArray(
            item,
            endPropertiesRemainsOffer,
            goodRemains,
            true
          );
        }
      });

      this.onCreateFinishBasis();
      //проходимся по массивам грузотправителей, чтобы было одинаковое количество товара и товаров в грузоотправителях
      this.prepareFinishDeliveryScopes(goodCurrent, goodRemains);
      let payCondFull, paymentPart, deliveryPeriod;

      let objForReq = {}; //объект для записи в боди
      this.fullInfo.goods.forEach((item) => {
        let endKeys = [];
        let endValues = [];
        let objectForValues = {}; //объект заполненных полей 1 товара

        item.goodsSpecifications.forEach((field) => {
          for (let i = 0; i < field.length; i++) {
            if (field.idInterfaceField) {
              endKeys.push(
                'field' + field.blockId + 'n' + field.idInterfaceField
              );
              endValues.push(
                field.controlFieldType == 'dxSelectBox' ||
                  field.controlFieldType == 'dxNumberBox'
                  ? field.fieldValueNumber
                  : field.controlFieldType == 'dxTextBox' ||
                    field.controlFieldType == 'dxCheckBox'
                  ? field.fieldValue
                  : null
              );
            }
          }
          objectForValues = Object.assign(
            {},
            ...endKeys.map((n, i) => ({ [n]: endValues[i] }))
          );
        });

        objectForValues['products'] = null;

        if (this.fullInfo.goods[0] == item) {
          objectForValues['termsConditionsPayment'] = {
            paymentConditionId: this.editTermPayment
              ? this.termsPaymentForm.controls.termsPayment?.value
              : this.fullInfo.paymentCond.idPaymentType,
            paymentVolumeId: this.editTermPayment
              ? this.termsPaymentForm.controls.volume?.value
              : this.fullInfo.paymentCond.idShipmentVolume,
            prepayMomentId: this.editTermPayment
              ? this.termsPaymentForm.controls.momentPrepayment?.value || null
              : (this.fullInfo.paymentCond.idPaymentType !=
                termsConditionsPaymentConst.paymentDeferment
                  ? this.fullInfo.paymentCond.firstPaymentMomentId
                  : null) || null,
            delayMomentId: this.editTermPayment
              ? this.termsPaymentForm.controls.momentDelay?.value || null
              : this.fullInfo.paymentCond.idPaymentType ==
                termsConditionsPaymentConst.partialPrepayment
              ? this.fullInfo.paymentCond.secondPaymentMomentId
              : this.fullInfo.paymentCond.idPaymentType ==
                termsConditionsPaymentConst.paymentDeferment
              ? this.fullInfo.paymentCond.firstPaymentMomentId
              : null,
            dayTypeId: this.editTermPayment
              ? this.termsPaymentForm.controls.dayTypeId?.value || null
              : this.fullInfo.paymentCond.idDayType || null,
            delayValue: this.editTermPayment
              ? this.termsPaymentForm.controls.defermentAmount?.value || 0
              : this.fullInfo.paymentCond.idPaymentType ==
                termsConditionsPaymentConst.paymentDeferment
              ? this.fullInfo.paymentCond.firstPercent || 0
              : this.fullInfo.paymentCond.idPaymentType ==
                termsConditionsPaymentConst.partialPrepayment
              ? this.fullInfo.paymentCond.secondPercent || 0
              : 0,
            delayValue2: this.editTermPayment
              ? this.termsPaymentForm.controls.defermentAmount2?.value || null
              : 100 - this.fullInfo.paymentCond?.firstPercent ||
                0 - this.fullInfo.paymentCond.secondPercent ||
                0 ||
                null,
            prepayValue: this.editTermPayment
              ? this.termsPaymentForm.controls.prepaymentAmount?.value || 0
              : this.fullInfo.paymentCond.idPaymentType !=
                termsConditionsPaymentConst.paymentDeferment
              ? this.fullInfo.paymentCond.firstPercent || 0
              : 0,

            delayTerm: {
              applicableDayCount: this.editTermPayment
                ? this.momentPrepayment?.options.applicableDayCount
                  ? this.termsPaymentForm.controls.defermentPeriodNumber?.value
                  : null
                : this.fullInfo.paymentCond.idDayType
                ? this.termsPaymentForm.controls.termsPayment?.value ==
                  termsConditionsPaymentConst.partialPrepayment
                  ? this.fullInfo.paymentCond.secondPeriodValueNumber
                  : this.termsPaymentForm.controls.termsPayment?.value ==
                    termsConditionsPaymentConst.paymentDeferment
                  ? this.fullInfo.paymentCond.firstPeriodValueNumber
                  : null
                : null,
              calendarDayCount2: this.editTermPayment
                ? this.termsPaymentForm.controls.defermentPeriod2?.value || null
                : this.fullInfo.paymentCond.thirdPeriodValueNumber,
              dayOfMonth: this.editTermPayment
                ? this.momentPrepayment?.options.dayOfMonth
                  ? this.termsPaymentForm.controls.defermentPeriodNumber?.value
                  : null
                : !this.fullInfo.paymentCond.idDayType
                ? this.termsPaymentForm.controls.termsPayment?.value ==
                  termsConditionsPaymentConst.partialPrepayment
                  ? this.fullInfo.paymentCond.secondPeriodValueNumber
                  : this.termsPaymentForm.controls.termsPayment?.value ==
                    termsConditionsPaymentConst.paymentDeferment
                  ? this.fullInfo.paymentCond.firstPeriodValueNumber
                  : null
                : null,
              date: this.editTermPayment
                ? this.momentPrepayment?.options.date
                  ? this.termsPaymentForm.controls.defermentPeriodDate?.value
                  : null
                : this.fullInfo.paymentCond.firstPeriodValueDate || null,
            },
            prepayTerm: {
              applicableDayCount: this.editTermPayment
                ? this.momentPrepayment?.options.calendarDayCount
                  ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value
                  : null
                : this.fullInfo.paymentCond.idDayType
                ? this.fullInfo.paymentCond.firstPeriodValueNumber
                : null,
              dayOfMonth: this.editTermPayment
                ? this.momentPrepayment?.options.dayOfMonth
                  ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value
                  : null
                : !this.fullInfo.paymentCond.idDayType
                ? this.fullInfo.paymentCond.firstPeriodValueNumber
                : null,
              date: this.editTermPayment
                ? this.momentPrepayment?.options.date
                  ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                  : null
                : this.fullInfo.paymentCond.firstPeriodValueDate,
            },
          };

          if (this.deliveryBasisCommon?.length > 0) {
            let extra = [];
            let main = {};
            this.deliveryBasisCommon?.forEach((item) => {
              if (item.coreBasis) {
                main = {
                  minAddBasisPlaces: item.minAddBasisPlaces,
                  contradictoryValueId: item.contradictoryValueId,
                  contradictoryBasisName: item.contradictoryBasisName,
                  isRequiredPlace: item.isRequiredPlace,
                  isRequiredAddBasis: item.isRequiredAddBasis,
                  minAddBasis: item.minAddBasis,
                  placeName: item.enterPlaceName,
                  placeTypeId: item.placeTypeId,
                  parentId: item.parentId,
                  linkId: item.idBasisLink,
                  valueId: item.idBasisValue,
                  level: item.level,
                  hasChildren: item.hasChildren,
                  basisId: item.basisId,
                  basisName: item.basisName,
                };
              } else {
                extra.push({
                  minAddBasisPlaces: item.minAddBasisPlaces,
                  contradictoryValueId: item.contradictoryValueId,
                  contradictoryBasisName: item.contradictoryBasisName,
                  isRequiredPlace: item.isRequiredPlace,
                  isRequiredAddBasis: item.isRequiredAddBasis,
                  minAddBasis: item.minAddBasis,
                  placeName: item.enterPlaceName,
                  placeTypeId: item.placeTypeId,
                  parentId: item.parentId,
                  linkId: item.idBasisLink,
                  valueId: item.idBasisValue,
                  level: item.level,
                  hasChildren: item.hasChildren,
                  basisId: item.basisId,
                  basisName: item.basisName,
                });
              }
            });
            objectForValues['deliveryCondition'] = Object.assign(
              { main: main },
              { extra: extra }
            );
          }

          objectForValues['deliveryTerm'] = {
            deliveryStartId: this.deliveryTermForm.value.startDelivery,
            deliveryTermId: this.deliveryTermForm.value.deliveryType,
            dayValue:
              this.deliveryTermForm.value.deliveryType == 1
                ? this.deliveryTermForm.value.deliveryTerm
                : null,
            monthValue:
              this.deliveryTermForm.value.deliveryType == 2
                ? this.deliveryTermForm.value.deliveryTerm
                : null,
            startDeliveryDate: this.deliveryTermForm.value?.startDate
              ? toOADate(this.deliveryTermForm.value?.startDate)
              : null,
            endDeliveryDate: this.deliveryTermForm.value?.endDate
              ? toOADate(this.deliveryTermForm.value?.endDate)
              : null,
          };

          if (this.finishDelivSchPeriods.length > 0 || this.finishDelivSchPeriodsGraded.length > 0) {
            const schedule: ScheduleData[] = this.isSameGradedSaleOffer ? this.finishDelivSchPeriodsGraded : this.finishDelivSchPeriods;

            objectForValues['deliverySchedule'] = Object.assign(
              {
                periodType: {
                  id: schedule[0]?.idPeriod,
                  name: '',
                },
              },
              { periods: this.generatePeriods(schedule) }
            );
          }
        }

        let endObject = {}; //объект с индексом товара

        endObject[this.fullInfo.goods.indexOf(item)] = objectForValues;
        objForReq = Object.assign(endObject, objForReq);
      });

      let rules = {
        model: this.dataForModel,
        modelId: this.fullInfo.generalInfo.idModel,
        values: objForReq,
        sessionsParams: {
          tradeTypeId: this.dataForModel.tradeTypeId.toString(),
          marketTypeIds: this.dataForModel.marketTypeIds,
        },
        generalParams: {
          //!добавить свое
          validityPeriod: null,
          isMoveToNextSession: false,
        },
        demandParams: {
          //!добавить свое
          directionId: this.fullInfo.generalInfo.directionId,
          marketTypeIds: null, //this.demandsModal.marketTypeIds
          startDate: null,
        },
      };

      if (this.editTermPayment) {
        //открыт блок редактирования условия оплаты
        payCondFull =
          this.termsPaymentForm.controls.termsPayment?.value !=
          termsConditionsPaymentConst.partialPrepayment
            ? {
                idPaymentType:
                  this.termsPaymentForm.controls.termsPayment?.value,
                idDayType:
                  this.termsPaymentForm.controls.dayTypeId?.value || null,
                idShipmentVolume: this.termsPaymentForm.controls.volume?.value,
                idPaymentMoment:
                  this.termsPaymentForm.controls.termsPayment?.value ==
                    termsConditionsPaymentConst.prepayment100 ||
                  this.termsPaymentForm.controls.termsPayment?.value ==
                    termsConditionsPaymentConst.paymentThroughExchange
                    ? this.termsPaymentForm.controls.momentPrepayment?.value
                    : this.termsPaymentForm.controls.momentDelay?.value,
                periodValueNumber:
                  this.termsPaymentForm.controls.termsPayment?.value !=
                  termsConditionsPaymentConst.paymentDeferment
                    ? this.termsPaymentForm.controls.prepaymentPeriodNumber
                        ?.value || null
                    : this.termsPaymentForm.controls.defermentPeriodNumber
                        ?.value || null,
                periodValueDate:
                  this.termsPaymentForm.controls.termsPayment?.value !=
                  termsConditionsPaymentConst.paymentDeferment
                    ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                      ? toOADate(
                          this.termsPaymentForm.controls.prepaymentPeriodDate
                            ?.value
                        )
                      : null
                    : this.termsPaymentForm.controls.defermentPeriodDate?.value
                    ? toOADate(
                        this.termsPaymentForm.controls.defermentPeriodDate
                          ?.value
                      )
                    : null,
              }
            : null;
        paymentPart =
          this.termsPaymentForm.controls.termsPayment?.value ==
          termsConditionsPaymentConst.partialPrepayment
            ? {
                idDayType:
                  this.termsPaymentForm.controls.dayTypeId?.value || null,
                idShipmentVolume: this.termsPaymentForm.controls.volume?.value,
                idPaymentMomentPrepay:
                  this.termsPaymentForm.controls.momentPrepayment?.value,
                firstPercent:
                  this.termsPaymentForm.controls.prepaymentAmount?.value,
                firstPeriodValueNumber:
                  this.termsPaymentForm.controls.momentPrepayment?.value != 7
                    ? this.termsPaymentForm.controls.prepaymentPeriodNumber
                        ?.value
                    : null,
                idPaymentMomentDelay:
                  this.termsPaymentForm.controls.momentDelay?.value,
                secondPercent:
                  this.termsPaymentForm.controls.defermentAmount?.value,
                secondPeriodValueNumber:
                  this.termsPaymentForm.controls.defermentPeriodNumber?.value ||
                  null,
                thirdPeriodValueNumber:
                  this.termsPaymentForm.controls.momentPrepayment?.value == 7 &&
                  this.termsPaymentForm.controls.prepaymentAmount?.value < 60
                    ? this.termsPaymentForm.controls.defermentPeriod2?.value
                    : null,
              }
            : null;
      } else {
        payCondFull =
          this.fullInfo.paymentCond.idPaymentType !=
          termsConditionsPaymentConst.partialPrepayment
            ? {
                idPaymentType: this.fullInfo.paymentCond.idPaymentType,
                idDayType: this.fullInfo.paymentCond.idDayType || null,
                idShipmentVolume: this.fullInfo.paymentCond.idShipmentVolume,
                idPaymentMoment: this.fullInfo.paymentCond.firstPaymentMomentId,
                periodValueNumber:
                  this.fullInfo.paymentCond.firstPeriodValueNumber,
                periodValueDate: this.fullInfo.paymentCond.firstPeriodValueDate,
              }
            : null;
        paymentPart =
          this.fullInfo.paymentCond.idPaymentType ==
          termsConditionsPaymentConst.partialPrepayment
            ? {
                idDayType: this.fullInfo.paymentCond.idDayType || null,
                idShipmentVolume: this.fullInfo.paymentCond.idShipmentVolume,
                idPaymentMomentPrepay:
                  this.fullInfo.paymentCond.firstPaymentMomentId,
                firstPercent: this.fullInfo.paymentCond.firstPercent,
                firstPeriodValueNumber:
                  this.fullInfo.paymentCond.firstPaymentMomentId != 7
                    ? this.fullInfo.paymentCond.firstPeriodValueNumber
                    : null,
                idPaymentMomentDelay:
                  this.fullInfo.paymentCond.secondPaymentMomentId,
                secondPercent: this.fullInfo.paymentCond.secondPercent,
                secondPeriodValueNumber:
                  this.fullInfo.paymentCond.secondPeriodValueNumber || null,
                thirdPeriodValueNumber:
                  this.fullInfo.paymentCond.firstPaymentMomentId == 7 &&
                  this.fullInfo.paymentCond.firstPercent < 60
                    ? this.fullInfo.paymentCond.thirdPeriodValueNumber
                    : null,
              }
            : null;
      }

      if (this.editTermCondition) {
        //открыта форма редактирования Срока поставки
        deliveryPeriod = {
          idDeliveryMoment: this.deliveryTermForm.value.startDelivery,
          idPeriodType: this.deliveryTermForm.value.deliveryType,
          periodTypeValue: this.deliveryTermForm.value.deliveryTerm,
          dateBegin: this.deliveryTermForm.value?.startDate
            ? toOADate(this.deliveryTermForm.value?.startDate)
            : null,
          dateEnd: this.deliveryTermForm.value?.endDate
            ? toOADate(this.deliveryTermForm.value?.endDate)
            : null,
        };
      } else {
        deliveryPeriod = {
          idDeliveryMoment: this.fullInfo.deliveryPeriod.idDeliveryMoment,
          idPeriodType: this.fullInfo.deliveryPeriod.idDeliveryType,
          periodTypeValue: this.fullInfo.deliveryPeriod.periodTypeValue,
          dateBegin: this.fullInfo.deliveryPeriod.dateBegin,
          dateEnd: this.fullInfo.deliveryPeriod.dateEnd,
        };
      }

      if (goodRemains.length > 0) {
        //выделяем остаточную заявку
        remainsOffer = {
          idDirection: this.fullInfo.generalInfo.directionId,
          idSection: Number(this.sessionIds.sectionId),
          setDemandOffer: {
            idDemandOffer: this.fullInfo.generalInfo.idDemandOffer,
            idSession: Number(this.sessionIds.sessionId),
            idModel: this.fullInfo.generalInfo.idModel,
            idFirmClient:
              this.fullInfo.generalInfo.idClientContractType == 21
                ? this.fullInfo.generalInfo.clientId
                : null,
            idClientContractType:
              this.fullInfo.generalInfo.idClientContractType,
            idBranch: this.fullInfo.generalInfo.branchId,
            idCurrency: this.fullInfo.goods[0].goodsSpecifications.find(
              (field) => field.idInterfaceField === IdInterfaceField.currency
            )?.fieldValueNumber,
            vatPercent: getVatNumber(this.VatField, true),
            idPriceAdjustment: this.fullInfo.goods[0].goodsSpecifications.find(
              (field) =>
                field.idInterfaceField === IdInterfaceField.amendmentType
            )?.fieldValueNumber,
            isPriceAdjusted: false, //всегда false в остаточной
            idFinance: this.fullInfo.goods[0].goodsSpecifications.find(
              (field) =>
                field.idInterfaceField === IdInterfaceField.financeSource
            )?.fieldValueNumber,
            detailsImportDomestic:
              this.fullInfo.generalInfo.detailsImportDomestic,
            detailsExportForeign:
              this.fullInfo.generalInfo.detailsExportForeign,
            listDeletedDocuments: [], //сказали что не удаляем
            idDeliveryScheduleType: null,
          },
          goods: goodRemains,
          payCondFull: payCondFull,
          paymentPart: paymentPart,
          deliveryPeriod: deliveryPeriod,
          delivConditions: this.finishDeliveryBasis,
          delivScope: !this.isSameGradedSaleOffer ? this.finishDeliveryScopesRemain : [],
          delivScopeGraded: this.finishDeliveryScopesRemainGraded,
          delivSchPeriods: [], //в остаточной заявке всегда стирается
          delivSchPeriodsGraded: [],
          documents: [],
          idVatPercent: this.VatField.fieldValueNumber,
          idVatQuote:
            this.getGoodsSpecifications(
              this.fullInfo.goods[0].goodsSpecifications,
              IdInterfaceField.quoteCurrency
            )?.fieldValueNumber || 0,
          rules: rules,
        };
      } else remainsOffer = null;

      const body = {
        [this.sessionIds.session.idAuctionType ===
        auctionType.simpleBuyerAuction
          ? 'currentDemand'
          : 'currentOffer']: {
          idDirection: this.fullInfo.generalInfo.directionId,
          idSection: Number(this.sessionIds.sectionId),
          setDemandOffer: {
            idDemandOffer: this.fullInfo.generalInfo.idDemandOffer,
            idSession: Number(this.sessionIds.sessionId),
            idModel: this.fullInfo.generalInfo.idModel,
            idFirmClient:
              this.fullInfo.generalInfo.idClientContractType == 21
                ? this.fullInfo.generalInfo.clientId
                : null,
            idClientContractType:
              this.fullInfo.generalInfo.idClientContractType,
            idBranch: this.fullInfo.generalInfo.branchId,
            idCurrency: this.fullInfo.goods[0].goodsSpecifications.find(
              (field) => field.idInterfaceField === IdInterfaceField.currency
            )?.fieldValueNumber,
            vatPercent: getVatNumber(this.VatField, true),
            idPriceAdjustment:
              this.fullInfo.goods[0].goodsSpecifications.find(
                (field) =>
                  field.idInterfaceField === IdInterfaceField.amendmentType
              )?.fieldValueNumber || null,
            isPriceAdjusted: this.adjustablePrice
              ? this.adjustablePrice.toString().toLowerCase()
              : false,
            idFinance: this.fullInfo.goods[0].goodsSpecifications.find(
              (field) =>
                field.idInterfaceField === IdInterfaceField.financeSource
            )?.fieldValueNumber,
            detailsImportDomestic:
              this.fullInfo.generalInfo.detailsImportDomestic,
            detailsExportForeign:
              this.fullInfo.generalInfo.detailsExportForeign,
            listDeletedDocuments: [], //сказали что не удаляем
            idDeliveryScheduleType:
              this.fullInfo.generalInfo.idDeliveryScheduleType,
          },
          goods: goodCurrent,
          payCondFull: payCondFull,
          paymentPart: paymentPart,
          deliveryPeriod: deliveryPeriod,
          delivConditions: this.finishDeliveryBasis,
          delivScope: !this.isSameGradedSaleOffer ? this.finishDeliveryScopes : [],
          delivScopeGraded: this.finishDeliveryScopesGraded,
          delivSchPeriods: this.finishDelivSchPeriods,
          delivSchPeriodsGraded: this.finishDelivSchPeriodsGraded,
          documents: [],
          idVatPercent: this.VatField.fieldValueNumber,
          idVatQuote:
            this.getGoodsSpecifications(
              this.fullInfo.goods[0].goodsSpecifications,
              IdInterfaceField.quoteCurrency
            )?.fieldValueNumber || 0,
          rules: rules,
        },
        [this.sessionIds.session.idAuctionType ===
        auctionType.simpleBuyerAuction
          ? 'remainsDemand'
          : 'remainsOffer']: remainsOffer,
      };

      saveWithPending(
        this.demandService.editOffer(this.user?.token, body),
        (pending: boolean) => this.setSaveRequestPending(pending),
        {
          next: (res:EditOfferDemandResponse) => {
            this.finishEdit(res);
          },
        });
    }
  }

  private setSaveRequestPending(pending: boolean): void {
    this.isSaveRequestPending = pending;
    this.saveRequestPendingChange.emit(pending);
  }

  /*  private editOffer(body: any): void {
      this.demandService.editOffer(this.user?.token, body).subscribe((res) => {
        this.isDisabledSaveButton = true;
        let message = res.idDemandOfferRemains
          ? this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].changesSavedSuccessful +
            ' ' +
            RU['editOffer'].createdNewLot +
            res.lotNumberRemains
            : EN['editOffer'].changesSavedSuccessful +
            ' ' +
            EN['editOffer'].createdNewLot +
            res.lotNumberRemains
          : this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].changesSavedSuccessful
            : EN['editOffer'].changesSavedSuccessful;

        this.toastService.onShowToast({message: message, type: 'success'});
      });
    }*/

  private finishEdit(res: EditOfferDemandResponse): void {
    this.isDisabledSaveButton = true;
    let message = res.idDemandOfferRemains
      ? this.translate.store.currentLang == 'RU'
        ? RU['editOffer'].changesSavedSuccessful +
          ' ' +
          RU['editOffer'].createdNewLot +
          res.lotNumberRemains
        : EN['editOffer'].changesSavedSuccessful +
          ' ' +
          EN['editOffer'].createdNewLot +
          res.lotNumberRemains
      : this.translate.store.currentLang == 'RU'
      ? RU['editOffer'].changesSavedSuccessful
      : EN['editOffer'].changesSavedSuccessful;

    this.toastService.onShowToast({ message: message, type: 'success' });
  }

  protected readonly IdInterfaceField = IdInterfaceField;
  protected readonly auctionType = auctionType;
  protected readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  protected readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;
  protected readonly Number = Number;
}
