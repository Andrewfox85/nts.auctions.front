import { IEditOfferGoodsSpecifications } from './../../shared/interfaces/index';
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
  timberTicket,
  ID_STAT_DELIVERY,
  BELARUS_ID_LINK
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
} from '@services';
import { Subscription } from 'rxjs';
import moment from 'moment';
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
  upperCaseFirstLetter,
  round,
  getTranslateResultByCurrentLang,
  checkSameUnits,
  getVatNumber
} from '@helpers';
import {
  UpperCaseFirstLetterPipe,
  ActualDimensionsPipe,
  ToNumberPipe,
  RuNumberFormatPipe,
  GoodAnalogDescriptionPipe
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
  DxDateBoxModule,
  DxNumberBoxModule,
  DxCheckBoxModule,
  DxPopupModule,
} from 'devextreme-angular';
import { HomePageStore } from '../../views/homepage/store/homepage-store';
import {
  AUCTION_TYPE,
  DELIVERY_SCOPE_ITEMS,
  ID_DELIVERY_MOMENT,
  ID_DELIVERY_TYPE,
} from '../../shared/enums';
import { IdInterfaceField, FULL_PERCENT } from '@constants';
import { GlobalStore } from '@store';
import { SortActualDimensionsPipe } from '../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe';

import { MessagePopupComponent } from './../popups/message-popup/message-popup.component';
import { convertExcelSerialDateToMs } from './../../views/homepage/helpers';
import { PlacesTree } from '../../services/submission-service/shared';
import { IMainBasis, DeliveryScope } from './interfaces';
import { DisplaySpecsDirective } from './../../shared/directives/display-specs-in-good-grid.directive';
import { DisableNumberBoxWheel } from "../../shared/directives/disable-number-box-wheel";
import { ValueChangedEvent as TextBoxValueChangedEvent } from "devextreme/ui/text_box";
import { EditDemandOfferServiceService } from "../../services/edit-demand-offer-service.service";
import { OffersAdditionalInfoComponent } from '../../features/trading/components/offers-additional-info/offers-additional-info.component';

export interface RefBook {
  id: string;
  name: string;
  description: string | null;
}

export interface OutputRefsResult {
  idReference: number;
  idValue: number;
}

export enum SelectedGoodsType {
  Goods = 'goods',
  AnalogGood = 'analogGood',
}

@Component({
  selector: 'app-submitting-counter-offer',
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
    DxDateBoxModule,
    DxNumberBoxModule,
    DxCheckBoxModule,
    DxPopupModule,
    FormsModule,
    ReactiveFormsModule,
    UpperCaseFirstLetterPipe,
    ActualDimensionsPipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    SortActualDimensionsPipe,
    MessagePopupComponent,
    OffersAdditionalInfoComponent,
    DisplaySpecsDirective,
    GoodAnalogDescriptionPipe,
    DisableNumberBoxWheel
  ],
  templateUrl: './submitting-counter-offer.component.html',
  styleUrls: ['./submitting-counter-offer.component.scss'],
})
export class SubmittingCounterOfferComponent implements OnInit {
  public readonly idDemandOffer = input.required<number>();
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
  private readonly globalStore = inject(GlobalStore);
  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);

  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;

  @Input() fullInfo;
  @Input() fullInfoCopy;
  @Input() deliveryTerm;
  @Input() termsConditionsPayment;
  @Input() sessionIds;
  @Input() idOffer;
  @Input() deliveryConditions;
  @Input() goodsOriginal;
  @Input() editRulesIntersections;
  @Input() deliveryScopes: DeliveryScope[];

  @Output() onClose = new EventEmitter();

  @ViewChild('endValidator', { static: false })
  public endValidator: DxValidatorComponent;
  @ViewChild('termsPayment', { static: false })
  public validationGroup: DxValidationGroupComponent;
  @ViewChild(DxTreeViewComponent, { static: false })
  public treeView: DxTreeViewComponent;
  @ViewChild('dataGoodTable', { static: false })
  public dataGridGood: DxDataGridComponent;
  @ViewChild('goodFormValid', { static: false })
  goodFormValidationGroup: DxValidationGroupComponent;

  public setFocus(e): void {
    setTimeout(() => {
      e.component.focus();
    });
  }

  public openSimilarProducts = false;

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
  public VatField: any;
  public currencyPrecision: number;
  public totalRowData: any; //инфа в строку Итого по товарам
  public goodInfo = false;
  public viewInfoGood = null;
  public deliveryConditionsChoose = []; //выбранный базис

  public uniqueDeliveryTerm = [];
  public uniqueDelConditions = []; // уникальные значения в массиве deliveryConditions

  public deliveryTermForm = this.formBuilder.group({
    startDelivery: [null, [Validators.required]],
    deliveryType: [null, [Validators.required]],
    deliveryTerm: [40, [Validators.required]],
    startDate: [new Date(), [Validators.required]],
    endDate: [new Date(), [Validators.required]],
  });

  public disableChangeBasis: boolean = false;
  public isDisabledAdjustablePrice: boolean = false;
  public goodForm: any = this.formBuilder.group({});

  public editingRules = editingRules;

  public isDisabledMainButton = true; // дизэблим основную кнопку подачи
  public disabledMakeCounter = false; // параметр для блокировки кнопки, так как неподходящий период или состояние
  public adjustablePrice;

  public AgreementType = AgreementType; //ids договоров

  public dateSessionPlusDay = new Date();
  public dateSession = new Date();

  public messagePopup: boolean;
  public messageString: string;

  public changeBrokerClinet(): void {
    this.infoForm.get('listClientBranch').reset();
    this.onChooseBroker();
    // this.isDisabledMainButton = false;
  }

  public get isQuantityDecreaseAllowed(): boolean {
    const isNoDeliveryScopes: boolean =
      this.fullInfo.deliveryScopes?.length === 0 ||
      this.fullInfo.deliveryScopes?.length === 1;

    return (
      isNoDeliveryScopes &&
      this.editRuleInIntersections(IdInterfaceField.quantity) === editingRules.decreaseValue
    );
  }

  public get isQuantityEditingDisabled(): boolean {
    return (
      this.fullInfo.deliveryScopes?.length > 1 ||
      this.editRuleInIntersections(IdInterfaceField.quantity) === editingRules.editingIsNotAvailable
    );
  }

  public ngOnInit(): void {
    this.dateSessionPlusDay.setDate(this.dateSessionPlusDay.getDate() + 1);

    this.setChangeVolume();
    this.setMainBasis();
    this.setAdjustablePrice();
    this.checkForDisableTheAdjustedPrice();
    this.setIsCanSchedule();
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

  private convertDate(date): any {
    return date ? convertExcelSerialDateToMs(date) : null;
  }

  private setAdjustablePrice(): void {
    this.adjustablePrice = this.getValue(
      this.fullInfo.goods[0].goodsSpecifications,
      IdInterfaceField.adjustedPrice
    );
  }

  private checkForDisableTheAdjustedPrice(): void {
    // дизейблим ли корректируемую цену
    if (this.fullInfo.deliveryPeriod.idDeliveryType == ID_DELIVERY_TYPE.DATE) {
      this.isDaysCountCorrect =
        this.getDaysCount(
          this.convertDate(this.fullInfo.deliveryPeriod?.dateBegin),
          this.convertDate(this.fullInfo.deliveryPeriod?.dateEnd),
          0,
          0
        ) >= minDeliveryScheduleDaysCount;
    } else {
      this.isDaysCountCorrect =
        this.getDaysCount(
          this.deliveryTermForm.controls.startDate?.value,
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

  private counterOfferGetLast(): void {
    //предзаполняем данные, если раньше уже подавали встречку
    this.counterService
      .counterOfferGetLast(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idOffer
      )
      .subscribe((res) => {
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

        this.counterOfferGetLast();
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
        listClientBranchControl?.patchValue(
          this.listClientBranch[0].idFirmBranch
        );
      }
    } else {
      listClientBranchControl.clearValidators();
    }
    listClientBranchControl.updateValueAndValidity({ emitEvent: false });

    this.onContextCheckCounterState();
  }

  get disableBtnByBuyer() {
    //для дизэйбла кнопки по блоку Покупатель
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
      this.disableBtnByBuyer ||
      (this.brokerClientFull?.length === 0 &&
        this.listBranch?.length === 0 &&
        this.isBranchRequired) ||
      this.disabledMakeCounter ||
      this.deadlineErrorMess.length > 0
    );
  }

  changedMainBasis; //только для отображения при изменении на Франко-нижний лесосклад

  public isDataReset: boolean = false;  //признак, что данные по заявке сбросились до первоначальных

  public onContextCheckCounterState(): void {

    //если кнопка подачи была разблочена - проставляем признак, что данные по заявке сбросились до первоначальных
    if (!this.isDisabledMainButton) {
      this.isDataReset = true;
      this.isDisabledMainButton = true;
    }

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
        idOffer: this.idOffer,
      };

      this.counterService
        .checkCounterOfferState(
          this.user?.token,
          body,
          'CheckCounterOfferState'
        )
        .subscribe((res: any) => {
          this.stateMessage = res.stateMessage;
          this.isResident = res.isResident;
          /* Если:
          признак резидента true;
          и наименование базиса FCA с idValue 17;
          и заявка на продажу предполагает торги одновременно на внешний и внутренний рынок
      наименование надо подменять на ФРАНКО-НИЖНИЙ ЛЕСОСКЛАД (СКЛАД ПРЕДПРИЯТИЯ) */
          if (
            res.isResident &&
            this.fullInfo.generalInfo.isCombinedMarketTypes &&
            this.fullInfo.deliveryConditions.length > 0
          ) {
            this.changedMainBasis = this.fullInfo?.deliveryConditions.find(
              (basis) => basis.isMain == true
            );
            if (
              this.changedMainBasis.concatedCondition.includes('FCA') &&
              this.changedMainBasis.idBasisValue == 17
            ) {
              this.disableChangeBasis = true;
              this.changedMainBasis.concatedCondition =
                this.changedMainBasis.concatedCondition.replace(
                  'FCA Склад грузоотправителя РБ',
                  getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.FCAreplace')
                );
            }
          }

          if (
            res.isResident &&
            this.fullInfo.generalInfo.isCombinedMarketTypes
          ) {
            /*если признак резидента true - валюта из заявки заменяется на BYN с конвертацией цен*/

            this.demandService
              .getOfferShortInfo(
                this.user?.token,
                this.sessionIds.sectionId,
                this.sessionIds.sessionId,
                this.idOffer,
                CurrentTab.auctions,
                'GetOfferShortInfo',
                'IdOffer',
                '1'
              )
              .subscribe((res) => {
                this.fullInfo.generalInfo = res.generalInfo;
                this.currencyPrecision =
                  this.fullInfo.goods[0].goodsSpecifications.find(
                    (field) =>
                      field.idInterfaceField == IdInterfaceField.currency
                  )?.fieldValueNumber != 1
                    ? null
                    : this.currencyPrecision;
                this.fullInfo.goods = res.goods;
                this.fullInfo.deliveryConditions = res.deliveryConditions;
                this.resetBasisAfterChangedSeller();
                this.resetDeliveryScopes();
                this.getPrecision();
                this.isDataReset = false;
              });
          } else {
            /*если признак резидента false - НДС из заявки заменить на 0 (соответственно, сумма НДС 0 и к стоимости с НДС не добавляется)*/
            this.demandService
              .getOfferShortInfo(
                this.user?.token,
                this.sessionIds.sectionId,
                this.sessionIds.sessionId,
                this.idOffer,
                CurrentTab.auctions,
                'GetOfferShortInfo',
                'IdOffer',
                this.fullInfo.filterIdCurrency
              )
              .subscribe((res) => {
                this.fullInfo.generalInfo = res.generalInfo;
                this.fullInfo.goods = res.goods;
                this.fullInfo.deliveryConditions = res.deliveryConditions;
                this.resetBasisAfterChangedSeller();
                this.resetDeliveryScopes();
                this.getPrecision();
                this.isDataReset = false;
              });
          }
        });
    } else {
      this.getPrecision();
    }
  }

  private resetBasisAfterChangedSeller(): void {
    this.setMainBasis();
    this.choosenPlaceBasis = this.basisChooseValue = null;
    this.deliveryBasisCommon = [];
    this.basisForm.controls.basis.patchValue(null);
    this.basisForm.controls.placeName.patchValue(null);
    this.basisForm.controls.specifyingLocation?.patchValue(null);
  }

  private resetDeliveryScopes(): void {
    if (this.deliveryScopes?.length > 0) {
      const updateDeliveryScope = this.deliveryScopes?.map((scope) => {
        const newScope = structuredClone(scope);
        newScope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO][0].isDeletedScope = false;
        newScope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].forEach((good) => {
          good.volume = this.deliveryScopes
            .find((el) => el[DELIVERY_SCOPE_ITEMS.ID_SCOPE] === newScope[DELIVERY_SCOPE_ITEMS.ID_SCOPE])[DELIVERY_SCOPE_ITEMS.SCOPE_INFO]
            .find((g) => g.idDemandOfferGood == good.idDemandOfferGood).volume;
        });
        return newScope;
      });
      this.tradingService.sendChangeScope(updateDeliveryScope);
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

  get stringOfPrevBuyer(): string {
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
      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField == IdInterfaceField.VATrate
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
        let vat: number = getVatNumber(this.VatField);
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

    this.totalForm.controls.vat.patchValue(this.VatField.fieldValue); //Ставка НДС (%)
    if (this.onSameUnits) {
      //Количество
      let volumeSum = 0,
        precision;
      this.fullInfo.goods.forEach((good) => {
        let volume = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.quantity
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

  get onSameUnits(): boolean {
    return checkSameUnits(this.fullInfo.goods);
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

  calculate(idGood, idField) {
    //если зашли в calculate в результате сброса данных при смене клиента - ничего не делаем
    if (this.isDataReset) {
      return;
    }

    let vat: number = getVatNumber(this.VatField),
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
    if (idField == IdInterfaceField.quantity)
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
  placeDataBasis: PlacesTree[];
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
        (el) => el.idInterfaceField == IdInterfaceField.VATrate
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
      this.fullInfo.deliveryConditions =
        this.fullInfo.deliveryConditions.reduce(function (r, a) {
          //сгруппированы поля по concatedCondition
          r[a.concatedCondition] = r[a.concatedCondition] || [];
          r[a.concatedCondition].push(a);
          return r;
        }, {});
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
      this.deliveryConditions = this.deliveryConditions.filter(
        (cond) => !cond?.minAddBasis
      );
      this.basisValue = this.deliveryConditions;
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
          (el) => el.linkId === e.value.linkId
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
            el.linkId === e.value.linkId && el.placeLink === e.value.placeLink
        );

       //второе изменение базиса, те место назначения изменено и не равно месту из заявки
        if(this.basisChooseValue.linkId === this.mainBasis.idBasisLink && this.basisChooseValue.placeLink !== this.mainBasis.idPlaceLink) {
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

        if (this.basisChooseValue) {
          this.onCreateBasisString();
        }
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
            this.sessionIds.marketTypesIds
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

  public onChangeSpecifyingLocation(): void {
    //формируем итоговую строку только при наличии выбранного базиса
    if (Object.keys(this.basisChooseValue).length !== 0) {
      this.onCreateBasisString();
    }
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
        this.mainBasis.placeName = this.choosenPlaceBasis.valueName;
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
        this.mainBasis.idPlaceLink = this.choosenPlaceBasis.placeLink || this.choosenPlaceBasis.idLink || null;
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
  deliveryTermValue = [];
  deliveryTermConcated: string;
  deliveryTermType = [];
  deadlinePayment: number;
  deadlineDelivery: number;
  deadlineErrorMess: string = '';
  isDaysCountCorrect = false;
  isEditedDeliveryTerm = false;

  // открываем и заполняем форму срок поставки
  public changeDeliveryPeriod(): void {
    this.changeDeliveryPeriodForm = true;
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
        let dateBegin = this.convertDate(
          this.fullInfo.deliveryPeriod?.dateBegin
        );
        let dateEnd = this.convertDate(this.fullInfo.deliveryPeriod?.dateEnd);
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
    switch (str) {
      case 'deliveryStart': {
        //фильтрация deliveryTermType в соответствии с тем, что выбрано в "Начало поставки"
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
        this.deadlineDelivery = null;
        this.deadlinePayment = null;

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
        //очищаются все значения
        this.deliveryTermValue = [];
        this.deliveryTermForm.get('startDate').setValue(null);
        this.deliveryTermForm.get('endDate').setValue(null);
        this.deliveryTermForm.get('deliveryTerm').setValue(null);
        this.deliveryTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;

        //если период «Календарные дни» или «Месяцы»
        if (
          this.deliveryTermForm.controls.deliveryType.value == 1 ||
          this.deliveryTermForm.controls.deliveryType.value == 2
        ) {
          let during = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.during');
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
                  ' ' + getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.calendarDays'),
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
                  ' ' + getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.months'),
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

  public onCreateString(): void {
    if (this.deliveryTermForm.controls.startDelivery.value == 3) {
      //если начало поставки «Начало поставки не задано»
      if (this.deliveryTermForm.controls.endDate.value) {
        //проверка заполнение поля «Дата окончания поставки»
        this.getDeliveryTermConcated();
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
              : this.getDeliveryTermConcated();

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
            this.getDeliveryTermConcated();

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

    if (this.isEditedDeliveryTerm) {
      if (this.isDaysCountCorrect) {
        this.adjustablePrice =
          this.getValue(
            this.fullInfo.goods[0].goodsSpecifications,
            IdInterfaceField.adjustedPrice
          ) === 'true';
        this.isDisabledAdjustablePrice = false;
      } else {
        this.adjustablePrice = false;
        this.isDisabledAdjustablePrice = true;
      }
    }
  }

  private getDeliveryTermConcated(): void {
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
        if (this.deliveryTermConcated != null) {
          this.tradingService.editDeliveryParams({
            concatedStringDeliveryTerm: this.deliveryTermConcated,
          });
        }
        //если открыто срок поставки, то смотрим открыт ли условия оплаты
        if (
          this.deliveryTermConcated?.length > 0 &&
          ((this.paymentTermConcated?.length > 0 &&
            this.changePaymentCondForm) ||
            !this.changePaymentCondForm)
        ) {
          this.getDeadlines();
        }
      });
  }

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

  validateEndDate = () => {
    return this.deliveryTermForm.controls.startDate.value;
  };

  /*   deliveryTimeCondition() {
      return (this.deliveryTermForm.controls.startDelivery.value == 1 || this.deliveryTermForm.controls.startDelivery.value == 2 || this.deliveryTermForm.controls.startDelivery.value == 4)
        && (this.deliveryTermForm.controls.deliveryType?.value == 1 || this.deliveryTermForm.controls.deliveryType?.value == 2)
    }
*/
  //сохранить измненения в сроке поставки
  saveDeliveryPeriodForm() {
    this.fullInfo.deliveryPeriod.dateBegin = this.deliveryTermForm.get(
      'startDate'
    ).value
      ? toOADate(this.deliveryTermForm.get('startDate').value)
      : null;
    this.fullInfo.deliveryPeriod.dateEnd = this.deliveryTermForm.get('endDate')
      .value
      ? toOADate(this.deliveryTermForm.get('endDate').value)
      : null;
    this.fullInfo.deliveryPeriod.idDeliveryMoment = Number(
      this.deliveryTermForm.get('startDelivery').value
    );
    this.fullInfo.deliveryPeriod.idDeliveryType = Number(
      this.deliveryTermForm.get('deliveryType').value
    );
    this.fullInfo.deliveryPeriod.periodTypeValue =
      this.deliveryTermForm.get('deliveryTerm').value;
    this.fullInfo.generalInfo.concatedDeliveryPeriod =
      this.deliveryTermConcated;
    this.isEditedDeliveryTerm = false;
    this.changeDeliveryPeriodForm = false;
    if (this.isDisabledMainButton) {
      this.isDisabledMainButton = false;
    }
  }

  public closeDeliveryPeriodForm(): void {
    this.changeDeliveryPeriodForm = false;
    this.isEditedDeliveryTerm = false;
    this.deliveryTermForm.get('startDelivery').setValue(null);
    this.deliveryTermForm.get('deliveryType').setValue(null);
    this.deliveryTermForm.get('deliveryTerm').setValue(null);
    this.deadlineErrorMess = '';
  }

  // -----------------Блок Условия оплаты----------------------

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
  isEditedTermsPayment = false;
  dayTypePaymentConfig: any;
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

  //изменяем условия оплаты
  changePaymentCond(): void {
    this.changePaymentCondForm = true;
    //получаем справочник календарные и банковские дни
    this.commonService
      .getByName(this.user?.token, 'daytypes')
      .subscribe((res) => {
        this.dayTypePaymentConfig = res.refbooks;
      });

    this.tradingService
      .getPaymentConfig(this.user.token, this.sessionIds.sectionId)
      .subscribe((res) => {
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

  onTermsPaymentChange(str: string) {
    switch (str) {
      case 'termsPayment': {
        this.termsPaymentForm.controls.volume.reset();
        this.termsPaymentForm.controls.prepaymentAmount.reset();
        this.termsPaymentForm.controls.dayTypeId.reset();
        this.volumeTerms = [];
        this.paymentTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;

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
        this.termsConditions.volumes.forEach((item) => {
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
        this.termsPaymentForm.controls.defermentPeriodDate.setValue(null); //
        this.termsPaymentForm.controls.prepaymentPeriodDate.setValue(null); //
        this.termsPaymentForm.controls.defermentAmount.setValue(null);
        this.termsPaymentForm.controls.dayTypeId?.setValue(null);
        this.readOnlyDefermentAmount = true;
        this.momentPrepayment = null;
        this.momentDelay = null;
        this.paymentTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;
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
            this.termsPaymentForm.controls.prepaymentAmount.setValue(
              FULL_PERCENT
            ); //Размер предоплаты
          }
          //Условие оплаты в форме заявки = «Отсрочка»
          if (
            this.termsPaymentForm.controls.termsPayment?.value ==
            termsConditionsPaymentConst.paymentDeferment
          ) {
            this.termsPaymentForm.controls.defermentAmount.setValue(
              FULL_PERCENT
            ); //Размер отсрочки
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
              if (this.termsPaymentForm.controls.momentPrepayment?.value != timberTicket)
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
        this.deadlineDelivery = null;
        this.deadlinePayment = null;
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
            this.fullInfo.paymentCond.firstPaymentMomentId != timberTicket
          ) {
            let date = this.convertDate(
              this.fullInfo.paymentCond?.firstPeriodValueDate
            );
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
            this.termsPaymentForm.controls.momentPrepayment?.value == timberTicket
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
        this.deadlineDelivery = null;
        this.deadlinePayment = null;

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
              let date = this.convertDate(
                this.fullInfo.paymentCond?.firstPeriodValueDate
              );
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
          this.termsPaymentForm.controls.momentPrepayment?.value == timberTicket &&
          this.isEditedTermsPayment
        ) {
          this.termsPaymentForm.controls.defermentPeriodNumber.setValue(30);
          this.termsPaymentForm.controls.momentDelay2.setValue(
            this.momentDelayValues[0].id
          );
          this.termsPaymentForm.controls.defermentPeriod2.setValue(60);
        }
        if (
          this.termsPaymentForm.controls.momentPrepayment?.value == timberTicket &&
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
      this.termsPaymentForm.controls.momentPrepayment?.value == timberTicket &&
      FULL_PERCENT - this.termsPaymentForm.controls.prepaymentAmount?.value >
        40 &&
      this.termsPaymentForm.controls.defermentAmount2?.value
    );
  }

  onPrepaymentAmountChange() {
    //Условие оплаты в форме заявки = «Частичная предоплата» и (или) «Момент предоплаты» = «до выдачи лесорубочного билета»;
    if (
      this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment &&
      this.termsPaymentForm.controls.momentPrepayment?.value == timberTicket
    ) {
      let value =
      FULL_PERCENT - this.termsPaymentForm.controls.prepaymentAmount?.value;

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
        FULL_PERCENT - this.termsPaymentForm.controls.prepaymentAmount?.value
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
    FULL_PERCENT -
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
        FULL_PERCENT - this.termsPaymentForm.controls.defermentAmount.value
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
                  this.changeDeliveryPeriodForm) ||
                  !this.changeDeliveryPeriodForm)
              ) {
                this.getDeadlines();
              }

              this.timberTicket = false;
            });
        });
    }
  }

  private getDeadlines(): void {
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

    if (this.changeDeliveryPeriodForm) {
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
      deliveryTerm =
        this.fullInfo.deliveryPeriod.periodTypeValue?.toString() || null;
      startDate = this.fullInfo.deliveryPeriod?.dateBegin;
      endDate = this.fullInfo.deliveryPeriod?.dateEnd;
    }

    if (this.changePaymentCondForm) {
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
          this.isDisabledMainButton = false; //разблокировали кнопку
        },
        error: (error) => {
          this.deadlineErrorMess = error.title;
        },
      });
  }

  public savePaymentCondForm(): void {
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
          ? toOADate(this.termsPaymentForm.controls.prepaymentPeriodDate?.value)
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
    this.isEditedTermsPayment = false;
    this.changePaymentCondForm = false;
    this.termsPaymentForm.controls.termsPayment.reset(); //!перепроверять
    if (this.isDisabledMainButton) {
      this.isDisabledMainButton = false;
    }
  }

  public closePaymentCondForm(): void {
    this.changePaymentCondForm = false;
    this.isEditedTermsPayment = false;
    this.termsPaymentForm.controls.termsPayment.reset();
    this.deadlineErrorMess = '';
  }

  public nsiCharacteristics;

  public onRefsValuesChanged(values: OutputRefsResult[]): void {
    this.nsiCharacteristics = values;
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

    const adjustedPriceFromOffer: string = this.getValue(
      this.fullInfo.goods[0].goodsSpecifications,
      IdInterfaceField.adjustedPrice
    );

    let isSameAdjustedPrice: boolean = true;

    if (adjustedPriceFromOffer) {
      isSameAdjustedPrice = adjustedPriceFromOffer === this.adjustablePrice?.toString();
    }

    return (
      isSameBasis &&
      isSameDeliveryTerm &&
      isSamePaymentCond &&
      isSameVolume &&
      isSamePrice &&
      isSameAdjustedPrice
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

    let IdFirmClient = null;
    if (this.infoForm.get('participant').value == role.broker) {
      if (this.infoForm.get('contractType').value == AgreementType.Commission) {
        IdFirmClient = null;
      }

      if (this.infoForm.get('contractType').value == AgreementType.Agency) {
        if (this.infoForm.get('brokerClient').value)
          IdFirmClient = this.infoForm.get('brokerClient').value;
      }
    }

    let IdBranch = null;

    if (this.infoForm.get('participant').value === role.visitor) {
      if (this.infoForm.get('listBranch').value && (!this.listBranch || this.listBranch.length === 0)) {
        //регистрация со струкрутным была отклонена (ранее этим структурным подалась встречка)
        IdBranch = null;
      } else {
        IdBranch = this.infoForm.get('listBranch').value;
      }
    } else if (this.infoForm.get('contractType').value === AgreementType.Agency) {
      IdBranch = this.infoForm.get('listClientBranch').value;
    }

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

      endListGoods = [
        ...endListGoods,
        {
          idGood:
            nsiGoodValues?.length > 0
              ? null
              : item.goodsSpecifications[0].idDemandOfferGood,
          idGoodFromFront: item.goodsSpecifications[0].idDemandOfferGood,
          nsiGoodValues: nsiGoodValues,
          idGoodName: item.idGoodName,
          idGoodGroup: item.idGoodGroup,
          idNomenclature: item.idNomenclatureGroup,
          properties: endProperties,
        },
      ];
    });

    //заявка может быть без базисов, тогда отправляем null
    let basisObj, idPlaceLink;
    idPlaceLink = this.choosenPlaceBasis?.placeLink || this.choosenPlaceBasis?.idLink || null;

    if (this.fullInfo?.deliveryConditions?.length > 0) {
      //если форма изменения открыта - берем из формы, нет - берем из общей инфы
      basisObj = this.changeDeliveryBasisForm
        ? {
            // goods: goodsForBasis,
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
    let payCondFullObj, paymentPartObj;

    if (this.changePaymentCondForm) {
      payCondFullObj =
        this.termsPaymentForm.controls.termsPayment?.value !=
        termsConditionsPaymentConst.partialPrepayment
          ? {
              idPaymentType: Number(
                this.termsPaymentForm.controls.termsPayment?.value
              ),
              idDayType:
                this.termsPaymentForm.controls.dayTypeId?.value || null,
              idShipmentVolume: Number(
                this.termsPaymentForm.controls.volume?.value
              ),
              idPaymentMoment:
                this.termsPaymentForm.controls.termsPayment?.value ==
                  termsConditionsPaymentConst.prepayment100 ||
                this.termsPaymentForm.controls.termsPayment?.value ==
                  termsConditionsPaymentConst.paymentThroughExchange
                  ? Number(
                      this.termsPaymentForm.controls.momentPrepayment?.value
                    )
                  : Number(this.termsPaymentForm.controls.momentDelay?.value),
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
      paymentPartObj =
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
                this.termsPaymentForm.controls.momentPrepayment?.value != timberTicket
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
                this.termsPaymentForm.controls.momentPrepayment?.value == timberTicket &&
                this.termsPaymentForm.controls.prepaymentAmount?.value < 60
                  ? this.termsPaymentForm.controls.defermentPeriod2?.value
                  : null,
            }
          : null;
    } else {
      payCondFullObj =
        this.fullInfo.paymentCond.idPaymentType !=
        termsConditionsPaymentConst.partialPrepayment
          ? {
              idPaymentType: this.fullInfo.paymentCond.idPaymentType,
              idDayType: this.fullInfo.paymentCond.idDayType,
              idShipmentVolume: this.fullInfo.paymentCond.idShipmentVolume,
              idPaymentMoment: this.fullInfo.paymentCond.firstPaymentMomentId,
              periodValueNumber:
                this.fullInfo.paymentCond.firstPeriodValueNumber,
              periodValueDate: this.fullInfo.paymentCond.firstPeriodValueDate,
            }
          : null;
      paymentPartObj =
        this.fullInfo.paymentCond.idPaymentType ==
        termsConditionsPaymentConst.partialPrepayment
          ? {
              idDayType: this.fullInfo.paymentCond.idDayType || null,
              idShipmentVolume: this.fullInfo.paymentCond.idShipmentVolume,
              idPaymentMomentPrepay:
                this.fullInfo.paymentCond.firstPaymentMomentId,
              firstPercent: this.fullInfo.paymentCond.firstPercent,
              firstPeriodValueNumber:
                this.fullInfo.paymentCond.firstPaymentMomentId != timberTicket
                  ? this.fullInfo.paymentCond.firstPeriodValueNumber
                  : null,
              idPaymentMomentDelay:
                this.fullInfo.paymentCond.secondPaymentMomentId,
              secondPercent: this.fullInfo.paymentCond.secondPercent,
              secondPeriodValueNumber:
                this.fullInfo.paymentCond.secondPeriodValueNumber || null,
              thirdPeriodValueNumber:
                this.fullInfo.paymentCond.firstPaymentMomentId == timberTicket &&
                this.fullInfo.paymentCond.firstPercent < 60
                  ? this.fullInfo.paymentCond.thirdPeriodValueNumber
                  : null,
            }
          : null;
    }

    let deliveryPeriodObj = this.changeDeliveryPeriodForm
      ? {
          idDeliveryMoment: this.deliveryTermForm.value.startDelivery,
          idPeriodType: this.deliveryTermForm.value.deliveryType,
          periodTypeValue: this.deliveryTermForm.value.deliveryTerm,
          dateBegin: this.deliveryTermForm.value?.startDate
            ? toOADate(this.deliveryTermForm.value?.startDate)
            : null,
          dateEnd: this.deliveryTermForm.value?.endDate
            ? toOADate(this.deliveryTermForm.value?.endDate)
            : null,
        }
      : {
          idDeliveryMoment: this.fullInfo.deliveryPeriod.idDeliveryMoment,
          idPeriodType: this.fullInfo.deliveryPeriod.idDeliveryType,
          periodTypeValue: this.fullInfo.deliveryPeriod.periodTypeValue,
          dateBegin: this.fullInfo.deliveryPeriod.dateBegin,
          dateEnd: this.fullInfo.deliveryPeriod.dateEnd,
        };

    if (this.compareConditions()) {
      this.messagePopup = true;
      this.messageString = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'counterOffers.sameConditions');
    } else {
      this.sendEnglishUpgradingAuction(
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

  private sendEnglishUpgradingAuction(
    IdFirmClient,
    IdBranch,
    endListGoods,
    payCondFullObj,
    paymentPartObj,
    deliveryPeriodObj,
    basisObj
  ): void {

     const deletedClients: number[] | null =
      this.tradingService.deletedScopeForCounter?.length > 0
        ? this.tradingService.deletedScopeForCounter
        : null;

    const body = {
      idSection: Number(this.sessionIds.sectionId),
      setDemandOffer: {
        idSession: Number(this.sessionIds.sessionId),
        idOffer: this.fullInfo.generalInfo.idDemandOffer,
        buyerIdClient: IdFirmClient,
        buyerContractType:
          this.infoForm.get('participant').value == role.broker
            ? this.infoForm.get('contractType').value
            : null,
        buyerIdBranch: IdBranch,
        isPriceAdjusted: this.adjustablePrice,
        ...(deletedClients && { listDeletedClients: deletedClients })
      },
      goods: endListGoods,
      payCondFull: payCondFullObj,
      paymentPart: paymentPartObj,
      deliveryPeriod: deliveryPeriodObj,
      delivConditions: basisObj,
    };

    this.counterService
      .setOfferCounter(this.user?.token, body)
      .subscribe(() => {
        let message = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'counterOffers.counterSubmittedSuccessfully');
        this.toastService.onShowToast({ message: message, type: 'success' });
        this.onClose.emit(true);
      });
  }

  public closeMessagePopup(event) {
    this.messagePopup = event;
  }
}
