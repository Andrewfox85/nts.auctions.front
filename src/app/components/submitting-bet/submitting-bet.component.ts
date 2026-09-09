import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  Output,
  EventEmitter,
  signal,
  effect,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  pricingType,
  role,
  DX_MODULES,
  auctionType,
  IdDirection,
  ID_LOCATION_GOOD_REF,
  AgreementType,
  IdInterfaceField,
  CurrentTab,
  ACTUAL_SIZE_READINESS_FIELDS,
  ACTUAL_SIZE_FIELDS,
} from '@constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import RU from '@ru-translate';
import EN from '@en-translate';
import { User } from '@classes';
import {
  CommonService,
  TradingService,
  ToastService,
  ErrorServiceService,
  CurrencyService,
  BidService,
  DemandService,
} from '@services';
import { Observable, Subscription, catchError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { getNumber, round, checkSameUnits, getVatNumber } from '@helpers';
import {
  UpperCaseFirstLetterPipe,
  ActualDimensionsPipe,
  ToNumberPipe,
  RuNumberFormatPipe,
  GoodAnalogDescriptionPipe
} from '@pipes';
import {
  CheckBidderStatePayload,
  CheckBidderStateResponse,
} from '../../services/bid-service/shared';
import { AdditionalPurchaseFieldsComponent } from './additional-purchase-fields/additional-purchase-fields.component';
import { IReferences } from '../../views/homepage/interfaces';
import { map } from 'rxjs/operators';
import { ConfirmationOfPriceIncreaseComponent } from './confirmation-of-price-increase/confirmation-of-price-increase.component';
import { HomePageStore } from '../../views/homepage/store/homepage-store';
import { AUCTION_TYPE } from '@enums';
import { AnalogFormComponent } from './analog-form/analog-form.component';
import { AnalogsListPopupComponent } from './analogs-list-popup/analogs-list-popup.component';
import { AnalogBid, ReferenceValue, AnalogListItem } from './interfaces/index';
import { NOMENCLATURE_REF_ID, GOOD_GROUP_REF_ID } from './constants/index';
import { GlobalStore } from '@store';
import { SortActualDimensionsPipe } from "../../shared/pipes/sort-actual-dimensions/sort-actual-dimensions.pipe";
import { OffersAdditionalInfoComponent } from '../../features/trading/components/offers-additional-info/offers-additional-info.component';
import { NsiTreePopupComponent } from './nsi-tree-popup/nsi-tree-popup.component';

@Component({
  selector: 'app-submitting-bet',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
    UpperCaseFirstLetterPipe,
    ActualDimensionsPipe,
    ToNumberPipe,
    AdditionalPurchaseFieldsComponent,
    ConfirmationOfPriceIncreaseComponent,
    RuNumberFormatPipe,
    AnalogFormComponent,
    AnalogsListPopupComponent,
    SortActualDimensionsPipe,
    OffersAdditionalInfoComponent,
    GoodAnalogDescriptionPipe,
    NsiTreePopupComponent
  ],
  templateUrl: './submitting-bet.component.html',
  styleUrls: ['./submitting-bet.component.scss'],
})
export class SubmittingBetComponent implements OnChanges {
  public readonly idDemandOffer = input.required<number>();
  public readonly isAllowAnalog = input<boolean>();
  public readonly isAvailableAnalogList = input<boolean>()
  private readonly currencyService = inject(CurrencyService);
  private readonly bidService = inject(BidService);
  private readonly demandService = inject(DemandService);
  private readonly homePageStore = inject(HomePageStore);

  public readonly idAuctionType = this.homePageStore.idAuctionType();

  public readonly globalStore = inject(GlobalStore);
  public readonly auctionType = auctionType;
  public readonly IdDirection = IdDirection;
  public readonly AgreementType = AgreementType;
  public readonly IdInterfaceField = IdInterfaceField;
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;


  @Input() fullInfo;
  @Input() sessionIds;
  @Input() idOffer;

  @Output() onClose = new EventEmitter();

  subscription: Subscription;

  role = role;
  infoForm = this.formBuilder.group({
    participant: [],
    contractType: [],
    brokerClient: [null],
    listClientBranch: [null],
    listBranch: [null],
    deliveryBasis: [null],
    financesources: [null],
    purchasePurpose: [null],
    vatValue: [null],
  });

  totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  contractType = [];
  brokerClientFull = [];
  brokerClient = [];
  listClientBranch = [];
  isClientBranchRequired = false;
  listBranch = [];
  deliveryBasis = [];
  financesources = [];
  purchasePurpose = [];

  mainBasis: any;
  user: User;
  isBranchRequired = false; // признак 0/1, что указание структурного подразделения является обязательным

  isTookParticipate = false; // трейдер в принципе принимал участие в торгах по данной заявке
  isMinPriceOnBasicBasis = false; //Минимальная цена на основном базисе поставки

  disabledAssignments = false; //дизейблим договор поручения
  disabledCommission = false; //дизейблим договор комиссии

  isResident: boolean; //признак 0/1 резидента
  isNeedPurchasePurpose: boolean; //признак 0/1 необходимости указания цели приобретения при подаче ставки
  stateMessage: string; //сообщение для отображения после контекстной проверки
  isSelfCompetition: boolean; //признак конкуренции между двумя трейдерами одной фирмы
  buySaleCond: boolean = false; //блок Условия продажи/покупки
  termsDeliveryTime: boolean = false; //блок Условия поставки
  expandTable: boolean = false;

  bidCost: string;
  pricingType = pricingType;
  VatField: any;
  currencyPrecision: number;
  totalRowData: any; //инфа в строку Итого по товарам
  goodInfo = false;
  viewInfoGood = null;
  deliveryConditionsChoose = []; //выбранный базис

  stepCount: number = 0; //счетчик шага цены
  stepCountBidNumber: number = 0; //счетчик шага цены, который приходит из заявки
  selfCompetitionPopup = false; //попап окно для подтверждения повышения собственной цены

  disabledMakeBid = false; //параметр для блокировки купить лот и изменения ставки, так как неподходящий период или состояние

  changedMainBasis: any;

  vatDataSource: IReferences[];
  locationGoodDataSource: IReferences[];
  minPrice: number;

  CURRENCY_BYN = '1'; //Фильтр валют BYN

  loadingVisible = false;

  public analogsBidsList: AnalogBid[];
  public analogsListPopup: boolean = false;
  public nsiTreePopup: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private tradingService: TradingService,
    public commonService: CommonService,
    public toastService: ToastService,
    public errorServiceService: ErrorServiceService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sessionIds']) {
      //изменился период или он не активен
      if (
        !changes['sessionIds'].currentValue.session.isActive ||
        ![2, 4].includes(
          changes['sessionIds'].currentValue.session.idSessionPeriod
        )
      ) {
        this.disabledMakeBid = true;
      } else this.disabledMakeBid = false;

      //изменили шаг цены
      if (
        changes['sessionIds'].previousValue &&
        changes['sessionIds'].previousValue.session.options.priceUpPoints !=
          changes['sessionIds'].currentValue.session.options.priceUpPoints
      ) {
        this.priceWithoutVAT();
      }
    }
    //обновить инфу после нажатия подача ставки или когда переключили на другую заявку   todo иногда происходит двойной вызов после переключения офера
    if (
      (changes['idOffer'] &&
        changes['idOffer'].previousValue != changes['idOffer'].currentValue) ||
      (changes['fullInfo'] &&
        !changes['fullInfo'].firstChange &&
        changes['fullInfo'].previousValue.generalInfo.idDemandOffer ==
          changes['fullInfo'].currentValue.generalInfo.idDemandOffer)
    ) {
      this.subscription?.unsubscribe();
      this.deliveryConditionsChoose = [];
      this.mainBasis = null;
      this.deliveryBasis = [];
      this.contractType = [];
      this.brokerClientFull = [];
      this.brokerClient = [];
      this.listClientBranch = [];
      this.isClientBranchRequired = false;
      this.listBranch = [];
      this.financesources = [];
      this.purchasePurpose = [];
      this.isMinPriceOnBasicBasis = false;
      this.infoForm.get('participant').reset();
      this.infoForm.get('deliveryBasis').reset();
      this.infoForm.get('financesources').reset();
      this.infoForm.get('purchasePurpose').reset();
      this.onInit();
    }
  }

  private onInit(): void {
    this.loadingVisible = true;
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.getBranchesListFirm();
    this.getListBranchesOfAllClients();

    if (this.isSimpleBuyerAuction) {
      this.getRefValue('vatpercents').subscribe((refs: IReferences[]) => {
        this.vatDataSource = refs;
      });

      this.commonService
        .getById(
          this.user?.token,
          ID_LOCATION_GOOD_REF,
          this.sessionIds.sectionId
        )
        .subscribe((res: any) => (this.locationGoodDataSource = res.data));
    }

    //запрашиваем инфу о товарах-аналогах из сформированного списка
    if (this.isAllowAnalog()) {
      this.getListDemandAnalogBidInfo();
    }
  }

  public getListDemandAnalogBidInfo(): void {
    this.bidService
      .getListDemandAnalogBidInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idOffer
      )
      .subscribe((res) => {
        this.analogsBidsList = res.bids;
        //создаем массив для дальнейшей заполнения формы хар-к

        this.analogsBidsList.forEach((analog) => {
          analog.values.sort((a, b) => a.idReference - b.idReference);
        
          const obj: Record<number, number> = {};
          analog.values.forEach((val) => {
            obj[val.idReference] = val.idValue;
          });
      
          analog.listValuesForm = obj;
        });

        //если в аналогах допущен только 1 товар - предустанавливаем id товара для подачи ставки без выбора товара
        if (this.analogsBidsList?.length === 1) {
          this.idGood = this.analogsBidsList[0]?.idGood;
        }
      });
  }

  //условие для отображения модального окна с деревом НСИ при подаче заявки
  //признак isAvailableAnalogList nullable, при вызове функции bidInfo будет список товаров, допущенных к торгам
  //комбинация nullable + bidInfo характеризует первый период торгов для заявки, т.к. список еще не сформирован, но товары для торгов уже доступны
  public get isSpecialCondForMakingBid(): boolean {
    return this.isAvailableAnalogList() === null && this.analogsBidsList?.length > 0;
  }

  public openChoosingAnalog(): void {
    if (this.isSpecialCondForMakingBid) {
      this.nsiTreePopup = true;
    } else {
      this.analogsListPopup = true;
    }
  }

  public idGood: number;

  public onAddChoosenGood(event: AnalogListItem): void {
    this.globalStore.setAnalogGood(event);
    this.idGood = event.idGood;
  }
 
  public onAddNsiGood(event: AnalogListItem): void {
    this.globalStore.setAnalogGood(event);
    this.idGood = event.idGood;
  }

  public closeAnalogsListPopup(): void {
    this.analogsListPopup = false;
  }

  public closeNsiTreePopup(): void {
    this.nsiTreePopup = false;
  }
 
  getDestinationAndBidInfo() {
    this.fullInfo.goods.forEach((good) => {
      if (
        Object.keys(this.infoForm) ===
        good.goodsSpecifications[0].idDemandOfferGood.toString()
      ) {
        this.infoForm.removeControl(
          good.goodsSpecifications[0].idDemandOfferGood.toString()
        );
      }

      if (!this.isSimpleBuyerAuction) {
        let destination = this.getAllValues(
          good.goodsSpecifications,
          IdInterfaceField.destination
        );
        if (destination) {
          this.infoForm.addControl(
            good.goodsSpecifications[0].idDemandOfferGood.toString(),
            this.formBuilder.control(null, Validators.required)
          );
          destination.dataSource = good.goodsSpecifications.filter(
            (el) => el.idInterfaceField == this.IdInterfaceField.destination
          );
          if (destination.dataSource?.length == 1) {
            this.infoForm.controls[
              good.goodsSpecifications[0].idDemandOfferGood.toString()
            ].patchValue(destination.dataSource[0].fieldValueNumber);
          }
        }
      } else {
        this.infoForm.addControl(
          good.goodsSpecifications[0].idDemandOfferGood.toString(),
          this.formBuilder.control(null, Validators.required)
        );
      }
    });

    this.tradingGetLastBidInfo();
  }

  onChangedProductLocation(e): void {
    if (!e.previousValue) {
      this.fullInfo.goods.forEach((good) => {
        this.infoForm
          .get(good.goodsSpecifications[0].idDemandOfferGood.toString())
          .patchValue(e.value);
      });
    }
  }

  getFormattedRoles(): string {
    const result: string[] = [];

    // Добавляем роль участника
    const participantRole = this.getParticipantRole();
    if (participantRole) {
      result.push(participantRole);
    }

    // Добавляем тип договора
    const contractType = this.getContractType();
    if (contractType) {
      result.push(contractType);
    }

    // Добавляем информацию о клиенте
    const clientInfo = this.getClientInfo();
    if (clientInfo) {
      result.push(clientInfo);
    }

    // Добавляем информацию о структурном подразделении
    const branchInfo = this.getBranchInfo();
    if (branchInfo) {
      result.push(branchInfo);
    }

    return result.join(', ');
  }

  private getParticipantRole(): string | null {
    const participantValue = Number(this.infoForm.get('participant').value);

    if (participantValue === role.broker) {
      return this.translate.instant('general.brokerRole');
    }

    if (participantValue === role.visitor) {
      return this.translate.instant('general.visitorRole');
    }

    return null;
  }

  private getContractType(): string | null {
    const contractTypeValue = Number(this.infoForm.get('contractType').value);

    if (contractTypeValue === AgreementType.Agency) {
      return this.translate.instant('general.agencyAgreement');
    }

    if (contractTypeValue === AgreementType.Commission) {
      return this.translate.instant('general.commissionAgreement');
    }

    return null;
  }

  private getClientInfo(): string | null {
    const brokerClientValue = Number(this.infoForm.get('brokerClient').value);
    const contractTypeValue = Number(this.infoForm.get('contractType').value);

    if (!brokerClientValue) {
      return null;
    }

    const clientPrefix = this.translate.instant('general.client') + ': ';

    if (contractTypeValue === AgreementType.Agency) {
      const clientName = this.getBranchValue(
        this.brokerClient,
        'idClient',
        brokerClientValue,
        'nameShort'
      );
      return clientPrefix + clientName;
    }

    if (contractTypeValue === AgreementType.Commission) {
      const commissionBranch = this.getCommissionBranch();
      return clientPrefix + commissionBranch;
    }

    return null;
  }

  private getBranchInfo(): string | null {
    const result: string[] = [];

    // Информация о структурном подразделении клиента брокера
    const clientBranchValue = this.infoForm.get('listClientBranch')?.value;
    if (clientBranchValue != null) {
      const branchName = this.getBranchValue(
        this.listClientBranch,
        'idFirmBranch',
        clientBranchValue,
        'nameShort'
      );
      result.push(branchName);
    }

    // Информация о структурном подразделении посетителя
    const branchValue = this.infoForm.get('listBranch')?.value;
    if (branchValue != null) {
      const branchName = this.getBranchValue(
        this.listBranch,
        'idFirmBranch',
        branchValue,
        'nameShort'
      );
      result.push(branchName);
    }

    return result.length > 0 ? result.join(', ') : null;
  }

  get isSimpleBuyerAuction(): boolean {
    return (
      this.sessionIds.session.idAuctionType ===
        auctionType.simpleBuyerAuction &&
      this.fullInfo.generalInfo.directionId === IdDirection.buy
    );
  }

  public isShowGoodField(field): boolean {
    if (ACTUAL_SIZE_READINESS_FIELDS.includes(
      field.idInterfaceField
    ) || !field.idInterfaceField) {
      return false;
    }

    switch (Number(this.fullInfo.generalInfo?.pricingTypeId)) {
      case pricingType?.price:
        return ![IdInterfaceField.quantity,
          IdInterfaceField.unit,
          IdInterfaceField.priceWithoutVAT,
          IdInterfaceField.currency,
          IdInterfaceField.VATrate,
          IdInterfaceField.destination].includes(
          field.idInterfaceField
        )


      case pricingType?.formulaWithQuotation:
        return ![
          IdInterfaceField.quantity,
          IdInterfaceField.unit,
          IdInterfaceField.priceWithoutVAT,
          IdInterfaceField.currency,
          IdInterfaceField.VATrate,
          IdInterfaceField.amendmentType,
          IdInterfaceField.amendment,
          IdInterfaceField.quoteCurrency,
          IdInterfaceField.quotation,
          IdInterfaceField.destination
        ].includes(field.idInterfaceField)

      case pricingType?.formulaWithoutQuotation:
        return ![IdInterfaceField.quantity,
          IdInterfaceField.unit,
          IdInterfaceField.currency,
          IdInterfaceField.VATrate,
          IdInterfaceField.amendmentType,
          IdInterfaceField.amendment,
          IdInterfaceField.destination].includes(
          field.idInterfaceField
        )

      default:
        return true;
    }
  }

  getRefValue(name): Observable<IReferences[]> {
    return this.commonService
      .getByName(this.user?.token, name, this.sessionIds.sectionId)
      .pipe(map((res: any) => res.refbooks));
  }

  isAgencyContract(): boolean {
    return (
      Number(this.infoForm.get('contractType').value) ===
        AgreementType.Agency &&
      this.infoForm.get('brokerClient').value &&
      this.listClientBranch.length > 0
    );
  }

  get isDisabledMinus(): boolean {
    return !this.isSimpleBuyerAuction
      ? this.getStepCounter()
      : !this.infoForm.get('vatValue')?.value ||
          this.fullInfo.goods.every((good) => {
            const price = good.goodsSpecifications.find(
              (el) => el.priceWithoutVat != null
            )?.priceWithoutVat;
            return Number(price) === Number(this.minPrice);
          });
  }

  get isDisabledPlus(): boolean {
    return this.isSimpleBuyerAuction
      ? !this.infoForm.get('vatValue')?.value || this.getStepCounter()
      : false;
  }

  getStepCounter(): boolean {
    const bidNumber = Number(!!this.fullInfo.generalInfo.bidDateFinish);
    const bidNumberAuction = this.isSimpleBuyerAuction
      ? -1 * bidNumber
      : bidNumber;
    return this.stepCount === bidNumberAuction;
  }

  private getPrecision(): void {
    if (!this.currencyPrecision)
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === 4
          )?.fieldValueNumber
        )
        .subscribe((res: number) => {
          this.currencyPrecision = res;
          this.minPrice = Math.pow(10, -1 * this.currencyPrecision);
          this.prepareGoods();
        });
    else this.prepareGoods();
  }

  async prepareGoods() {
    //добавляем в товары стоимость ндс/стоимость с/без ндс
    await this.fullInfo.goods.forEach((good) => {
      good.isOpened = this.isAllowAnalog() ? true : false; //для открытия подробного просмотра в таблице
      let destination = this.getAllValues(good.goodsSpecifications, 62);
      if (destination)
        destination.dataSource = good.goodsSpecifications.filter(
          (el) => el.idInterfaceField === IdInterfaceField.destination
        );

      if (
        this.fullInfo.generalInfo.pricingTypeId !=
        this.pricingType.formulaWithoutQuotation
      ) {
        // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
        let count = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === 1)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === 3)
            .fieldValueNumber
        ); //Цена без НДС
        let vat;

        if (this.VatField?.fieldValueNumber != 1) {
          vat = Number(this.VatField?.fieldValue.replace(/[^0-9]/g, ''));
        } else vat = 0;

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
            priceWithoutVat: priceWithoutVat,
            fieldName:
              this.translate.store.currentLang === 'RU'
                ? RU['viewOffer'].priceWithoutVAT
                : EN['viewOffer'].priceWithoutVAT,
            fieldValue: priceWithoutVat,
          },
          {
            costWithoutVAT: costWithoutVAT,
            fieldName:
              this.translate.store.currentLang === 'RU'
                ? RU['trading'].offersTable.costNoVAT
                : EN['trading'].offersTable.costNoVAT,
            fieldValue: costWithoutVAT,
          },
          {
            amountVAT: amountVAT,
            fieldName:
              this.translate.store.currentLang === 'RU'
                ? RU['trading'].offersTable.amountVAT
                : EN['trading'].offersTable.amountVAT,
            fieldValue: amountVAT,
          },
          {
            costVAT: costVAT,
            fieldName:
              this.translate.store.currentLang === 'RU'
                ? RU['trading'].offersTable.costVATShort
                : EN['trading'].offersTable.costVATShort,
            fieldValue: costVAT,
          }
        );
      }

      Object.assign(good, {
        currency: good.goodsSpecifications.find(
          (field) => field.idInterfaceField === 4
        ).fieldValue,
      }); //добавляем каждому товару Валюта

      if (
        this.fullInfo.generalInfo.pricingTypeId ===
        this.pricingType.formulaWithQuotation
      ) {
        let quoteCurrency = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === 55
        ).fieldValue; //Валюта котировки
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === 53
        ).fieldValueNumber; //Тип поправки
        /* let quotation = good.goodsSpecifications.find(field => field.idInterfaceField === 56).fieldValueNumber
        let amendment = good.goodsSpecifications.find(field => field.idInterfaceField === 54).fieldValueNumbe
       */
        Object.assign(good, {
          quoteCurrency: quoteCurrency,
          priceAdjustment: priceAdjustment,
        });
      }
      if (
        this.fullInfo.generalInfo.pricingTypeId ===
        this.pricingType.formulaWithoutQuotation
      ) {
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === 53
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }
    });

    if (this.onSameUnits) {
      //Количество
      let volumeSum = 0,
        precision;
      this.fullInfo.goods.forEach((good) => {
        let volume = good.goodsSpecifications.find(
          (field) => field.idInterfaceField === 1
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

    this.isMinPriceOnBasicBasis = this.fullInfo.generalInfo.isMinPriceMainBasis;

    /*------ базис поставки -------*/
    if (this.fullInfo.deliveryConditions?.length > 0) {
      this.fullInfo.deliveryConditions.forEach((basis) => {
        basis.idCondition =
          basis.idBasisLink +
          '-' +
          (basis.idPlaceLink != null ? basis.idPlaceLink : '') +
          '-' +
          (basis.placeDetails ? basis.placeDetails?.toLowerCase() : '');
      });

      let uniqueBasis = [
        ...new Map(
          this.fullInfo.deliveryConditions.map((item) => [
            item['concatedCondition'],
            item,
          ])
        ).values(),
      ];
      this.deliveryBasis = uniqueBasis.sort();
      this.mainBasis = this.fullInfo.deliveryConditions.filter(
        (el) => el.isMain
      );
      if (
        (!this.changedMainBasis || this.changedMainBasis?.length === 0) &&
        !this.isTookParticipate
      ) {
        if (this.deliveryBasis.length === 1) {
          this.infoForm
            .get('deliveryBasis')
            .patchValue(this.deliveryBasis[0].idCondition);
        } else {
          //предзаполняем главным базисом
          /*--- ставим главный базис первым в списке базисов ---*/
          let mainIndex = this.deliveryBasis.findIndex(
            (el) => el.idCondition === this.mainBasis[0].idCondition
          );
          this.deliveryBasis.splice(mainIndex, 1);
          this.deliveryBasis.unshift(this.mainBasis[0]);
          this.infoForm
            .get('deliveryBasis')
            .patchValue(this.mainBasis[0]?.idCondition);
        }
      }
      await this.onChangedBasis({
        value: this.infoForm.get('deliveryBasis').value,
      });
    } else this.changeTotalCost(); //сразу рассчитываем без базиса

    //получаем точность валюты
    if (
      this.fullInfo.generalInfo.pricingTypeId ===
      pricingType.formulaWithoutQuotation
    ) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField === 4
          ).fieldValueNumber
        )
        .subscribe((res: number) => {
          this.currencyPrecision = res;
          this.minPrice = Math.pow(10, -1 * this.currencyPrecision);
        });
    }

    this.loadingVisible = false;
  }

  // посетитель - структурные
  private getBranchesListFirm(): void {
    // this.CheckDemoffOwnerState()
    this.bidService
      .getListBranchesFirm(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        true
      )
      .subscribe((res) => {
        this.listBranch = res.branchesFirms;
        this.isBranchRequired = res.isBranchRequired;
        /*
      if(this.listBranch.length ===1 && this.isBranchRequired){
        this.infoForm.get('listBranch')?.patchValue(this.listBranch[0].idFirmBranch)
        this.onContextCheckBidderState()
      }*/
        //else this.getPrecision()//this.prepareGoods()
      });
  }

  // брокер - клиенты со структурными
  private getListBranchesOfAllClients() {
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
              (el) => Number(el.idContractType) === AgreementType.Agency
            ).length === 0;
          this.disabledCommission =
            this.brokerClientFull.filter(
              (el) => Number(el.idContractType) === AgreementType.Commission
            ).length === 0;
          this.initContractType();
        }
        this.getDestinationAndBidInfo();
      });
  }

  initContractType() {
    if (
      this.disabledAssignments === true &&
      this.disabledCommission === false
    ) {
      this.infoForm.controls.contractType.patchValue(20);
    } else this.infoForm.controls.contractType.patchValue(21);
    this.contractType = [
      {
        refBookKey: 20,
        refBookValue:
          this.translate.store.currentLang === 'RU'
            ? RU['general'].commissionAgreement
            : EN['general'].commissionAgreement,
        disabled: this.disabledCommission,
      },
      {
        refBookKey: 21,
        refBookValue:
          this.translate.store.currentLang === 'RU'
            ? RU['general'].agencyAgreement
            : EN['general'].agencyAgreement,
        disabled: this.disabledAssignments,
      },
    ];

    this.changeContractType({
      value: this.infoForm.controls.contractType.value,
    });
  }

  changeContractType(e) {
    this.brokerClient = this.brokerClientFull.filter(
      (el) => el.idContractType === e.value
    );
    this.infoForm.get('brokerClient').reset(null);
    this.infoForm.get('listClientBranch').reset(null);
    if (this.brokerClient.length === 1) {
      this.infoForm
        .get('brokerClient')
        ?.patchValue(
          Number(e.value) === AgreementType.Commission
            ? [this.brokerClient[0].idClient]
            : this.brokerClient[0].idClient
        );
      this.infoForm.get('listClientBranch').reset();
      this.onChooseBroker();
    } else if (Number(e.value) === AgreementType.Agency)
      this.onContextCheckBidderState();
  }

  onChooseBroker() {
    let branch = this.brokerClient.find(
      (el) =>
        Number(el.idClient) === Number(this.infoForm.get('brokerClient').value)
    );
    this.listClientBranch = branch?.branchesClients;
    this.isClientBranchRequired = branch?.isBranchRequired;
    if (this.listClientBranch?.length === 1 && this.isClientBranchRequired) {
      this.infoForm
        .get('listClientBranch')
        ?.patchValue(this.listClientBranch[0].idFirmBranch);
    }
    this.onContextCheckBidderState();
  }

  onContextCheckBidderState() {
    if (this.infoForm.get('participant').value) {
      let ListClients = [],
        IdBranch;
      if (Number(this.infoForm.get('participant').value) === role.broker) {
        if (
          this.infoForm.get('contractType').value == AgreementType.Commission
        ) {
          //договор комиссии
          if (this.infoForm.get('brokerClient').value?.length > 0)
            ListClients = this.infoForm
              .get('brokerClient')
              .value?.map((id) => id);
          else return;
        }

        if (this.infoForm.get('contractType').value == AgreementType.Agency) {
          //договор поручения
          if (this.infoForm.get('brokerClient').value)
            ListClients.push(this.infoForm.get('brokerClient').value);
          else return;

          //  this.infoForm.get('listClientBranch').value)
        }
      }

      IdBranch =
        Number(this.infoForm.get('participant').value) === role.visitor
          ? this.infoForm.get('listBranch').value
          : this.infoForm.get('contractType').value == AgreementType.Agency
          ? this.infoForm.get('listClientBranch').value
          : null;

      const body: Partial<CheckBidderStatePayload> = {
        idSection: this.sessionIds.sectionId,
        idSession: this.sessionIds.sessionId,
        [this.isSimpleBuyerAuction ? 'idDemand' : 'idOffer']: this.idOffer,
        idContractType:
          this.infoForm.get('participant').value == role.broker
            ? this.infoForm.get('contractType').value
            : null,
        listClients: ListClients,
        idBranch: IdBranch,
      };

      this.stateMessage = null;

      if (!this.isSimpleBuyerAuction)
        this.bidService
          .checkBidderStateOffer(this.user?.token, body)
          .subscribe((res) => {
            this.contextResult(res);
          });
      else
        this.bidService
          .checkBidderStateDemand(this.user?.token, body)
          .subscribe((res) => {
            this.contextResult(res);
          });
    } else this.getPrecision();
  }

  contextResult(res: CheckBidderStateResponse): void {
    this.stateMessage = res.stateMessage;
    if (!!this.stateMessage) {
      const errors = {
        error: true,
        errorStatus: 0,
        messageError: this.stateMessage,
      };
      this.errorServiceService.callErrorPopup(errors);
    }
    this.isResident = res.isResident;
    this.isNeedPurchasePurpose = res.isNeedPurchasePurpose;
    this.changedMainBasis = [];
    this.financesources = [];
    this.purchasePurpose = [];

    /*поле «Цель приобретения» отображается на форме подачи ставки если ставка направляется от резидента и включен режим «Цель приобретения»*/
    if (this.isResident && this.isNeedPurchasePurpose) {
      this.commonService
        .getByName(this.user?.token, 'purchasepurposes')
        .subscribe((res) => {
          this.purchasePurpose = res.refbooks;
          if (this.purchasePurpose?.length === 1) {
            this.infoForm
              .get('purchasePurpose')
              .patchValue(this.purchasePurpose[0].id);
          }
        });
    }

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
        this.changedMainBasis.concatedCondition =
          this.changedMainBasis.concatedCondition.replace(
            'FCA Склад грузоотправителя РБ',
            this.translate.store.currentLang == 'RU'
              ? RU['general'].FCAreplace
              : EN['general'].FCAreplace
          );

        this.changedMainBasis = [this.changedMainBasis];
        this.changedMainBasis[0].idCondition =
          this.changedMainBasis[0].idBasisLink +
          '-' +
          (this.changedMainBasis[0].idPlaceLink != null
            ? this.changedMainBasis[0].idPlaceLink
            : '') +
          '-' +
          (this.changedMainBasis[0].placeDetails
            ? this.changedMainBasis[0].placeDetails?.toLowerCase()
            : '');
        this.infoForm
          .get('deliveryBasis')
          .patchValue(this.changedMainBasis[0].idCondition);
      } else {
        this.changedMainBasis = [];
      }
    }
    /*----------- Государственные закупки -----------*/
    /*Если:
        если тип рынка заявки на продажу включает внутренний DOMESTIC ИЛИ импорт IMPORT
        покупатель резидент (контекстная проверка)*/
    if (
      !this.isSimpleBuyerAuction &&
      res.isResident &&
      (this.fullInfo.generalInfo.concatedMarketTypes.includes('Внутренний') ||
        this.fullInfo.generalInfo.concatedMarketTypes.includes('Импорт'))
    ) {
      this.bidService
        .tradingGetFinanceSource(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer,
          this.infoForm.get('contractType').value == '21'
            ? this.infoForm.get('brokerClient')?.value
            : ''
        )
        .subscribe((res) => {
          //this.commonService.getByName(this.user?.token, 'financesources').subscribe((res: any) => {
          this.financesources = res.financeSources;

          if (this.financesources.length == 1) {
            this.infoForm
              .get('financesources')
              .patchValue(this.financesources[0].id);
          }
        });
    }

    /*если признак резидента true - валюта из заявки заменяется на BYN с конвертацией цен*/
    const queryParams =
      this.idAuctionType === AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION
        ? 'IdOffer'
        : 'IdDemand';
    const typeRequest =
      this.idAuctionType === AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION
        ? 'GetOfferShortInfo'
        : 'GetDemandShortInfo';
    const idRequestForCounterOffer =
      this.idAuctionType === AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION
        ? this.idOffer
        : this.idDemandOffer();

    if (
      this.fullInfo.generalInfo.isCombinedMarketTypes &&
      !this.isSimpleBuyerAuction
    ) {
      if (res.isResident) {
        this.demandService
          .getOfferShortInfo(
            this.user?.token,
            this.sessionIds.sectionId,
            this.sessionIds.sessionId,
            idRequestForCounterOffer,
            CurrentTab.auctions,
            typeRequest,
            queryParams,
            this.CURRENCY_BYN
          )
          .subscribe((res) => {
            this.currencyPrecision =
              this.fullInfo.goods[0].goodsSpecifications.find(
                (field) => field.idInterfaceField == IdInterfaceField.currency
              )?.fieldValueNumber != 1
                ? null
                : this.currencyPrecision;

            this.processingGetShortInfo(res);
          });
      } else {
        /*если признак резидента false - НДС из заявки заменить на 0 (соответственно, сумма НДС 0 и к стоимости с НДС не добавляется)*/
        this.demandService
          .getOfferShortInfo(
            this.user?.token,
            this.sessionIds.sectionId,
            this.sessionIds.sessionId,
            idRequestForCounterOffer,
            CurrentTab.auctions,
            typeRequest,
            queryParams,
            this.fullInfo.filterIdCurrency
          )
          .subscribe((res) => {
            this.processingGetShortInfo(res);
          });
      }
    } else {
      this.getPrecision();
    }

    this.fullInfo.goods.forEach((good) => {
      let destination = this.getAllValues(
        good.goodsSpecifications,
        IdInterfaceField.destination
      );
      if (destination && destination?.dataSource?.length == 1) {
        this.infoForm.controls[
          good.goodsSpecifications[0].idDemandOfferGood.toString()
        ].patchValue(destination.dataSource[0].fieldValueNumber);
      }
    });
  }

  processingGetShortInfo(res): void {
    this.fullInfo.generalInfo = res.generalInfo;
    this.fullInfo.goods = res.goods;
    this.fullInfo.deliveryConditions = res.deliveryConditions;
    this.VatField = this.fullInfo.goods[0].goodsSpecifications.find(
      (field) => field.idInterfaceField === IdInterfaceField.VATrate
    ); //Ставка НДС
    this.getPrecision();
  }

  private tradingGetLastBidInfo() {
    //предзаполняем данные, если раньше уже подавали ставку

    if (!this.isSimpleBuyerAuction)
      this.bidService
        .tradingGetLastBidOfferInfo(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer
        )
        .subscribe((res) => {
          this.processingBidInfo(res);
        });
    else
      this.bidService
        .tradingGetLastBidDemandInfo(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer
        )
        .subscribe({
          next: (res) => this.processingBidInfo(res),
          error: (err) => {
            this.onClose.emit(true);
          },
        });
  }

  processingBidInfo(res): void {
    this.isTookParticipate = res.isTookParticipate;
    let openRole;
    if (this.isTookParticipate) {
      //если не первая подача ставки
      openRole = !res.contractType ? role.visitor : role.broker;
      this.infoForm.get('participant')?.patchValue(openRole);
      this.infoForm.get('contractType').patchValue(res.contractType); //тип договора
      this.infoForm
        .get('purchasePurpose')
        .patchValue(res.idPurchasePurpose?.toString());
      this.infoForm.get('financesources').patchValue(res.idFinance);
      if (res.destinations?.length > 0) {
        res.destinations.forEach((destination) => {
          this.infoForm
            .get(destination.idOfferGood.toString())
            .patchValue(destination.idDestination);
        });
      }

      if (res.locatGoods?.length > 0) {
        res.locatGoods.forEach((location) => {
          this.infoForm
            .get(location.idDemandGood.toString())
            .patchValue(location.idLocationGood.toString());
        });
      }

      this.brokerClient = this.brokerClientFull.filter(
        (el) => el.idContractType == res.contractType
      );
      this.infoForm.get('deliveryBasis').patchValue(res?.idCondition);
      if (res.idBranch) {
        //идентификатор структурного участника торгов или клиента по договору поручения, может быть NULL;
        if (res.contractType == 21)
          //поручения
          this.infoForm.get('listClientBranch').patchValue(res.idBranch);
        if (!res.contractType)
          this.infoForm.get('listBranch').patchValue(res.idBranch);
      }
      if (res.listClients.length > 0) {
        //идентификатор клиента
        if (res.contractType == 20) {
          this.infoForm.get('brokerClient').patchValue(res.listClients);
        }
        if (res.contractType == 21)
          this.infoForm.get('brokerClient').patchValue(res.listClients[0]);
        this.onChooseBroker();
      }
      if (
        openRole == role.visitor &&
        !(this.listBranch.length == 0 && !this.isBranchRequired)
      ) {
        this.onContextCheckBidderState();
      }
      if (res.idGood) {
        this.idGood = res.idGood;
      }
    } else {
      openRole =
        this.brokerClientFull?.length != 0
          ? role.broker
          : !(this.isBranchRequired && this.listBranch?.length == 0)
          ? role.visitor
          : null;
      this.infoForm.get('participant')?.patchValue(openRole);
      /*        if(this.fullInfo.deliveryConditions?.length > 0 ) {
      if (this.deliveryBasis.length == 1) {
        this.infoForm.get('deliveryBasis').patchValue(this.deliveryBasis[0].idCondition)
      } else {   //предзаполняем главным базисом
        /!*--- ставим главный базис первым в списке базисов ---*!/
        let mainIndex = this.deliveryBasis.findIndex(el => el == this.mainBasis[0])
        this.deliveryBasis.splice(mainIndex, 1)
        this.deliveryBasis.unshift(this.mainBasis[0])
        this.infoForm.get('deliveryBasis').patchValue(this.mainBasis[0]?.idCondition)
      }
    }*/
    }
    let step = !this.isSimpleBuyerAuction ? 1 : -1;
    this.stepCount = this.fullInfo.generalInfo.bidDateFinish ? step : 0;
    this.stepCountBidNumber = this.fullInfo.generalInfo.bidNumber || 0;
    if (
      openRole == role.visitor &&
      this.listBranch.length == 1 &&
      this.isBranchRequired
    ) {
      this.infoForm
        .get('listBranch')
        ?.patchValue(this.listBranch[0].idFirmBranch);
      // this.onContextCheckBidderState()
    }

    this.VatField = this.fullInfo.goods[0].goodsSpecifications.find(
      (field) => field.idInterfaceField === IdInterfaceField.VATrate
    ); //Ставка НДС

    if (res.idVatPercent) {
      this.onChangedAdditionalParam(res.idVatPercent.toString(), 'vatValue');
    }

    if (!this.isTookParticipate) {
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
        this.onContextCheckBidderState();
      } else this.getPrecision();

      if (this.isSimpleBuyerAuction) {
        this.onChangedAdditionalParam(this.VatField.fieldValueNumber.toString(), 'vatValue');
      }
    } else if (
      openRole == role.visitor &&
      this.listBranch.length == 0 &&
      !this.isBranchRequired
    ) {
      //если ранее подавали заявку посетителем без структурных
      this.onContextCheckBidderState();
    }

    this.isSelfCompetition = res.isSelfCompetition;
  }

  getBranchValue(array, idName, id, value) {
    return array?.length > 0
      ? array.find((el) => el[idName] === id)[value]
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

  public changeRole(roleId: number): void {
   this.infoForm.get('participant').patchValue(roleId);
    if (roleId === role.visitor) {
      this.infoForm.get('contractType').patchValue(null);
      this.onContextCheckBidderState();
    } else {
      this.initContractType();
    }
    this.financesources = [];
    this.purchasePurpose = [];
  }

  onChangedBasis(e) {
    this.deliveryConditionsChoose = [];
    this.deliveryConditionsChoose = this.fullInfo.deliveryConditions.filter(
      (el) => el.idCondition === e.value
    );
    if (
      this.fullInfo.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      this.changeTotalCost();
    }
  }

  public onChangedAdditionalParam(id: number, nameVariable: string): void {
    this.infoForm.controls[nameVariable].patchValue(id);
    if (nameVariable === 'vatValue') {
      this.VatField.fieldValue = this.vatDataSource.find(
        (el) => el.id === id
      ).name;
      this.VatField.fieldValueNumber = id;
      this.changeTotalCost();
    }
  }

  changeTotalCost() {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat =
      this.VatField?.fieldValueNumber != 1
        ? Number(this.VatField?.fieldValue.replace(/[^0-9]/g, ''))
        : 0;
    if (
      this.fullInfo.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      /*this.currencyService.getPrecision(this.user?.token, this.fullInfo.goods[0].goodsSpecifications.find(field => field.idInterfaceField == 4)?.fieldValueNumber).subscribe((res: number) => {
        this.currencyPrecision = res;*/
      this.fullInfo.goods.forEach((good) => {
        if (this.fullInfo.deliveryConditions.length > 0) {
          this.deliveryConditionsChoose.forEach((basis) => {
            if (
              basis.idDemandOfferGood ===
              good.goodsSpecifications[0].idDemandOfferGood
            ) {
              let count = Number(
                good.goodsSpecifications.find(
                  (field) => field.idInterfaceField === 1
                ).fieldValueNumber
              ); //количество
              let step, priceWithoutVat;
              if (
                this.fullInfo.generalInfo?.pricingTypeId === pricingType?.price
              ) {
                step = this.getStepPrice(good);
                priceWithoutVat =
                  this.stepCount === 0
                    ? basis?.priceWithoutVat
                    : basis?.priceWithoutVat + Number(step) * this.stepCount; //Цена без НДС
              }
              if (
                this.fullInfo.generalInfo?.pricingTypeId ===
                pricingType?.formulaWithQuotation
              ) {
                step = this.getAmendmentStep(good);
                priceWithoutVat =
                  good.goodsSpecifications.find(
                    (field) => field.idInterfaceField === 56
                  ).fieldValueNumber +
                  this.getAmendment(good) +
                  Number(step) * this.stepCount; //Цена без НДС
              }

              if (priceWithoutVat <= this.minPrice && this.isSimpleBuyerAuction) {
                priceWithoutVat = this.minPrice;
              }

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
                if (item.priceWithoutVat) {
                  item.priceWithoutVat = priceWithoutVat;
                  item.fieldValue = priceWithoutVat;
                }
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
            }
          });
        } else {
          let count = Number(
            good.goodsSpecifications.find(
              (field) => field.idInterfaceField === 1
            ).fieldValueNumber
          ); //количество

          let price: number = this.getPriceFromBasisForGood(
              good.goodsSpecifications[0].idDemandOfferGood,
              'priceWithoutVat'
            ); //Цена без НДС
          let step, priceWithoutVat;
          if (this.fullInfo.generalInfo?.pricingTypeId === pricingType?.price) {
            step = this.getStepPrice(good); //Number((this.sessionIds.session.options.priceUpPoints / 100 * price).toFixed(this.currencyPrecision))
            priceWithoutVat =
              this.stepCount === 0
                ? price
                : price + Number(step) * this.stepCount; //Цена без НДС
          }
          if (
            this.fullInfo.generalInfo?.pricingTypeId ===
            pricingType?.formulaWithQuotation
          ) {
            step = this.getAmendmentStep(good);
            priceWithoutVat =
              good.goodsSpecifications.find(
                (field) => field.idInterfaceField === 56
              ).fieldValueNumber +
              this.getAmendment(good) +
              Number(step) * this.stepCount; //Цена без НДС
          }

          if (priceWithoutVat <= this.minPrice && this.isSimpleBuyerAuction) {
            priceWithoutVat = this.minPrice;
          }

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
            if (item.priceWithoutVat) {
              item.priceWithoutVat = priceWithoutVat;
              item.fieldValue = priceWithoutVat;
            }
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
        }
      });

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

      this.bidCost = this.totalForm.controls.costVat.value;
      this.totalRowData = this.totalForm.value;
      //   })
    }
  }

  onViewInfo(good) {
    this.viewInfoGood = good.idGood;
    this.goodInfo = false;
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.fullInfo.goods);
  }

  getStepPrice(good) {
    let price, stepPrice;
    if (!this.fullInfo.generalInfo.isIndividualPriceStepUsed) {
      if (this.fullInfo.deliveryConditions.length > 0) {
        if (!this.isMinPriceOnBasicBasis) {
          this.deliveryConditionsChoose?.forEach((basis) => {
            if (
              basis.idDemandOfferGood ===
              good.goodsSpecifications[0].idDemandOfferGood
            ) {
              price =
                Number(basis?.priceStartWithoutVat) ||
                Number(basis?.priceWithoutVat);
            }
          });
        } else {
          //шаг цены рассчитывается на основном базисе; текущая цена каждого базиса изменяется на расчетную величину от основного базиса;
          let goodFromMainBasis = this.mainBasis.find(
            (basis) =>
              basis.idDemandOfferGood ===
              good.goodsSpecifications[0].idDemandOfferGood
          );
          price =
            Number(goodFromMainBasis?.priceStartWithoutVat) ||
            Number(goodFromMainBasis?.priceWithoutVat);
        }
      } else {
        price = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === 3)
            .fieldValueNumber
        );
      }
      stepPrice = Number(
        ((this.sessionIds.session.options.priceUpPoints / 100) * price).toFixed(
          this.currencyPrecision
        )
      );

      if (this.currencyPrecision === 0) {
        stepPrice = stepPrice > 1 ? stepPrice : 1;
      } else
        stepPrice =
          stepPrice > Math.pow(10, -1 * this.currencyPrecision)
            ? stepPrice
            : Math.pow(10, -1 * this.currencyPrecision);
    } else {
      //независимо от того, какой базис выбран, увеличивается на абсолютное значение шага цены для товара
      stepPrice = good.goodsSpecifications.find(
        (field) => field.idInterfaceField === 64
      ).fieldValueNumber; //индивидуальный шаг цены
    }
    return stepPrice;
  }

  getAmendment(good) {
    let amendment;
    if (this.fullInfo.deliveryConditions.length > 0) {
      this.deliveryConditionsChoose?.forEach((basis) => {
        if (
          basis.idDemandOfferGood ===
          good.goodsSpecifications[0].idDemandOfferGood
        ) {
          amendment =
            Number(basis?.priceStartAdjustment) ||
            Number(basis?.priceAdjustment);
        }
      });
    } else {
      amendment = Number(
        good.goodsSpecifications.find((field) => field.idInterfaceField === 54)
          .fieldValueNumber
      );
    }
    if (amendment) {
      if (good.priceAdjustment === 1) {
        // %
        let quotation = Number(
          good.goodsSpecifications.find(
            (field) => field.idInterfaceField === 56
          ).fieldValueNumber
        );
        amendment = (quotation * amendment) / 100;
      }
    }
    return amendment ? Number(amendment.toFixed(this.currencyPrecision)) : null;
  }

  getAmendmentStep(good) {
    let amendment;
    amendment = this.getAmendment(good);
    return Number(
      (
        (this.sessionIds.session.options.priceUpPoints / 100) *
        amendment
      ).toFixed(this.currencyPrecision)
    );
  }

  getValue(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField === idInterfaceField
    )?.fieldValue;
  }

  getAllValues(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField === idInterfaceField
    );
  }

  getNumberCost(value, field) {
    return value?.find((el) => el[field] || el[field] === 0)?.fieldValue || 0;
  }

  getPriceFromBasisForGood(idGood, nameField) {
    let price;
    if (this.fullInfo.deliveryConditions.length > 0) {
      if (this.deliveryConditionsChoose.length > 0)
        price =
          Number(
            this.deliveryConditionsChoose.find(
              (b) => b.idDemandOfferGood === idGood
            )?.[nameField]
          ) || null;
    } else {
      //если нет базисов, берем из товара
      if (this.fullInfo.generalInfo?.pricingTypeId != pricingType?.price) {
        //с поправкой
        if (nameField === 'priceStartWithoutVat')
          //стартовая
          price = Number(
            this.fullInfo.goods
              .find(
                (good) =>
                  good?.goodsSpecifications[0].idDemandOfferGood === idGood
              )
              ?.goodsSpecifications?.find((el) => el.idInterfaceField === 61)
              .fieldValueNumbe
          );
        //стартовая поправка (на начало торгов)
        else
          price = getNumber(
            this.getValue(
              this.fullInfo.goods.find(
                (good) =>
                  good?.goodsSpecifications[0].idDemandOfferGood === idGood
              )?.goodsSpecifications,
              54
            )
          );
      } else {
        if (nameField === 'priceStartWithoutVat')
          price = Number(
            this.fullInfo.goods
              .find(
                (good) =>
                  good?.goodsSpecifications[0].idDemandOfferGood === idGood
              )
              ?.goodsSpecifications?.find((el) => el.idInterfaceField === 60)
              .fieldValueNumber
          );
        //стартовая цена (на начало торгов)
        else
          price = getNumber(
            this.getValue(
              this.fullInfo.goods.find(
                (good) =>
                  good?.goodsSpecifications[0].idDemandOfferGood === idGood
              )?.goodsSpecifications,
              3
            )
          );
      }
    }
    return price;
  }

  priceWithoutVAT() {
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat =
      this.VatField?.fieldValueNumber != 1
        ? Number(this.VatField?.fieldValue.replace(/[^0-9]/g, ''))
        : 0;
    this.fullInfo.goods.forEach((good) => {
      let step, price;
      if (this.fullInfo.generalInfo?.pricingTypeId === pricingType?.price) {
        //шаг_цены * количество_кликов + текущая _стоимость
        step = this.getStepPrice(good); //Number((this.sessionIds.session.options.priceUpPoints / 100 * this.getPriceFromBasisForGood(good.goodsSpecifications[0].idDemandOfferGood)).toFixed(this.currencyPrecision))
        price =
          Number(step) * this.stepCount +
          this.getPriceFromBasisForGood(
            good.goodsSpecifications[0].idDemandOfferGood,
            'priceWithoutVat'
          );
      }
      if (
        this.fullInfo.generalInfo?.pricingTypeId ===
        pricingType?.formulaWithQuotation
      ) {
        step = this.getAmendmentStep(good);
        price =
          good.goodsSpecifications.find(
            (field) => field.idInterfaceField === 56
          ).fieldValueNumber +
          this.getAmendment(good) +
          Number(step) * this.stepCount; //Цена без НДС
      }

      if (price <= this.minPrice && this.isSimpleBuyerAuction) {
        price = this.minPrice;
      }

      good.goodsSpecifications.find(
        (el) => el.priceWithoutVat
      ).priceWithoutVat = price;
      good.goodsSpecifications.find((el) => el.priceWithoutVat).fieldValue =
        price;

      let count = Number(
        good.goodsSpecifications.find((field) => field.idInterfaceField === 1)
          .fieldValueNumber
      ); //количество
      let costWithoutVAT = round(count * price, this.currencyPrecision);
      let amountVAT = round(
        costWithoutVAT * (vat / 100),
        this.currencyPrecision
      );
      let costVAT = costWithoutVAT + amountVAT;

      good.goodsSpecifications.find((el) => el.costWithoutVAT).costWithoutVAT =
        costWithoutVAT;
      good.goodsSpecifications.find((el) => el.costWithoutVAT).fieldValue =
        costWithoutVAT;

      good.goodsSpecifications.find((el) => el.costVAT).costVAT = costVAT;
      good.goodsSpecifications.find((el) => el.costVAT).fieldValue = costVAT;

      good.goodsSpecifications.find(
        (el) => el.amountVAT || el.amountVAT === 0
      ).amountVAT = amountVAT;
      good.goodsSpecifications.find(
        (el) => el.amountVAT || el.amountVAT === 0
      ).fieldValue = amountVAT;

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

    this.bidCost = this.totalForm.controls.costVat.value;
    this.totalRowData = this.totalForm.value;
  }

  makeBid(e): void {
    let result = e.validationGroup.validate();

    if (result.isValid) {
      let bidListGoods = [],
        bidListPlace = [];
      this.fullInfo.goods.forEach((good) => {
        if (
          !this.isSimpleBuyerAuction &&
          this.getAllValues(
            good.goodsSpecifications,
            IdInterfaceField.destination
          )
        ) {
          bidListGoods.push(good.goodsSpecifications[0].idDemandOfferGood);
          bidListPlace.push(
            this.infoForm.get(
              good.goodsSpecifications[0].idDemandOfferGood.toString()
            ).value
          );
        }
        if (this.isSimpleBuyerAuction) {
          const placeValue = this.infoForm.get(
            good.goodsSpecifications[0].idDemandOfferGood.toString()
          ).value;
          if (placeValue) {
            bidListGoods.push(good.goodsSpecifications[0].idDemandOfferGood);
            bidListPlace.push(placeValue);
          }
        }
      });
      if (this.isSelfCompetition && !this.selfCompetitionPopup)
        this.selfCompetitionPopup = true;
      else {
        this.selfCompetitionPopup = false;
        if (this.infoForm.get('participant').value) {
          let ListClients = [],
            IdBranch;
          if (Number(this.infoForm.get('participant').value) === role.broker) {
            if (
              Number(this.infoForm.get('contractType').value) ===
              AgreementType.Commission
            ) {
              //договор комисси
              if (this.infoForm.get('brokerClient').value?.length > 0)
                ListClients = this.infoForm
                  .get('brokerClient')
                  .value?.map((id) => id);
              else return;
            }

            if (
              Number(this.infoForm.get('contractType').value) ===
              AgreementType.Agency
            ) {
              //договор поручения
              ListClients.push(this.infoForm.get('brokerClient').value);
            }
          }

          IdBranch =
            Number(this.infoForm.get('participant').value) === role.visitor
              ? this.infoForm.get('listBranch').value
              : Number(this.infoForm.get('contractType').value) ===
                AgreementType.Agency
              ? this.infoForm.get('listClientBranch').value
              : null;

          const body: Partial<CheckBidderStatePayload> = {
            idSection: this.sessionIds.sectionId,
            idSession: this.sessionIds.sessionId,
            [this.isSimpleBuyerAuction ? 'idDemand' : 'idOffer']: this.idOffer,
            idContractType:
              Number(this.infoForm.get('participant').value) === role.broker
                ? this.infoForm.get('contractType').value
                : null,
            listClients: ListClients,
            idBranch: IdBranch,
          };

          if (!this.isSimpleBuyerAuction)
            this.bidService
              .checkBidderStateOffer(this.user?.token, body)
              .subscribe((res) => {
                this.makeBidAfterCheckBidderState(
                  res,
                  bidListGoods,
                  bidListPlace
                );
              });
          else
            this.bidService
              .checkBidderStateDemand(this.user?.token, body)
              .subscribe((res) => {
                this.makeBidAfterCheckBidderState(
                  res,
                  bidListGoods,
                  bidListPlace
                );
              });
        }
      }
    }
  }

  public makeBidAfterCheckBidderState(
    res: CheckBidderStateResponse,
    bidListGoods: any[],
    bidListPlace: any[]
  ): void {
    this.stateMessage = res.stateMessage;
    if (!!this.stateMessage) {
      const errors = {
        error: true,
        errorStatus: 0,
        messageError: this.stateMessage,
      };
      this.errorServiceService.callErrorPopup(errors);
    }
    if (!this.stateMessage) {
      if (!this.isSimpleBuyerAuction) {
        this.tradingMakeBidOffer(bidListGoods, bidListPlace);
      } else {
        this.tradingMakeBidDemand(bidListGoods, bidListPlace);
      }
    }
  }

  tradingMakeBidOffer(bidListGoods: any[], bidListDestination: any[]): void {
    const body: any = {
      idSection: Number(this.sessionIds.sectionId),
      idSession: Number(this.sessionIds.sessionId),
      idOffer: this.idOffer,
      buyerContractType:
        Number(this.infoForm.get('participant').value) === role.broker
          ? this.infoForm.get('contractType').value
          : null,
      buyerListClients:
        Number(this.infoForm.get('participant').value) === role.broker
          ? this.infoForm.get('contractType').value == '21'
            ? [this.infoForm.get('brokerClient').value]
            : this.infoForm.get('brokerClient').value
          : null,
      buyerIdBranch:
        Number(this.infoForm.get('participant').value) === role.broker &&
        this.infoForm.get('contractType').value == '21'
          ? this.infoForm.get('listClientBranch').value
          : Number(this.infoForm.get('participant').value) === role.visitor
          ? this.infoForm.get('listBranch').value
          : null,
      bidNumber: Number(this.stepCountBidNumber) + Number(this.stepCount),
      bidIdFinance: this.infoForm.get('financesources').value,
      bidIdCondition: this.infoForm.get('deliveryBasis').value,
      isMinPriceMainBasis: this.isMinPriceOnBasicBasis,
      bidListGoods: bidListGoods?.length > 0 ? bidListGoods : '',
      bidListDestination:
        bidListDestination?.length > 0 ? bidListDestination : '',
      bidIdPurchasePurpose: this.infoForm.get('purchasePurpose').value,
    };

    this.bidService
      .tradingMakeBidOffer(this.user?.token, body)
      .subscribe(() => {
        this.stepCount = 0;
        let message =
          this.translate.store.currentLang == 'RU'
            ? RU['trading'].auctionsTab.bidSubmittedSuccessfully
            : EN['trading'].auctionsTab.bidSubmittedSuccessfully;
        this.toastService.onShowToast({
          message: message,
          type: 'success',
        });
      });
  }

  tradingMakeBidDemand(bidListGoods, bidListLocationGood): void {
    const body: any = {
      idSection: Number(this.sessionIds.sectionId),
      idSession: Number(this.sessionIds.sessionId),
      idDemand: this.idOffer,
      sellerContractType:
        Number(this.infoForm.get('participant').value) === role.broker
          ? this.infoForm.get('contractType').value
          : null,
      sellerListClients:
        Number(this.infoForm.get('participant').value) === role.broker
          ? this.infoForm.get('contractType').value == '21'
            ? [this.infoForm.get('brokerClient').value]
            : this.infoForm.get('brokerClient').value
          : null,
      sellerIdBranch:
        Number(this.infoForm.get('participant').value) === role.broker &&
        this.infoForm.get('contractType').value == '21'
          ? this.infoForm.get('listClientBranch').value
          : Number(this.infoForm.get('participant').value) === role.visitor
          ? this.infoForm.get('listBranch').value
          : null,
      bidNumber: -1 * Number(this.stepCount) + Number(this.stepCountBidNumber),
      vatPercent: getVatNumber(this.VatField, true),
      bidIdCondition: this.infoForm.get('deliveryBasis').value,
      isMinPriceMainBasis: this.isMinPriceOnBasicBasis,
      bidListGoods: bidListGoods?.length > 0 ? bidListGoods : '',
      bidListLocationGood:
        bidListLocationGood?.length > 0 ? bidListLocationGood : '',
      bidIdGood: this.idGood,
    };

    this.bidService
      .tradingMakeBidDemand(this.user?.token, body)
      .subscribe(() => {
        this.stepCount = 0;
        let message =
          this.translate.store.currentLang == 'RU'
            ? RU['trading'].auctionsTab.purchaseBidSubmittedSuccessfully
            : EN['trading'].auctionsTab.purchaseBidSubmittedSuccessfully;
        this.toastService.onShowToast({
          message: message,
          type: 'success',
        });
      });
  }
}
