import { Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  UpperCaseFirstLetterPipe,
  ActualDimensionsPipe,
  ToNumberPipe,
  RuNumberFormatPipe,
  GoodAnalogDescriptionPipe
} from '@pipes';
import { DeliveryTermFormComponent } from "../../../../components/edit-offer/delivery-term-form";
import {
  DeliveryTermsPaymentComponent
} from "../../../../components/edit-offer/delivery-terms-payment/delivery-terms-payment.component";
import {
  DxButtonComponent,
  DxCheckBoxComponent, DxDataGridComponent,
  DxNumberBoxComponent,
  DxPopupComponent,
  DxScrollViewComponent,
  DxSelectBoxComponent,
  DxTemplateDirective,
  DxTooltipComponent,
  DxValidationGroupComponent,
  DxValidatorComponent
} from "devextreme-angular";
import { DxiValidationRuleComponent, DxoAnimationComponent, DxoFormatComponent } from "devextreme-angular/ui/nested";
import { NgForOf, NgIf, NgTemplateOutlet } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SortActualDimensionsPipe } from "../../../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  CommonService,
  CurrencyService,
  DemandService,
  EditOfferDemandResponse,
  ErrorServiceService,
  SubmissionService,
  ToastService,
  TradingService
} from "@services";
import { HomePageStore } from "@homepage-store";
import {
  DataSourceDeliveryTerm,
  DelayMoment,
  Field,
  IApiDataSection,
  IDeliveryPeriod,
  IDeliveryTerm,
  IEditOfferGood,
  IEditOfferGoodsSpecifications,
  IGeneralInfo,
  IPaymentCondition,
  PaymentMethod,
  PrepayMoment,
  TotalRowData,
  Volume
} from "@interfaces";
import { User } from "@classes";
import { forkJoin, Observable, Subject, Subscription } from "rxjs";
import { IReferences } from "../../../homepage/interfaces";
import {
  auctionType,
  COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES,
  editingRules,
  IdDirection,
  IdInterfaceField,
  minDeliveryScheduleDaysCount,
  pricingType,
  sectionID,
  termsConditionsPaymentConst,
  timberTicket,
  IdSessionPeriods,
  EDITING_FIELDS,
  ACTUAL_SIZE_FIELDS,
  ACTUAL_SIZE_READINESS_FIELDS,
  SPECIAL_FIELDS_AGRI,
  IdWithoutVAT,
  DEFAULT_DEFERMENT_PERIOD_NUMBER,
  DEFAULT_DEFERMENT_PERIOD_NUMBER_2,
  AMOUNT_OF_DEFERMENT_40,
  AMOUNT_OF_DEFERMENT_100,
  AgreementType,
} from "@constants";
import {
  convertDate,
  getNumber,
  getTranslateResultByCurrentLang,
  round,
  toOADate,
  upperCaseFirstLetter,
  checkSameUnits,
  saveWithPending,
  getVatNumber,
  getIdGood
} from "@helpers";
import { convertExcelSerialDateToMs } from "../../../homepage/helpers";
import {
  AUCTION_TYPE,
  ID_DELIVERY_MOMENT,
  ID_DELIVERY_TYPE,
  ID_START_DELIVERY
} from "@enums";
import { ValueChangedEvent } from "devextreme/ui/date_box";
import moment from "moment/moment";
import { map, takeUntil, tap } from "rxjs/operators";
import {
  AdditionalFieldsForPurchaseComponent
} from "../../../../components/edit-offer/additional-fields-for-purchase/additional-fields-for-purchase.component";
import { EditLocationComponent, RefBook } from "@components";
import { SECTIONS_TYPES } from "../../../../features/header/enums";
import {
  AllowedValue,
  Block,
  DeliveryBasis,
  EditDemandOfferServiceService,
  EditRule,
  TermsConditionsPaymentSelectedValue
} from "../../../../services/edit-demand-offer-service.service";
import { DisplaySpecsDirective } from './../../../../shared/directives/display-specs-in-good-grid.directive';
import { ApiStore } from '@store';
import { DisableNumberBoxWheel } from "../../../../shared/directives/disable-number-box-wheel";
import {
  NumberBoxEditOfferDemand
} from "../../../../shared/components/number-box-edit-offer-demand/number-box-edit-offer-demand";
import { OffersAdditionalInfoComponent } from '../../../../features/trading/components/offers-additional-info/offers-additional-info.component';
import { GetGoodIdPipe } from "../../../../shared/pipes/get-good-id/get-good-id-pipe";

@Component({
  selector: 'app-edit-purchase-offer',
  imports: [
    ActualDimensionsPipe,
    DeliveryTermFormComponent,
    DeliveryTermsPaymentComponent,
    DxButtonComponent,
    DxCheckBoxComponent,
    DxNumberBoxComponent,
    DxPopupComponent,
    DxScrollViewComponent,
    DxSelectBoxComponent,
    DxTemplateDirective,
    DxTooltipComponent,
    DxValidationGroupComponent,
    DxValidatorComponent,
    DxiValidationRuleComponent,
    DxoAnimationComponent,
    DxoFormatComponent,
    NgForOf,
    NgIf,
    NgTemplateOutlet,
    ReactiveFormsModule,
    RuNumberFormatPipe,
    SortActualDimensionsPipe,
    ToNumberPipe,
    TranslateModule,
    UpperCaseFirstLetterPipe,
    AdditionalFieldsForPurchaseComponent,
    EditLocationComponent,
    GoodAnalogDescriptionPipe,
    DisplaySpecsDirective,
    DisableNumberBoxWheel,
    OffersAdditionalInfoComponent,
    NumberBoxEditOfferDemand,
    GetGoodIdPipe
  ],
  templateUrl: './edit-purchase-offer.component.html',
  standalone: true,
  styleUrl: './edit-purchase-offer.component.scss'
})
export class EditPurchaseOfferComponent {
  private readonly commonService = inject(CommonService);
  private readonly translate = inject(TranslateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly tradingService = inject(TradingService);
  private readonly toastService = inject(ToastService);
  private readonly errorServiceService = inject(ErrorServiceService);
  private readonly currencyService = inject(CurrencyService);
  private readonly submissionService = inject(SubmissionService);
  private readonly demandService = inject(DemandService);
  private readonly homePageStore = inject(HomePageStore);
  private readonly apiStore = inject(ApiStore);
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);


  @Input({ required: true }) generalInfo: IGeneralInfo;
  @Input({ required: true }) goods: IEditOfferGood[];
  @Input({ required: true }) documents;
  @Input({ required: true }) deliveryConditions;
  @Input({ required: true }) uniqueDeliveryScopes;
  @Input({ required: true }) sessionIds;
  @Input({ required: true }) dataForModel;
  @Input({ required: true }) termsConditionsPayment: TermsConditionsPaymentSelectedValue[];
  @Input({ required: true }) deliveryTerm: IDeliveryTerm[];
  @Input({ required: true }) deliveryPeriod: IDeliveryPeriod;
  @Input({ required: true }) paymentCond: IPaymentCondition;
  @Input({ required: true }) goodsOriginal;
  @Input({ required: true }) editRulesIntersections;
  @Input({ required: true }) delivSchPeriods;
  @Input({ required: true }) scheduleData;
  @Input({ required: true }) deliveryScopes;
  @Input({ required: true }) deliveryBasisCommon;
  @Input({ required: true }) currencyIntersections: AllowedValue[];
  @Input({ required: true }) VatIntersections: AllowedValue[];
  @Input({ required: true }) financeSourceIntersections: AllowedValue[];
  @Input({ required: true }) adjustablePriceIntersections: boolean;
  @Input({ required: true }) editRulesForSession: EditRule[];

  @Output() onClose = new EventEmitter();
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
  @ViewChild('dataGoodTable', { static: false })
  dataGridGood: DxDataGridComponent;
  @ViewChild('goodFormValid', { static: false })
  goodFormValidationGroup: DxValidationGroupComponent;
  @ViewChild('deliveryTerm', { static: false })
  deliveryTermValidationGroup: DxValidationGroupComponent;

  public readonly idAuctionType = this.homePageStore.idAuctionType();
  public readonly AUCTION_TYPE = AUCTION_TYPE;
  public user: User;
  public sellerInformationHidden: boolean = true;
  public expandTable: boolean = false;
  public pricingType = pricingType;
  public VatField: IEditOfferGoodsSpecifications; //Ставка НДС  todo

  public privileges: boolean = false;
  public mainbasis: DeliveryBasis;
  public DateSessionPlusDay: Date;
  public DateSession: Date;

  public isShowNotific = false; //показывать уведомление перед кнопками, если изменили количество

  public currencyPrecision: number; //точность валюты
  public quoteCurrencyPrecision: number; //точность валюты

  public totalForm: FormGroup = this.formBuilder.group({
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  public goodForm = this.formBuilder.group({});

  public restorePopup = false;
  public message: string = ' ';

  public goodInfo = false;
  public viewInfoGood = null; //todo
  public totalRowData: TotalRowData; //инфа в строку Итого по товарам

  public editTermCondition = false; //форма редактирования срока поставки
  public editTermPayment = false; //форма редактирования условия поставки
  public uniqueDeliveryTerm: IDeliveryTerm[] = [];

  public deliveryTermForm: FormGroup = this.formBuilder.group({
    startDelivery: [null, [Validators.required]],
    deliveryType: [null, [Validators.required]],
    deliveryTerm: [0, [Validators.required]],
    startDate: [new Date(), [Validators.required]],
    endDate: [new Date(), [Validators.required]],
  });

  public isEditedDeliveryTerm = false; // при редактировании заявки отредактировано ли что-нибудь в срок поставки
  public isEditedTermsPayment = false; // при редактировании заявки отредактировано ли что-нибудь в срок оплаты

  public dayTypePaymentConfig: RefBook[]; //Справочник календарных и банковских дней
  public isDisabledSaveButton = true; //задизейблина ли кнопка Сохранить
  public isSaveRequestPending: boolean = false; //выполняется ли запрос сохранения
  public editingRules = editingRules;

  public adjustablePrice = false; //значение корректируемая цена
  public isPopupClear = false; //попап окно для очистки графика поставки
  public isPopupClearPrice = false; //попап окно для очистки графика поставки через корректируемую цену
  public finishDelivSchPeriods = []; //массив графика поставки, который отправляется на бд
  public finishDeliveryScopes = []; //массив грузоотправителей, который отправляется на бд
  public finishDeliveryScopesRemain = []; //массив грузоотправителей для остаточной заявки, который отправляется на бд
  public finishDeliveryBasis = []; //массив базисов, который отправляется на бд

  public isDisabledAdjustablePrice = false; //заблокировать корректируемую цену
  public deliveryPeriodOriginal: IDeliveryPeriod;

  public isActiveQuotation = false; // установлена котировка
  public isActiveCorridor = false; // установлена котировка
  public isDisabledSaveButtonSubscribe: Subscription;
  public changeMainBasis: Subscription;
  public changeVolume: Subscription;
  public isSessionInfoDisable = false;

  public locationField: Field;
  public isEditProductLocation = false;
  public productLocations: IReferences[] = [];
  public productLocationValue: string | number;
  public goodLocation: IEditOfferGood;

  public momentPrepayment: PrepayMoment;
  public momentDelay: DelayMoment;
  public readOnlyDefermentAmount = true;
  public paymentTermConcated: string;
  public termsConditions: PaymentMethod;
  public volumeTerms: Volume[] = [];
  public volumeTermsPayment: Volume;
  public termsConditionsFilter: TermsConditionsPaymentSelectedValue[]; //условия оплаты отфильтрованные по условиям оплаты из пересечения
  public termsConditionsVolumesFilter: TermsConditionsPaymentSelectedValue[]; //условия оплаты отфильтрованные по условиям оплаты и объему из пересечения

  public timberTicket = false; //до выдачи лесорубочного билета

  public momentPrepaymentValues = [];
  public momentDelayValues = [];
  public dayType: string[] = []; //тип дней (календарные/банковские) в выбранном условии

  public isExpandLotItems = false;     //Раскрыть товары лота
  public isCloseViewGood = false;

  // редактируем срок поставки
  public deliveryTermValue: DataSourceDeliveryTerm[] = [];
  public deliveryTermConcated: string;
  public deliveryTermType = [];
  public deadlinePayment: number;
  public deadlineDelivery: number;
  public deadlineErrorMess: string;
  public isDaysCountCorrect = false;
  private destroy$ = new Subject<void>();

  public readonly IdInterfaceField = IdInterfaceField;
  public readonly IdDirection = IdDirection;
  public readonly auctionType = auctionType;
  public readonly SPECIAL_FIELDS_AGRI = SPECIAL_FIELDS_AGRI;

  constructor() {
    this.editRuleInIntersections = this.editRuleInIntersections.bind(this);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.user = this.user
      ? this.user
      : JSON.parse(localStorage.getItem('user') || '{}');

    this.checkForChanges(changes);
  }

  public ngOnInit(): void {
    this.user = this.user
      ? this.user
      : JSON.parse(localStorage.getItem('user') || '{}');
    const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();
    let sectionDescription: string = sectionsArray.find(
      (el: IApiDataSection): boolean => Number(el.id) === Number(this.sessionIds.sectionId)
    )?.description;
    sectionDescription = 'TradingEditItem' + sectionDescription;
    this.privileges = this.commonService.checkPrivileges(sectionDescription);

    this.DateSession = new Date();
    this.DateSessionPlusDay = new Date(
      this.DateSession.getFullYear(),
      this.DateSession.getMonth(),
      this.DateSession.getDate() + 1
    );

    this.deliveryPeriodOriginal = JSON.parse(
      JSON.stringify(this.deliveryPeriod)
    );
    this.currencyPrecision = null;
    this.getPrecision();
    this.setMainbasis();

    if (this.scheduleData?.length > 0) {
      this.onCreateFinishPeriod();
    }
    if (this.deliveryScopes?.length > 0) {
      this.onCreateFinishScopes();
    }
    if (this.deliveryBasisCommon?.length > 0) {
      this.onCreateFinishBasis();
    }

    this.changeMainBasis = this.tradingService.changeMainBasis$.subscribe(
      (res: any) => {
        //обновлена цена
        if (res.str != 'edit') {
          this.goods = res.goods;
          this.goods.forEach((good) => {
            const controlNamePrice: string = getIdGood(good).toString() + '_' + IdInterfaceField.priceWithoutVAT;
            this.goodForm.controls[controlNamePrice].patchValue(
              Number(this.getValue(good.goodsSpecifications, IdInterfaceField.priceWithoutVAT))
            );

            if (this.idAuctionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION) {
              const controlName =
                getIdGood(good).toString() + `_${IdInterfaceField.minPrice}`;
              const control = this.goodForm.get(controlName);

              if (control) {
                control.patchValue(
                  Number(
                    this.getValue(
                      good.goodsSpecifications,
                      IdInterfaceField.minPrice
                    )
                  )
                );
              }
            }
          });
          this.getTotalCost();
        }
      }
    );

    this.changeVolume = this.tradingService.changeVolume$.subscribe(
      (res: any) => {
        if (res.str != 'edit') {
          this.goods = res.goods;
          this.goods.forEach((good) => {
            const controlNameQuantity = getIdGood(good).toString() + '_' + IdInterfaceField.quantity;
            this.goodForm.controls[controlNameQuantity].patchValue(
              Number(this.getValue(good.goodsSpecifications, IdInterfaceField.quantity))
            );
          });
          this.getTotalCost();
        }
      }
    );

    this.isDisabledSaveButtonSubscribe =
      this.tradingService.isDisabledSaveButton$.subscribe((res: any) => {
        this.isDisabledSaveButton = false;
        if (res.schedule) {
          //изменился график поставки
          this.scheduleData = res.schedule.scheduleData;
          this.onCreateFinishPeriod();
          this.generalInfo.idDeliveryScheduleType =
            res.schedule.idDeliveryScheduleType; //изменяем тип графика поставки
        }
        if (res.deliveryScope) {
          this.deliveryScopes = res.deliveryScope;
          this.onCreateFinishScopes();
        }
        if (res.deliveryConditions) {
          this.deliveryBasisCommon = res.deliveryConditions;
          this.onCreateFinishBasis();
        }
      });
    this.adjustablePrice =
      this.getValue(this.goods[0].goodsSpecifications, IdInterfaceField.adjustedPrice) == 'true';
    //дизейблим ли корректируемую цену
    if (Number(this.deliveryPeriod.idDeliveryType) === ID_DELIVERY_TYPE.DATE) {
      this.isDaysCountCorrect =
        this.getDaysCount(
          convertDate(this.deliveryPeriod?.dateBegin),
          convertDate(this.deliveryPeriod?.dateEnd),
          0,
          0
        ) >= minDeliveryScheduleDaysCount;
    } else {
      const daysCnt: number = Number(this.deliveryPeriod.idDeliveryType) === ID_DELIVERY_TYPE.DAY ?
        (this.deliveryPeriod.periodTypeValue == null ?
          0 :
          this.deliveryPeriod.periodTypeValue) :
        0;
      const monthCnt: number = Number(this.deliveryPeriod.idDeliveryType) === ID_DELIVERY_TYPE.MONTH ?
        (this.deliveryPeriod.periodTypeValue == null ?
          0 :
          this.deliveryPeriod.periodTypeValue) :
        0;

      this.isDaysCountCorrect =
        this.getDaysCount(
          this.deliveryTermForm.controls['startDate']?.value,
          null,
          daysCnt,
          monthCnt
        ) >= minDeliveryScheduleDaysCount;
    }
    let isCanSchedule = !!(
      Number(this.deliveryPeriod.idDeliveryMoment) === ID_DELIVERY_MOMENT.FROM_THE_DATE_OF_DELIVERY &&
      this.isDaysCountCorrect &&
      this.getGoodsSpecifications(this.goods[0].goodsSpecifications, IdInterfaceField.adjustedPrice)
    );
    if (!isCanSchedule) this.isDisabledAdjustablePrice = true;

    // установлены ли котировки
    this.submissionService
      .checkActivePriceLimit(
        this.user.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.generalInfo.idModel,
        this.generalInfo.directionId
      )
      .subscribe((res) => {
        this.isActiveQuotation = res.activePriceLimit.isActiveQuotation;
        this.isActiveCorridor = res.activePriceLimit.isActiveCorridor;
      });

    this.getDeadlines('isFirstTime');

    if (this.isComplexLotGrades()) {
      this.editProductLocation(this.goods[0], IdInterfaceField.productLocation);
    }

    this.editDemandOfferServiceService.closeModal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.onClose.emit(value);
      });

    this.editDemandOfferServiceService.saveRequestPending$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.setSaveRequestPending(value);
      });

    this.editDemandOfferServiceService.goodsOriginalSubject.next(this.goodsOriginal);
    this.editDemandOfferServiceService.sessionIdsSubject.next(this.sessionIds);
  }

  public ngOnDestroy(): void {
    this.isDisabledSaveButtonSubscribe.unsubscribe();
    this.changeMainBasis.unsubscribe();
    this.changeVolume.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setMainbasis(): void {
    if (this.deliveryBasisCommon?.length > 0) {
      this.mainbasis = this.deliveryBasisCommon.find(
        (basis) => basis.isMain == true
      );
    }
  }

  private checkForChanges(changes: SimpleChanges): void {
    //изменился период или он не активен
    if (changes['sessionIds']) {
      if (
        ((!changes['sessionIds'].currentValue.session.isActive ||
            ![IdSessionPeriods.pretrading, IdSessionPeriods.offersAdjustment].includes(
              changes['sessionIds'].currentValue.session.idSessionPeriod
            )) &&
          !this.user?.IsWorker) ||
        (![IdSessionPeriods.pretrading, IdSessionPeriods.offersAdjustment].includes(
            changes['sessionIds'].currentValue.session.idSessionPeriod
          ) &&
          this.user?.IsWorker)
      ) {
        this.isSessionInfoDisable = true;
      } else {
        this.isSessionInfoDisable = false;
      }
    }
  }

  public onCreateFinishPeriod(): void {
    this.finishDelivSchPeriods = this.editDemandOfferServiceService.onCreateFinishPeriod(this.scheduleData, this.goods, true);
    if (this.finishDelivSchPeriods?.length === 0 && !this.isCanSchedule())
      this.isDisabledAdjustablePrice = true;
  }

  public onCreateFinishScopes(): void {
    const result: { finishDeliveryScopes, finishDeliveryScopesRemain } =
      this.editDemandOfferServiceService.onCreateFinishScopes(this.deliveryScopes, this.goods, true);
    this.finishDeliveryScopes = result.finishDeliveryScopes;
    this.finishDeliveryScopesRemain = result.finishDeliveryScopesRemain;
  }

  public onCreateFinishBasis(): void {
    this.finishDeliveryBasis = this.editDemandOfferServiceService.onCreateFinishBasis(this.deliveryBasisCommon, this.goods, true);
  }

  private getPrecision(): void {
    if (!this.currencyPrecision) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.currency
          )?.fieldValueNumber
        )
        ?.subscribe((res) => {
          this.currencyPrecision = res;
          this.prepareGoods();
        });
    } else {
      this.prepareGoods();
    }
  }

  private prepareGoods(): void {
    //добавляем в товары стоимость ндс/стоимость с/без ндс
    this.goods.forEach((good) => {

      good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.priceWithoutVAT
      ).fieldPrecision = this.currencyPrecision;

      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.VATrate
      ); //Ставка НДС
      this.editDemandOfferServiceService.VatFieldSubject.next(this.VatField);
      good.isOpened = false; //для открытия подробного просмотра в таблице
      //смотрим к какому блоку принадлежит товар
      let blockFind: Block = this.editDemandOfferServiceService.onFindBlock(good, this.dataForModel);
      blockFind.fields.forEach((blField) => {
        if (blField.interfaceField.isAvailableMultiSelection) {
          //ищем поле с возможностью мультивыбора
          //находим все значения поля с мультивыбором
          let multiField: IEditOfferGoodsSpecifications[] = good.goodsSpecifications.filter(
            (goodField) =>
              goodField.idInterfaceField === blField.interfaceField.fieldId
          );
          if (multiField?.length > 0) {
            //формируем строковые значения и значения массива
            let fieldValue: string = '',
              fieldValueArray: number[] = [];
            multiField.forEach((field) => {
              fieldValue =
                fieldValueArray.length === 0
                  ? field.fieldValue.toString()
                  : fieldValue + '; ' + field.fieldValue; //формируем строку значений из всех выбранных значений по полю с мультивыбором
              fieldValueArray.push(field.fieldValueNumber);
            });
            //удаляем все поля с этим ид
            good.goodsSpecifications = good.goodsSpecifications.filter(
              (el) => el.idInterfaceField !== blField.interfaceField.fieldId
            );
            multiField[0].fieldValue = fieldValue;
            multiField[0].fieldValueArray = fieldValueArray;
            good.goodsSpecifications.push(multiField[0]); //добавляем поле с ид и значениями с мультивыбором
          }
        }
      });

      if (Number(this.sessionIds.sectionId) === SECTIONS_TYPES.AGRI) {
        SPECIAL_FIELDS_AGRI.forEach(id => {
          const field: IEditOfferGoodsSpecifications = good.goodsSpecifications.find(field => field.idInterfaceField === id);
          if (field) {
            const fieldValue = blockFind.fields.find(el => el.interfaceField.fieldId === id);
            field.dataSource = fieldValue?.selectedValues || fieldValue?.interfaceField?.allowedValues;
            field.idEditRule = this.editRulesForSession.find(el =>
              el.idModelBlock === blockFind.id &&
              el.idInterfaceField === id &&
              el.idSessionPeriod === this.sessionIds.idSessionPeriod)?.idEditRule;
          }
        });
      }

      if (
        this.generalInfo.pricingTypeId !==
        this.pricingType.formulaWithoutQuotation
      ) {
        // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
        let count: number = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.quantity)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat: number = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.priceWithoutVAT)
            .fieldValueNumber
        ); //Цена без НДС
        let vat: number = getVatNumber(this.VatField);

        let costWithoutVAT: number = round(
          count * priceWithoutVat,
          this.currencyPrecision
        );
        let amountVAT: number = round(
          costWithoutVAT * (vat / 100),
          this.currencyPrecision
        );
        let costVAT: number = costWithoutVAT + amountVAT;

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
        this.generalInfo.pricingTypeId === this.pricingType.formulaWithQuotation
      ) {
        let quoteCurrency: string | number = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.quoteCurrency
        ).fieldValue; //Валюта котировки
        let priceAdjustment: number = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.amendmentType
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, {
          quoteCurrency: quoteCurrency,
          priceAdjustment: priceAdjustment,
        });
      }
      if (
        this.generalInfo.pricingTypeId ===
        this.pricingType.formulaWithoutQuotation
      ) {
        let priceAdjustment: number = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.amendmentType
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }
      good.goodsSpecifications.forEach((field) => {
        if (EDITING_FIELDS.includes(field.idInterfaceField)) {
          this.goodForm.addControl(
            getIdGood(good).toString() + '_' + field.idInterfaceField.toString(),
            this.formBuilder.control(null, Validators.required)
          );
          //this.getNumber(this.getValue(good.goodsSpecifications, field.idInterfaceField))
          this.goodForm.controls[
            getIdGood(good).toString() + '_' + field.idInterfaceField.toString()
            ].patchValue(
            getNumber(
              this.getValue(good.goodsSpecifications, field.idInterfaceField)
            )
          );
        }
      });
    });
    this.isExpandLotItems = this.isCheckBoxExpandLotItems;
    this.onChangedExpandLotItems();

    if (this.onSameUnits) {
      //Количество
      let volumeSum: number = 0,
        precision: number;
      this.goods.forEach((good) => {
        let volume = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.quantity
        );
        volumeSum = volumeSum + volume.fieldValueNumber;
        precision = volume.fieldPrecision;
      });
      this.totalForm.controls['quantity'].patchValue(
        Number(volumeSum).toLocaleString('ru', {
          maximumFractionDigits: precision,
        }) +
        ' ' +
        this.goods[0].unitName
      );
    }
    this.getTotalCost(); //сразу рассчитываем без базиса

    //получаем точность валюты
    if (this.generalInfo.pricingTypeId === pricingType.formulaWithQuotation) {
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

  public goToBasis(): void {
    this.tradingService.goToBasis();
  }

  get isCheckBoxExpandLotItems(): boolean {
    const hasRule = this.goods.some(good =>
      good.goodsSpecifications.some(el =>
        el.idEditRule &&
        el?.idEditRule !== editingRules.editingIsNotAvailable
      )
    );
    return hasRule;
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
    this.isExpandLotItems = this.goods.every(good => good.isOpened);
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

        this.deliveryTermForm.controls['startDelivery'].patchValue(
          this.deliveryPeriod.idDeliveryMoment?.toString() as any
        );
        this.deliveryTermStartChange('deliveryStart');
        let dateBegin: number = convertDate(this.deliveryPeriod?.dateBegin);
        let dateEnd: number = convertDate(this.deliveryPeriod?.dateEnd);

        this.deliveryTermForm.controls['startDate'].patchValue(dateBegin);
        this.deliveryTermForm.controls['endDate'].patchValue(dateEnd);
        this.deliveryTermForm.controls['deliveryTerm'].patchValue(this.deliveryPeriod.periodTypeValue);
        this.deliveryTermConcated = this.generalInfo.concatedDeliveryPeriod;
      });
  }

  isDate() {
    return this.deliveryTermType.find(
      (el) =>
        el.deliveryTermId.toString() ==
        this.deliveryTermForm.controls['deliveryType'].value
    );
  }

  public deliveryTermStartChange(str): void {
    switch (str) {
      case 'deliveryStart': {
        //фильтрация deliveryTermType в соответствие с тем, что выбрано в "Начало поставки"
        this.deliveryTermType = this.deliveryTerm.filter(
          (el) =>
            el.deliveryStartId ==
            this.deliveryTermForm.controls?.['startDelivery']?.value
        );
        //очистка всей формы
        this.deliveryTermForm.controls['deliveryType'].reset();
        this.deliveryTermForm.get('startDate').setValue(null);
        this.deliveryTermForm.get('endDate').setValue(null);
        this.deliveryTermForm.get('deliveryTerm').reset();
        this.deliveryTermConcated = '';
        /* this.deadlineDelivery = null;
        this.deadlinePayment = null;*/

        //если найдена всего одна запись - сразу отображается заполненый select-box
        if (this.deliveryTermType.length == 1) {
          this.deliveryTermForm.controls['deliveryType'].patchValue(
            this.deliveryTermType[0].deliveryTermId
          );
        }
        if (
          !this.deliveryTermForm.controls['deliveryType'].value &&
          !this.isEditedDeliveryTerm
        ) {
          this.deliveryTermForm.controls['deliveryType'].patchValue(
            (this.deliveryPeriod.idDeliveryType?.toString() as any) || null
          );
          this.deliveryTermStartChange('deliveryType');
        }

        break;
      }
      case 'deliveryType': {
        if (
          this.deliveryTermForm.controls['deliveryType'].value != null &&
          this.isEditedDeliveryTerm &&
          this.isCanSchedule() &&
          this.adjustablePrice
        )
          this.tradingService.editDeliveryParams({
            deliveryType: this.deliveryTermForm.controls['deliveryType'].value,
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
          Number(this.deliveryTermForm.controls['deliveryType'].value) === ID_DELIVERY_TYPE.DAY ||
          Number(this.deliveryTermForm.controls['deliveryType'].value) === ID_DELIVERY_TYPE.MONTH
        ) {
          let during = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.during');
          if (Number(this.deliveryTermForm.controls['deliveryType']?.value) === ID_DELIVERY_TYPE.DAY) {
            //дни
            //формирование массива "В течение Х дней"
            let days = this.deliveryTermType.find(
              (el) =>
                el.deliveryTermId ==
                this.deliveryTermForm.controls['deliveryType']?.value
            ).dayValues;
            for (let i = 0; i < days.length; i++) {
              this.deliveryTermValue.push({
                id: days[i],
                value:
                  during +
                  ' ' +
                  days[i] +
                  ' ' +
                  (getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.calendarDays')),
              });
            }
          }
          if (Number(this.deliveryTermForm.controls['deliveryType']?.value) === ID_DELIVERY_TYPE.MONTH) {
            //месяца
            // формирование массива "В течение Х месяцев"
            let months = this.deliveryTermType.find(
              (el) =>
                el.deliveryTermId ==
                this.deliveryTermForm.controls['deliveryType']?.value
            ).monthValues;
            for (let i = 0; i < months.length; i++) {
              this.deliveryTermValue.push({
                id: months[i],
                value:
                  during +
                  ' ' +
                  months[i] +
                  ' ' +
                  (getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.months')),
              });
            }
          }
          if (
            !this.deliveryTermForm.controls['deliveryTerm'].value &&
            !this.isEditedDeliveryTerm
          ) {
            this.deliveryTermForm.controls['deliveryTerm'].patchValue(
              this.deliveryPeriod.periodTypeValue
            );
          }

          this.deliveryTermValue.sort((a, b) => a.id - b.id); //сортировка по id
          if (this.deliveryTermValue.length == 1) {
            this.deliveryTermForm.controls['deliveryTerm'].patchValue(
              this.deliveryTermValue[0].id
            );
            this.onCreateString();
          }
        }
        break;
      }
    }
  }

  onCreateString(e?, str?) {
    if (
      (this.deliveryTermForm.controls['endDate'].value != null ||
        this.deliveryTermForm.controls['deliveryTerm'].value != null) &&
      this.isEditedDeliveryTerm &&
      this.isCanSchedule() &&
      this.adjustablePrice
    )
      this.tradingService.editDeliveryParams({
        deliveryPeriodInDays:
          Number(this.deliveryTermForm.controls['deliveryType'].value) === ID_DELIVERY_TYPE.DATE
            ? this.deliveryTermForm.controls['endDate'].value
            : this.deliveryTermForm.controls['deliveryTerm'].value,
      });

    if (
      this.deliveryTermForm.controls['startDate'].value != null &&
      this.isEditedDeliveryTerm &&
      this.isCanSchedule() &&
      this.adjustablePrice
    )
      this.tradingService.editDeliveryParams({
        deliveryStartDate: this.deliveryTermForm.controls['startDate'].value,
      });

    if (Number(this.deliveryTermForm.controls['startDelivery'].value) === ID_START_DELIVERY.NO_DELIVERY_START) {
      //если начало поставки «Начало поставки не задано»
      if (this.deliveryTermForm.controls['endDate'].value) {
        //проверка заполнение поля «Дата окончания поставки»
        this.GetDeliveryTermConcated();
      }
    } else {
      //если начало поставки «С даты регистрации договора на бирже», «С даты начала поставки», «С даты поступления предоплаты»
      switch (Number(this.deliveryTermForm.controls['deliveryType'].value)) {
        case ID_DELIVERY_TYPE.DAY:
        case ID_DELIVERY_TYPE.MONTH: {
          //если период «Календарные дни» или «Месяцы»
          if (this.deliveryTermForm.controls['deliveryTerm'].value) {
            //проверка заполнение поля срок поставки
            if (!(Number(this.deliveryTermForm.controls['startDelivery'].value) === ID_START_DELIVERY.FROM_START_DATE_DELIVERY &&
              !this.deliveryTermForm.controls['startDate']?.value)) {
              this.GetDeliveryTermConcated();
            }

            this.isDaysCountCorrect =
              this.getDaysCount(
                this.deliveryTermForm.controls['startDate']?.value,
                this.deliveryTermForm.controls['endDate']?.value,
                Number(this.deliveryTermForm.controls['deliveryType'].value) === ID_DELIVERY_TYPE.DAY
                  ? this.deliveryTermForm.controls['deliveryTerm'].value == null
                    ? 0
                    : this.deliveryTermForm.controls['deliveryTerm'].value
                  : 0,
                Number(this.deliveryTermForm.controls['deliveryType'].value) === ID_DELIVERY_TYPE.MONTH
                  ? this.deliveryTermForm.controls['deliveryTerm'].value == null
                    ? 0
                    : this.deliveryTermForm.controls['deliveryTerm'].value
                  : 0
              ) >= minDeliveryScheduleDaysCount;
          }
          break;
        }
        case ID_DELIVERY_TYPE.DATE: {
          //если Период "Дата"
          if (
            this.deliveryTermForm.controls['startDate']?.value &&
            this.deliveryTermForm.controls['endDate']?.value
          ) {
            //проверка заполнения полей «Дата начала поставки» и «Дата окончания поставки»
            this.GetDeliveryTermConcated();

            this.isDaysCountCorrect =
              this.getDaysCount(
                this.deliveryTermForm.controls['startDate']?.value,
                this.deliveryTermForm.controls['endDate']?.value,
                0,
                0
              ) >= minDeliveryScheduleDaysCount;
          }
          break;
        }
      }
    }
  }

  public onChangedExpandLotItems(): void {
    this.goods.forEach(good => good.isOpened = this.isExpandLotItems);
  }

  GetDeliveryTermConcated() {
    this.submissionService
      .getDeliveryTermConcated(
        this.user?.token,
        this.deliveryTermForm.controls['startDelivery'].value,
        this.deliveryTermForm.controls['deliveryType'].value,
        this.deliveryTermForm.controls['deliveryTerm']?.value,
        this.deliveryTermForm.controls['startDate']?.value
          ? toOADate(this.deliveryTermForm.controls['startDate']?.value)
          : null,
        this.deliveryTermForm.controls['endDate']?.value
          ? toOADate(this.deliveryTermForm.controls['endDate']?.value)
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

  public isCanSchedule(): boolean {
    //может ли быть график поставки
    if (!this.editTermCondition) {
      const { dateBegin, dateEnd, idDeliveryType, periodTypeValue } = this.deliveryPeriod || {};

      const startDateMs = dateBegin ? convertExcelSerialDateToMs(dateBegin) : null;
      const endDateMs = dateEnd ? convertExcelSerialDateToMs(dateEnd) : null;

      const isDayType = idDeliveryType == ID_DELIVERY_TYPE.DAY;
      const isMonthType = idDeliveryType == ID_DELIVERY_TYPE.MONTH;

      const dayValue = isDayType ? periodTypeValue || 0 : 0;
      const monthValue = isMonthType ? periodTypeValue || 0 : 0;

      this.isDaysCountCorrect = this.getDaysCount(
        startDateMs,
        endDateMs,
        dayValue,
        monthValue
      ) >= minDeliveryScheduleDaysCount;
    } else {
      const { startDate, endDate, deliveryType, deliveryTerm } = this.deliveryTermForm.controls;

      const dayValue = Number(deliveryType?.value) === ID_DELIVERY_TYPE.DAY ? deliveryTerm?.value || 0 : 0;
      const monthValue = Number(deliveryType?.value) === ID_DELIVERY_TYPE.MONTH ? deliveryTerm?.value || 0 : 0;

      this.isDaysCountCorrect = this.getDaysCount(
        startDate?.value,
        endDate?.value || null,
        dayValue,
        monthValue
      ) >= minDeliveryScheduleDaysCount;
    }

    const isReadyValue: boolean = this.editTermCondition
      && this.isDeliveryFormValid();

    return !!(
      this.deliveryTerm.length > 0 &&
      ((isReadyValue ? (this.editTermCondition &&
          Number(this.deliveryTermForm.controls['startDelivery']?.value) === ID_DELIVERY_MOMENT.FROM_THE_DATE_OF_DELIVERY &&
          this.isDaysCountCorrect &&
          (Number(this.deliveryTermForm.controls['deliveryType'].value) === ID_DELIVERY_TYPE.DATE
            ? this.deliveryTermForm.controls['endDate'].value
            : this.deliveryTermForm.controls['deliveryTerm'].value) &&
          (this.deliveryTermForm.controls['endDate'].value
            ? this.deliveryTermForm.controls['endDate'].value >=
            this.deliveryTermForm.controls['startDate'].value
            : true)) : false) ||
        (!this.editTermCondition &&
          this.deliveryPeriod.idDeliveryMoment == ID_DELIVERY_MOMENT.FROM_THE_DATE_OF_DELIVERY &&
          this.isDaysCountCorrect)) &&
      this.getGoodsSpecifications(this.goods[0].goodsSpecifications, IdInterfaceField.adjustedPrice)
    );
  }

  private isDeliveryFormValid(): boolean {
    const form = this.deliveryTermForm.controls;

    const basicInfoFilled =
      !!form['startDelivery']?.value &&
      !!form['deliveryType'].value &&
      !!form['startDate']?.value;

    if (!basicInfoFilled) {
      return false;
    }

    const deliveryDetailsFilled =
      !!form['endDate']?.value ||
      !!form['deliveryTerm']?.value;

    return deliveryDetailsFilled;
  }


  public isClearSchedule(str: string, e?: ValueChangedEvent): void {
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
        Number(this.deliveryTermForm.controls['deliveryType'].value) === ID_DELIVERY_TYPE.DATE
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

    this.checkForEditedDeliveryTerm();
  }

  private checkForEditedDeliveryTerm(): void {
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
    if (
      e.value &&
      this.finishDelivSchPeriods.length == 0 &&
      this.isCanSchedule()
    ) {
      let deliveryPeriodInDays;
      if (this.editTermCondition) {
        deliveryPeriodInDays = Number(this.deliveryTermForm.controls['deliveryType'].value) === ID_DELIVERY_TYPE.DATE
          ? this.deliveryTermForm.controls['endDate'].value
          : this.deliveryTermForm.controls['deliveryTerm'].value;
      } else {
        deliveryPeriodInDays = Number(this.deliveryPeriod.idDeliveryType) === ID_DELIVERY_TYPE.DATE
          ? convertDate(this.deliveryPeriod?.dateEnd)
          : this.deliveryPeriod.periodTypeValue;
      }

      const body = this.editTermCondition
        ? {
          returnSchedule: [],
          deliveryType: this.deliveryTermForm.controls['deliveryType'].value,
          deliveryPeriodInDays: deliveryPeriodInDays,
          deliveryStartDate: this.deliveryTermForm.controls['startDate'].value,
          concatedStringDeliveryTerm: this.deliveryTermConcated,
        }
        : {
          returnSchedule: [],
          deliveryType: this.deliveryPeriod.idDeliveryType.toString(),
          deliveryPeriodInDays: deliveryPeriodInDays,
          deliveryStartDate: convertDate(this.deliveryPeriod?.dateBegin),
          concatedStringDeliveryTerm: this.generalInfo.concatedDeliveryPeriod,
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
      }
    }
  }

  onDeleteSchedule() {
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

  onCancelSchedule() {
    if (this.isPopupClear) {
      this.isEditedDeliveryTerm = false;

      this.deliveryTermForm.controls['startDelivery'].patchValue(
        this.deliveryPeriodOriginal.idDeliveryMoment?.toString()
      );
      this.deliveryTermForm.controls['deliveryType'].patchValue(
        this.deliveryPeriodOriginal.idDeliveryType.toString()
      );
      this.deliveryTermForm.controls['deliveryTerm'].patchValue(
        this.deliveryPeriodOriginal.periodTypeValue
      );
      let dateBegin: number = convertDate(this.deliveryPeriod?.dateBegin);
      let dateEnd: number = convertDate(this.deliveryPeriod?.dateEnd);
      this.deliveryTermForm.controls['startDate'].patchValue(dateBegin);
      this.deliveryTermForm.controls['endDate'].patchValue(dateEnd);
      this.deliveryTermConcated = this.generalInfo.concatedDeliveryPeriod;
      this.onHideRedFlag.emit();
    }
    if (this.isPopupClearPrice) this.adjustablePrice = true;
    this.isPopupClear = false;
    this.isPopupClearPrice = false;
  }

  public onCloseTermConditions(): void {
    this.resetFormState();
    this.sendDeliveryData();
  }

  private resetFormState(): void {
    this.editTermCondition = false;
    this.isEditedDeliveryTerm = false;
  }

  private sendDeliveryData(): void {
    const { dateBegin, dateEnd, idDeliveryType, periodTypeValue } = this.deliveryPeriod || {};

    const deliveryParams = {
      deliveryType: idDeliveryType.toString(),
      deliveryPeriodInDays: this.calculateDeliveryPeriod(),
      deliveryStartDate: dateBegin
        ? convertExcelSerialDateToMs(dateBegin)
        : null,
      concatedStringDeliveryTerm: this.generalInfo.concatedDeliveryPeriod,
    };
    this.tradingService.editDeliveryParams(deliveryParams);
  }

  private calculateDeliveryPeriod(): number | null {
    if (this.deliveryPeriod?.idDeliveryType === ID_DELIVERY_TYPE.DATE) {
      return this.deliveryPeriod.dateEnd ? convertExcelSerialDateToMs(this.deliveryPeriod.dateEnd) : null;
    }
    return this.deliveryPeriod?.periodTypeValue ?? null;
  }

  onSaveTermCondition(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      this.isEditedDeliveryTerm = false;
      this.editTermCondition = false;
      this.deliveryPeriod.idDeliveryMoment = Number(
        this.deliveryTermForm.controls['startDelivery'].value
      );
      this.deliveryPeriod.idDeliveryType = Number(
        this.deliveryTermForm.controls['deliveryType'].value
      );
      this.deliveryPeriod.periodTypeValue =
        Number(this.deliveryTermForm.controls['deliveryTerm']?.value) || null;
      this.deliveryPeriod.dateBegin = this.deliveryTermForm.controls['startDate']
        ?.value
        ? toOADate(this.deliveryTermForm.controls['startDate']?.value)
        : null;
      this.deliveryPeriod.dateEnd = this.deliveryTermForm.controls['endDate']
        ?.value
        ? toOADate(this.deliveryTermForm.controls['endDate']?.value)
        : null;
      this.generalInfo.concatedDeliveryPeriod = this.deliveryTermConcated;
    }
  }

  validateEndDate = () => {
    return this.deliveryTermForm.controls['startDate'].value;
  };

  // Получить расчетный период в днях (период вида <дата начала>-<дата окончания> --> дни; месяцы --> дни;)
  getDaysCount(startDate, endDate, daysCnt, monthCnt) {
    var daysCounter = 0;

    var _startDate = null;
    var _endDate = null;

    var _deliveryTermType = 0;

    if (daysCnt > 0) {
      _deliveryTermType = ID_DELIVERY_TYPE.DAY; // на вход пришел период в днях (ничего делать не будем - вренем обратно)
    } else if (monthCnt > 0) {
      _deliveryTermType = ID_DELIVERY_TYPE.MONTH; // на вход пришел период в месяцах
    } else if (startDate != null && endDate != null) {
      _deliveryTermType = ID_DELIVERY_TYPE.DATE; // на вход пришел период вида <Дата начала>-<Дата окончания>
    }

    switch (_deliveryTermType) {
      //календарные дни
      case ID_DELIVERY_TYPE.DAY:
        if (daysCnt > 0) {
          daysCounter = daysCnt;
        }
        break;
      // месяцы
      case ID_DELIVERY_TYPE.MONTH:
        if (startDate != null && monthCnt > 0) {
          _startDate = moment.unix(startDate / 1000).format('DD-MM-YYYY');

          var a = moment(_startDate, 'DD-MM-YYYY');
          var b = moment(a).add(monthCnt, 'M');

          daysCounter = b.diff(a, 'days');
        }
        break;
      //дата
      case ID_DELIVERY_TYPE.DATE:
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
  public termsConditionsPaymentValue = [];
  public termsPaymentForm = this.formBuilder.group({
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

  public termsConditionsPaymentConst = termsConditionsPaymentConst;

  public editingTermPayment(): void {
    this.editTermPayment = true;
    //получаем справочник календарные и банковские дни
    this.commonService
      .getByName(this.user?.token, 'daytypes')
      .subscribe((res: any) => {
        this.dayTypePaymentConfig = res.refbooks;
      });

    this.tradingService
      .getPaymentConfig(this.user.token, this.sessionIds.sectionId)
      .pipe(
        map((res: any) => res.data),
        tap((paymentConfigData) => {
          this.processPaymentConditions(paymentConfigData);
          this.setupPaymentForm();
        })
      )
      .subscribe();
  }

  private processPaymentConditions(paymentConfigData: any[]): void {
    const filtered = paymentConfigData.filter((item) =>
      this.termsConditionsPayment?.find(
        (el) => el.paymentConditionId === item.id
      )
    );

    this.termsConditionsPaymentValue = Array.from(
      new Map(filtered.map((item) => [item.id, item])).values()
    );
  }

  private setupPaymentForm(): void {
    if (
      this.termsConditionsPaymentValue.length === 1 &&
      !this.termsPaymentForm.controls.volume.value
    ) {
      this.termsPaymentForm.controls.termsPayment.patchValue(
        this.termsConditionsPaymentValue[0].id.toString()
      );
      this.onTermsPaymentChange('termsPayment');
    }

    this.termsPaymentForm.controls['termsPayment'].patchValue(
      this.paymentCond.idPaymentType.toString()
    );
    this.onTermsPaymentChange('termsPayment');
    this.paymentTermConcated = this.generalInfo.concatedPaymentConditions;
  }

  public onTermsPaymentChange(field: string): void {
    const form = this.termsPaymentForm.controls;

    switch (field) {
      case 'termsPayment':
        this.handleTermsPaymentChange(form);
        break;
      case 'volume':
        this.handleVolumeChange(form);
        break;
      case 'momentPrepayment':
        this.handleMomentPrepaymentChange(form);
        break;
      case 'momentDelay':
        this.handleMomentDelayChange(form);
        break;
    }
  }

  private handleTermsPaymentChange(form: any): void {
    this.resetTermsPaymentFields(form);

    // выбранное значение условия оплаты
    this.termsConditions = this.termsConditionsPaymentValue.find(
      (el) => el.id == this.termsPaymentForm.controls.termsPayment.value
    );

    // условия оплаты отфильторованные по условиям оплаты из пересечения
    this.termsConditionsFilter = this.termsConditionsPayment.filter(
      (el) =>
        el.paymentConditionId ===
        this.termsPaymentForm.controls.termsPayment.value
    );

    // формирование массива объема доступных для выбора
    this.setAvailableVolumes();
    this.handleSingleVolumeSelection(form);
    this.setDefaultVolumeIfNeeded(form);
  }

  private resetTermsPaymentFields(form: any): void {
    form.volume.reset();
    form.prepaymentAmount.reset();
    form.dayTypeId.reset();
    this.volumeTerms = [];
    this.paymentTermConcated = '';
  }

  private setAvailableVolumes(): void {
    this.volumeTerms = this.termsConditions?.volumes?.filter(
      (item) =>
        this.termsConditionsFilter.find(
          (el) => el.paymentVolumeId === item.id
        ) && !this.volumeTerms.find((el) => el.id === item.id)
    );
  }

  private handleSingleVolumeSelection(form: any): void {
    if (this.volumeTerms?.length === 1) {
      form['volume'].setValue(this.volumeTerms[0].id);
      this.onTermsPaymentChange('volume');
    }
  }

  private setDefaultVolumeIfNeeded(form: any): void {
    if (!form['volume'].value && !this.isEditedTermsPayment) {
      form['volume'].setValue(this.paymentCond.idShipmentVolume.toString());
      this.onTermsPaymentChange('volume');
    }
  }

  private handleVolumeChange(form: any): void {
    this.resetVolumeDetails(form);

    if (!form.volume.value) return;
    //выбранное значение объема
    this.volumeTermsPayment = this.termsConditions?.volumes.find(
      (el) => el.id === form['volume'].value
    );
    //условия оплаты отфильтрованы по условиям оплаты и объему из пересечения
    this.termsConditionsVolumesFilter = this.termsConditionsFilter.filter(
      (el) => el.paymentVolumeId === form['volume'].value
    );

    this.handlePaymentTypeSpecificLogic(form);
    // «Условие оплаты» в форме заявке = «Предоплата 100%» или «Частичная предоплата»;
    if (
      Number(form['termsPayment'].value) !==
      termsConditionsPaymentConst.paymentDeferment
    ) {
      this.handlePrepaymentLogic(form);
    } else {
      //отсрочка
      this.handleDefermentLogic(form);
    }
  }

  private resetVolumeDetails(form: any): void {
    form.momentPrepayment.reset();
    form.prepaymentAmount.reset();
    form.momentDelay.reset();
    form.defermentAmount.reset();
    form.dayTypeId?.reset();
    this.readOnlyDefermentAmount = true;
    this.momentPrepayment = null;
    this.momentDelay = null;
    this.paymentTermConcated = '';
    this.momentDelayValues = [];
    this.momentPrepaymentValues = [];
  }

  private handlePaymentTypeSpecificLogic(form: any): void {
    //Условие оплаты в форме заявки = «Предоплата 100%» или Оплата через счета биржи
    if (
      Number(form['termsPayment'].value) ===
      termsConditionsPaymentConst.prepayment100 ||
      Number(form['termsPayment'].value) ===
      termsConditionsPaymentConst.paymentThroughExchange
    ) {
      form['prepaymentAmount'].setValue(100);
    }
    //Условие оплаты в форме заявки = «Отсрочка»
    if (
      Number(form['termsPayment'].value) ===
      termsConditionsPaymentConst.paymentDeferment
    ) {
      form['defermentAmount'].setValue(100);
    }
  }

  private handlePrepaymentLogic(form: any): void {
    this.momentPrepaymentValues = this.volumeTermsPayment?.prepayMoments.filter(
      (item) =>
        this.termsConditionsVolumesFilter.find(
          (el) => el.prepayMomentId === item.id
        ) && !this.momentPrepaymentValues.find((el) => el.id === item.id)
    );

    if (!this.isEditedTermsPayment) {
      form['momentPrepayment'].setValue(
        this.paymentCond.firstPaymentMomentId?.toString()
      );
      form['prepaymentAmount'].setValue(this.paymentCond?.firstPercent);
      this.onTermsPaymentChange('momentPrepayment');
    }
    this.handleSingleMomentPrepaymentSelection(form);
  }

  private handleSingleMomentPrepaymentSelection(form: any): void {
    if (this.momentPrepaymentValues?.length === 1) {
      form['momentPrepayment'].setValue(this.momentPrepaymentValues[0].id);
      this.onTermsPaymentChange('momentPrepayment');
    }
  }

  private handleDefermentLogic(form: any): void {
    this.momentDelayValues = this.volumeTermsPayment.delayMoments.filter(
      (item) =>
        this.termsConditionsVolumesFilter.find(
          (el) => el.delayMomentId === item.id
        ) && !this.momentDelayValues.find((el) => el.id === item.id)
    );

    if (
      (!form['momentDelay'].value || !form['defermentAmount'].value) &&
      !this.isEditedTermsPayment
    ) {
      if (form['momentPrepayment']?.value !== timberTicket) {
        form['momentDelay'].setValue(
          this.paymentCond.firstPaymentMomentId?.toString()
        );
      }
      this.onTermsPaymentChange('momentDelay');
    }

    this.handleSingleMomentDelaySelection(form);
  }

  private handleSingleMomentDelaySelection(form: any): void {
    if (this.momentDelayValues.length === 1) {
      form['momentDelay'].setValue(this.momentDelayValues[0].id);
      this.onTermsPaymentChange('momentDelay');
    }
  }

  private handleMomentPrepaymentChange(form: any): void {
    this.resetPrepaymentPeriodFields(form);

    if (!form['momentPrepayment'].value) return;

    this.momentPrepayment = this.volumeTermsPayment?.prepayMoments.find(
      (el) => el.id == form['momentPrepayment'].value
    );
    this.setDayTypeIfApplicable(form, this.momentPrepayment);
    this.setDefaultPrepaymentValues(form);
    this.handlePartialPrepaymentLogic(form);
    this.handleTimberTicketLogic(form);
  }

  private resetPrepaymentPeriodFields(form: any): void {
    form.prepaymentPeriodNumber?.setValue(null);
    form.prepaymentPeriodDate?.setValue(null);
    form.dayTypeId?.setValue(null);
    this.paymentTermConcated = '';
    this.readOnlyDefermentAmount = true; //при переключении с лесорубочного надругое значение. дизейблим размер отсрочки
    this.timberTicket = false;
  }

  private setDayTypeIfApplicable(form: any, moment): void {
    if (moment?.options.applicableDayCount) {
      this.dayType = this.termsConditionsPayment.find(
        (el) =>
          el.paymentConditionId == form['termsPayment'].value &&
          el.paymentVolumeId == form['volume'].value &&
          el.prepayMomentId == form['momentPrepayment'].value &&
          el.delayMomentId == form['momentDelay'].value
      )?.dayTypeId;
      if (this.dayType?.length == 1) {
        form['dayTypeId'].setValue(this.dayType[0]);
      }
    }
  }

  private setDefaultPrepaymentValues(form: any): void {
    if (
      !(
        form['prepaymentPeriodNumber'].value ||
        form['prepaymentPeriodDate'].value
      ) &&
      !this.isEditedTermsPayment &&
      this.paymentCond.firstPaymentMomentId != timberTicket
    ) {
      let date: number | null = convertDate(this.paymentCond?.firstPeriodValueDate);
      form['prepaymentPeriodNumber']?.setValue(
        this.paymentCond.firstPeriodValueNumber?.toString()
      );
      form['prepaymentPeriodDate']?.setValue(date);
      form['dayTypeId']?.setValue(this.paymentCond?.idDayType);

      //Условие оплаты в форме заявки = «Предоплата 100%»
      if (
        Number(form['termsPayment']?.value) ==
        termsConditionsPaymentConst.prepayment100 ||
        Number(form['termsPayment']?.value) ==
        termsConditionsPaymentConst.paymentThroughExchange
      ) {
        this.paymentTermConcated = upperCaseFirstLetter(
          this.generalInfo.concatedPaymentConditions
        );
      }
    }
  }

  private handlePartialPrepaymentLogic(form: any): void {
    //«Условие оплаты» в форме заявки = «Частичная предоплата»
    if (
      Number(form['termsPayment'].value) ==
      termsConditionsPaymentConst.partialPrepayment
    ) {
      this.momentDelayValues = this.momentPrepayment.delayMoments;
      this.onPrepaymentAmountChange();
      if (!form['momentDelay'].value && !this.isEditedTermsPayment) {
        form['defermentAmount'].setValue(this.paymentCond.secondPercent);
        form['momentDelay'].setValue(
          this.paymentCond.secondPaymentMomentId?.toString()
        );
        this.onTermsPaymentChange('momentDelay');
      }

      this.handleSingleMomentDelaySelection(form);
    }
  }

  private handleTimberTicketLogic(form: any): void {
    //формирование строки для «Условие оплаты» в форме заявке = «Предоплата 100%» и Момент предоплаты = «до выдачи лесорубочного билета»
    if (
      (Number(form['termsPayment'].value) ==
        termsConditionsPaymentConst.prepayment100 ||
        Number(form['termsPayment']?.value) ==
        termsConditionsPaymentConst.paymentThroughExchange) &&
      Number(form['momentPrepayment']?.value) == timberTicket
    ) {
      this.timberTicket = true;
      this.getPaymentTermConcatedString();
    }
  }

  private handleMomentDelayChange(form: any): void {
    this.resetDefermentPeriodFields(form);

    if (!form.momentDelay.value) return;

    let array =
      Number(form['termsPayment'].value) ==
      termsConditionsPaymentConst.partialPrepayment
        ? this.momentPrepayment
        : this.volumeTermsPayment;

    this.momentDelay = this.findMomentDelay(array, form);
    this.setDayTypeIfApplicable(form, this.momentDelay);
    this.setDefaultDefermentValues(form);
    this.handleTimberTicketDefermentLogic(form);
  }

  private resetDefermentPeriodFields(form): void {
    form['defermentPeriodNumber']?.setValue(null);
    form['defermentPeriodDate']?.setValue(null);
    form['dayTypeId']?.setValue(null);
    this.paymentTermConcated = '';
  }

  private findMomentDelay(array, form): DelayMoment {
    return array.delayMoments.find((el) => el.id == form['momentDelay'].value);
  }

  private setDefaultDefermentValues(form: any): void {
    if (
      !(
        form['defermentPeriodNumber'].value || form['defermentPeriodDate'].value
      ) &&
      !this.isEditedTermsPayment
    ) {
      if (
        this.paymentCond?.idPaymentType !=
        termsConditionsPaymentConst.partialPrepayment
      ) {
        //если это предоплата или отсрочка
        let date: number | null = convertDate(
          this.paymentCond?.firstPeriodValueDate
        );
        form['defermentPeriodNumber']?.setValue(
          this.paymentCond?.firstPeriodValueNumber?.toString()
        );
        form['defermentPeriodDate']?.setValue(date);
      } else {
        form['defermentPeriodNumber']?.setValue(
          this.paymentCond?.secondPeriodValueNumber.toString()
        );
      }
      form['dayTypeId']?.setValue(this.paymentCond?.idDayType);
      this.paymentTermConcated = upperCaseFirstLetter(
        this.generalInfo.concatedPaymentConditions
      );
    }
  }

  private handleTimberTicketDefermentLogic(form) {
    //«Момент предоплаты» = «до выдачи лесорубочного билета»
    if (
      form['momentPrepayment']?.value == timberTicket &&
      this.isEditedTermsPayment
    ) {
      form['defermentPeriodNumber'].setValue(DEFAULT_DEFERMENT_PERIOD_NUMBER);
      form['momentDelay2'].setValue(this.momentDelayValues[0].id);
      form['defermentPeriod2'].setValue(DEFAULT_DEFERMENT_PERIOD_NUMBER_2);
    }
    this.isNotEditedTermsPaymentTimberTicket(form);
  }

  private isNotEditedTermsPaymentTimberTicket(form: any): void {
    if (
      form['momentPrepayment']?.value == timberTicket &&
      !(form['momentDelay2'].value || form['defermentPeriod2'].value) &&
      !this.isEditedTermsPayment
    ) {
      form['momentDelay'].setValue(
        this.paymentCond.secondPaymentMomentId?.toString()
      );
      form['momentDelay2'].setValue(
        this.paymentCond.secondPaymentMomentId?.toString()
      );
      form['defermentAmount'].setValue(this.paymentCond.secondPercent);
      form['prepaymentAmount'].setValue(this.paymentCond.firstPercent);
      form['defermentPeriodNumber'].setValue(
        this.paymentCond?.secondPeriodValueNumber
      );
      form['defermentPeriod2'].setValue(
        this.paymentCond?.thirdPeriodValueNumber
      );
      form['dayTypeId']?.setValue(this.paymentCond?.idDayType);
      this.timberTicket = true;
      this.onChangedefermentAmount();
    }
  }

  //проверка на добавление 2 этапа при Момент предоплаты = «до выдачи лесорубочного билета»
  conditionSecondStage(): boolean {
    return (
      Number(this.termsPaymentForm.controls['termsPayment']?.value) ==
      termsConditionsPaymentConst.partialPrepayment &&
      Number(this.termsPaymentForm.controls['momentPrepayment']?.value) ==
      timberTicket &&
      AMOUNT_OF_DEFERMENT_100 - Number(this.termsPaymentForm.controls['prepaymentAmount']?.value) >
      AMOUNT_OF_DEFERMENT_40 &&
      this.termsPaymentForm.controls['defermentAmount2']?.value
    );
  }

  onPrepaymentAmountChange(): void {
    //Условие оплаты в форме заявки = «Частичная предоплата» и (или) «Момент предоплаты» = «до выдачи лесорубочного билета»;
    if (
      Number(this.termsPaymentForm.controls.termsPayment?.value) ==
      termsConditionsPaymentConst.partialPrepayment &&
      this.termsPaymentForm.controls.momentPrepayment?.value == 7
    ) {
      let value = AMOUNT_OF_DEFERMENT_100 - this.termsPaymentForm.controls.prepaymentAmount?.value;

      //«Размер отсрочки» <= 40%, то поле недоступно для изменения и содержит рассчитанное значение
      if (value <= AMOUNT_OF_DEFERMENT_40) {
        this.termsPaymentForm.controls.defermentAmount.setValue(value);
        this.readOnlyDefermentAmount = true;
      }
      //«Размер отсрочки» >40% (оплата может быть произведена в один или два этапа), то поле заполняется значением по умолчанию - 40% и остается доступным для редактирования
      else {
        this.termsPaymentForm.controls.defermentAmount.setValue(AMOUNT_OF_DEFERMENT_40);
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
        AMOUNT_OF_DEFERMENT_100 - this.termsPaymentForm.controls.prepaymentAmount?.value
      );
    if (
      !(
        Number(this.termsPaymentForm.controls.termsPayment?.value) ==
        termsConditionsPaymentConst.partialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }

  onChangedefermentAmount(): void {
    let defermentAmount2 =
      AMOUNT_OF_DEFERMENT_100 -
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
        AMOUNT_OF_DEFERMENT_100 - this.termsPaymentForm.controls.defermentAmount.value
      );
    }

    if (
      !(
        Number(this.termsPaymentForm.controls.termsPayment?.value) ==
        termsConditionsPaymentConst.partialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }


  getPaymentTermConcatedString(): void {
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

  private getDeadlines(isFirstTime?: string): void {
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
      startDelivery = this.deliveryTermForm.controls['startDelivery'].value;
      deliveryType = this.deliveryTermForm.controls['deliveryType'].value;
      deliveryTerm = this.deliveryTermForm.controls['deliveryTerm']?.value || 0;
      startDate = this.deliveryTermForm.controls['startDate']?.value
        ? toOADate(this.deliveryTermForm.controls['startDate']?.value)
        : null;
      endDate = this.deliveryTermForm.controls['endDate']?.value
        ? toOADate(this.deliveryTermForm.controls['endDate']?.value)
        : null;
    } else {
      //берем значения из заявки (если сохранили данные, перезаписываем их в массив того что пришло по заявке)
      startDelivery = this.deliveryPeriod.idDeliveryMoment?.toString();
      deliveryType = this.deliveryPeriod.idDeliveryType?.toString();
      deliveryTerm = this.deliveryPeriod.periodTypeValue
        ? this.deliveryPeriod.periodTypeValue?.toString()
        : 0;
      startDate = this.deliveryPeriod?.dateBegin;
      endDate = this.deliveryPeriod?.dateEnd;
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
      termsPayment = this.paymentCond.idPaymentType.toString();
      idMomentPrepay =
        termsPayment != termsConditionsPaymentConst.paymentDeferment
          ? this.paymentCond.firstPaymentMomentId?.toString()
          : null;
      idMomentDelay =
        termsPayment == termsConditionsPaymentConst.paymentDeferment
          ? this.paymentCond.firstPaymentMomentId?.toString()
          : termsPayment == termsConditionsPaymentConst.partialPrepayment
            ? this.paymentCond.secondPaymentMomentId?.toString()
            : null;
      idDayType = this.paymentCond.idDayType || null;
      FirstPeriodValueNumber = this.paymentCond.firstPeriodValueNumber || null;
      FirstPeriodValueDate = this.paymentCond.firstPeriodValueDate || null;
      SecondPeriodValueNumber =
        this.paymentCond.secondPeriodValueNumber || null;
      ThirdPeriodValueNumber = this.paymentCond.thirdPeriodValueNumber || null;
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
          if (!isFirstTime) {
            this.isDisabledSaveButton = false; //разблокировали кнопку сохранить
          }
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
      this.paymentCond.idPaymentType =
        this.termsPaymentForm.controls.termsPayment?.value || null;
      this.paymentCond.idShipmentVolume =
        this.termsPaymentForm.controls.volume?.value;
      this.paymentCond.firstPercent =
        this.paymentCond.idPaymentType !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentAmount?.value
          : this.termsPaymentForm.controls.defermentAmount?.value;
      this.paymentCond.secondPercent =
        this.paymentCond.idPaymentType ==
        termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.defermentAmount?.value
          : null;
      this.paymentCond.firstPaymentMomentId =
        this.paymentCond.idPaymentType !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.momentPrepayment?.value
          : this.termsPaymentForm.controls.momentDelay?.value;
      this.paymentCond.secondPaymentMomentId =
        this.paymentCond.idPaymentType ==
        termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.momentDelay?.value
          : null;
      this.paymentCond.idDayType =
        this.termsPaymentForm.controls.dayTypeId?.value || null;
      this.paymentCond.firstPeriodValueNumber =
        this.termsPaymentForm.controls.termsPayment?.value !=
        termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value || null
          : this.termsPaymentForm.controls.defermentPeriodNumber?.value || null;
      this.paymentCond.firstPeriodValueDate =
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
      this.paymentCond.secondPeriodValueNumber =
        this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.defermentPeriodNumber?.value || null
          : null;
      this.paymentCond.thirdPeriodValueNumber = this.conditionSecondStage()
        ? this.termsPaymentForm.controls.defermentPeriod2?.value || null
        : null;
      this.generalInfo.concatedPaymentConditions = this.paymentTermConcated;
    }
  }

  onChangedAdditionalFields(fieldId, value) {
    this.goods.forEach((good) => {
      let findField = good.goodsSpecifications.find(
        (el) => el.idInterfaceField == fieldId
      );
      findField.fieldValueNumber = Number(value.value);

      switch (fieldId) {
        case IdInterfaceField.currency: {
          let currencyValue = this.currencyIntersections.find(
            (el) => Number(el.id) === Number(value.value)
          ).name;
          this.changeCurrency(findField, good, currencyValue);
          break;
        }
        case IdInterfaceField.VATrate: {
          findField.fieldValue = this.VatIntersections.find(
            (el) => Number(el.id) === Number(value.value)
          ).name;
          break;
        }
        case IdInterfaceField.financeSource: {
          findField.fieldValue = this.financeSourceIntersections.find(
            (el) => Number(el.id) === Number(value.value)
          ).name;
          break;
        }
      }
    });

    if (fieldId === IdInterfaceField.VATrate) {
      this.VatField = this.getGoodsSpecifications(
        this.goods[0].goodsSpecifications,
        IdInterfaceField.VATrate
      );
      this.editDemandOfferServiceService.VatFieldSubject.next(this.VatField);
      this.getTotalCost();
    }
    this.isDisabledSaveButton = false;
  }

  changeCurrency(
    findField: IEditOfferGoodsSpecifications,
    good: IEditOfferGood,
    currencyValue: string
  ): void {
    findField.fieldValue = currencyValue;
    good.currency = currencyValue;
  }

  getValue(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  getValueNumber(
    goodsSpecifications: IEditOfferGoodsSpecifications[],
    idInterfaceField: number
  ) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValueNumber;
  }

  getGoodsSpecifications(
    goodsSpecifications: IEditOfferGoodsSpecifications[],
    idInterfaceField: number
  ): IEditOfferGoodsSpecifications {
    return goodsSpecifications?.find(
      (el) => el.idInterfaceField == idInterfaceField
    );
  }

  public editRuleInIntersections(id: number): number {
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField == id)
        ?.idEditRule || null
    );
  }

  getNumberCost(value): number {
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

  public getTotalCost(): void {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal: number = 0,
      amountVATTotal: number = 0,
      costVATTotal: number = 0,
      volumeTotal: number = 0;
    let vat: number = getVatNumber(this.VatField);

    if (this.generalInfo.pricingTypeId !== pricingType.formulaWithoutQuotation) {
      this.goods.forEach((good) => {
        let count: number = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.quantity)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat: number = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.priceWithoutVAT)
            .fieldValueNumber
        ); //Цена без НДС

        let costWithoutVAT: number = round(
          count * priceWithoutVat,
          this.currencyPrecision
        );
        let amountVAT: number = round(
          costWithoutVAT * (vat / 100),
          this.currencyPrecision
        );
        let costVAT: number = costWithoutVAT + amountVAT;

        good.goodsSpecifications.forEach((item) => {
          if (item.costWithoutVAT) {
            item.costWithoutVAT = costWithoutVAT;
            item.fieldValue = costWithoutVAT;
          }
          if (item.amountVAT || item.amountVAT === 0) {
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
        volumeTotal = volumeTotal + count;
      });

      const totalRow: TotalRowData = {
        quantity: volumeTotal.toString(),
        costWithoutVat: costWithoutVatTotal.toString(),
        amountVAT: amountVATTotal.toString(),
        costVat: costVATTotal.toString(),
      };

      this.updateTotalRowData(totalRow);
    }
  }

  public updateTotalRowAfterEditNumber(totalRowData: TotalRowData): void {
    this.updateTotalRowData(totalRowData);
    this.goodFormValidationGroup?.instance.validate();
    this.isDisabledSaveButton = false;
  }

  public updateTotalRowData(totalValues: TotalRowData): void {
    this.totalForm.controls['quantity'].patchValue(
      Number(totalValues.quantity).toLocaleString('ru', {
        maximumFractionDigits: this.goods[0].goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.quantity
        ).fieldPrecision,
      }) +
      ' ' +
      this.goods[0].unitName
    );
    this.totalForm.controls['costWithoutVat'].patchValue(
      Number(totalValues.costWithoutVat).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
      ' ' +
      this.goods[0].currency
    );
    this.totalForm.controls['amountVAT'].patchValue(
      Number(totalValues.amountVAT).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
      ' ' +
      this.goods[0].currency
    );
    this.totalForm.controls['costVat'].patchValue(
      Number(totalValues.costVat).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
      ' ' +
      this.goods[0].currency
    );

    this.totalRowData = this.totalForm.value;
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.goods);
  }

  editProductLocation(good: IEditOfferGood, fieldId: number): void {
    this.goodLocation = Object.assign(good, { fieldId: fieldId });
    let blockFind = this.editDemandOfferServiceService.onFindBlock(good, this.dataForModel);
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

  public onChangedFeield(e: ValueChangedEvent, field): void {
    field.fieldValueNumber = Number(e.value);
    this.isDisabledSaveButton = false;
  }

  public onSaveEditField(field): void {
    field.fieldValue = field.dataSource?.find(el => el.id === field.fieldValueNumber.toString())?.name;
    field.isEdit = false;
  }

  public onCancelEditField(field): void {
    field.fieldValueNumber = Number(field.dataSource?.find(el => el.name === field.fieldValue)?.id);
    field.isEdit = false;
  }

  public onContinueEditProductLocation(): void {
    let field: IEditOfferGoodsSpecifications =
      this.goodLocation.goodsSpecifications.find(
        (field) => field.idInterfaceField == this.goodLocation.fieldId
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
      this.generalInfo.directionId === IdDirection.sale
    ) {
      for (let i = 1; i < this.goods.length; i++) {
        let goodField = this.goods[i].goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.productLocation
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

  isViewLocation(good): boolean {
    return (
      !this.isComplexLotGrades() &&
      this.generalInfo.directionId === IdDirection.sale &&
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

  isViewPlaceOfWork(good): boolean {
    return (
      this.generalInfo.directionId === IdDirection.buy &&
      this.getGoodsSpecifications(
        good.goodsSpecifications,
        IdInterfaceField.placeOfWork
      ) &&
      this.editRuleInIntersections(IdInterfaceField.placeOfWork) ==
      editingRules.selectFromDirectory
    );
  }

  public onSave(): void {
    this.editDemandOfferServiceService.userTokenSubject.next(this.user?.token);
    this.editDemandOfferServiceService.goodsSubject.next(this.goods);
    this.editDemandOfferServiceService.generalInfoSubject.next(this.generalInfo);
    this.editDemandOfferServiceService.editTermPaymentSubject.next(this.editTermPayment);
    this.editDemandOfferServiceService.termsPaymentFormSubject.next(this.termsPaymentForm);
    this.editDemandOfferServiceService.paymentCondSubject.next(this.paymentCond);
    this.editDemandOfferServiceService.deliveryBasisCommonSubject.next(this.deliveryBasisCommon);
    this.editDemandOfferServiceService.isActiveCorridorSubject.next(this.isActiveCorridor);
    this.editDemandOfferServiceService.isActiveQuotationSubject.next(this.isActiveQuotation);
    this.editDemandOfferServiceService.adjustablePriceSubject.next(this.adjustablePrice);
    this.editDemandOfferServiceService.deliveryScopesSubject.next(this.deliveryScopes);
    this.editDemandOfferServiceService.momentPrepaymentSubject.next(this.momentPrepayment);
    this.editDemandOfferServiceService.deliveryTermFormSubject.next(this.deliveryTermForm);
    this.editDemandOfferServiceService.dataForModelSubject.next(this.dataForModel);
    this.editDemandOfferServiceService.finishDelivSchPeriodsSubject.next(this.finishDelivSchPeriods);
    this.editDemandOfferServiceService.editTermConditionSubject.next(this.editTermCondition);
    this.editDemandOfferServiceService.deliveryPeriodValueSubject.next(this.deliveryPeriod);
    this.editDemandOfferServiceService.uniqueDeliveryScopesSubject.next(this.uniqueDeliveryScopes);

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

  public setSaveRequestPending(pending: boolean): void {
    this.isSaveRequestPending = pending;
    this.saveRequestPendingChange.emit(pending);
  }
}
