import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  DxScrollViewModule,
  DxTooltipModule,
  DxValidationGroupModule,
  DxButtonModule,
  DxNumberBoxModule,
  DxValidatorModule,
  DxSelectBoxModule,
  DxCheckBoxModule,
  DxPopupModule,
  DxDropDownBoxModule,
  DxTextBoxModule,
  DxListModule,
  DxDataGridModule,
} from 'devextreme-angular';
import { User } from '@classes';
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
} from '@constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import RU from '@ru-translate';
import EN from '@en-translate';
import moment from 'moment';
import {
  DxDataGridComponent,
  DxValidationGroupComponent,
  DxValidatorComponent,
} from 'devextreme-angular';
import {
  ErrorServiceService,
  TradingService,
  CommonService,
  ToastService,
  CurrencyService,
  SubmissionService,
  DemandService,
  EditOfferDemandResponse,
  DeliverySchedulePeriodGraded,
  DeliveryScope,
  OfferGood,
} from '@services';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DeliveryTermFormComponent } from './delivery-term-form';
import { ValueChangedEvent } from 'devextreme/ui/date_box';
import { DeliveryTermsPaymentComponent } from './delivery-terms-payment/delivery-terms-payment.component';
import { map, tap } from 'rxjs/operators';
import { convertExcelSerialDateToMs } from '../../views/homepage/helpers';
import { AdditionalFieldsForPurchaseComponent } from './additional-fields-for-purchase/additional-fields-for-purchase.component';
import {
  DelayMoment,
  PaymentMethod,
  Volume,
  IEditOfferGoodsSpecifications,
  IGeneralInfo,
  IEditOfferGood,
  IDeliveryTerm,
  IPaymentCondition,
  IDeliveryPeriod,
  PrepayMoment,
  Field,
  IApiDataSection,
} from '@interfaces';
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
  UpperCaseFirstLetterPipe,
  ActualDimensionsPipe,
  ToNumberPipe,
  RuNumberFormatPipe,
} from '@pipes';
import { HomePageStore } from '../../views/homepage/store';
import { AUCTION_TYPE, DELIVERY_SCOPE_ITEMS, ID_DELIVERY_MOMENT, ID_DELIVERY_TYPE } from '../../shared/enums';
import { IReferences } from '../../views/homepage/interfaces';
import { EditLocationComponent } from '@components';
import {SortActualDimensionsPipe} from "../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe";
import { ApiStore } from '@store';
import { DisableNumberBoxWheel } from "../../shared/directives/disable-number-box-wheel";
import { SumVolumePipe } from "../../shared/pipes/sumVolume/sum-volume-pipe";
import { DeliveryScopeGraded, ScheduleData } from "../../services/edit-demand-offer-service.service";
import { Block, EditDemandOfferServiceService } from "../../services/edit-demand-offer-service.service";
import { OffersAdditionalInfoComponent } from '../../features/trading/components/offers-additional-info/offers-additional-info.component';

@Component({
  selector: 'app-edit-offer',
  standalone: true,
  imports: [
    CommonModule,
    DxScrollViewModule,
    DxTooltipModule,
    DxValidationGroupModule,
    DxButtonModule,
    DxNumberBoxModule,
    DxValidatorModule,
    DxSelectBoxModule,
    DxCheckBoxModule,
    DxPopupModule,
    DxDropDownBoxModule,
    DxTextBoxModule,
    DxListModule,
    DxDataGridModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DeliveryTermFormComponent,
    DeliveryTermsPaymentComponent,
    AdditionalFieldsForPurchaseComponent,
    UpperCaseFirstLetterPipe,
    ActualDimensionsPipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    EditLocationComponent,
    SortActualDimensionsPipe,
    DisableNumberBoxWheel,
    OffersAdditionalInfoComponent
  ],
  templateUrl: './edit-offer.component.html',
  styleUrls: ['./edit-offer.component.scss'],
})
export class EditOfferComponent implements OnChanges, OnInit {
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


  @Input({ required: true }) generalInfo: IGeneralInfo;
  @Input({ required: true }) goods: IEditOfferGood[];
  @Input({ required: true }) documents;
  @Input({ required: true }) deliveryConditions;
  @Input({ required: true }) uniqueDeliveryScopes;
  @Input({ required: true }) sessionIds;
  @Input({ required: true }) dataForModel;
  @Input({ required: true }) termsConditionsPayment: any[];
  @Input({ required: true }) deliveryTerm: IDeliveryTerm[];
  @Input({ required: true }) deliveryPeriod: IDeliveryPeriod;
  @Input({ required: true }) paymentCond: IPaymentCondition;
  @Input({ required: true }) goodsOriginal;
  @Input({ required: true }) editRulesIntersections;
  @Input({ required: true }) delivSchPeriods;
  @Input({ required: true }) scheduleData;
  @Input({ required: true }) deliveryScopes;
  @Input({ required: true }) deliveryScopeGraded: DeliveryScopeGraded[];
  @Input({ required: true }) deliveryBasisCommon;
  @Input({ required: true }) currencyIntersections: any[];
  @Input({ required: true }) VatIntersections: any[];
  @Input({ required: true }) financeSourceIntersections: any[];
  @Input({ required: true }) adjustablePriceIntersections: boolean;
  @Input({ required: true }) isSameGradedSaleOffer: boolean = false;

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
  sellerInformationHidden: boolean = true;
  expandTable: boolean = false;
  pricingType = pricingType;
  VatField: any; //Ставка НДС
  // uniqueDelConditions = []; //уникальные значения в массиве deliveryConditions
  privileges: boolean = false;
  mainbasis: any;
  DateSessionPlusDay: Date;
  DateSession: any;

  isShowNotific = false; //показывать уведомление перед кнопками, если изменили количество

  currencyPrecision: any; //точность валюты
  quoteCurrencyPrecision: any; //точность валюты

  totalForm = this.formBuilder.group({
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  goodForm = this.formBuilder.group({});

  restorePopup: boolean = false;
  message: string = ' ';

  goodInfo = false;
  viewInfoGood = null;
  totalRowData: any; //инфа в строку Итого по товарам

  editTermCondition = false; //форма редактирования срока поставки
  editTermPayment = false; //форма редактирования условия поставки
  uniqueDeliveryTerm = [];

  deliveryTermForm = this.formBuilder.group({
    startDelivery: [null, [Validators.required]],
    deliveryType: [null, [Validators.required]],
    deliveryTerm: [0, [Validators.required]],
    startDate: [new Date(), [Validators.required]],
    endDate: [new Date(), [Validators.required]],
  });

  isEditedDeliveryTerm = false; // при редактировании заявки отредактировано ли что-нибудь в срок поставки
  isEditedTermsPayment = false; // при редактировании заявки отредактировано ли что-нибудь в срок оплаты

  dayTypePaymentConfig: any; //Справочник календарных и банковских дней
  isDisabledSaveButton = true; //задизейблина ли кнопка Сохранить
  public isSaveRequestPending: boolean = false; //выполняется ли запрос сохранения
  editingRules = editingRules;

  adjustablePrice = false; //значение корректируемая цена
  isPopupClear = false; //попап окно для очистки графика поставки
  isPopupClearPrice = false; //попап окно для очистки графика поставки через корректируемую цену
  finishDelivSchPeriods = []; //массив графика поставки, который отправляется на бд
  finishDeliveryScopes = []; //массив грузоотправителей, который отправляется на бд
  finishDeliveryScopesRemain = []; //массив грузоотправителей для остаточной заявки, который отправляется на бд
  finishDeliveryBasis = []; //массив базисов, который отправляется на бд
  public finishDelivSchPeriodsGraded: DeliverySchedulePeriodGraded[] = []; //массив графика поставки, который отправляется на бд
  public finishDeliveryScopesGraded: DeliveryScopeGraded[] = [];
  public finishDeliveryScopesRemainGraded: DeliveryScopeGraded[] = [];

  isDisabledAdjustablePrice = false; //заблокировать корректируемую цену
  deliveryPeriodOriginal: any;

  isActiveQuotation = false; // установлена котировка
  isActiveCorridor = false; // установлена котировка
  isDisabledSaveButtonSubscribe: Subscription;
  changeMainBasis: Subscription;
  changeVolume: Subscription;
  isSessionInfoDisable = false;

  locationField: Field;
  isEditProductLocation = false;
  productLocations: IReferences[] = [];
  productLocationValue: string | number;
  goodLocation: IEditOfferGood;

  momentPrepayment: PrepayMoment;
  momentDelay: DelayMoment;
  readOnlyDefermentAmount = true;
  paymentTermConcated: string;
  termsConditions: PaymentMethod;
  volumeTerms: Volume[] = [];
  volumeTermsPayment: any;
  termsConditionsFilter: any; //условия оплаты отфильтрованные по условиям оплаты из пересечения
  termsConditionsVolumesFilter: any; //условия оплаты отфильтрованные по условиям оплаты и объему из пересечения

  timberTicket = false; //до выдачи лесорубочного билета

  momentPrepaymentValues = [];
  momentDelayValues = [];
  dayType = []; //тип дней (календарные/банковские) в выбранном условии

  public readonly IdInterfaceField = IdInterfaceField;
  public readonly IdDirection = IdDirection;
  public readonly auctionType = auctionType;
  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);

  private sumVolumePipe: SumVolumePipe = inject(SumVolumePipe);

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
    // this.DateSession = new Date((this.sessionDateTime - 25569) * 24 * 3600 * 1000)
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
            this.goodForm.controls[good.idGood.toString() + '_3'].patchValue(
              Number(this.getValue(good.goodsSpecifications, 3))
            );

            if (this.idAuctionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION) {
              const controlName =
                good.idGood.toString() + `_${IdInterfaceField.minPrice}`;
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
            this.goodForm.controls[good.idGood.toString() + '_1'].patchValue(
              Number(this.getValue(good.goodsSpecifications, 1))
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
        if (res.deliveryScopeGraded) {
          this.deliveryScopeGraded = res.deliveryScopeGraded;
        }
      });
    this.adjustablePrice =
      this.getValue(this.goods[0].goodsSpecifications, 47) == 'true';
    //дизейблим ли корректируемую цену
    if (this.deliveryPeriod.idDeliveryType == 3) {
      this.isDaysCountCorrect =
        this.getDaysCount(
          (this.deliveryPeriod?.dateBegin - 25569) * 24 * 3600 * 1000,
          (this.deliveryPeriod?.dateEnd - 25569) * 24 * 3600 * 1000,
          0,
          0
        ) >= minDeliveryScheduleDaysCount;
    } else {
      this.isDaysCountCorrect =
        this.getDaysCount(
          this.deliveryTermForm.controls.startDate?.value,
          null,
          this.deliveryPeriod.idDeliveryType == 1
            ? this.deliveryPeriod.periodTypeValue == null
              ? 0
              : this.deliveryPeriod.periodTypeValue
            : 0,
          this.deliveryPeriod.idDeliveryType == 2
            ? this.deliveryPeriod.periodTypeValue == null
              ? 0
              : this.deliveryPeriod.periodTypeValue
            : 0
        ) >= minDeliveryScheduleDaysCount;
    }
    let isCanSchedule = !!(
      this.deliveryPeriod.idDeliveryMoment == 2 &&
      this.isDaysCountCorrect &&
      this.getGoodsSpecifications(this.goods[0].goodsSpecifications, 47)
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
  }

  public ngOnDestroy(): void {
    this.isDisabledSaveButtonSubscribe.unsubscribe();
    this.changeMainBasis.unsubscribe();
    this.changeVolume.unsubscribe();
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
          ![1, 3].includes(
            changes['sessionIds'].currentValue.session.idSessionPeriod
          )) &&
          !this.user?.IsWorker) ||
        (![1, 3].includes(
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

  onCreateFinishPeriod() {
    //создание объекта графика поставки, если не изменяли сам график поставки
    this.finishDelivSchPeriods = [];
    this.finishDelivSchPeriodsGraded = [];
    if (!this.isSameGradedSaleOffer) {
      this.scheduleData.forEach((item) => {
        let goodsForSchedule = [];
        item.goods.forEach((el) => {
          let good = this.goods.find((g) => g.idGood == el.idGood);
          if (
            this.getGoodsSpecifications(good.goodsSpecifications, 1)
              .fieldValueNumber != 0
          ) {
            let nsiGoodValues = [];
            if (good?.goodValues?.length > 0) {
              good?.goodValues.forEach((gv) => {
                nsiGoodValues.push({
                  idReference: gv.idReference,
                  listValues: gv.listValues,
                  isAllowAnalogs: gv.isAllowAnalogs,
                });
              });
            }

            goodsForSchedule.push({
              idGood: good.goodsSpecifications[0].idDemandOfferGood,
              idGoodFromFront: good.goodsSpecifications[0].idDemandOfferGood,
              nsiGoodValues: nsiGoodValues,
              idGoodName: good.idGoodName,
              idGoodGroup: good.idGoodGroup,
              idNomenclature: good.idNomenclatureGroup,
              periodVolume: el.volume,
              ...(this.generalInfo?.directionId == IdDirection.buy && {
                minPriceWithoutVat: this.getValueNumber(
                  good.goodsSpecifications,
                  IdInterfaceField.minPrice
                ),
                locationService: this.getValueNumber(
                  good.goodsSpecifications,
                  IdInterfaceField.placeOfWork
                ),
              }),
            });
          }
        });

        let start: string[] = item.startDate.split('.');
        let end: string[] = item.endDate.split('.');

        this.finishDelivSchPeriods.push({
          goods: goodsForSchedule,
          periodDateBegin: toOADate(
            Date.parse(start[1] + '.' + start[0] + '.' + start[2])
          ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл
          periodDateEnd: toOADate(
            Date.parse(end[1] + '.' + end[0] + '.' + end[2])
          ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл
          idPeriod: item.idPeriod,
        });
      });
    } else {
      this.finishDelivSchPeriodsGraded = this.scheduleData.map(sch => {
        let start: string[] = sch.startDate.split('.');
        let end: string[] = sch.endDate.split('.');
        return {
          periodDateBegin: toOADate(
            Date.parse(start[1] + '.' + start[0] + '.' + start[2])
          ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл,
          periodDateEnd: toOADate(
            Date.parse(end[1] + '.' + end[0] + '.' + end[2])
          ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл,
          periodVolume: sch.periodVolume,
          idPeriod: sch.idPeriod
        };
      });
    }

    if (this.finishDelivSchPeriods?.length === 0 && this.finishDelivSchPeriodsGraded.length === 0 && !this.isCanSchedule()) {
      this.isDisabledAdjustablePrice = true;
    }
  }

  onCreateFinishScopes() {
    this.finishDeliveryScopes = [];
    this.finishDeliveryScopesRemain = [];
    this.deliveryScopes.forEach((scope) => {
      let goods = [];
      scope[1].forEach((good) => {
        let goodFromList = this.goods.find((g) => g.idGood == good.idGood);
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
          ...(this.generalInfo?.directionId == IdDirection.buy && {
            minPriceWithoutVat: this.getValueNumber(
              goodFromList.goodsSpecifications,
              IdInterfaceField.minPrice
            ),
            locationService: this.getValueNumber(
              goodFromList.goodsSpecifications,
              IdInterfaceField.placeOfWork
            ),
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
        let goodFromList = this.goods.find((g) => g.idGood == good.idGood);

        if (
          this.getGoodsSpecifications(goodFromList.goodsSpecifications, 1)
            .fieldValueNumber != 0
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
            ...(this.generalInfo?.directionId == IdDirection.buy && {
              minPriceWithoutVat: good.minPrice,
              locationService: this.getValueNumber(
                goodFromList.goodsSpecifications,
                IdInterfaceField.placeOfWork
              ),
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

  private getPrecision(): void {
    if (!this.currencyPrecision) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
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
        (field) => field.idInterfaceField == 3
      ).fieldPrecision = this.currencyPrecision;

      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField == 5
      ); //Ставка НДС
      good.isOpened = false; //для открытия подробного просмотра в таблице
      //смотрим к какому блоку принадлежит товар
      let blockFind: Block = this.editDemandOfferServiceService.onFindBlock(good, this.dataForModel);
      blockFind.fields.forEach((blField) => {
        if (blField.interfaceField.isAvailableMultiSelection) {
          //ищем поле с возможностью мультивыбора
          //находим все значения поля с мультивыбором
          let multiField = good.goodsSpecifications.filter(
            (goodField) =>
              goodField.idInterfaceField == blField.interfaceField.fieldId
          );
          if (multiField?.length > 0) {
            //формируем строковые значения и значения массива
            let fieldValue = '',
              fieldValueArray = [];
            multiField.forEach((field) => {
              fieldValue =
                fieldValueArray.length === 0
                  ? field.fieldValue.toString()
                  : fieldValue + '; ' + field.fieldValue; //формируем строку значений из всех выбранных значений по полю с мультивыбором
              fieldValueArray.push(field.fieldValueNumber);
            });
            //удаляем все поля с этим ид
            good.goodsSpecifications = good.goodsSpecifications.filter(
              (el) => el.idInterfaceField != blField.interfaceField.fieldId
            );
            multiField[0].fieldValue = fieldValue;
            multiField[0].fieldValueArray = fieldValueArray;
            good.goodsSpecifications.push(multiField[0]); //добавляем поле с ид и значениями с мультивыбором
          }
        }
      });

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
    this.getTotalCost(); //сразу рассчитываем без базиса

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

  goToBasis() {
    this.tradingService.goToBasis();
  }

  // редактируем срок поставки
  deliveryTermValue = [];
  deliveryTermConcated: string;
  deliveryTermType = [];
  deadlinePayment: number;
  deadlineDelivery: number;
  deadlineErrorMess: string;
  isDaysCountCorrect = false;

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
          this.deliveryPeriod.idDeliveryMoment?.toString() as any
        );
        this.deliveryTermStartChange('deliveryStart');
        let dateBegin: any = this.deliveryPeriod?.dateBegin
          ? (this.deliveryPeriod?.dateBegin - 25569) * 24 * 3600 * 1000
          : null;
        let dateEnd: any = this.deliveryPeriod?.dateEnd
          ? (this.deliveryPeriod?.dateEnd - 25569) * 24 * 3600 * 1000
          : null;

        this.deliveryTermForm.controls.startDate.patchValue(dateBegin);
        this.deliveryTermForm.controls.endDate.patchValue(dateEnd);
        this.deliveryTermForm.controls.deliveryTerm.patchValue(this.deliveryPeriod.periodTypeValue);
        this.deliveryTermConcated = this.generalInfo.concatedDeliveryPeriod;
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
            (this.deliveryPeriod.idDeliveryType?.toString() as any) || null
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
              this.deliveryPeriod.periodTypeValue
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

  onCreateString(e?, str?) {
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
          this.deliveryTermForm.controls.startDelivery?.value == ID_DELIVERY_MOMENT.FROM_THE_DATE_OF_DELIVERY &&
          this.isDaysCountCorrect &&
          (this.deliveryTermForm.controls.deliveryType.value == ID_DELIVERY_TYPE.DATE
            ? this.deliveryTermForm.controls.endDate.value
            : this.deliveryTermForm.controls.deliveryTerm.value) &&
          (this.deliveryTermForm.controls.endDate.value
            ? this.deliveryTermForm.controls.endDate.value >=
            this.deliveryTermForm.controls.startDate.value
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
      !!form.startDelivery?.value &&
      !!form.deliveryType.value &&
      !!form.startDate?.value;

    if (!basicInfoFilled) {
      return false;
    }

    const deliveryDetailsFilled =
      !!form.endDate?.value ||
      !!form.deliveryTerm?.value;

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

    this.checkForEditedDeliveryTerm();
  }

  private checkForEditedDeliveryTerm(): void {
    if (this.isEditedDeliveryTerm) {
      const scheduleLength: number = this.isSameGradedSaleOffer ?
        this.finishDelivSchPeriodsGraded.length :
        this.finishDelivSchPeriods.length;

      if (scheduleLength > 0 && !(this.isCanSchedule() && this.adjustablePrice)) {
        this.isPopupClear = true;
      }
      if (scheduleLength === 0 && this.isCanSchedule()) {
        this.isDisabledAdjustablePrice = false;
      }
      if (scheduleLength === 0 && !this.isCanSchedule()) {
        this.isDisabledAdjustablePrice = true;
        this.adjustablePrice = false;
      }
    }
  }

  public onChangedAdjustablePrice(e): void {
    const scheduleLength: number = this.isSameGradedSaleOffer ?
      this.finishDelivSchPeriodsGraded.length :
      this.finishDelivSchPeriods.length;

    if (
      e.value &&
      scheduleLength === 0 &&
      this.isCanSchedule()
    ) {
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
            deliveryType: this.deliveryPeriod.idDeliveryType.toString(),
            deliveryPeriodInDays:
              this.deliveryPeriod.idDeliveryType == 3
                ? this.deliveryPeriod?.dateEnd
                  ? (this.deliveryPeriod?.dateEnd - 25569) * 24 * 3600 * 1000
                  : null
                : this.deliveryPeriod.periodTypeValue,
            deliveryStartDate: this.deliveryPeriod?.dateBegin
              ? (this.deliveryPeriod?.dateBegin - 25569) * 24 * 3600 * 1000
              : null,
            concatedStringDeliveryTerm: this.generalInfo.concatedDeliveryPeriod,
          };
      this.tradingService.editDeliveryParams(body);
      this.onRedFlag.emit();
    }
    if (!e.value) {
      if (scheduleLength > 0 && this.isCanSchedule()) {
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
    this.finishDelivSchPeriodsGraded = [];
    if (this.isCanSchedule() && this.adjustablePrice) {
      this.onHideRedFlag.emit();
    }
  }

  onCancelSchedule() {
    if (this.isPopupClear) {
      this.isEditedDeliveryTerm = false;

      this.deliveryTermForm.controls.startDelivery.patchValue(
        this.deliveryPeriodOriginal.idDeliveryMoment?.toString()
      );
      this.deliveryTermForm.controls.deliveryType.patchValue(
        this.deliveryPeriodOriginal.idDeliveryType.toString()
      );
      this.deliveryTermForm.controls.deliveryTerm.patchValue(
        this.deliveryPeriodOriginal.periodTypeValue
      );
      let dateBegin: any = this.deliveryPeriod?.dateBegin
        ? (this.deliveryPeriodOriginal?.dateBegin - 25569) * 24 * 3600 * 1000
        : null;
      let dateEnd: any = this.deliveryPeriod?.dateEnd
        ? (this.deliveryPeriodOriginal?.dateEnd - 25569) * 24 * 3600 * 1000
        : null;
      this.deliveryTermForm.controls.startDate.patchValue(dateBegin);
      this.deliveryTermForm.controls.endDate.patchValue(dateEnd);
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
    const {dateBegin, dateEnd, idDeliveryType, periodTypeValue} = this.deliveryPeriod || {};

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
        this.deliveryTermForm.controls.startDelivery.value
      );
      this.deliveryPeriod.idDeliveryType = Number(
        this.deliveryTermForm.controls.deliveryType.value
      );
      this.deliveryPeriod.periodTypeValue =
        Number(this.deliveryTermForm.controls.deliveryTerm?.value) || null;
      this.deliveryPeriod.dateBegin = this.deliveryTermForm.controls.startDate
        ?.value
        ? toOADate(this.deliveryTermForm.controls.startDate?.value)
        : null;
      this.deliveryPeriod.dateEnd = this.deliveryTermForm.controls.endDate
        ?.value
        ? toOADate(this.deliveryTermForm.controls.endDate?.value)
        : null;
      this.generalInfo.concatedDeliveryPeriod = this.deliveryTermConcated;
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
      _deliveryTermType = 1; // на вход пришел период в днях (ничего делать не будем - вренем обратно)
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
      let date: any = this.convertDate(this.paymentCond?.firstPeriodValueDate);
      // (this.paymentCond?.firstPeriodValueDate - 25569) * 24 * 3600 * 1000
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
        let date: any = this.convertDate(
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
      form['defermentPeriodNumber'].setValue(30);
      form['momentDelay2'].setValue(this.momentDelayValues[0].id);
      form['defermentPeriod2'].setValue(60);
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

  private convertDate(date): any {
    return date ? convertExcelSerialDateToMs(date) : null;
  }

  //проверка на добавление 2 этапа при Момент предоплаты = «до выдачи лесорубочного билета»
  conditionSecondStage(): boolean {
    return (
      Number(this.termsPaymentForm.controls['termsPayment']?.value) ==
        termsConditionsPaymentConst.partialPrepayment &&
      Number(this.termsPaymentForm.controls['momentPrepayment']?.value) ==
        timberTicket &&
      100 - Number(this.termsPaymentForm.controls['prepaymentAmount']?.value) >
        40 &&
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
        Number(this.termsPaymentForm.controls.termsPayment?.value) ==
          termsConditionsPaymentConst.partialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }

  /*
  changeDayType(e) {
    this.termsPaymentForm.controls['dayTypeId'].setValue(e.value);
  }
*/

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
      startDelivery = this.deliveryTermForm.controls.startDelivery.value;
      deliveryType = this.deliveryTermForm.controls.deliveryType.value;
      deliveryTerm = this.deliveryTermForm.controls.deliveryTerm?.value || 0;
      startDate = this.deliveryTermForm.controls.startDate?.value
        ? toOADate(this.deliveryTermForm.controls.startDate?.value)
        : null;
      endDate = this.deliveryTermForm.controls.endDate?.value
        ? toOADate(this.deliveryTermForm.controls.endDate?.value)
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
            (el) => el.id == Number(value.value)
          ).name;
          this.changeCurrency(findField, good, currencyValue);
          break;
        }
        case IdInterfaceField.VATrate: {
          findField.fieldValue = this.VatIntersections.find(
            (el) => el.id == Number(value.value)
          ).name;
          break;
        }
        case IdInterfaceField.financeSource: {
          findField.fieldValue = this.financeSourceIntersections.find(
            (el) => el.id == Number(value.value)
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
      this.getTotalCost();
    }
    this.isDisabledSaveButton = false;
  }

  minFieldValue(data: IEditOfferGoodsSpecifications, idGood: number): number {
    return this.editRuleInIntersections(data.idInterfaceField) ==
    editingRules.increaseValue
      ? this.getGoodsSpecifications(
        this.getOriginalGood(idGood)?.goodsSpecifications,
        data.idInterfaceField
      )?.fieldValueNumber
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

  minPriceCondition(data: IEditOfferGoodsSpecifications): boolean {
    return (
      this.getGoodsSpecifications(
        this.goods[0].goodsSpecifications,
        IdInterfaceField.minPrice
      ) &&
      this.sessionIds.session.idAuctionType ===
        auctionType.simpleBuyerAuction &&
      this.generalInfo.directionId === IdDirection.buy
    );
  }

  minPriceComparison = (idGood: number) => {
    return (
      this.goodForm.get(
        idGood.toString() + '_' + IdInterfaceField.minPrice.toString()
      )?.value || 0
    );
  };

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

  getOriginalGood(idGood) {
    return this.goodsOriginal.find((el) => el.idGood == idGood);
  }

  public editRuleInIntersections(id: number): number {
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField == id)
        ?.idEditRule || null
    );
  }

  public checkQuantityNotZero(): boolean {
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField === IdInterfaceField.quantity)
        ?.isCheckQuantityNotZero || false
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

  getTotalCost() {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0,
      volumeTotal = 0;
    let vat : number = getVatNumber(this.VatField);
    if (this.generalInfo.pricingTypeId != pricingType.formulaWithoutQuotation) {
      this.goods.forEach((good) => {
        let count = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField == 1)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField == 3)
            .fieldValueNumber
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
        volumeTotal = volumeTotal + count;
        //  }
      });

      this.totalForm.controls.quantity.patchValue(
        Number(volumeTotal).toLocaleString('ru', {
          maximumFractionDigits: this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 1
          ).fieldPrecision,
        }) +
          ' ' +
          this.goods[0].unitName
      );
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

  calculate(idGood, idField) {
    let vat: number = getVatNumber(this.VatField),
      volumeTotal = 0,
      costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;

    let good = this.goods.find((el) => el.idGood == idGood);

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

    this.goods.forEach((good) => {
      good.goodsSpecifications.forEach((item) => {
        if (item.idInterfaceField == 1) {
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

    this.totalForm.controls.quantity.patchValue(
      Number(volumeTotal).toLocaleString('ru', {
        maximumFractionDigits: this.goods[0].goodsSpecifications.find(
          (field) => field.idInterfaceField == 1
        ).fieldPrecision,
      }) +
        ' ' +
        this.goods[0].unitName
    );
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

    if (idField === IdInterfaceField.quantity) {
      //количество
      this.tradingService.editVolume({ goods: this.goods, str: 'edit' });
      this.isShowNotific = true;
    } else {
      // цена
      this.tradingService.editMainBasisInfo({ goods: this.goods, str: 'edit' });
    }
    this.goodFormValidationGroup?.instance.validate();
    this.isDisabledSaveButton = false;
  }

  zeroComparison = () => 0;

  get onSameUnits(): boolean {
    return checkSameUnits(this.goods);
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
      //если поле введено вручную - заполняем для него только fieldValueString, иначе и fieldValueString и fieldValueNumber
      fieldValue = this.productLocationValue;
      if (this.isFreeInput) {
        fieldValueNumber = null;
      } else {
        fieldValueNumber = this.productLocationId;
      }
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
    this.productLocationId = null;
    this.isFreeInput = false;
  }

  formGoodsFinishArray(item, endProperties, goodArray, isRemains?) {
    item.goodsSpecifications.forEach((field) => {
      if (
        !field.isVirtual &&
        field.idInterfaceField &&
        (field.fieldValueNumber || field.fieldValue)
      ) {
        if (isRemains && field.idInterfaceField === IdInterfaceField.adjustedPrice) {
          field.fieldValue = 'false';
        } else if (!isRemains && field.idInterfaceField === IdInterfaceField.adjustedPrice) {
          field.fieldValue = this.adjustablePrice;
        }
        //при записи в остаточный массив если поле количество - то от количества которое пришло отнимаем текущее количество
        endProperties.push({
          idInterfaceField: field.idInterfaceField,
          fieldValueNumber: !field.fieldValueArray
            ? (field.controlFieldType == 'dxSelectBox' &&
                field.idInterfaceField !== IdInterfaceField.productLocation) ||
                (field.controlFieldType == 'dxSelectBox' &&
                field.idInterfaceField === IdInterfaceField.productLocation && !this.isFreeInput) ||
              field.controlFieldType == 'dxNumberBox'
              ? isRemains && field.idInterfaceField === IdInterfaceField.quantity
                ? this.getGoodsSpecifications(
                    this.getOriginalGood(item.idGood).goodsSpecifications,
                    1
                  ).fieldValueNumber - field.fieldValueNumber
                : field.fieldValueNumber
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
      ...(this.generalInfo?.directionId == IdDirection.buy && {
        minPriceWithoutVat: this.getValueNumber(
          item.goodsSpecifications,
          IdInterfaceField.minPrice
        ),
        locationService: this.getValueNumber(
          item.goodsSpecifications,
          IdInterfaceField.placeOfWork
        ),
      }),
    });
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

  public isFreeInput: boolean = false;
  public productLocationId: number;

  public resultEditLocation(event: { id: number, value: string | number, freeInput: boolean }): void {
    if (event) {
      this.productLocationId = event.id;
      this.productLocationValue = event.value;
      this.isFreeInput = event.freeInput;
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

  public prepareFinishDeliveryScopes(goodCurrent: OfferGood[], goodRemains: OfferGood[]): void {
    if (this.isSameGradedSaleOffer) {
      this.prepareGradedFinishScopes(goodCurrent, goodRemains);
    } else {
      this.prepareOrdinaryFinishScopes(goodCurrent, goodRemains);
    }
  }

  private prepareOrdinaryFinishScopes(goodCurrent: OfferGood[], goodRemains: OfferGood[]): void {
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

  private prepareGradedFinishScopes(goodCurrent: OfferGood[], goodRemains: OfferGood[]): void {
    if (this.uniqueDeliveryScopes?.length === 1) {
      this.buildSingleGradedFinishVolumes(goodCurrent, goodRemains);
    } else {
      if (this.deliveryScopeGraded?.length > 0) {
        const { finish, remain } = this.splitGradedScopesIntoFinishAndRemain(
          this.deliveryScopeGraded
        );
        this.finishDeliveryScopesGraded = finish;
        this.finishDeliveryScopesRemainGraded = remain;
      }
    }
  }

  private buildSingleScopeFinishVolumes(goodCurrent: OfferGood[], goodRemains: OfferGood[]): void {
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

  private buildSingleGradedFinishVolumes(goodCurrent: OfferGood[], goodRemains: OfferGood[]): void {
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
      const originalVolume: number = this.getOriginalGradedScopeVolume(scopeInfo.idFirmClient);
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

  public getRangeForGood(): Observable<boolean> {
    /* todo доработать в рамках товаров-аналогов*/
    const requests = this.goods.map((good: IEditOfferGood) => {
      return this.submissionService
        .getPriceLimitCorridor(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.generalInfo.idModel,
          this.generalInfo.directionId,
          good.idGood,
          this.getGoodsSpecifications(
            good.goodsSpecifications,
            IdInterfaceField.currency
          ).fieldValueNumber,
          getVatNumber(this.VatField, true),
          good.unitId,
          this.getGoodsSpecifications(
            good.goodsSpecifications,
            IdInterfaceField.quantity
          ).fieldValueNumber,
          this.editTermPayment
            ? this.termsPaymentForm.controls.termsPayment?.value
            : this.paymentCond.idPaymentType,

          this.deliveryBasisCommon[0].idBasisValue,
          this.deliveryBasisCommon[0]?.idPlaceLink || null,
          null
        )
        .pipe(
          map((res) => {
            const minPrice = res.leftBound,
              maxPrice = res.rightBound,
              price = this.getGoodsSpecifications(
                good.goodsSpecifications,
                IdInterfaceField.priceWithoutVAT
              ).fieldValueNumber;
            if (
              (minPrice && price < minPrice) ||
              (maxPrice && price > maxPrice)
            ) {
              good.minPrice = minPrice; //нижняя граница коридора
              good.maxPrice = maxPrice; //верхняя граница коридора
              good.range = true;
              return true;
            } else {
              good.range = false;
            }
            return false;
          })
        );
    });
    return forkJoin(requests).pipe(
      map((results) => results.some((result) => result === true))
    );
  }

  public getQuotationForGood(): Observable<boolean> {
    /* todo доработать в рамках товаров-аналогов*/
    const requests = this.goods.map((good: IEditOfferGood) => {
      return this.submissionService
        .getPriceLimitQuotation(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.generalInfo.idModel,
          this.generalInfo.directionId,
          good.idGood,
          this.getGoodsSpecifications(
            good.goodsSpecifications,
            IdInterfaceField.currency
          ).fieldValueNumber,
          getVatNumber(this.VatField, true),
          good.unitId,
          this.getGoodsSpecifications(
            good.goodsSpecifications,
            IdInterfaceField.quantity
          ).fieldValueNumber,
          this.editTermPayment
            ? this.termsPaymentForm.controls.termsPayment?.value
            : this.paymentCond.idPaymentType,

          this.deliveryBasisCommon[0].idBasisValue,
          this.deliveryBasisCommon[0]?.idPlaceLink || null,
          null
        )
        .pipe(
          map((res) => {
            const quotation = res.priceWithoutVat,
              price = this.getGoodsSpecifications(
                good.goodsSpecifications,
                IdInterfaceField.priceWithoutVAT
              ).fieldValueNumber;
            if (quotation && price != quotation) {
              good.maxPrice = quotation; //верхняя граница коридора
              good.error = true;
              return true;
            } else {
              good.error = false;
            }
            return false;
          })
        );
    });
    return forkJoin(requests).pipe(
      map((results) => results.some((result) => result === true))
    );
  }

  public onSave(): void {
    let error = false, errorMessage: string;

    if (this.editTermPayment)
      if (!this.validationGroup?.instance.validate().isValid) {
        //валидация срока оплаты
        return;
      }

    if (this.editTermCondition)
      if (!this.deliveryTermValidationGroup?.instance.validate().isValid) {
        //валидация условий поставки
        return;
      }

    if (this.deadlineErrorMess?.length > 0) {
      //контрольные сроки поставки и оплаты
      const errors = {
        error: true,
        errorStatus: 0,
        messageError: this.deadlineErrorMess,
      };

      this.errorServiceService.callErrorPopup(errors);
      return;
    }

    if (!this.goodFormValidationGroup?.instance.validate().isValid) return;

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
      if (this.sessionIds.idSessionPeriod !== IdSessionPeriods.pretrading) {
        this.finalSave();
        return;
      }

      this.checkPriceValidations();
    }
  }

  private checkPriceValidations(): void {
    if (this.isActiveCorridor) {
      this.getRangeForGood().subscribe((hasError) => {
        if (hasError) {
          const errors = {
            error: true,
            errorStatus: 0,
            messageError:
              this.translate.store.currentLang == 'RU'
                ? RU['editOffer'].deliveryConditions.warningPriceRange
                : EN['editOffer'].deliveryConditions.warningPriceRange,
          };
          this.errorServiceService.callErrorPopup(errors);
          return;
        } else {
          this.finalSave();
        }
      });
    } else if (this.isActiveQuotation) {
      this.getQuotationForGood().subscribe((hasError) => {
        if (hasError) {
          const errors = {
            error: true,
            errorStatus: 0,
            messageError:
              this.translate.store.currentLang == 'RU'
                ? RU['editOffer'].deliveryConditions.priceQuoteError2
                : EN['editOffer'].deliveryConditions.priceQuoteError2,
          };
          this.errorServiceService.callErrorPopup(errors);
          return;
        } else {
          this.finalSave();
        }
      });
    } else {
      this.finalSave();
    }
  }

  private finalSave(): void {
    let remainsOffer,
      goodCurrent = [],
      goodRemains = [];
    this.goods.forEach((item) => {
      let endPropertiesCurrentOffer = [],
        endPropertiesRemainsOffer = [];
      //сравниваем текущий объем с первоначальным объемом, если объем в каком-либо товаре изменился, то на разницу этого объема отделяется новая заявка
      if (
        this.getGoodsSpecifications(item.goodsSpecifications, 1)
          .fieldValueNumber == 0
      ) {
        this.formGoodsFinishArray(
          item,
          endPropertiesRemainsOffer,
          goodRemains,
          true
        );
      } else if (
        this.getGoodsSpecifications(item.goodsSpecifications, 1)
          .fieldValueNumber ==
        this.getGoodsSpecifications(
          this.getOriginalGood(item.idGood).goodsSpecifications,
          1
        ).fieldValueNumber
      ) {
        this.formGoodsFinishArray(item, endPropertiesCurrentOffer, goodCurrent);
      } else {
        this.formGoodsFinishArray(item, endPropertiesCurrentOffer, goodCurrent);
        this.formGoodsFinishArray(
          item,
          endPropertiesRemainsOffer,
          goodRemains,
          true
        );
      }
    });
    this.onCreateFinishBasis(); //Для проверки, если один товар занулили
    this.prepareFinishDeliveryScopes(goodCurrent, goodRemains);
    let payCondFull, paymentPart, deliveryPeriod;

    let objForReq = {}; //объект для записи в боди
    this.goods.forEach((item) => {
      let endKeys = [];
      let endValues = [];
      let objectForValues = {}; //объект заполненных полей 1 товара

      item.goodsSpecifications.forEach((field: any) => {
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

      if (this.goods[0] == item) {
        objectForValues['termsConditionsPayment'] = {
          paymentConditionId: this.editTermPayment
            ? this.termsPaymentForm.controls.termsPayment?.value
            : this.paymentCond.idPaymentType,
          paymentVolumeId: this.editTermPayment
            ? this.termsPaymentForm.controls.volume?.value
            : this.paymentCond.idShipmentVolume,
          prepayMomentId: this.editTermPayment
            ? this.termsPaymentForm.controls.momentPrepayment?.value || null
            : (this.paymentCond.idPaymentType !=
              termsConditionsPaymentConst.paymentDeferment
                ? this.paymentCond.firstPaymentMomentId
                : null) || null,
          delayMomentId: this.editTermPayment
            ? this.termsPaymentForm.controls.momentDelay?.value || null
            : this.paymentCond.idPaymentType ==
              termsConditionsPaymentConst.partialPrepayment
            ? this.paymentCond.secondPaymentMomentId
            : this.paymentCond.idPaymentType ==
              termsConditionsPaymentConst.paymentDeferment
            ? this.paymentCond.firstPaymentMomentId
            : null,
          dayTypeId: this.editTermPayment
            ? this.termsPaymentForm.controls.dayTypeId?.value || null
            : this.paymentCond.idDayType || null,
          delayValue: this.editTermPayment
            ? this.termsPaymentForm.controls.defermentAmount?.value || 0
            : this.paymentCond.idPaymentType ==
              termsConditionsPaymentConst.paymentDeferment
            ? this.paymentCond.firstPercent || 0
            : this.paymentCond.idPaymentType ==
              termsConditionsPaymentConst.partialPrepayment
            ? this.paymentCond.secondPercent || 0
            : 0,
          delayValue2: this.editTermPayment
            ? this.termsPaymentForm.controls.defermentAmount2?.value || null
            : 100 - this.paymentCond?.firstPercent ||
              0 - this.paymentCond.secondPercent ||
              0 ||
              null,
          prepayValue: this.editTermPayment
            ? this.termsPaymentForm.controls.prepaymentAmount?.value || 0
            : this.paymentCond.idPaymentType !=
              termsConditionsPaymentConst.paymentDeferment
            ? this.paymentCond.firstPercent || 0
            : 0,

          delayTerm: {
            applicableDayCount: this.editTermPayment
              ? this.momentPrepayment?.options.applicableDayCount
                ? this.termsPaymentForm.controls.defermentPeriodNumber?.value
                : null
              : this.paymentCond.idDayType
              ? this.termsPaymentForm.controls.termsPayment?.value ==
                termsConditionsPaymentConst.partialPrepayment
                ? this.paymentCond.secondPeriodValueNumber
                : this.termsPaymentForm.controls.termsPayment?.value ==
                  termsConditionsPaymentConst.paymentDeferment
                ? this.paymentCond.firstPeriodValueNumber
                : null
              : null,
            calendarDayCount2: this.editTermPayment
              ? this.termsPaymentForm.controls.defermentPeriod2?.value || null
              : this.paymentCond.thirdPeriodValueNumber,
            dayOfMonth: this.editTermPayment
              ? this.momentPrepayment?.options.dayOfMonth
                ? this.termsPaymentForm.controls.defermentPeriodNumber?.value
                : null
              : !this.paymentCond.idDayType
              ? this.termsPaymentForm.controls.termsPayment?.value ==
                termsConditionsPaymentConst.partialPrepayment
                ? this.paymentCond.secondPeriodValueNumber
                : this.termsPaymentForm.controls.termsPayment?.value ==
                  termsConditionsPaymentConst.paymentDeferment
                ? this.paymentCond.firstPeriodValueNumber
                : null
              : null,
            date: this.editTermPayment
              ? this.momentPrepayment?.options.date
                ? this.termsPaymentForm.controls.defermentPeriodDate?.value
                : null
              : this.paymentCond.firstPeriodValueDate || null,
          },
          prepayTerm: {
            applicableDayCount: this.editTermPayment
              ? this.momentPrepayment?.options.applicableDayCount
                ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value
                : null
              : this.paymentCond.idDayType
              ? this.paymentCond.firstPeriodValueNumber
              : null,
            dayOfMonth: this.editTermPayment
              ? this.momentPrepayment?.options.dayOfMonth
                ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value
                : null
              : !this.paymentCond.idDayType
              ? this.paymentCond.firstPeriodValueNumber
              : null,
            date: this.editTermPayment
              ? this.momentPrepayment?.options.date
                ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                : null
              : this.paymentCond.firstPeriodValueDate,
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
          let periods = [];

          const schedule: ScheduleData[] = this.isSameGradedSaleOffer ? this.finishDelivSchPeriodsGraded : this.finishDelivSchPeriods;

          if (!this.isSameGradedSaleOffer) {
            schedule.forEach((item) => {
              for (let i = 0; i < item.goods.length; i++) {
                periods.push({
                  number: item.numberPeriod,
                  startDate: item.startDate,
                  endDate: item.endDate,
                  volume: item.goods[i].volume,
                  unit: this.goods.find(
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
                unit: this.goods[0].unitName,
              };
            });
          }

          objectForValues['deliverySchedule'] = Object.assign(
            {
              periodType: {
                id: schedule[0]?.idPeriod,
                name: '',
              },
            },
            { periods: periods }
          );
        }
      }

      let endObject = {}; //объект с индексом товара

      endObject[this.goods.indexOf(item)] = objectForValues;
      objForReq = Object.assign(endObject, objForReq);
    });

    let rules = {
      model: this.dataForModel,
      modelId: this.generalInfo.idModel,
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
        directionId: this.generalInfo.directionId,
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
              idPaymentType: this.termsPaymentForm.controls.termsPayment?.value,
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
                      this.termsPaymentForm.controls.defermentPeriodDate?.value
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
                  ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value
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
        this.paymentCond.idPaymentType !=
        termsConditionsPaymentConst.partialPrepayment
          ? {
              idPaymentType: this.paymentCond.idPaymentType,
              idDayType: this.paymentCond.idDayType || null,
              idShipmentVolume: this.paymentCond.idShipmentVolume,
              idPaymentMoment: this.paymentCond.firstPaymentMomentId,
              periodValueNumber: this.paymentCond.firstPeriodValueNumber,
              periodValueDate: this.paymentCond.firstPeriodValueDate,
            }
          : null;
      paymentPart =
        this.paymentCond.idPaymentType ==
        termsConditionsPaymentConst.partialPrepayment
          ? {
              idDayType: this.paymentCond.idDayType || null,
              idShipmentVolume: this.paymentCond.idShipmentVolume,
              idPaymentMomentPrepay: this.paymentCond.firstPaymentMomentId,
              firstPercent: this.paymentCond.firstPercent,
              firstPeriodValueNumber:
                this.paymentCond.firstPaymentMomentId != 7
                  ? this.paymentCond.firstPeriodValueNumber
                  : null,
              idPaymentMomentDelay: this.paymentCond.secondPaymentMomentId,
              secondPercent: this.paymentCond.secondPercent,
              secondPeriodValueNumber:
                this.paymentCond.secondPeriodValueNumber || null,
              thirdPeriodValueNumber:
                this.paymentCond.firstPaymentMomentId == 7 &&
                this.paymentCond.firstPercent < 60
                  ? this.paymentCond.thirdPeriodValueNumber
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
        idDeliveryMoment: this.deliveryPeriod.idDeliveryMoment,
        idPeriodType: this.deliveryPeriod.idDeliveryType,
        periodTypeValue: this.deliveryPeriod.periodTypeValue,
        dateBegin: this.deliveryPeriod.dateBegin,
        dateEnd: this.deliveryPeriod.dateEnd,
      };
    }

    if (goodRemains.length > 0) {
      //выделяем остаточную заявку
      remainsOffer = {
        idDirection: this.generalInfo.directionId,
        idSection: Number(this.sessionIds.sectionId),
        setDemandOffer: {
          idDemandOffer: this.generalInfo.idDemandOffer,
          idSession: Number(this.sessionIds.sessionId),
          idModel: this.generalInfo.idModel,
          idFirmClient:
            this.generalInfo.idClientContractType == 21
              ? this.generalInfo.clientId
              : null,
          idClientContractType: this.generalInfo.idClientContractType,
          idBranch: this.generalInfo.branchId,
          idCurrency: this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          )?.fieldValueNumber,
          vatPercent: getVatNumber(this.VatField, true),
          idPriceAdjustment: this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 53
          )?.fieldValueNumber,
          isPriceAdjusted: false, //всегда false в остаточной
          idFinance: this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 11
          )?.fieldValueNumber,
          detailsImportDomestic: this.generalInfo.detailsImportDomestic,
          detailsExportForeign: this.generalInfo.detailsExportForeign,
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
          this.getGoodsSpecifications(this.goods[0].goodsSpecifications, 55)
            ?.fieldValueNumber || 0,
        rules: rules,
      };
    } else remainsOffer = null;

    const body = {
      [this.sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
        ? 'currentDemand'
        : 'currentOffer']: {
        idDirection: this.generalInfo.directionId,
        idSection: Number(this.sessionIds.sectionId),
        setDemandOffer: {
          idDemandOffer: this.generalInfo.idDemandOffer,
          idSession: Number(this.sessionIds.sessionId),
          idModel: this.generalInfo.idModel,
          idFirmClient:
            this.generalInfo.idClientContractType == 21
              ? this.generalInfo.clientId
              : null,
          idClientContractType: this.generalInfo.idClientContractType,
          idBranch: this.generalInfo.branchId,
          idCurrency: this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          )?.fieldValueNumber,
          vatPercent: getVatNumber(this.VatField, true),
          idPriceAdjustment:
            this.goods[0].goodsSpecifications.find(
              (field) => field.idInterfaceField == 53
            )?.fieldValueNumber || null,
          isPriceAdjusted: this.adjustablePrice
            ? this.adjustablePrice.toString().toLowerCase()
            : this.adjustablePrice,
          idFinance: this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 11
          )?.fieldValueNumber,
          detailsImportDomestic: this.generalInfo.detailsImportDomestic,
          detailsExportForeign: this.generalInfo.detailsExportForeign,
          listDeletedDocuments: [], //сказали что не удаляем
          idDeliveryScheduleType: this.generalInfo.idDeliveryScheduleType || null,
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
          this.getGoodsSpecifications(this.goods[0].goodsSpecifications, 55)
            ?.fieldValueNumber || 0,
        rules: rules,
      },
      [this.sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
        ? 'remainsDemand'
        : 'remainsOffer']: remainsOffer,
    };

    saveWithPending(
      this.demandService.editOffer(this.user?.token, body),
      (pending: boolean) => this.setSaveRequestPending(pending),
      {
        next: (res: EditOfferDemandResponse) => {
          this.finishEdit(res);
        },
      });
  }

  private setSaveRequestPending(pending: boolean): void {
    this.isSaveRequestPending = pending;
    this.saveRequestPendingChange.emit(pending);
  }

  public finishEdit(res): void {
    this.isDisabledSaveButton = false;
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
    this.onClose.emit(true);
  }
}
