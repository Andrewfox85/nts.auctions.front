import { SECTIONS_TYPES } from './../../../../features/header/enums/index';
import {
  IEditOfferGoodsSpecifications,
  IEditOfferGood,
} from '../../../../shared/interfaces/index';
import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  ViewChild,
  Output,
  EventEmitter,
  inject,
  input,
  effect,
  WritableSignal,
  signal,
  DestroyRef,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  Validators,
} from '@angular/forms';
import {
  pricingType,
  role,
  minDeliveryScheduleDaysCount,
  termsConditionsPaymentConst,
  searchIcon,
  editingRules,
  AgreementType,
  ACTUAL_SIZE_READINESS_FIELDS,
  ACTUAL_SIZE_FIELDS,
  CurrentTab,
  SPECIAL_FIELDS_AGRI,
  PRODUCT_LEVELS_IN_BLOCK,
  IdSessionPeriods
} from '@constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { User } from '@classes';
import {
  CommonService,
  TradingService,
  ToastService,
  CurrencyService,
  BidService,
  SubmissionService,
  DemandService,
  CounterService,
  SubmitCounterService,
  IAnalogGood
} from '@services';
import { combineLatest, Observable, Subscription, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  DxDataGridComponent,
  DxValidationGroupComponent,
  DxValidatorComponent,
  DxTreeViewComponent,
} from 'devextreme-angular';
import TreeView from 'devextreme/ui/tree_view';
import { CommonModule } from '@angular/common';
import {
  getNumber,
  toOADate,
  round,
  getTranslateResultByCurrentLang,
  checkSameUnits,
  getVatNumber,
  upperCaseFirstLetter,
  groupByConcatedCondition
} from '@helpers';
import {
  UpperCaseFirstLetterPipe,
  ToNumberPipe,
  RuNumberFormatPipe,
} from '@pipes';
import { LocalStorageService } from '@shared-services';
import {
  DxScrollViewModule,
  DxValidationGroupModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxTooltipModule,
  DxButtonModule,
  DxTextBoxModule,
  DxDropDownBoxModule,
  DxTreeViewModule,
  DxNumberBoxModule,
  DxCheckBoxModule,
  DxPopupModule,
} from 'devextreme-angular';
import { HomePageStore } from '../../../../views/homepage/store/homepage-store';
import { AUCTION_TYPE } from '../../../../shared/enums';
import { AnalogGoodFormComponent } from './components/analog-good-form/analog-good-form.component';
import { AddingSimilarProductPopupComponent } from './components/popups/adding-similar-product-popup/adding-similar-product-popup.component';
import { GOOD_REF_ID, NO_VAT_RATE, VALUE_WITHOUT_VAT_ID, DEFAULT_VAT_RATE } from './constants';
import { IdInterfaceField, FULL_PERCENT } from '@constants';
import { GlobalStore } from '@store';
import { IGoodsSpecifications, IDutchDownSubmiting } from '@interfaces';
import { SortActualDimensionsPipe } from '../../../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe';
import { convertExcelSerialDateToMs } from '../../../../views/homepage/helpers';
import {
  ID_DELIVERY_TYPE,
  ID_DELIVERY_MOMENT,
} from './../../../../shared/enums/index';
import { MessagePopupComponent } from './../../../../components/popups/message-popup/message-popup.component';
import { IMainBasis } from '../../../../components/submitting-counter-offer/interfaces';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { GoodAnalog, ICloseEvent, IAddNsiEvent } from './interfaces/index';
import { DisplaySpecsDirective } from './../../../../shared/directives/display-specs-in-good-grid.directive';
import { NsiGoodPopupComponent } from './components/popups/nsi-good-popup/nsi-good-popup.component';
import { ShowGoodsFieldsPipe } from "../../../../shared/pipes/showGoodsFields/show-goods-fields-pipe";
import { GoodsValuePipe } from "../../../../shared/pipes/showFieldsValue/goods-value-pipe";
import { ActualValuePipe } from "../../../../shared/pipes/showFieldsValue/actual-value-pipe";
import { ValueChangedEvent as TextBoxValueChangedEvent } from "devextreme/ui/text_box";
import { EditDemandOfferServiceService } from "../../../../services/edit-demand-offer-service.service";
import { DisableNumberBoxWheel } from "../../../../shared/directives/disable-number-box-wheel";
import { PaymentConditionEditComponent } from './../../../../features/trading/components/payment-condition-edit/payment-condition-edit.component';
import { IDeadlineParamsReset, IOutputEvent, ITermsPaymentForm } from './../../../../features/trading/components/payment-condition-edit/interfaces/index';
import { DeliveryPeriodEditComponent } from './../../../../features/trading/components/delivery-period-edit/delivery-period-edit.component';
import { IOutputDeliveryPeriodEvent, IDeliveryPeriodForm, IAdjustablePriceOutput } from './../../../../features/trading/components/delivery-period-edit/interfaces/index';
import { OffersAdditionalInfoComponent } from '../../../../features/trading/components/offers-additional-info/offers-additional-info.component';

export interface RefBook {
  id: string;
  name: string;
  description: string | null;
}

export enum SelectedGoodsType {
  Goods = 'goods',
  AnalogGood = 'analogGood',
}

@Component({
  selector: 'app-submitting-counter-demand',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DxScrollViewModule,
    DxValidationGroupModule,
    DxSelectBoxModule,
    DxValidatorModule,
    DxTooltipModule,
    DxButtonModule,
    DxTextBoxModule,
    DxDropDownBoxModule,
    DxTreeViewModule,
    DxNumberBoxModule,
    DxCheckBoxModule,
    DxPopupModule,
    FormsModule,
    ReactiveFormsModule,
    UpperCaseFirstLetterPipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    AddingSimilarProductPopupComponent,
    AnalogGoodFormComponent,
    SortActualDimensionsPipe,
    MessagePopupComponent,
    DisplaySpecsDirective,
    OffersAdditionalInfoComponent,
    ShowGoodsFieldsPipe,
    GoodsValuePipe,
    ActualValuePipe,
    DisableNumberBoxWheel,
    PaymentConditionEditComponent,
    DeliveryPeriodEditComponent,
    NsiGoodPopupComponent
  ],
  templateUrl: './submitting-counter-demand.component.html',
  styleUrls: ['./submitting-counter-demand.component.scss'],
})
export class SubmittingCounterDemandComponent implements OnInit {
  public readonly idDemandOffer = input.required<number>();

  public readonly isAllowAnalog = input<boolean>();

  private readonly currencyService = inject(CurrencyService);
  private readonly bidService = inject(BidService);
  private readonly submissionService = inject(SubmissionService);
  private readonly demandService = inject(DemandService);
  public readonly commonService = inject(CommonService);

  private readonly formBuilder = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly tradingService = inject(TradingService);
  private readonly untypedFormBuilder = inject(UntypedFormBuilder);
  private readonly homePageStore = inject(HomePageStore);
  private readonly toastService = inject(ToastService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly counterService = inject(CounterService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly globalStore = inject(GlobalStore);
  private readonly submitCounterService = inject(SubmitCounterService);
  private readonly editDemandOfferServiceService = inject(
    EditDemandOfferServiceService
  );

  public readonly currencyIntersections = input.required<RefBook[]>();
  public readonly vatIntersections = input.required<RefBook[]>();
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;

  @Input({ required: true }) fullInfo;
  @Input({ required: true }) fullInfoCopy;
  @Input({ required: true }) deliveryTerm;
  @Input({ required: true }) termsConditionsPayment;
  @Input({ required: true }) sessionIds;
  @Input({ required: true }) idOffer;
  @Input({ required: true }) deliveryConditions;
  @Input({ required: true }) goodsOriginal;
  @Input({ required: true }) editRulesIntersections;
  @Input({ required: true }) editRulesForSession;
  @Input({ required: true }) dataForModel;

  @Output() onClose = new EventEmitter();

  @ViewChild('endValidator', { static: false })
  public endValidator: DxValidatorComponent;
  @ViewChild(DxTreeViewComponent, { static: false })
  public treeView: DxTreeViewComponent;
  @ViewChild('dataGoodTable', { static: false })
  public dataGridGood: DxDataGridComponent;
  @ViewChild('goodFormValid', { static: false })
  goodFormValidationGroup: DxValidationGroupComponent;

  public messagePopup: boolean;
  public messageString: string;

  public setFocus(e): void {
    setTimeout(() => {
      e.component.focus();
    });
  }

  public openSimilarProducts: boolean = false;
  public addNsiGood: boolean = false;

  public readonly idAuctionType = this.homePageStore.idAuctionType();
  public readonly AUCTION_TYPE = AUCTION_TYPE;
  public readonly IdInterfaceField = IdInterfaceField;

  public readonly totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  public readonly dutchDownAuctionForm = this.untypedFormBuilder.group({
    idCurrency: new FormControl(null, [Validators.required]),
    vatPercent: new FormControl(null, [Validators.required]),
  });

  private get userToken(): string {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw).token : '';
  }

  private get vatPercentControl(): Observable<number> {
    return this.dutchDownAuctionForm.get('vatPercent')!.valueChanges;
  }

  private get costWithoutVatControl(): Observable<number> {
    return this.totalForm.get('costWithoutVat')!.valueChanges;
  }

  private readonly _displayCurrency = signal<RefBook[]>([]);
  public readonly displayCurrency = this._displayCurrency.asReadonly();

  private readonly _amountVat = signal<RefBook[]>([]);
  public readonly amountVat = this._amountVat.asReadonly();

  public readonly amountVATCounter = toSignal(
    combineLatest([this.vatPercentControl, this.costWithoutVatControl]).pipe(
      startWith([]),
      map(([vatPercentId, costWithoutVat]) => {
        return this.processSumVat(vatPercentId, costWithoutVat);
      })
    )
  );

  public subscription: Subscription;
  public role = role;

  public infoForm = this.formBuilder.group({
    participant: [],
    contractType: [],
    brokerClient: [null],
    listClientBranch: [null],
    listBranch: [null],
    deliveryBasis: [null],
  });

  public contractType = [];
  public brokerClientFull = [];
  public brokerClient = [];
  public listClientBranch = [];
  public isClientBranchRequired = false;
  public listBranch = [];
  public deliveryBasis = [];

  public mainBasis: IMainBasis;
  public mainBasisCopy: IMainBasis;

  public user: User;
  public isBranchRequired = false; // признак 0/1, что указание структурного подразделения является обязательным

  public isSend = false; // трейдер подавал встречку по данной заявке

  public disabledAssignments = false; //дизейблим договор поручения
  public disabledCommission = false; //дизейблим договор комиссии

  public isResident: boolean; //признак 0/1 резидента
  public stateMessage: string; //сообщение для отображения после контекстной проверки
  public buySaleCond = false; //блок Условия продажи/покупки
  public termsDeliveryTime = false; //блок Условия поставки
  public expandTable = false;
  public changePaymentCondForm = false;
  public changeDeliveryBasisForm = false;
  public changeDeliveryPeriodForm = false;

  public pricingType = pricingType;
  public currencyPrecision: number;
  public totalRowData: any; //инфа в строку Итого по товарам
  public goodInfo = false;
  public viewInfoGood = null;
  public deliveryConditionsChoose = []; //выбранный базис

  public uniqueDelConditions = []; // уникальные значения в массиве deliveryConditions

  public isDisabledAdjustablePrice: boolean = false;
  public goodForm: any = this.formBuilder.group({});

  public editingRules = editingRules;

  public isDisabledMainButton = true; // дизэблим основную кнопку подачи
  public disabledMakeCounter = false; // параметр для блокировки кнопки, так как неподходящий период или состояние
  public adjustablePrice;

  public AgreementType = AgreementType; //ids договоров

  public dateSessionPlusDay = new Date();
  public dateSession = new Date();
  public readonly SPECIAL_FIELDS_AGRI = SPECIAL_FIELDS_AGRI;
  public readonly SECTIONS_TYPES = SECTIONS_TYPES;
  public isExpandLotItems = false;

  public goodsCopy: GoodAnalog;

  constructor() {
    effect(() => {
      this.loadRefbooks(
        this.currencyIntersections(),
        () =>
          this.commonService
            .getByName(this.userToken, 'currencies')
            .pipe(map((res: { refbooks: RefBook[] }) => res.refbooks)),
        this._displayCurrency
      );

      this.loadRefbooks(
        this.vatIntersections(),
        () =>
          this.commonService
            .getByName(this.userToken, 'vatpercents')
            .pipe(map((res: { refbooks: RefBook[] }) => res.refbooks)),
        this._amountVat
      );
    });
  }

  public changeBrokerClinet(): void {
    this.infoForm.get('listClientBranch').reset();
    this.onChooseBroker();
    // this.isDisabledMainButton = false;
  }

  public ngOnInit(): void {
    this.dateSessionPlusDay.setDate(this.dateSessionPlusDay.getDate() + 1);

    this.setChangeVolume();
    this.setMainBasis();
    this.setAdjustablePrice();
    this.checkForDisableTheAdjustedPrice();
    this.setIsCanSchedule();
    this.goodsCopy = JSON.parse(JSON.stringify(this.fullInfo.goods[0])); //создаем копию товара, чтобы в модалке заполнения товара НСИ работать с ней
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const sessionInfo = this.globalStore.computedSessionInfo();

    if (!sessionInfo.isActive || sessionInfo.idSessionPeriod != 2) {
      this.disabledMakeCounter = true;
    } else {
      this.disabledMakeCounter = false;
    }

    if (
      (changes['idOffer'] &&
        changes['idOffer'].previousValue != changes['idOffer'].currentValue) ||
      (changes['fullInfo'] &&
        !changes['fullInfo'].firstChange &&
        changes['fullInfo'].previousValue.generalInfo.idDemandOffer ==
          changes['fullInfo'].currentValue.generalInfo.idDemandOffer)
    ) {
      this.subscription?.unsubscribe();
      this.contractType = [];
      this.brokerClientFull = [];
      this.brokerClient = [];
      this.listClientBranch = [];

      this.listBranch = [];
      this.infoForm.get('participant').reset();
      this.onInit();
    }
  }

  private setChangeVolume(): void {
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

        this.prepareGoods();
        this.isDisabledMainButton = false;
      }
    });
  }

  private setMainBasis(): void {
    this.mainBasis = this.fullInfo?.deliveryConditions.find(
      (basis) => basis.isMain == true
    );
    this.mainBasisCopy = this.fullInfoCopy?.deliveryConditions.find(
      (basis) => basis.isMain == true
    );
  }

  private setAdjustablePrice(): void {
    this.adjustablePrice = this.getValue(
      this.fullInfo.goods[0].goodsSpecifications,
      IdInterfaceField.adjustedPrice
    );
  }

  private convertDate(date): any {
    return date ? convertExcelSerialDateToMs(date) : null;
  }

  private checkForDisableTheAdjustedPrice(): void {
    // дизейблим ли корректируемую цену
    if (this.fullInfo.deliveryPeriod.idDeliveryType == ID_DELIVERY_TYPE.DATE) {
      this.isDaysCountCorrect =
        this.submitCounterService.getDaysCount(
          this.convertDate(this.fullInfo.deliveryPeriod?.dateBegin),
          this.convertDate(this.fullInfo.deliveryPeriod?.dateEnd),
          0,
          0
        ) >= minDeliveryScheduleDaysCount;
    } else {
      this.isDaysCountCorrect =
        this.submitCounterService.getDaysCount(
          this.deliveryTermForm?.startDate || null,
          null,
          this.fullInfo.deliveryPeriod.idDeliveryType == ID_DELIVERY_TYPE.DAY
            ? this.fullInfo.deliveryPeriod.periodTypeValue == null
              ? 0
              : this.fullInfo.deliveryPeriod.periodTypeValue
            : 0,
          this.fullInfo.deliveryPeriod.idDeliveryType == ID_DELIVERY_TYPE.MONTH
            ? this.fullInfo.deliveryPeriod.periodTypeValue == null
              ? 0
              : this.fullInfo.deliveryPeriod.periodTypeValue
            : 0
        ) >= minDeliveryScheduleDaysCount;
    }
  }

  private setIsCanSchedule(): void {
    let isCanSchedule = !!(
      this.fullInfo.deliveryPeriod.idDeliveryMoment ==
        ID_DELIVERY_MOMENT.FROM_THE_DATE_OF_DELIVERY &&
      this.isDaysCountCorrect &&
      this.getGoodsSpecifications(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.adjustedPrice
      )
    );
    if (!isCanSchedule) this.isDisabledAdjustablePrice = true;
  }

  private onInit(): void {
    this.user = this.localStorageService.getUser() as User;
    this.getBranchesListFirm();
    this.getListBranchesOfAllClients();
  }

  private counterDemandGetLast(): void {
    this.counterService
      .counterDemandGetLast(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idDemandOffer()
      )
      .subscribe((res) => {
        if (res) {
          const { isSend, idCurrency, idVatPercent } = res;
          this.setValueDutchDownAuctionForm(isSend, idCurrency, idVatPercent);
        }

        this.isSend = res.isSend;
        let openRole;
        if (this.isSend) {
          //если не первая подача
          openRole = !res.idContractType ? role.visitor : role.broker;
          this.infoForm.get('participant')?.patchValue(openRole);
          this.infoForm.get('contractType').patchValue(res.idContractType); //тип договора
          this.brokerClient = this.brokerClientFull.filter(
            (el) => el.idContractType == res.idContractType
          );
          // this.changeContractType({value: this.infoForm.controls.contractType.value})
          this.infoForm.get('deliveryBasis').patchValue(res?.idCondition);
          if (res.idBranch) {
            //идентификатор структурного участника торгов или клиента по договору поручения, может быть NULL;
            if (res.idContractType == AgreementType.Agency)
              //поручения
              this.infoForm.get('listClientBranch').patchValue(res.idBranch);
            if (!res.idContractType)
              this.infoForm.get('listBranch').patchValue(res.idBranch);
          }
          if (res.idFirmClient) {
            //идентификатор клиента
            if (res.idContractType == AgreementType.Agency)
              this.infoForm.get('brokerClient').patchValue(res.idFirmClient);
            this.onChooseBroker();
          }
          if (
            openRole == role.visitor ||
            res.idContractType == AgreementType.Commission
          ) {
            this.onContextCheckCounterState();
          }
        } else {
          openRole =
            this.brokerClientFull?.length != 0
              ? role.broker
              : !(this.isBranchRequired && this.listBranch?.length == 0)
              ? role.visitor
              : null;
          this.infoForm.get('participant')?.patchValue(openRole);
        }

        if (
          openRole == role.visitor &&
          this.listBranch.length == 1 &&
          this.isBranchRequired
        ) {
          this.infoForm
            .get('listBranch')
            ?.patchValue(this.listBranch[0].idFirmBranch);
        }

        if (!this.isSend) {
          //брокер с предзаполненным значением клиента (структурное либо 1, либо нет структурных)
          //посетитель без структурных
          //предзаполненые значения (ранее торговал по этой сессии)
          if (
            (openRole == role.visitor && !this.isBranchRequired) ||
            (openRole == role.broker &&
              (this.listClientBranch?.length == 1 ||
                this.listClientBranch?.length == 0) &&
              this.infoForm.get('brokerClient')?.value != null)
          ) {
            this.onContextCheckCounterState();
          } else this.getPrecision();
        } else if (
          openRole == role.visitor &&
          this.listBranch.length == 0 &&
          !this.isBranchRequired
        ) {
          //если ранее подавали заявку посетителем без структурных
          this.onContextCheckCounterState();
        }
      });
  }

  private getPrecision(): void {
    if (!this.currencyPrecision)
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == IdInterfaceField.currency
          )?.fieldValueNumber
        )
        .subscribe((res: number) => {
          this.currencyPrecision = res;
          this.prepareGoods();
        });
    else this.prepareGoods();
  }

  //--------Блок Покупатель------------
  private getBranchesListFirm(): void {
    this.bidService
      .getListBranchesFirm(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        false
      )
      .subscribe((res) => {
        this.listBranch = res.branchesFirms;
        this.isBranchRequired = res.isBranchRequired;
      });
  }

  // брокер - клиенты со структурными
  private getListBranchesOfAllClients(): void {
    this.bidService
      .getListBranchesOfAllClients(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId
      )
      .subscribe((res) => {
        this.brokerClientFull = res.branchesClients;
        if (this.brokerClientFull.length > 0) {
          this.disabledAssignments =
            this.brokerClientFull.filter(
              (el) => el.idContractType == AgreementType.Agency.toString()
            ).length == 0;
          this.disabledCommission =
            this.brokerClientFull.filter(
              (el) => el.idContractType == AgreementType.Commission.toString()
            ).length == 0;
          this.initContractType();
        }

        this.counterDemandGetLast();
      });
  }

  initContractType() {
    if (this.disabledAssignments == true && this.disabledCommission == false) {
      this.infoForm.controls.contractType.patchValue(AgreementType.Commission);
    } else this.infoForm.controls.contractType.patchValue(AgreementType.Agency);
    this.contractType = [
      {
        refBookKey: AgreementType.Commission,
        refBookValue: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.commissionAgreement'),
        disabled: this.disabledCommission,
      },
      {
        refBookKey: AgreementType.Agency,
        refBookValue: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.agencyAgreement'),
        disabled: this.disabledAssignments,
      },
    ];

    this.changeContractType({
      value: this.infoForm.controls.contractType.value,
    });
  }

  changeContractType(e) {
    this.brokerClient = this.brokerClientFull.filter(
      (el) => el.idContractType == e.value
    );
    this.infoForm.get('brokerClient').reset(null);
    this.infoForm.get('listClientBranch').reset(null);
    if (this.brokerClient.length == 1) {
      this.infoForm
        .get('brokerClient')
        ?.patchValue(
          e.value == AgreementType.Commission
            ? [this.brokerClient[0].idClient]
            : this.brokerClient[0].idClient
        );
      this.infoForm.get('listClientBranch').reset();
      this.onChooseBroker();
    } else if (e.value == AgreementType.Agency)
      this.onContextCheckCounterState();
  }

  onChooseBroker() {
    let branch = this.brokerClient.find(
      (el) => el.idClient == this.infoForm.get('brokerClient').value
    );

    this.listClientBranch = branch?.branchesClients;
    this.isClientBranchRequired = branch?.isBranchRequired;

    const listClientBranchControl = this.infoForm.get('listClientBranch');

    if (this.isClientBranchRequired) {
      listClientBranchControl.setValidators([Validators.required]);

      if (this.listClientBranch?.length === 1) {
        listClientBranchControl?.patchValue(this.listClientBranch[0].idFirmBranch);
      }
    } else {
      listClientBranchControl.clearValidators();
    }
    listClientBranchControl.updateValueAndValidity({ emitEvent: false });

    this.onContextCheckCounterState();
  }

  get disableBtnBySeller() {
    //для дизэйбла кнопки по блоку Продавец
    return this.infoForm.get('participant').value == role.broker &&
      this.infoForm.get('contractType').value == AgreementType.Agency.toString()
      ? !this.infoForm.get('brokerClient').value
      : this.infoForm.get('participant').value == role.broker &&
        this.infoForm.get('contractType').value ==
          AgreementType.Commission.toString()
      ? false
      : (this.isBranchRequired && !this.infoForm.get('listBranch').value);
  }

  get isSubmitDisabled(): boolean {
    return (
      this.isDisabledMainButton ||
      this.disableBtnBySeller ||
      (this.isAllowAnalog() && !this.idCatalogGood) ||
      (this.brokerClientFull?.length === 0 &&
        this.listBranch?.length === 0 &&
        this.isBranchRequired) ||
      this.disabledMakeCounter ||
      this.deadlineErrorMess?.length > 0
    );
  }

  public onContextCheckCounterState(): void {
    if (this.infoForm.get('participant').value) {
      let IdFirmClient, IdBranch;
      if (this.infoForm.get('participant').value == role.broker) {
        if (
          this.infoForm.get('contractType').value == AgreementType.Commission
        ) {
          IdFirmClient = null;
        }

        if (this.infoForm.get('contractType').value == AgreementType.Agency) {
          if (this.infoForm.get('brokerClient').value)
            IdFirmClient = this.infoForm.get('brokerClient').value;
          else return;
        }
      }

      IdBranch =
        this.infoForm.get('participant').value == role.visitor
          ? this.infoForm.get('listBranch').value
          : this.infoForm.get('contractType').value ==
            AgreementType.Agency.toString()
          ? this.infoForm.get('listClientBranch').value
          : null;

      const body = {
        idSection: this.sessionIds.sectionId,
        idSession: this.sessionIds.sessionId,
        idContractType:
          this.infoForm.get('participant').value == role.broker
            ? this.infoForm.get('contractType').value
            : null,
        idFirmClient: IdFirmClient,
        idBranch: IdBranch,
        idDemand: this.idDemandOffer(),
      };

      this.counterService
        .checkCounterOfferState(
          this.user?.token,
          body,
          'CheckCounterDemandState'
        )
        .subscribe((res: any) => {
          this.stateMessage = res.stateMessage;
          this.isResident = res.isResident;
          this.getPrecision();
        });
    } else {
      this.getPrecision();
    }
  }

  getBranchValue(array, idName, id, value) {
    return array?.length > 0
      ? array.find((el) => el[idName] == id)[value]
      : null;
  }

  getCommissionBranch() {
    let string = '';
    this.infoForm.get('brokerClient').value?.forEach((elem, idx) => {
      if (idx === 0) {
        //первый элемент
        string = this.getBranchValue(
          this.brokerClient,
          'idClient',
          elem,
          'regNumShortName'
        );
      } else
        string =
          string +
          ', ' +
          this.getBranchValue(
            this.brokerClient,
            'idClient',
            elem,
            'regNumShortName'
          );
    });
    return string;
  }

  public changeCurrency(e: ValueChangedEvent): void {
    if (!e.event) {
      return;
    }
    this.demandService
      .getOfferShortInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idDemandOffer(),
        CurrentTab.auctions,
        'GetDemandShortInfo',
        'IdDemand',
        this.dutchDownAuctionForm.get('idCurrency')?.value
      )
      .subscribe((res) => {
        this.fullInfo.generalInfo = res.generalInfo;
        this.currencyPrecision =
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == IdInterfaceField.currency
          )?.fieldValueNumber != 1
            ? null
            : this.currencyPrecision;
        this.fullInfo.goods = res.goods;
        this.fullInfo.deliveryConditions = res.deliveryConditions;
        
        //если меняем валюту после выбора аналога - сбрасываем выбранный аналог
        if (this.idCatalogGood) { 
          this.idCatalogGood = null;
        }
        this.getPrecision();
      });
  }

  public changeAmountVat(e: ValueChangedEvent): void {
    if (!e.event) {
      return;
    }

    this.isDisabledMainButton = false;
  }

  get stringOfPrevSeller(): string {
    const part: string[] = [];

    if (this.infoForm.get('participant').value === role.broker) {
      part.push(getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.brokerRole'));
    } else if (this.infoForm.get('participant').value === role.visitor) {
      part.push(getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.visitorRole'));
    }

    if (this.infoForm.get('contractType').value === AgreementType.Agency) {
      part.push(getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.agencyAgreement'));
    } else if (this.infoForm.get('contractType').value === AgreementType.Commission) {
      part.push(getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.commissionAgreement'));
    }

    if (this.infoForm.get('brokerClient').value && this.infoForm.get('contractType').value === AgreementType.Agency) {
      const clientName = this.getBranchValue(this.brokerClient, 'idClient', this.infoForm.get('brokerClient').value, 'nameShort');
      let clientStr: string = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.client');
      part.push(`${clientStr}: ${clientName}`);
    }

    if (this.infoForm.get('listClientBranch').value != null ) {
      part.push(this.getBranchValue(this.listClientBranch, 'idFirmBranch', this.infoForm.get('listClientBranch').value, 'nameShort'));
    }

    if (this.infoForm.get('listBranch').value != null) {
      part.push(this.getBranchValue(this.listBranch, 'idFirmBranch', this.infoForm.get('listBranch').value, 'nameShort'));
    }

    return part.join(', ');
  }

  //--------------------------Блок Товаров-------------------------
  prepareGoods() {
    if (this.fullInfo?.deliveryConditions?.length > 0) {
      this.uniqueDelConditions = [
        ...new Map(
          this.fullInfo?.deliveryConditions.map(
            (
              item //уникальные значения в массиве deliveryConditions
            ) => [item['concatedCondition'], item]
          )
        ).values(),
      ];
      this.deliveryConditionsChoose = this.fullInfo?.deliveryConditions.filter(
        (el) => el.concatedCondition == this.mainBasis?.concatedCondition
      );
    }
    //добавляем в товары стоимость ндс/стоимость с/без ндс
    this.fullInfo.goods.forEach((good) => {
      good.goodsSpecifications.find(
        (field) => field.idInterfaceField == IdInterfaceField.priceWithoutVAT
      ).fieldPrecision = this.currencyPrecision;
      good.isOpened = this.isAllowAnalog() ? true : false; //для открытия подробного просмотра в таблице
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

      let blockFind = this.onFindBlock(good);

      if (Number(this.sessionIds.sectionId) === SECTIONS_TYPES.AGRI) {
        SPECIAL_FIELDS_AGRI.forEach((id) => {
          const field: IEditOfferGoodsSpecifications =
            good.goodsSpecifications.find(
              (field) => field.idInterfaceField === id
            );
          if (field) {
            const fieldValue = blockFind.fields.find(
              (el) => el.interfaceField.fieldId === id
            );
            field.dataSource =
              fieldValue?.selectedValues ||
              fieldValue?.interfaceField?.allowedValues;
            field.idEditRule = this.editRulesForSession.find(
              (el) =>
                el.idModelBlock === blockFind.id &&
                el.idInterfaceField === id &&
                el.idSessionPeriod === IdSessionPeriods.offersAdjustment
            )?.idEditRule;
          }
        });
      }

      if (
        this.fullInfo.generalInfo.pricingTypeId !=
        this.pricingType.formulaWithoutQuotation
      ) {
        // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
        let count = Number(
          good.goodsSpecifications.find(
            (field) => field.idInterfaceField == IdInterfaceField.quantity
          ).fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find(
            (field) =>
              field.idInterfaceField == IdInterfaceField.priceWithoutVAT
          ).fieldValueNumber
        ); //Цена без НДС

        let vat: number = this.findVatPercent(this.dutchDownAuctionForm.get('vatPercent').value);

        let costWithoutVAT = round(
          count * priceWithoutVat,
          this.currencyPrecision
        );
        let amountVAT = round(
          costWithoutVAT * (vat / FULL_PERCENT),
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
          (field) => field.idInterfaceField == IdInterfaceField.currency
        ).fieldValue,
      }); //добавляем каждому товару Валюта

      if (
        this.fullInfo.generalInfo.pricingTypeId ==
        this.pricingType.formulaWithQuotation
      ) {
        let quoteCurrency = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.quoteCurrency
        ).fieldValue; //Валюта котировки
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.amendmentType
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
          (field) => field.idInterfaceField == IdInterfaceField.amendmentType
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }

      //формируем форму для инпутов цен/кол-ва
      good.goodsSpecifications.forEach((field) => {
        if (
          [
            IdInterfaceField.quantity,
            IdInterfaceField.priceWithoutVAT,
            IdInterfaceField.amendment,
            IdInterfaceField.quotation,
          ].includes(field.idInterfaceField)
        ) {
          this.goodForm.addControl(
            // good.idGood ? good.idGood.toString() : '' + '_' + field.idInterfaceField.toString(),
            (good.idGood ? good.idGood.toString() : '') +
              '_' +
              field.idInterfaceField.toString(),
            this.formBuilder.control(null, Validators.required)
          );
          this.goodForm.controls[
            (good.idGood ? good.idGood.toString() : '') +
              '_' +
              field.idInterfaceField.toString()
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
          this.fullInfo.goods[0].unitName
      );
    }

    this.changeTotalCost(); //сразу рассчитываем без базиса

    //получаем точность валюты
    if (
      this.fullInfo.generalInfo.pricingTypeId ==
      pricingType.formulaWithoutQuotation
    ) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == IdInterfaceField.currency
          ).fieldValueNumber
        )
        .subscribe((res: number) => {
          this.currencyPrecision = res;
        });
    }
  }

  public onChangedExpandLotItems(): void {
    this.fullInfo.goods.forEach(
      (good) => (good.isOpened = this.isExpandLotItems)
    );
  }

  public onFindBlock(good: IEditOfferGood) {
    const foundBlock = this.dataForModel.blocks.find((block) => {
      // Проверяем уровень 3
      const hasLevel3 = block.products
        .filter((prod) => prod.level === PRODUCT_LEVELS_IN_BLOCK.GOOD_NAME)
        .some((item) => item.valueId === good.idGoodName);

      // Проверяем уровень 2
      const hasLevel2 = block.products
        .filter((prod) => prod.level === PRODUCT_LEVELS_IN_BLOCK.GOOD_GROUP)
        .some((item) => item.valueId === good.idGoodGroup);

      // Проверяем уровень 1
      const hasLevel1 = block.products
        .filter(
          (prod) => prod.level === PRODUCT_LEVELS_IN_BLOCK.NOMENCLATURE_GROUP
        )
        .some((item) => item.valueId === good.idNomenclatureGroup);

      // Возвращаем блок, если он соответствует любому из условий
      return hasLevel3 || hasLevel2 || hasLevel1;
    });

    return foundBlock;
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.fullInfo.goods);
  }

  changeTotalCost() {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0,
      volumeTotal = 0;

    let vat: number = this.findVatPercent(this.dutchDownAuctionForm.get('vatPercent').value);

    if (
      this.fullInfo.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      this.fullInfo.goods.forEach((good) => {
        let count = Number(
          good.goodsSpecifications.find(
            (field) => field.idInterfaceField == IdInterfaceField.quantity
          ).fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find(
            (field) =>
              field.idInterfaceField == IdInterfaceField.priceWithoutVAT
          ).fieldValueNumber
        ); //Цена без НДС

        let costWithoutVAT = round(
          count * priceWithoutVat,
          this.currencyPrecision
        );
        let amountVAT = round(
          costWithoutVAT * (vat / FULL_PERCENT),
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
        //   }
      });

      this.totalForm.controls.quantity.patchValue(
        Number(volumeTotal).toLocaleString('ru', {
          maximumFractionDigits:
            this.fullInfo.goods[0].goodsSpecifications.find(
              (field) => field.idInterfaceField == 1
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
          ' ' +
          this.fullInfo.goods?.[0]?.currency
      );

      this.totalRowData = this.totalForm.value;
    }
  }

  onViewInfo(good) {
    this.viewInfoGood = good.idGood;
    this.goodInfo = false;
  }

  getPriceFromBasisForGood(idGood) {
    let price;
    if (this.fullInfo.deliveryConditions.length > 0)
      price =
        Number(
          this.deliveryConditionsChoose?.find(
            (b) => b.idDemandOfferGood == idGood
          )?.priceWithoutVat
        ) || null;
    else
      price = getNumber(
        this.getValue(
          this.fullInfo.goods.find(
            (good) => good?.goodsSpecifications[0].idDemandOfferGood == idGood
          )?.goodsSpecifications,
          IdInterfaceField.priceWithoutVAT
        )
      );
    return price;
  }

  getValue(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  getNumberCost(value, field) {
    return value?.find((el) => el[field] || el[field] == 0)?.fieldValue || 0;
  }

  getGoodsSpecifications(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications?.find(
      (el) => el.idInterfaceField == idInterfaceField
    );
  }

  getOriginalGood(idGood) {
    return this.goodsOriginal.find((el) => el.idGood == idGood);
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

  editRuleInIntersections(id) {
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

  public onChangedField(e, field): void {
    field.fieldValueNumber = Number(e.value);
   this.isDisabledMainButton = false;
  }

  public onSaveEditField(field): void {
    field.fieldValue = field.dataSource?.find(
      (el) => el.id === field.fieldValueNumber.toString()
    )?.name;
    field.isEdit = false;
  }

  public onSaveEditFieldAnalog(e, field): void {
    field.fieldValueNumber = Number(e.value);
    field.fieldValue = field.dataSource?.find(
      (el) => el.id === field.fieldValueNumber.toString()
    )?.name;
  }

  public onCancelEditField(field): void {
    field.fieldValueNumber = Number(
      field.dataSource?.find((el) => el.name === field.fieldValue)?.id
    );
    field.isEdit = false;
  }

  //проверка на наличие каталожных товаров для отображения модалки
  public get isCatalogGoods(): boolean {
    const hasAllowAnalogs: boolean = this.fullInfo?.goods[0]?.goodValues?.some(
      (ref) => ref.isAllowAnalogs
    );
    const hasNullListValues: boolean = this.fullInfo?.goods[0]?.goodValues?.some(
      (ref) => ref.listValues === null
    );
    return hasAllowAnalogs || hasNullListValues;
  }

  public openChoosingAnalog(): void {
    //если доступен выбор каталожных товаров - открываем эту модалку, иначе форма для заполнения товара-аналога
    if (this.isCatalogGoods) {
      this.openSimilarProducts = true;
    } else {
      this.addNsiGood = true;
    }
  }

  public closeSimilarProdcutsPopup(event: ICloseEvent): void {
    this.openSimilarProducts = event.close;

    if (event.type === 'openNsiPopup') {
      this.addNsiGood = true;
    }
  }

  public closeNsiGoodPopup(event: ICloseEvent): void {
    this.addNsiGood = event.close;

    if (event.type === 'openCatalogPopup') {
      this.openSimilarProducts = true;
    }
  }

  public idCatalogGood: number;

  public onAddCatalogGood(event: IAnalogGood): void {
    this.counterService.emitCatalogGood(event);
    this.idCatalogGood = event.idCatalogGood;
    if (this.isDisabledMainButton) {
      this.isDisabledMainButton = false;
    }
  }

  public onAddNsiGood(event: IAddNsiEvent): void {
    this.counterService.emitNsiGood(event);
    this.idCatalogGood = event.idCatalogGood;
    if (this.isDisabledMainButton) {
      this.isDisabledMainButton = false;
    }
  }

  calculate(idGood, idField) {
    let vat: number = this.findVatPercent(this.dutchDownAuctionForm.get('vatPercent').value),
        volumeTotal = 0,
        costWithoutVatTotal = 0,
        amountVATTotal = 0,
        costVATTotal = 0;

    let good = this.fullInfo.goods.find((el) => el.idGood == idGood);

    good.goodsSpecifications.find(
      (el) => el.idInterfaceField == idField
    ).fieldValueNumber = Number(
      this.goodForm.controls[
        (good.idGood ? good.idGood.toString() : '') + '_' + idField.toString()
      ].value
    );
    good.goodsSpecifications.find(
      (el) => el.idInterfaceField == idField
    ).fieldValue = Number(
      this.goodForm.controls[
        (good.idGood ? good.idGood.toString() : '') + '_' + idField.toString()
      ].value
    ).toString();

    let count = Number(
      this.goodForm.controls[(good.idGood ? good.idGood.toString() : '') + '_1']
        .value
    ); //количество
    let priceWithoutVat = Number(
      this.goodForm.controls[(good.idGood ? good.idGood.toString() : '') + '_3']
        .value
    ); //Цена без НДС

    let costWithoutVAT = round(count * priceWithoutVat, this.currencyPrecision);
    let amountVAT = round(
      costWithoutVAT * (vat / FULL_PERCENT),
      this.currencyPrecision
    );
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
        if (item.idInterfaceField == IdInterfaceField.quantity) {
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
        maximumFractionDigits: this.fullInfo.goods[0].goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.quantity
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
        ' ' +
        this.fullInfo.goods?.[0]?.currency
    );

    this.totalRowData = this.totalForm.value;
    if (idField === IdInterfaceField.quantity)
      this.tradingService.editVolume({
        goods: this.fullInfo.goods,
        str: 'edit',
      });
    this.goodFormValidationGroup?.instance.validate();

    this.isDisabledMainButton = false;
  }

  zeroComparison = () => 0;

  onChangedAdjustablePrice(e) {
    this.adjustablePrice = !!e.value;
  }

  //--------Блок Базисы------------
  basisForm = this.formBuilder.group({
    basis: [null, [Validators.required]],
    placeName: [null],
    specifyingLocation: null,
  });

  treeViewInstance: TreeView;
  placeDataBasis: any;
  EnterPlaceName: string; //которое отображает значение выбранного или введенного поля
  delivery: any;
  basisValue: any = []; //массив базисов который отображаем в выпадайке
  basisChooseValue: any;
  choosenPlaceBasis: any;
  loadingVisible = false; //при поиске
  searchValue: string;
  openPopupAddPlace = false;
  searchIcon = searchIcon;
  enterPlace: string;
  concatedBasisString;
  deliveryBasisCommon = [];
  vat: number;

  initBasisFromOffer() {
    if (
      this.fullInfo.deliveryConditions.length > 0 &&
      !this.fullInfo.deliveryConditions[0][1]
    ) {
      //базисы поставки
      let vatValue = this.fullInfo.goods[0].goodsSpecifications.find(
        (el) => el.idInterfaceField == 5
      );
      if (vatValue.fieldValueNumber != 1) {
        this.vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
      } else this.vat = 0;

      this.fullInfo.deliveryConditions.forEach((basis) => {
        this.fullInfo.goods.forEach((good) => {
          if (
            good.goodsSpecifications[0].idDemandOfferGood ==
            basis.idDemandOfferGood
          ) {
            Object.assign(basis, {
              goodName: good.goodName,
              unitName: good.unitName,
              properties: good.goodDescription,
              volume: good.goodsSpecifications.find(
                (el) => el.idInterfaceField == IdInterfaceField.quantity
              ).fieldValueNumber, //количество
              quotation:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == IdInterfaceField.quotation
                )?.fieldValue || null, //Котировка
              quoteCurrency:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == IdInterfaceField.quoteCurrency
                )?.fieldValue || null, //Валюта котировки
              amendment:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == IdInterfaceField.amendment
                )?.fieldValue || null, //поправка
              priceAdjustment:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == IdInterfaceField.amendmentType
                )?.fieldValueNumber || null, //Тип поправки
              currency: good.goodsSpecifications.find(
                (el) => el.idInterfaceField == IdInterfaceField.currency
              ).fieldValue, //Валюта
              costVat: this.costVatBasis(
                basis.priceWithoutVat,
                good.goodsSpecifications.find(
                  (el) => el.idInterfaceField == IdInterfaceField.quantity
                ).fieldValueNumber
              ),
              currencyPrecision: good.goodsSpecifications.find(
                (field) =>
                  field.idInterfaceField == IdInterfaceField.priceWithoutVAT
              ).fieldPrecision,
              volumePrecision: good.goodsSpecifications.find(
                (field) => field.idInterfaceField == IdInterfaceField.quantity
              ).fieldPrecision,
            });
          }
        });
      });

      let mainBasis = this.fullInfo.deliveryConditions.find(
        (el) => el.isMain == true
      ); //главный базис из того, что пришло по заявке
      this.fullInfo.deliveryConditions.splice(
        this.fullInfo.deliveryConditions.indexOf(mainBasis),
        1
      );
      this.fullInfo.deliveryConditions.splice(0, 0, mainBasis);
      /*  this.deliveryBasisCommon = JSON.parse(JSON.stringify(this.deliveryBasis))*/
      this.fullInfo.deliveryConditions = groupByConcatedCondition(this.fullInfo.deliveryConditions ?? []);
      this.fullInfo.deliveryConditions = Object.entries(
        this.fullInfo.deliveryConditions
      );
      this.fullInfo.deliveryConditions.forEach((offer) => {
        let basis = offer[1][0];
        let goods = [];
        for (let i = 0; i < offer[1].length; i++) {
          let good = this.fullInfo.goods.find(
            (good) =>
              good.goodsSpecifications[0].idDemandOfferGood ==
              offer[1][i].idDemandOfferGood
          );

          offer[1][i].priceWithoutVat = basis.isMain
            ? good.goodsSpecifications?.find(
                (el) => el.idInterfaceField == IdInterfaceField.priceWithoutVAT
              )?.fieldValueNumber
            : offer[1][i].priceWithoutVat;
          goods.push({
            idDemandOfferGood: good.goodsSpecifications[0].idDemandOfferGood,
            idGood: good.idGood,
            goodName: good.goodName,
            unitName: good.unitName,
            properties: good.goodDescription,
            volume: good.goodsSpecifications.find(
              (el) => el.idInterfaceField == IdInterfaceField.quantity
            ).fieldValueNumber, //количество
            quotation:
              good.goodsSpecifications?.find(
                (el) => el.idInterfaceField == IdInterfaceField.quotation
              )?.fieldValue || null, //Котировка
            quoteCurrency:
              good.goodsSpecifications?.find(
                (el) => el.idInterfaceField == IdInterfaceField.quoteCurrency
              )?.fieldValue || null, //Валюта котировки
            amendment:
              good.goodsSpecifications?.find(
                (el) => el.idInterfaceField == IdInterfaceField.amendment
              )?.fieldValue || null, //поправка
            priceAdjustment:
              good.goodsSpecifications?.find(
                (el) => el.idInterfaceField == IdInterfaceField.amendmentType
              )?.fieldValueNumber || null, //Тип поправки
            currency: good.goodsSpecifications.find(
              (el) => el.idInterfaceField == IdInterfaceField.currency
            ).fieldValue, //Валюта
            costVat: this.costVatBasis(
              offer[1][i].priceWithoutVat,
              good.goodsSpecifications.find(
                (el) => el.idInterfaceField == IdInterfaceField.quantity
              ).fieldValueNumber
            ),
            currencyPrecision: good.goodsSpecifications.find(
              (field) =>
                field.idInterfaceField == IdInterfaceField.priceWithoutVAT
            ).fieldPrecision,
            cost: offer[1][i].priceWithoutVat,
            volumePrecision: good.goodsSpecifications.find(
              (field) => field.idInterfaceField == IdInterfaceField.quantity
            ).fieldPrecision,
          });
        }
        this.deliveryBasisCommon.push({
          placeName: [basis.idPlaceLink],
          concatedCondition: basis.concatedCondition,
          specifyingLocation: basis.placeDetails,
          minAddBasis: basis.minAddBasis,
          basisName: basis.basisName,
          enterPlaceName: basis.placeName,
          isMain: basis.isMain,
          idBasisLink: basis.idBasisLink,
          idBasisValue: basis.idBasisValue,
          idPlaceLink: basis.idPlaceLink,
          idPlaceValue: basis.idPlaceValue,
          minAddBasisPlaces: basis.minAddBasisPlaces,
          isRequiredPlace: basis.isRequiredPlace,
          isRequiredAddBasis: basis.isRequiredAddBasis,
          placeTypeId: basis.placeTypeId,
          parentId: basis.parentId,
          level: basis.level,
          hasChildren: basis.hasChildren,
          basisId: basis.idBasisLink,
          goods: goods,
        });
      });
    }
  }

  costVatBasis(priceWithoutVat, volume) {
    return (
      Math.round(
        (volume * priceWithoutVat +
          (volume * priceWithoutVat * this.vat) / FULL_PERCENT) *
          FULL_PERCENT
      ) / FULL_PERCENT
    );
  }

  // открываем форму и заполняем условия поставки
  public changeDeliveryBasis(): void {
    this.changeDeliveryBasisForm = true;
    //если в правилах редактирование НЕразрешено - берем базисы только из заявки или если в правилах редактирование разрешено изменение и заявка многобазисная
    if (
      this.editRulesIntersections?.find(
        (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
      )?.idEditRule == editingRules.editingIsNotAvailable ||
      (this.editRulesIntersections?.find(
        (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
      )?.idEditRule == editingRules.changesDeliveryTerms &&
        this.uniqueDelConditions?.length > 1)
    ) {
      if (this.deliveryBasisCommon?.length == 0) {
        this.initBasisFromOffer();

        const myBasis = this.deliveryConditions.find(
          (el) => el.linkId === this.mainBasis.idBasisLink
        ); //ныходим мой базис из всех пересеченных
        const flatStructure = this.flatStructure(myBasis); //выносим детей на уровень с главным
        this.fullInfo.deliveryConditions.forEach((el) => {
          let item = el[1][0];
          flatStructure.forEach((i) => {
            if (i.linkId === item.idBasisLink) {
              this.basisValue.push({
                minAddBasisPlaces: i.minAddBasisPlaces,
                contradictoryValueId: i.contradictoryValueId,
                contradictoryBasisName: i.contradictoryBasisName,
                isRequiredPlace: i.isRequiredPlace,
                isRequiredAddBasis: i.isRequiredAddBasis,
                minAddBasis: i.minAddBasis,
                placeName: i.placeName,
                placeTypeId: i.placeTypeId,
                parentId: i.parentId,
                linkId: item.idBasisLink,
                valueId: item.idBasisValue,
                level: i.level,
                hasChildren: i.hasChildren,
                basisId: item.idBasisValue,
                basisName: i.basisName,
                placeLink: item.idPlaceLink,
                enterPlaceName: item.placeName,
                specifyingLocation: item.placeDetails,
              });
            }
          });
        });

        this.basisValue = this.basisValue.filter((item, index, arr) => {
          return (
            arr.findIndex(
              (el) =>
                el.basisId === item.basisId && el.placeLink === item.placeLink
            ) === index
          );
        });

        this.basisValue.forEach((basisItem) => {
          this.deliveryBasisCommon.forEach((commonItem) => {
            if (basisItem.linkId === commonItem.idBasisLink) {
              basisItem.goods = commonItem.goods;
            }
          });
        });
      }
    }

    //если в правилах редактирование разрешено изменение и сессия однобазисная - берем все основные НЕ требующие доп базисов
    if (
      this.editRulesIntersections?.find(
        (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
      )?.idEditRule == editingRules.changesDeliveryTerms &&
      this.uniqueDelConditions?.length == 1
    ) {
      this.initBasisFromOffer();
      this.basisValue = this.deliveryConditions;
      this.deliveryConditions = this.deliveryConditions.filter(
        (cond) => !cond?.minAddBasis
      );
      this.basisValue.forEach((basisItem) => {
        this.deliveryBasisCommon.forEach((commonItem) => {
          if (basisItem.linkId === commonItem.idBasisLink) {
            basisItem.goods = commonItem.goods;
            basisItem.enterPlaceName = commonItem.enterPlaceName;
            basisItem.specifyingLocation = commonItem.specifyingLocation;
            basisItem.placeLink = commonItem.placeName[0];
          }
        });
      });
    }

    //если в правилах редактирование разрешено только добавление - берем все доп.базисы, родителем которых является базис из заявки
    if (
      this.editRulesIntersections?.find(
        (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
      )?.idEditRule == editingRules.addingValueFromReferenceBook
    ) {
      this.basisValue = this.deliveryConditions.filter(
        (el) => el.linkId == this.mainBasis.idBasisLink
      )[0].children;
    }

    //если в правилах редактирование разрешено изменение+добавление - берем все основные, + допы моего основого
    if (
      this.editRulesIntersections?.find(
        (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
      )?.idEditRule == editingRules.changingDeliveryConditionsAddingValue
    ) {
      const flatStructure = this.flatStructureWithAllBasis(
        this.deliveryConditions
      ); //выносим всех детей на уровень с главным
      this.basisValue = flatStructure.filter(
        (item) =>
          item.parentId === this.mainBasis.idBasisLink || item.parentId === 0
      ); //удаляем детей не моего основног базисы
    }

    if (
      this.editRulesIntersections?.find(
        (el) => el.idInterfaceField === IdInterfaceField.deliveryTerms
      )?.idEditRule === editingRules.editingIsNotAvailable ||
      (this.editRulesIntersections?.find(
        (el) => el.idInterfaceField === IdInterfaceField.deliveryTerms
      )?.idEditRule === editingRules.changesDeliveryTerms &&
        this.uniqueDelConditions?.length > 1)
    ) {
      this.basisForm.controls.basis.patchValue(this.basisValue[0]?.linkId);
      this.basisForm.controls.placeName?.patchValue(
        this.basisValue[0]?.placeName
      );
      this.basisForm.controls.specifyingLocation?.patchValue(
        this.basisValue[0]?.specifyingLocation
      );
    }

    this.concatedBasisString = null;
  }

  flatStructure(data) {
    const { children, ...parent } = data;
    const result = [parent];

    if (children && Array.isArray(children)) {
      result.push(
        ...children.map((child) => ({ ...child, parentId: data.linkId }))
      );
    }
    return result;
  }

  flatStructureWithAllBasis(data) {
    const result = [];

    function flatten(item, parentId = null) {
      const { children, ...parent } = item;
      if (parentId !== null) {
        parent.parentId = parentId;
      }
      result.push(parent);

      if (children && Array.isArray(children)) {
        children.forEach((child) => flatten(child, parent.linkId));
      }
    }

    if (Array.isArray(data)) {
      data.forEach((item) => flatten(item));
    } else {
      flatten(data);
    }

    return result;
  }

  selectBasis(e) {
    this.basisChooseValue = {};
    if (e.value.linkId) {
      if (
        this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.addingValueFromReferenceBook ||
        this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.changingDeliveryConditionsAddingValue ||
        (this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.changesDeliveryTerms &&
          this.uniqueDelConditions?.length == 1)
      ) {
        this.basisChooseValue = this.basisValue.find(
          (el) => el.linkId == e.value.linkId
        );
        this.choosenPlaceBasis = this.basisChooseValue;
        this.EnterPlaceName = this.basisChooseValue?.enterPlaceName;
        this.getDeliveryPlaces(e.value.linkId, this.basisChooseValue.valueId);

         //если базис НЕ из заявки - очищаем
         if(this.choosenPlaceBasis?.linkId !== this.mainBasis?.idBasisLink) {
          this.clearPlaceName();
        } else {
          this.basisForm.controls.placeName.patchValue(
            this.choosenPlaceBasis?.placeLink
          );
          this.basisForm.controls.specifyingLocation?.patchValue(
            this.choosenPlaceBasis?.specifyingLocation
          );
          this.EnterPlaceName = this.choosenPlaceBasis?.enterPlaceName;
        }
        if (this.basisChooseValue) this.onCreateBasisString();
      }

      if (
        this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.editingIsNotAvailable ||
        (this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.changesDeliveryTerms &&
          this.uniqueDelConditions?.length > 1)
      ) {
        this.basisChooseValue = this.basisValue.find(
          (el) =>
            el.linkId == e.value.linkId && el.placeLink == e.value.placeLink
        );

       //второе изменение базиса, те место назначения изменено и не равно месту из заявки
       if (this.basisChooseValue.linkId === this.mainBasis.idBasisLink && this.basisChooseValue.placeLink !== this.mainBasis.idPlaceLink) {
        this.EnterPlaceName = this.mainBasis?.placeName;
        this.basisForm.controls.specifyingLocation?.patchValue(
          this.mainBasis?.placeDetails
        );
        this.basisForm.controls.placeName.patchValue(
          this.mainBasis?.placeName
        );
        this.choosenPlaceBasis = this.mainBasis;
      } else {
        this.EnterPlaceName = this.basisChooseValue?.enterPlaceName;
        this.basisForm.controls.specifyingLocation?.patchValue(
          this.basisChooseValue?.specifyingLocation || this.mainBasis?.placeDetails
        );
        this.basisForm.controls.placeName.patchValue(
          this.basisChooseValue?.placeName
        );
        this.choosenPlaceBasis = this.basisChooseValue;
      }

        this.deliveryConditionsChoose = [];
        this.deliveryConditionsChoose = this.fullInfo.deliveryConditions.reduce(
          (acc, el) => {
            return acc.concat(
              el[1].filter((item) => item.idBasisLink === e.value.linkId)
            );
          },
          []
        );
        this.getDeliveryPlaces(e.value.linkId, this.basisChooseValue.valueId);

        if (
          this.fullInfo.generalInfo.pricingTypeId !=
          pricingType.formulaWithoutQuotation
        ) {
          this.changeTotalCost();
        }
        if (this.basisChooseValue) this.onCreateBasisString();
      }
    }
  }

  clearPlaceName() {
    this.enterPlace = '';
    this.EnterPlaceName = '';
    this.treeView?.instance?.unselectAll();
    this.basisForm.controls.placeName.patchValue(null);
    this.basisForm.controls.specifyingLocation?.patchValue(null);
  }

  public getDeliveryPlaces(idBasisLink: number, idBasisValue: number): void {
    //получение названия места для каждого базиса
    this.submissionService
      .getDeliveryPlacesTree(this.user.token, idBasisLink)
      .subscribe((res) => {
        this.placeDataBasis =
          this.editDemandOfferServiceService.getPrepareDeliveryPlaceValues(
            res.trees,
            idBasisValue,
            this.idAuctionType,
            this.dataForModel.marketTypeIds
          );
      });
  }

  onChangePlaceType(e) {
    if (e.itemData.disableCountries) {
      //не даем возможности выбрать страну
      e.component.unselectItem(e.itemData);
    }
    let placeNameString =
      (e.node.parent?.parent?.text ? e.node.parent?.parent?.text + ', ' : '') +
      (e.node.parent?.text ? e.node.parent?.text + ', ' : '') +
      e.node.text;
    // this.EnterPlaceName = e.itemData.valueName
    this.EnterPlaceName = placeNameString;
    this.basisForm.controls.placeName.patchValue(
      e.component.getSelectedNodeKeys()
    );
    this.basisForm.controls.specifyingLocation?.patchValue(null);
    if (e) {
      this.choosenPlaceBasis = this.placeDataBasis.find(
        (el) => el.idLink == e.component.getSelectedNodeKeys()
      );
      if (!e.node.selected) {
        this.EnterPlaceName = '';
      }
    }
    this.onCreateBasisString();
  }

  onOpenedDropDown() {
    if (
      this.basisValue?.length > 0 &&
      this.basisForm.controls.placeName?.value ==
        this.basisValue[0]?.placeName &&
      this.treeView?.instance
    )
      this.treeView?.instance.selectItem(this.basisValue[0]?.placeName[0]);
  }

  public searchTxtBoxValueChange(e: TextBoxValueChangedEvent): void {
    // от 3х и более символов или пришла пустота
    let result = e.value.length >= 3 || e.value.length == 0;
    if (result) {
      this.loadingVisible = true;
      this.editDemandOfferServiceService.searchTxtBoxValueChange(e, this.placeDataBasis, this.treeViewInstance);
      setTimeout(() => (this.loadingVisible = false), 1000);
    }
  }

  saveInstance(e) {
    this.treeViewInstance = e.component;
  }

  lengthValidationSearch(e) {
    return e.value.length >= 3;
  }

  onChangePlaceTypeByEnter() {
    this.openPopupAddPlace = false;
    this.EnterPlaceName = this.enterPlace;
    this.treeView?.instance?.unselectAll();
    this.basisForm.controls.placeName.patchValue(-1);
    this.basisForm.controls.specifyingLocation?.patchValue(null);
  }

  public isDisabledSpecifyingLocation(): boolean {
    return !this.basisForm.controls.placeName.value ||
      this.basisForm.controls.placeName.value?.length == 0 ||
      this.editRuleInIntersections(IdInterfaceField.deliveryTerms) ==
      editingRules.editingIsNotAvailable
  }

  onCreateBasisString() {
    const idPlaceLink =
      this.choosenPlaceBasis?.placeLink ||
      this.choosenPlaceBasis?.idLink ||
      this.choosenPlaceBasis?.idPlaceLink
      null;

    this.demandService
      .getDeliveryCondConcated(
        this.user?.token,
        this.basisChooseValue.linkId,
        idPlaceLink,
        this.basisForm.controls?.specifyingLocation?.value?.toString() || null
      )
      .subscribe((item) => {
        this.concatedBasisString = item.result;
      });
  }

  saveDeliveryBasisForm(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      this.mainBasis.concatedCondition = this.concatedBasisString;
      this.mainBasis.idBasisLink = this.basisChooseValue.linkId;
      this.mainBasis.idBasisValue = this.basisChooseValue.valueId;

      if (
        this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.editingIsNotAvailable
      ) {
        this.mainBasis.idPlaceLink =
          this.deliveryConditionsChoose[0].idPlaceLink;
        this.mainBasis.idPlaceValue =
          this.deliveryConditionsChoose[0].idPlaceValue;
        this.mainBasis.placeDetails =
          this.deliveryConditionsChoose[0].idPlaceLink == null &&
          this.deliveryConditionsChoose[0].idPlaceValue == null
            ? this.EnterPlaceName
            : this.basisForm.get('specifyingLocation')?.value
            ? this.basisForm.get('specifyingLocation')?.value
            : null;
      }

      if (
        this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.changesDeliveryTerms &&
        this.uniqueDelConditions?.length > 1
      ) {
        this.mainBasis.idPlaceLink = this.choosenPlaceBasis?.placeLink || this.choosenPlaceBasis?.idLink;
        this.mainBasis.idPlaceValue = this.choosenPlaceBasis.idValue;
        this.mainBasis.placeDetails =
          this.deliveryConditionsChoose[0].idPlaceLink == null &&
          this.deliveryConditionsChoose[0].idPlaceValue == null
            ? this.EnterPlaceName
            : this.basisForm.get('specifyingLocation')?.value
            ? this.basisForm.get('specifyingLocation')?.value
            : null;
      }
      if (
        this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.addingValueFromReferenceBook ||
        this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.changingDeliveryConditionsAddingValue ||
        (this.editRulesIntersections?.find(
          (el) => el.idInterfaceField == IdInterfaceField.deliveryTerms
        )?.idEditRule == editingRules.changesDeliveryTerms &&
          this.uniqueDelConditions?.length == 1)
      ) {
        this.mainBasis.idPlaceLink = this.choosenPlaceBasis.idLink || null;
        this.mainBasis.idPlaceValue = this.choosenPlaceBasis.idValue || null;
        this.mainBasis.placeDetails = this.basisForm.get('specifyingLocation')?.value || null;
      }

      this.changeDeliveryBasisForm = false;
      if (this.isDisabledMainButton) {
        this.isDisabledMainButton = false;
      }
    }
  }

  //--------Блок Срок поставки------------
  public deadlinePayment: number;
  public deadlineDelivery: number;
  public deadlineErrorMess: string = '';
  public isDaysCountCorrect: boolean = false;
  public deliveryTermConcated: string;
  public deliveryTermForm: IDeliveryPeriodForm;
  public lastDeliveryData: IOutputDeliveryPeriodEvent;

  public getDeliveryTermConcated(event: IOutputDeliveryPeriodEvent): void {
    this.deliveryTermConcated = event.deliveryTermConcated;
    this.deliveryTermForm = event.formValue;
  }

  public getAdjustablePriceChange(event: IAdjustablePriceOutput): void {
    this.adjustablePrice = event.adjustablePrice;
    this.isDisabledAdjustablePrice = event.isDisabledAdjustablePrice;
  }

  public onDeliveryDeadlinesChanged(deliveryData: IOutputDeliveryPeriodEvent): void {
    this.lastDeliveryData = deliveryData;
    this.getDeadlines();
  }

  public onDeliveryPeriodSaved(deliveryData: IOutputDeliveryPeriodEvent): void {
    const form: IDeliveryPeriodForm = deliveryData.formValue;

    this.fullInfo.deliveryPeriod.dateBegin = form.startDate
      ? toOADate(form.startDate)
      : null;

    this.fullInfo.deliveryPeriod.dateEnd = form.endDate
      ? toOADate(form.endDate)
      : null;

    this.fullInfo.deliveryPeriod.idDeliveryMoment = Number(form.startDelivery);

    this.fullInfo.deliveryPeriod.idDeliveryType = Number(form.deliveryType);

    this.fullInfo.deliveryPeriod.periodTypeValue = form.deliveryTerm

    this.fullInfo.generalInfo.concatedDeliveryPeriod = this.deliveryTermConcated;


    this.changeDeliveryPeriodForm = false;

    if (this.isDisabledMainButton) {
      this.isDisabledMainButton = false;
    }
  }
  // -----------------Блок Условия оплаты----------------------

  public paymentTermConcated: string;
  public termsPaymentForm: ITermsPaymentForm;
  public lastPaymentData: IOutputEvent;

  public getPaymentTermConcated(event: IOutputEvent): void {
    this.paymentTermConcated = event.paymentTermConcated;
    this.termsPaymentForm = event.formValue;
  }

  public deadlineParamsReset(event: IDeadlineParamsReset): void {
    this.deadlineDelivery = event.deadlineDelivery;
    this.deadlinePayment = event.deadlinePayment;
  }

  public onPaymentSaved(paymentData: IOutputEvent): void {
    const form: ITermsPaymentForm = paymentData.formValue;

    this.fullInfo.paymentCond.idPaymentType = form.termsPayment || null;

    this.fullInfo.paymentCond.idShipmentVolume = form.volume;

    this.fullInfo.paymentCond.firstPercent =
      Number(form.termsPayment) !== termsConditionsPaymentConst.paymentDeferment
        ? form.prepaymentAmount
        : form.defermentAmount;

    this.fullInfo.paymentCond.secondPercent =
      Number(form.termsPayment) === termsConditionsPaymentConst.partialPrepayment
        ? form.defermentAmount
        : null;

    this.fullInfo.paymentCond.firstPaymentMomentId =
      Number(form.termsPayment) !== termsConditionsPaymentConst.paymentDeferment
        ? form.momentPrepayment
        : form.momentDelay;

    this.fullInfo.paymentCond.secondPaymentMomentId =
     Number(form.termsPayment) === termsConditionsPaymentConst.partialPrepayment
        ? form.momentDelay
        : null;

    this.fullInfo.paymentCond.idDayType = form.dayTypeId || null;

    this.fullInfo.paymentCond.firstPeriodValueNumber =
      Number(form.termsPayment) !== termsConditionsPaymentConst.paymentDeferment
        ? form.prepaymentPeriodNumber || null
        : form.defermentPeriodNumber || null;

    this.fullInfo.paymentCond.firstPeriodValueDate =
       Number(form.termsPayment) !== termsConditionsPaymentConst.paymentDeferment
        ? form.prepaymentPeriodDate
          ? toOADate(form.prepaymentPeriodDate)
          : null
        : form.defermentPeriodDate
        ? toOADate(form.defermentPeriodDate)
        : null;

    this.fullInfo.paymentCond.secondPeriodValueNumber =
      Number(form.termsPayment) === termsConditionsPaymentConst.partialPrepayment
        ? form.defermentPeriodNumber || null
        : null;

    this.fullInfo.paymentCond.thirdPeriodValueNumber =
      paymentData.conditionSecondStage ? form.defermentPeriod2 || null : null;

    this.fullInfo.generalInfo.concatedPaymentConditions =
      this.paymentTermConcated;

    this.changePaymentCondForm = false;

    this.deadlineErrorMess = '';

    if (this.isDisabledMainButton) {
      this.isDisabledMainButton = false;
    }
  }

  public onPaymentDeadlinesChanged(paymentData: IOutputEvent): void {
    this.lastPaymentData = paymentData;
    this.getDeadlines();
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

    if (this.lastDeliveryData) {
      const form: IDeliveryPeriodForm = this.lastDeliveryData.formValue;
      //если открыта форма редактирования Сроки поставки
      startDelivery = form.startDelivery?.toString();
      deliveryType = form.deliveryType?.toString();
      deliveryTerm = form.deliveryTerm?.toString() || null;
      startDate = form.startDate
        ? toOADate(form.startDate)
        : null;
      endDate = form.endDate
        ? toOADate(form.endDate)
        : null;
    } else {
      //берем значения из заявки (если сохранили данные, перезаписываем их в массив того что пришло по заявке)
      startDelivery = this.fullInfo.deliveryPeriod.idDeliveryMoment?.toString();
      deliveryType = this.fullInfo.deliveryPeriod.idDeliveryType?.toString();
      deliveryTerm =
        this.fullInfo.deliveryPeriod.periodTypeValue?.toString() || null;
      startDate = this.fullInfo.deliveryPeriod?.dateBegin;
      endDate = this.fullInfo.deliveryPeriod?.dateEnd;
    }

    if (this.lastPaymentData) {
      const form: ITermsPaymentForm = this.lastPaymentData.formValue;

      termsPayment = form.termsPayment;

      idMomentPrepay =
        Number(form.termsPayment) !== termsConditionsPaymentConst.paymentDeferment
          ? form.momentPrepayment
          : null;

      idMomentDelay =
        Number(form.termsPayment) ===
          termsConditionsPaymentConst.paymentDeferment ||
        Number(form.termsPayment) ===
          termsConditionsPaymentConst.partialPrepayment
          ? form.momentDelay
          : null;

      idDayType = form.dayTypeId || null;

      FirstPeriodValueNumber =
       Number(form.termsPayment) !==
        termsConditionsPaymentConst.paymentDeferment
          ? form.prepaymentPeriodNumber || null
          : form.defermentPeriodNumber || null;

      FirstPeriodValueDate =
        Number(form.termsPayment) !== termsConditionsPaymentConst.paymentDeferment
          ? form.prepaymentPeriodDate
            ? toOADate(form.prepaymentPeriodDate)
            : null
          : form.defermentPeriodDate
          ? toOADate(form.defermentPeriodDate)
          : null;

      SecondPeriodValueNumber =
        Number(form.termsPayment) ===
        termsConditionsPaymentConst.partialPrepayment
          ? form.defermentPeriodNumber || null
          : null;

      ThirdPeriodValueNumber = this.lastPaymentData.conditionSecondStage
        ? form.defermentPeriod2 || null
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
          : termsPayment ==
            termsConditionsPaymentConst.partialPrepayment
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
          this.isDisabledMainButton = false; //разблокировали кнопку
        },
        error: (error) => {
          this.deadlineErrorMess = error.title;
        },
      });
  }

  get specialFields(): IEditOfferGoodsSpecifications[] {
    return this.fullInfo.goods[0].goodsSpecifications.filter((field) =>
      SPECIAL_FIELDS_AGRI.includes(field.idInterfaceField)
    );
  }

  get isSpecialFields(): boolean {
    return (
      this.sessionIds.sectionId == SECTIONS_TYPES.AGRI && this.specialFields?.length > 0
    );
  }

  public compareConditions(): boolean {
    //если форма изменения открыта - сравниваем c инфой из заявки, нет - сравниваем с копией (оригинал)
    const isSameBasis = this.changeDeliveryBasisForm
      ? this.concatedBasisString === this.mainBasis?.concatedCondition
      : this.mainBasisCopy?.concatedCondition ===
        this.mainBasis?.concatedCondition;

    const isSameDeliveryTerm = this.changeDeliveryPeriodForm
      ? this.deliveryTermConcated ===
        upperCaseFirstLetter(this.fullInfo.generalInfo?.concatedDeliveryPeriod)
      : upperCaseFirstLetter(this.fullInfoCopy.generalInfo?.concatedDeliveryPeriod) ===
        upperCaseFirstLetter(this.fullInfo.generalInfo?.concatedDeliveryPeriod);

    const isSamePaymentCond = this.changePaymentCondForm
      ? this.paymentTermConcated ===
        this.fullInfo.generalInfo?.concatedPaymentConditions
      : this.fullInfoCopy.generalInfo?.concatedPaymentConditions ===
        this.fullInfo.generalInfo?.concatedPaymentConditions;

    const volumes = this.getValueByFieldForCompare(
      this.fullInfo?.goods,
      IdInterfaceField.quantity
    );
    const volumesCopy = this.getValueByFieldForCompare(
      this.fullInfoCopy?.goods,
      IdInterfaceField.quantity
    );
    const isSameVolume = volumes.every((val, idx) => val === volumesCopy[idx]);

    const prices = this.getValueByFieldForCompare(
      this.fullInfo?.goods,
      IdInterfaceField.priceWithoutVAT
    );
    const pricesCopy = this.getValueByFieldForCompare(
      this.fullInfoCopy?.goods,
      IdInterfaceField.priceWithoutVAT
    );
    const isSamePrice = prices.every((val, idx) => val === pricesCopy[idx]);

    const isSameVAT =
      this.fullInfo?.goods[0]?.goodsSpecifications.find(
        (el) => el.idInterfaceField === IdInterfaceField.VATrate
      )?.fieldValueNumber ===
      Number(this.dutchDownAuctionForm.get('vatPercent')?.value);

    const isSameCurrency =
      this.fullInfo?.goods[0]?.goodsSpecifications.find(
        (el) => el.idInterfaceField === IdInterfaceField.currency
      )?.fieldValueNumber ===
      Number(this.dutchDownAuctionForm.get('idCurrency')?.value);

    const expirationDate = this.getValueByFieldForCompare(
      this.fullInfo?.goods,
      IdInterfaceField.expirationDate
    );
    const expirationDateCopy = this.getValueByFieldForCompare(
      this.fullInfoCopy?.goods,
      IdInterfaceField.expirationDate
    );

    const isSameExpirationDate = this.isSpecialFields
      ? expirationDate.every((val, idx) => val === expirationDateCopy[idx])
      : false;

    const wholesaleMarkup = this.getValueByFieldForCompare(
      this.fullInfo?.goods,
      IdInterfaceField.wholesaleMarkup
    );
    const wholesaleMarkupCopy = this.getValueByFieldForCompare(
      this.fullInfoCopy?.goods,
      IdInterfaceField.wholesaleMarkup
    );

    const isSameWholesaleMarkup = this.isSpecialFields
      ? wholesaleMarkup.every((val, idx) => val === wholesaleMarkupCopy[idx])
      : false;

    return (
      isSameBasis &&
      isSameDeliveryTerm &&
      isSamePaymentCond &&
      isSameVolume &&
      isSamePrice &&
      isSameVAT &&
      isSameCurrency &&
      (!this.isSpecialFields || (isSameExpirationDate && isSameWholesaleMarkup))
    );
  }

  public getValueByFieldForCompare(data, idField): number[] {
    const values = data.map((item) => {
      const spec = item.goodsSpecifications.find(
        (s) => s.idInterfaceField === idField
      );
      return spec ? spec.fieldValueNumber : null;
    });

    return values;
  }

  public onSubmit(): void {
    if (!this.goodFormValidationGroup?.instance.validate().isValid) return;

    const { IdFirmClient, IdBranch } = this.submitCounterService.buildParticipantData(
      this.infoForm,
      this.listBranch
    );

    let endListGoods = []; //массив для goods

    this.fullInfo.goods.forEach((item) => {
      let endProperties = [];
      item.goodsSpecifications.forEach((block) => {
        if (
          block.controlFieldType == 'dxCheckBox' ||
          block.controlFieldType == 'dxNumberBox' ||
          block.controlFieldType == 'dxSelectBox' ||
          block.controlFieldType == 'dxTextBox'
        ) {
          endProperties.push({
            idInterfaceField: block.idInterfaceField,
            fieldValueNumber:
              block.controlFieldType == 'dxSelectBox' ||
              block.controlFieldType == 'dxNumberBox'
                ? block.fieldValueNumber
                : null,
            fieldValueString:
              block.controlFieldType == 'dxTextBox' ||
              block.controlFieldType == 'dxCheckBox'
                ? block.fieldValueString
                : null,
          });
        }
      });

      let nsiGoodValues = [];
      if (item?.goodValues?.length > 0 && item.idGood === null) {
        item?.goodValues.forEach((gv) => {
          nsiGoodValues.push({
            idReference: gv.idReference,
            listValues: gv.listValues,
            isAllowAnalogs: gv.isAllowAnalogs,
          });
        });
      }

      if (!this.isAllowAnalog()) {
        endListGoods = [
          ...endListGoods,
          {
            idDemandGood: item.goodsSpecifications[0].idDemandOfferGood,
            properties: endProperties,
          },
        ];
      }
      if (this.isAllowAnalog()) {
        endListGoods = [
          {
            idDemandGood: item.goodsSpecifications[0].idDemandOfferGood,
            properties: endProperties,
            idAnalogGood: this.idCatalogGood,
          },
        ];
      }
    });

    //заявка может быть без базисов, тогда отправляем null
    let basisObj, idPlaceLink;
    idPlaceLink = this.choosenPlaceBasis?.placeLink || this.choosenPlaceBasis?.idLink || null;

    if (this.fullInfo?.deliveryConditions?.length > 0) {
      //если форма изменения открыта - берем из формы, нет - берем из общей инфы
      basisObj = this.changeDeliveryBasisForm
        ? {
            idBasisLink: this.basisChooseValue.linkId,
            idBasisValue: this.basisChooseValue.valueId,
            idPlaceLink: idPlaceLink,
            idPlaceValue: this.choosenPlaceBasis.idValue || null,
            placeDetails:
              idPlaceLink == null &&
              this.choosenPlaceBasis.idValue == null
                ? this.EnterPlaceName
                : this.basisForm.get('specifyingLocation')?.value
                ? this.basisForm.get('specifyingLocation')?.value
                : null,
          }
        : {
            idBasisLink: this.mainBasis?.idBasisLink,
            idBasisValue: this.mainBasis?.idBasisValue,
            idPlaceLink: this.mainBasis?.idPlaceLink || null,
            idPlaceValue: this.mainBasis?.idPlaceValue || null,
            placeDetails: this.mainBasis?.placeDetails || null,
          };
    } else {
      basisObj = null;
    }

    const { payCondFullObj, paymentPartObj } =
      this.submitCounterService.buildPaymentConditions(
        this.changePaymentCondForm,
        this.termsPaymentForm,
        this.fullInfo.paymentCond
      );

    const deliveryPeriodObj =
      this.submitCounterService.buildDeliveryPeriod(
        this.changeDeliveryPeriodForm,
        this.deliveryTermForm,
        this.fullInfo.deliveryPeriod
      );

    //если выбран аналог - проверять условия встречки не нужно - сразу подаем
    if (!this.idCatalogGood && this.compareConditions()) {
      this.messagePopup = true;
      this.messageString = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'counterOffers.sameConditions');
    } else {
      this.sendDutchDownAuction(
        IdFirmClient,
        IdBranch,
        endListGoods,
        payCondFullObj,
        paymentPartObj,
        deliveryPeriodObj,
        basisObj
      );
    }
  }

  public closeMessagePopup(event) {
    this.messagePopup = event;
  }

  private sendDutchDownAuction(
    IdFirmClient,
    IdBranch,
    endListGoods,
    payCondFullObj,
    paymentPartObj,
    deliveryPeriodObj,
    basisObj
  ): void {
    const selectedGoodsType = this.getSelectedGoodsType();

    const body = {
      idSection: Number(this.sessionIds.sectionId),
      setDemandCounter: {
        idSession: Number(this.sessionIds.sessionId),
        idDemand: this.fullInfo.generalInfo.idDemandOffer,
        sellerIdClient: IdFirmClient,
        sellerContractType:
          this.infoForm.get('participant').value == role.broker
            ? this.infoForm.get('contractType').value
            : null,
        sellerIdBranch: IdBranch,
        idCurrency: +this.dutchDownAuctionForm.get('idCurrency')?.value,
        idVatPercent: +this.dutchDownAuctionForm.get('vatPercent')?.value,
        isPriceAdjusted: this.adjustablePrice,
        listDeletedClients: this.tradingService.deletedScopeForCounter,
      },
      payCondFull: payCondFullObj,
      paymentPart: paymentPartObj,
      deliveryPeriod: deliveryPeriodObj,
      delivConditions: basisObj,
      [selectedGoodsType]:
        selectedGoodsType === SelectedGoodsType.Goods
          ? endListGoods
          : endListGoods[0],
    };

    this.counterService
      .setDemandCounter(this.user?.token, body)
      .subscribe(() => {
        let message = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'counterOffers.counterSubmittedSuccessfully');
        this.toastService.onShowToast({ message: message, type: 'success' });
        this.onClose.emit(true);
      });
  }

  private getSelectedGoodsType(): string {
    const allowAnalog = this.isAllowAnalog();

    switch (true) {
      case !allowAnalog:
        return SelectedGoodsType.Goods;

      case allowAnalog:
        return SelectedGoodsType.AnalogGood;

      default:
        return SelectedGoodsType.Goods;
    }
  }

  private processSumVat(idVatPercent: string, costWithoutVAT: string): number {
    const vat: number = this.findVatPercent(idVatPercent);
    const costWithoutVatNumber: number = this.processCostWithotVat(costWithoutVAT);
    const rawResult: number = costWithoutVatNumber * (vat / FULL_PERCENT);

    let amountVATTotal: number = 0;
    let costVATTotal: number = 0;

    //пересчитываем табличные стоимости с/без НДС
    this.fullInfo?.goods.forEach((good) => {
      good.goodsSpecifications.forEach((item) => {
        let count: number = Number(
          good.goodsSpecifications.find(
            (field) => field.idInterfaceField == IdInterfaceField.quantity
          ).fieldValueNumber
        );
        let priceWithoutVat: number = Number(
          good.goodsSpecifications.find(
            (field) =>
              field.idInterfaceField == IdInterfaceField.priceWithoutVAT
          ).fieldValueNumber
        );

        let costWithoutVAT: number = round(
          count * priceWithoutVat,
          this.currencyPrecision
        );

        let amountVAT: number = costWithoutVAT * (vat / FULL_PERCENT);

        if (item.costWithoutVAT || item.costWithoutVAT === 0) {
          item.costWithoutVAT = costWithoutVAT;
          item.fieldValue = costWithoutVAT;
        }
        if (item.amountVAT || item.amountVAT === 0) {
          item.amountVAT = amountVAT;
          item.fieldValue = amountVAT;
          amountVATTotal = amountVATTotal + item.amountVAT;
        }
        if (item.costVAT || item.costVAT === 0) {
          item.costVAT = costWithoutVAT + amountVAT;
          item.fieldValue = costWithoutVAT + amountVAT;
          costVATTotal = costVATTotal + item.costVAT;
        }
      });
    });

    this.totalForm.controls.amountVAT.patchValue(
      Number(amountVATTotal).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
        ' ' +
        this.fullInfo?.goods?.[0]?.currency
    );

    this.totalForm.controls.costVat.patchValue(
      Number(costVATTotal).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
        ' ' +
        this.fullInfo?.goods?.[0]?.currency
    );

    this.totalRowData = this.totalForm.value;

    return parseFloat(rawResult.toFixed(2));
  }

  private processCostWithotVat(str: string): number {
    const tmp = str?.replace(/[^0-9,.\-]+/g, '');
    if (tmp?.includes('.') && tmp?.includes(',')) {
      return parseFloat(tmp?.replace(/,/g, ''));
    }
    return parseFloat(tmp?.replace(',', '.'));
  }

  private parseVatOrDefault(input: string): number {
    if (input === VALUE_WITHOUT_VAT_ID) return NO_VAT_RATE; // для без НДС возвращаем 0

    const m = input?.match(/(\d+(?:[.,]\d+)?)/);
    if (!m) return DEFAULT_VAT_RATE;
    return parseFloat(m[1]?.replace(',', '.'));
  }

  private findVatPercent(idVatPercent: string): number {
    return this.parseVatOrDefault(this.getVatAmountString(idVatPercent));
  }

  public getVatAmountString(idVatPercent: string): string {
    return this.amountVat()?.find((vatPercent) => vatPercent.id === idVatPercent)?.name;
  }

  private buildFormValues(
    isSend: boolean,
    idCurrency: number,
    vatPercent: number,
    specs: IGoodsSpecifications[]
  ): IDutchDownSubmiting {
    if (isSend) {
      return {
        idCurrency: idCurrency?.toString() ?? null,
        vatPercent: vatPercent?.toString() ?? null,
      };
    }

    const fieldMap: Partial<
      Record<IdInterfaceField, keyof IDutchDownSubmiting>
    > = {
      [IdInterfaceField.currency]: 'idCurrency',
      [IdInterfaceField.VATrate]: 'vatPercent',
    };

    return specs.reduce<IDutchDownSubmiting>(
      (acc, spec) => {
        const key = fieldMap[spec.idInterfaceField];
        if (key) {
          acc[key] = spec.fieldValueNumber?.toString() ?? null;
        }
        return acc;
      },
      { idCurrency: null, vatPercent: null }
    );
  }

  private setValueDutchDownAuctionForm(
    isSend: boolean,
    idCurrency: number,
    vatPercent: number
  ): void {
    const specs: IGoodsSpecifications[] =
      this.fullInfo.goods?.[0]?.goodsSpecifications ?? [];

    this.dutchDownAuctionForm.setValue(
      this.buildFormValues(isSend, idCurrency, vatPercent, specs)
    );
  }

  private loadRefbooks<T>(
    localData: T[] | undefined,
    fallback$: () => Observable<T[]>,
    targetSignal: WritableSignal<T[]>
  ): void {
    if (localData?.length) {
      targetSignal.set(localData);
    } else {
      fallback$()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((data) => targetSignal.set(data));
    }
  }
}