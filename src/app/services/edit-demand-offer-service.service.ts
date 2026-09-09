import { EventEmitter, inject, Injectable } from '@angular/core';
import {
  IDeliveryPeriod,
  IEditOfferGood,
  IEditOfferGoodsSpecifications,
  IGeneralInfo,
  IPaymentCondition,
  IServiceError,
  NsiGoodValue, PrepayMoment
} from "@interfaces";
import {
  AgreementType,
  AMOUNT_OF_DEFERMENT_100,
  auctionType,
  BELARUS_ID_LINK,
  BELARUS_ID_LINK_DESTINATION_STATION,
  DEFAULT_DEFERMENT_PERIOD_NUMBER_2,
  ID_STAT_DELIVERY,
  IdDirection,
  IdInterfaceField,
  IdSessionPeriods,
  IdWithoutVAT,
  PRODUCT_LEVELS_IN_BLOCK,
  termsConditionsPaymentConst,
  timberTicket
} from "@constants";
import { getIdGood, getTranslateResultByCurrentLang, getVatNumber, saveWithPending, toOADate } from "@helpers";
import {
  DeliveryPeriod,
  DeliverySchedulePeriod,
  DemandDeliveryCondition,
  DemandGood,
  DemandService,
  EditOfferDemandResponse,
  GoodPropertyValue,
  OfferGood,
  PayCondFull,
  PaymentPart
} from "./demand-service";
import { ErrorServiceService } from "./error-service.service";
import { TranslateService } from "@ngx-translate/core";
import { DxValidationGroupComponent } from "devextreme-angular";
import { BehaviorSubject, forkJoin, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { SubmissionService } from "./submission-service/submission-service.service";
import { SessionInfo } from "../features/trading/pages/deposit/shared";
import { DELIVERY_SCOPE_ITEMS, ID_DELIVERY_TYPE } from "@enums";
import { INsiGoodValues } from "../views/homepage/interfaces";
import { GoodSpecification } from "../views/dutch-down-auction/components/submitting-counter-demand/interfaces";
import { ToastService } from "./toast.service";
import { ValueChangedEvent } from "devextreme/ui/text_box";
import {
  ciNodeDelivPlaceArray,
  DeliveryConditionIntersection,
  PlacesTree
} from "./submission-service/shared";
import TreeView from "devextreme/ui/tree_view";
import { MARKET_TYPES } from "../features/trading/enums";
import { AUCTION_TYPE } from "@enums";
import { AppConfigService } from "./app-config.service";
import {
  EditPurchaseOfferComponent
} from "../views/dutch-down-auction/components/edit-purchase-offer/edit-purchase-offer.component";
import { TradingService } from "./trading-service.service";
import { FormGroup } from "@angular/forms";

export interface SessionIds {
  sectionId: number;
  sessionId: number;
  idSessionPeriod: number;
  session: SessionInfo;
}
import { GoodProperty } from "../components/submitting-bet/interfaces";
import { Good } from "./demand-service";

export interface DataForModel {
  sectionId: number;
  id: number;
  startDate: string;
  endDate: string;
  directionId: string;
  tradeTypeId: string;
  generatedName: string;
  sessionTemplateId: number;
  sessionTemplateName: string;
  isNeedWorkerDecision: boolean;
  notes: string;
  isDeleted: boolean;
  isDeletedAutomatically: boolean;
  isUpdated: boolean;
  concatedMarketTypes: string;
  marketTypeIds: string[];
  blocks: Block[];
  rules: number[];
  multiBasisTypeId: number;
  complexLotTypeId: number;
  complexLotProductTypes: ComplexLotProductType[];
  pricingTypeId: number;
  pricingTypeName: string;
  isAllowedTargetedTransact: boolean;
  isExpired: boolean;
}

export interface Block {
  modelId: number;
  id: number;
  products: Product[];
  properties: Property[];
  fields: Field[];
  deliveryConditions: DeliveryConditions;
  deliveryTerm: DeliveryTerm;
  deliverySchedule: DeliverySchedule;
  termsConditionsPayment: TermsConditionsPayment;
  editRules: EditRule[];
}

export interface Product {
  productName: string;
  valueId: number;
  linkId: number;
  level: number;
  modelId: number;
  modelBlockId: number;
}

export interface Property {
  referenceId: string;
  referenceName: string;
}

export interface Field {
  interfaceField: InterfaceField;
  isRequired: boolean;
  selectedValues: SelectedValue[];
}

export interface InterfaceField {
  blockId: number;
  fieldId: number;
  fieldName: string;
  referenceAlias: string;
  referenceId: number;
  fieldDataType: string;
  fieldSize: number;
  fieldPrecision: number;
  isAccessibleForWorker: boolean;
  isAvailableDataLimitation: boolean;
  isAvailableUserInput: boolean;
  allowedValues: AllowedValue[];
  controlFieldType: string;
  isAvailableMultiSelection: boolean;
  isAvailableFreeInput: boolean;
}

export interface AllowedValue {
  id: string;
  name: string;
}

export interface SelectedValue {
  id: string;
  name: string;
}

export interface DeliveryConditions {
  interfaceField: InterfaceField;
  isRequired: boolean;
  selectedValues: DeliveryConditionsSelectedValues;
}

export interface DeliveryConditionsSelectedValues {
  bases: Basis[];
  isNotSpecified: boolean;
  isMinPriceOnBasicBasis: boolean;
}

export interface Basis {
  minAddBasisPlaces: number;
  isRequiredPlace: boolean;
  minAddBasis: number;
  basisName: string;
  level: number;
  linkId: number;
  valueId: number;
}

export interface DeliveryTerm {
  interfaceField: InterfaceField;
  isRequired: boolean;
  selectedValues: DeliveryTermSelectedValue[];
}

export interface DeliveryTermSelectedValue {
  deliveryStartId: string;
  deliveryTermId: string;
  dayValues: number[];
  monthValues: number[];
  startDeliveryDate: string;
  endDeliveryDate: string;
}

export interface DeliverySchedule {
  interfaceField: InterfaceField;
  isRequired: boolean;
  selectedValues: AllowedValue[];
}

export interface TermsConditionsPayment {
  interfaceField: InterfaceField;
  isRequired: boolean;
  selectedValues: TermsConditionsPaymentSelectedValue[];
}

export interface TermsConditionsPaymentSelectedValue {
  delayMomentId: string;
  paymentConditionId: string;
  paymentVolumeId: string;
  prepayMomentId: string;
  dayTypeId: string[];
}

export interface EditRule {
  idModel: number;
  idSession: number;
  idModelBlock: number;
  idSessionPeriod: number;
  idInterfaceField: number;
  idEditRule: number;
  isCheckQuantityNotZero: boolean;
}

export interface ComplexLotProductType {
  typeId: string;
  referenceIds: string[];
}

export interface DemandOfferBasisGood {
  idDemandOfferGood: number;
  idGood: number;
  goodName: string;
  unitName: string;
  properties: string;
  volume: number;
  quotation: number;
  quoteCurrency: string;
  amendment: number;
  priceAdjustment: number;
  currency: string;
  costVat: number;
  currencyPrecision: number;
  cost: number;
  volumePrecision: number;
  minPrice: number;
}

export interface DeliveryBasis {
  placeName: number[];
  concatedCondition: string;
  specifyingLocation: string;
  enterPlaceName: string;
  isMain: boolean;
  coreBasis?: boolean;
  idBasisLink: number;
  idBasisValue: number;
  idPlaceLink: number;
  idPlaceValue: number;
  basisId: number;
  basisName: string;
  contradictoryValueId: number;
  contradictoryBasisName: string;
  isRequiredPlace: boolean;
  isRequiredAddBasis: boolean;
  minAddBasis: number;
  minAddBasisPlaces: number;
  parentId: number;
  placeTypeId: number;
  level: number;
  hasChildren: boolean;
  goods: DemandOfferBasisGood[];
}

export interface DemandOfferGoodScopes {
  idDemandOffer: number;
  idDemandOfferGood: number;
  idFirmClient: number;
  volume: number;
  volumeCounter?: number;
  firmClientName: string;
  idGood: number;
  goodName: string;
  unitName: string;
  properties: string;
}

export interface IDemandOfferBasisGood {
  amendment: number | null;
  concatedCondition: string;
  costVat: number;
  currency: string;
  currencyPrecision: number;
  goodName: string;
  idBasisLink: number;
  idBasisValue: number;
  idDemandOffer: number;
  idDemandOfferGood: number;
  idPlaceLink: number;
  idPlaceValue: number;
  isMain: boolean;
  minPriceWithoutVat: number | null;
  placeDetails: string | null;
  placeName: string;
  priceAdjustment: number | null;
  priceCorridorLeftBound: number | null;
  priceCorridorRightBound: number | null;
  priceStartAdjustment: number | null;
  priceStartWithoutVat: number | null;
  priceWithoutVat: number;
  properties: string;
  quotation: string | null;
  quoteCurrency: string | null;
  unitName: string;
  volume: number;
  volumePrecision: number;
}

export type DeliveryConcatedBasis = [string, IDemandOfferBasisGood]

export type DemandOfferGoodsList = DemandOfferGoodScopes[] & {
  isDeletedScope?: boolean;
};

export type DeliveryScope = [string, DemandOfferGoodsList]

export interface GoodItemScope {
  idGood: number;
  idGoodFromFront: number;
  nsiGoodValues: NsiGoodValue[];
  idGoodName: number;
  idGoodGroup: number;
  idNomenclature: number;
  volume: number;
  volumeCounter?: number;
  minPriceWithoutVat?: number;
  locationService?: number;
}

export interface FinishDeliveryScopes {
  goods: GoodItemScope[];
  idFirmClient: number;
}

export interface Property {
  propertyName: string;
  propertyValue: string;
}

export interface ScheduleGood {
  idGood: number;
  name: string;
  volume: number;
  units: string;
  properties: GoodProperty[];
}

export interface ScheduleData {
  numberPeriod: number;
  startDate: string;
  endDate: string;
  goods: ScheduleGood[];
  idPeriod: string;
}

export interface GoodsOriginal {
  idGood: number;
  goodsSpecifications: GoodSpecification[];
}

export interface Demand {
  model: DataForModel | null,
  modelId: number | null,
  values: DemandValues,
  sessionsParams: SessionsParams,
  generalParams: GeneralParams,
  demandParams: DemandParams // данные уровня заявки (для имитации применения правил)
}

export interface DemandValues {
  [key: string]: BlockValues,    // ключ-значение по каждому блоку
}

export interface BlockValues {
  [key: string]: any | null,    // ключ-значение по каждому полю (включая спец-поля)
  products: number[] | null
}

export interface SessionsParams {
  tradeTypeId: string | null,
  marketTypeIds: string[] | null
}

export interface GeneralParams {
  validityPeriod: string | null,
  isMoveToNextSession: boolean
}

export interface DemandParams {
  directionId: number | null,
  marketTypeIds: string[] | null,
  startDate: string | null,  // дата подачи заявки (проведения сессии)
}

export interface PeriodsForRule {
  number: number;
  startDate: string;
  endDate: string;
  volume: number;
  unit: string;
}

export interface ScheduleGood {
  idGood: number;
  name: string;
  volume: number;
  units: string;
  properties: GoodProperty[];
}

export interface ScheduleData {
  numberPeriod: number;
  startDate: string;
  endDate: string;
  goods: ScheduleGood[];
  idPeriod: string;
  periodVolume: number;
}

export interface SchedulePeriods {
  number: number;
  startDate: string | number;
  endDate: string | number;
  volume: number;
  unit: string;
}

export interface DeliveryScopeGraded {
  idFirmClient: number;
  volume: number;
  isDeletedScope?: boolean;
}

export interface GetGeneratedGoodFields {
  goodName: string;
  unitName?: string;
  unit?: string;
  properties: string | GoodProperty[];
}

@Injectable({
  providedIn: 'root'
})

export class EditDemandOfferServiceService {
  private readonly config = inject(AppConfigService);
  private readonly errorServiceService = inject(ErrorServiceService);
  private readonly translate = inject(TranslateService);
  private readonly submissionService = inject(SubmissionService);
  private readonly demandService = inject(DemandService);
  private readonly toastService = inject(ToastService);
  private readonly tradingService = inject(TradingService);

  public userTokenSubject = new BehaviorSubject<string>('');

  public sessionIdsSubject = new BehaviorSubject<SessionIds>(null);

  public goodsSubject = new BehaviorSubject<IEditOfferGood[]>([]);

  public generalInfoSubject = new BehaviorSubject<IGeneralInfo>(null);

  public VatFieldSubject = new BehaviorSubject<IEditOfferGoodsSpecifications>(null);

  public editTermPaymentSubject = new BehaviorSubject<boolean>(false);

  public termsPaymentFormSubject = new BehaviorSubject<any>({ controls: {} });

  public paymentCondSubject = new BehaviorSubject<IPaymentCondition>(null);

  public deliveryBasisCommonSubject = new BehaviorSubject<DeliveryBasis[]>([]);

  public isActiveCorridorSubject = new BehaviorSubject<boolean>(false);

  public isActiveQuotationSubject = new BehaviorSubject<boolean>(false);

  public adjustablePriceSubject = new BehaviorSubject<boolean>(false);

  public goodsOriginalSubject = new BehaviorSubject<GoodsOriginal[]>([]);

  public fullInfoOriginalSubject = new BehaviorSubject<any>(null);

  public editRulesIntersectionsSubject = new BehaviorSubject<EditRule[]>([]);

  public deliveryScopesSubject = new BehaviorSubject<DeliveryScope[]>([]);

  public momentPrepaymentSubject = new BehaviorSubject<PrepayMoment>(null);

  public deliveryTermFormSubject = new BehaviorSubject<any>({ controls: {} });

  public dataForModelSubject = new BehaviorSubject<any>([]);

  public finishDelivSchPeriodsSubject = new BehaviorSubject<ScheduleData[]>([]);

  public editTermConditionSubject = new BehaviorSubject<boolean>(false);

  public deliveryPeriodValueSubject = new BehaviorSubject<IDeliveryPeriod>(null);

  public uniqueDeliveryScopesSubject = new BehaviorSubject<DemandOfferGoodScopes[]>([]);

  public closeModalSubject = new Subject<boolean>();
  public closeModal$ = this.closeModalSubject.asObservable();

  private saveRequestPending = new Subject<boolean>();
  public saveRequestPending$ = this.saveRequestPending.asObservable();


  constructor() {
  }

  public onFindBlock(good: IEditOfferGood, dataForModel: DataForModel): Block {
    const foundBlock: Block = dataForModel.blocks.find(block => {
      // Проверяем уровень 3
      const hasLevel3: boolean = block.products
        .filter(prod => prod.level === PRODUCT_LEVELS_IN_BLOCK.GOOD_NAME)
        .some(item => item.valueId === good.idGoodName);

      // Проверяем уровень 2
      const hasLevel2: boolean = block.products
        .filter(prod => prod.level === PRODUCT_LEVELS_IN_BLOCK.GOOD_GROUP)
        .some(item => item.valueId === good.idGoodGroup);

      // Проверяем уровень 1
      const hasLevel1: boolean = block.products
        .filter(prod => prod.level === PRODUCT_LEVELS_IN_BLOCK.NOMENCLATURE_GROUP)
        .some(item => item.valueId === good.idNomenclatureGroup);

      // Возвращаем блок, если он соответствует любому из условий
      return hasLevel3 || hasLevel2 || hasLevel1;
    });

    return foundBlock;
  }

  public onCreateFinishPeriod(
    scheduleData: ScheduleData[],
    goods: IEditOfferGood[],
    isOfferToPurchase?: boolean
  ): DeliverySchedulePeriod[] {
    //создание объекта графика поставки, если не изменяли сам график поставки
    let finishDelivSchPeriods: DeliverySchedulePeriod[] = [];
    scheduleData.forEach((item) => {
      let goodsForSchedule: OfferGood[] = [];
      item.goods.forEach((el) => {
        let good: IEditOfferGood = goods?.[0]?.idGood ?
          goods.find((g) => g.idGood === el.idGood) :
          goods?.[0];
        if (
          this.getGoodsSpecifications(good.goodsSpecifications, IdInterfaceField.quantity)
            .fieldValueNumber !== 0
        ) {

          const nsiGoodValues: INsiGoodValues[] = this.createNsiGoodValuesArray(good?.goodValues);

          //если есть nsiGoodValues - заявка с товаром-аналогом, значит idGood для отправки null
          const idGoodToSend: number = nsiGoodValues
            ? null
            : good.goodsSpecifications[0].idDemandOfferGood;

          goodsForSchedule.push({
            idGood: idGoodToSend,
            idGoodFromFront: good.goodsSpecifications[0].idDemandOfferGood,
            nsiGoodValues: nsiGoodValues,
            idGoodName: good.idGoodName,
            idGoodGroup: good.idGoodGroup,
            idNomenclature: good.idNomenclatureGroup,
            periodVolume: el.volume,
            ...(isOfferToPurchase && {
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

      finishDelivSchPeriods.push({
        goods: goodsForSchedule,
        periodDateBegin: toOADate(
          Date.parse(start[1] + '.' + start[0] + '.' + start[2])
        ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл
        periodDateEnd: toOADate(
          Date.parse(end[1] + '.' + end[0] + '.' + end[2])
        ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл
        idPeriod: Number(item.idPeriod),
      });
    });

    return finishDelivSchPeriods;
  }

  public onCreateFinishScopes(
    deliveryScopes: DeliveryScope[],
    goodsArray: IEditOfferGood[],
    isOfferToPurchase?: boolean
  ): {
    finishDeliveryScopes: FinishDeliveryScopes[],
    finishDeliveryScopesRemain: FinishDeliveryScopes[]
  } {
    let finishDeliveryScopes: FinishDeliveryScopes[] = [];
    let finishDeliveryScopesRemain: FinishDeliveryScopes[] = [];
    deliveryScopes.forEach((scope) => {
      let goods: GoodItemScope[] = [],
        goodsRemain: GoodItemScope[] = [],
        isRemainScope: boolean = false;
      scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].forEach((good) => {
        let goodFromList: IEditOfferGood = goodsArray?.[0]?.idGood
          ? goodsArray?.find((g) => g.idGood === good.idGood)
          : goodsArray?.[0];

        const originalVolume: number = this.getOriginalScopeVolume(
          Number(scope[DELIVERY_SCOPE_ITEMS.ID_SCOPE]),
          goodFromList.goodsSpecifications[0].idDemandOfferGood
        );

        if (good.volume < originalVolume || scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].isDeletedScope) {
          isRemainScope = true;
        }
        goods.push(this.buildScopeGoods(goodFromList, good.volume, isOfferToPurchase));
        goodsRemain.push(
          this.buildScopeGoods(
            goodFromList,
            scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].isDeletedScope ? originalVolume : (originalVolume - good.volume),
            isOfferToPurchase
          )
        );
      });

      if (isRemainScope) {
        finishDeliveryScopesRemain.push(this.buildFinishArray(
          goodsRemain,
          Number(scope[DELIVERY_SCOPE_ITEMS.ID_SCOPE])
        ));
      }
      if (!scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].isDeletedScope) {
        finishDeliveryScopes.push(this.buildFinishArray(
          goods,
          Number(scope[DELIVERY_SCOPE_ITEMS.ID_SCOPE])
        ));
      }

    });
    return { finishDeliveryScopes, finishDeliveryScopesRemain };
  }

  public getOriginalScopeVolume(idFirmClient: number, idGood: number): number {
    let fullInfoOriginal: any = this.fullInfoOriginalSubject.getValue();
    return fullInfoOriginal.deliveryScopes
      ?.find((scope) => scope.idFirmClient === idFirmClient && scope.idDemandOfferGood === idGood)?.volume || 0;
  }

  private buildFinishArray(goods: GoodItemScope[], idFirmClient: number): FinishDeliveryScopes {
    return {
      goods: goods,
      idFirmClient: idFirmClient,
    };
  }

  private buildScopeGoods(goodFromList: IEditOfferGood, volume: number, isOfferToPurchase: boolean): GoodItemScope {
    const nsiGoodValues: INsiGoodValues[] = this.createNsiGoodValuesArray(goodFromList?.goodValues);

    //если есть nsiGoodValues - заявка с товаром-аналогом, значит idGood для отправки null
    const idGoodToSend: number = nsiGoodValues
      ? null
      : goodFromList.goodsSpecifications[0].idDemandOfferGood;

    return {
      idGood: idGoodToSend,
      idGoodFromFront:
      goodFromList.goodsSpecifications[0].idDemandOfferGood,
      nsiGoodValues: nsiGoodValues,
      idGoodName: goodFromList.idGoodName,
      idGoodGroup: goodFromList.idGoodGroup,
      idNomenclature: goodFromList.idNomenclatureGroup,
      volume: volume,
      ...(isOfferToPurchase && {
        minPriceWithoutVat: this.getValueNumber(
          goodFromList.goodsSpecifications,
          IdInterfaceField.minPrice
        ),
        locationService: this.getValueNumber(
          goodFromList.goodsSpecifications,
          IdInterfaceField.placeOfWork
        ),
      }),
    };
  }

  public onCreateFinishBasis(
    deliveryBasisCommon: DeliveryBasis[],
    goodsArray: IEditOfferGood[],
    isOfferToPurchase?: boolean
  ): DemandDeliveryCondition[] {
    let finishDeliveryBasis: DemandDeliveryCondition[] = [];
    deliveryBasisCommon.forEach((basis) => {
      let goods: DemandGood[] = [];
      basis.goods.forEach((good) => {
        //если нет idGood - заявка аналоговая и в ней всего один товар
        let goodFromList: IEditOfferGood = goodsArray?.[0]?.idGood
          ? goodsArray?.find((g) => g.idGood === good.idGood)
          : goodsArray?.[0];

        if (
          this.getGoodsSpecifications(goodFromList.goodsSpecifications, IdInterfaceField.quantity)
            .fieldValueNumber !== 0
        ) {

          const nsiGoodValues: INsiGoodValues[] = this.createNsiGoodValuesArray(goodFromList?.goodValues);

          //если есть nsiGoodValues - заявка с товаром-аналогом, значит idGood для отправки null
          const idGoodToSend: number = nsiGoodValues
            ? null
            : goodFromList.goodsSpecifications[0].idDemandOfferGood;

          goods.push({
            idGood: idGoodToSend,
            idGoodFromFront:
            goodFromList.goodsSpecifications[0].idDemandOfferGood,
            nsiGoodValues: nsiGoodValues,
            idGoodName: goodFromList.idGoodName,
            idGoodGroup: goodFromList.idGoodGroup,
            idNomenclature: goodFromList.idNomenclatureGroup,
            priceWithoutVat: good.cost,
            priceAdjustment: good.priceAdjustment,
            ...(isOfferToPurchase && {
              minPriceWithoutVat: good.minPrice,
              locationService: this.getValueNumber(
                goodFromList.goodsSpecifications,
                IdInterfaceField.placeOfWork
              ),
            }),
          });
        }
      });

      finishDeliveryBasis.push({
        goods: goods,
        isMain: basis.isMain,
        idBasisLink: basis.idBasisLink,
        idBasisValue: basis.idBasisValue,
        idPlaceLink: basis.idPlaceLink,
        idPlaceValue: basis.idPlaceValue,
        placeDetails:
          basis.idPlaceLink === null && basis.idPlaceValue === null
            ? basis.enterPlaceName
            : basis.specifyingLocation,
      });
    });

    return finishDeliveryBasis;
  }

  public getGoodsSpecifications(
    goodsSpecifications: IEditOfferGoodsSpecifications[],
    idInterfaceField: number
  ): IEditOfferGoodsSpecifications {
    return goodsSpecifications?.find(
      (el) => el.idInterfaceField === idInterfaceField
    );
  }

  public getValueNumber(
    goodsSpecifications: IEditOfferGoodsSpecifications[],
    idInterfaceField: number
  ): number {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField === idInterfaceField
    )?.fieldValueNumber;
  }

  public getOriginalGood(idGood: number) {
    let goodsOriginal: GoodsOriginal[] = this.goodsOriginalSubject.getValue();
    return goodsOriginal.find((el) => el.idGood === idGood);
  }

  public editRuleInIntersections(id: number): number {
    let editRulesIntersections: EditRule[] = this.editRulesIntersectionsSubject.getValue();
    return (
      editRulesIntersections?.find((el) => el.idInterfaceField === id)
        ?.idEditRule || null
    );
  }

  public onSave(
    requestDataScope: EventEmitter<{}>,
    requestDataBasis: EventEmitter<{}>,
    requestDataSchedule: EventEmitter<{}>,
    idSessionPeriod: number,
    validationGroup: DxValidationGroupComponent,
    deliveryTermValidationGroup: DxValidationGroupComponent,
    deadlineErrorMess: string,
    goodFormValidationGroup: DxValidationGroupComponent
  ): void {
    let editTermPayment: boolean = this.editTermPaymentSubject.getValue();
    let editTermCondition: boolean = this.editTermConditionSubject.getValue();

    let error: boolean = false, errorMessage: string;

    if (editTermPayment)
      if (!validationGroup?.instance.validate().isValid) {
        //валидация срока оплаты
        return;
      }

    if (editTermCondition)
      if (!deliveryTermValidationGroup?.instance.validate().isValid) {
        //валидация условий поставки
        return;
      }

    if (deadlineErrorMess?.length > 0) {
      //контрольные сроки поставки и оплаты
      const errors: IServiceError = {
        error: true,
        errorStatus: 0,
        messageError: deadlineErrorMess,
      };

      this.errorServiceService.callErrorPopup(errors);
      return;
    }

    if (!goodFormValidationGroup?.instance.validate().isValid) return;

    requestDataScope.emit({
      callback: (data: boolean) => {
        // Получаем данные от родителя
        if (data) {
          error = true;
          errorMessage = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.unableSaveChanges') +
            getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.adjustVolumeDistribution');
        }
      },
    });

    requestDataSchedule.emit({
      callback: (data: boolean) => {
        // Получаем данные от родителя
        if (data) {
          error = true;
          errorMessage = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.unableSaveChanges') +
            getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.adjustDeliverySchedule');
        }
      },
    });

    requestDataBasis.emit({
      callback: (data: boolean) => {
        // Получаем данные от родителя
        if (data) {
          error = true;
          errorMessage = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.unableSaveChanges') +
            getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.adjustDeliveryTerms');
        }
      },
    });

    if (error) {
      if (errorMessage?.length > 0) {
        const errors: IServiceError = {
          error: true,
          errorStatus: 0,
          messageError: errorMessage

        };
        this.errorServiceService.callErrorPopup(errors);
      }
      return;
    } else {
      if (idSessionPeriod !== IdSessionPeriods.pretrading) {
        this.finalSave();
        return;
      }

      this.checkPriceValidations();
    }
  }

  public getRangeForGood(): Observable<boolean> {
    let userToken: string = this.userTokenSubject.getValue();
    let goods: IEditOfferGood[] = this.goodsSubject.getValue();
    let sessionIds: SessionIds = this.sessionIdsSubject.getValue();
    let generalInfo: IGeneralInfo = this.generalInfoSubject.getValue();
    let VatField: IEditOfferGoodsSpecifications = this.VatFieldSubject.getValue();
    let editTermPayment: boolean = this.editTermPaymentSubject.getValue();
    let termsPaymentForm: FormGroup = this.termsPaymentFormSubject.getValue();
    let paymentCond: IPaymentCondition = this.paymentCondSubject.getValue();
    let deliveryBasisCommon: DeliveryBasis[] = this.deliveryBasisCommonSubject.getValue();

    const requests: Observable<boolean>[] = goods.map((good: IEditOfferGood) => {
      return this.submissionService
        .getPriceLimitCorridor(
          userToken,
          sessionIds.sectionId,
          sessionIds.sessionId,
          generalInfo.idModel,
          generalInfo.directionId,
          good.idGood,
          this.getGoodsSpecifications(
            good.goodsSpecifications,
            IdInterfaceField.currency
          ).fieldValueNumber,
          getVatNumber(VatField, true),
          good.unitId,
          this.getGoodsSpecifications(
            good.goodsSpecifications,
            IdInterfaceField.quantity
          ).fieldValueNumber,
          editTermPayment
            ? termsPaymentForm.controls['termsPayment']?.value
            : paymentCond.idPaymentType,

          deliveryBasisCommon[0].idBasisValue,
          deliveryBasisCommon[0]?.idPlaceLink || null,
          null
        )
        .pipe(
          map((res) => {
            const minPrice: number = res.leftBound,
              maxPrice: number = res.rightBound,
              price: number = this.getGoodsSpecifications(
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

  getQuotationForGood(): Observable<boolean> {
    let userToken: string = this.userTokenSubject.getValue();
    let goods: IEditOfferGood[] = this.goodsSubject.getValue();
    let sessionIds: SessionIds = this.sessionIdsSubject.getValue();
    let generalInfo: IGeneralInfo = this.generalInfoSubject.getValue();
    let VatField: IEditOfferGoodsSpecifications = this.VatFieldSubject.getValue();
    let editTermPayment: boolean = this.editTermPaymentSubject.getValue();
    let termsPaymentForm: FormGroup = this.termsPaymentFormSubject.getValue();
    let paymentCond: IPaymentCondition = this.paymentCondSubject.getValue();
    let deliveryBasisCommon: DeliveryBasis[] = this.deliveryBasisCommonSubject.getValue();

    const requests: Observable<boolean>[] = goods.map((good: IEditOfferGood) => {
      return this.submissionService
        .getPriceLimitQuotation(
          userToken,
          sessionIds.sectionId,
          sessionIds.sessionId,
          generalInfo.idModel,
          generalInfo.directionId,
          good.idGood,
          this.getGoodsSpecifications(
            good.goodsSpecifications,
            IdInterfaceField.currency
          ).fieldValueNumber,
          getVatNumber(VatField, true),
          good.unitId,
          this.getGoodsSpecifications(
            good.goodsSpecifications,
            IdInterfaceField.quantity
          ).fieldValueNumber,
          editTermPayment
            ? termsPaymentForm.controls['termsPayment']?.value
            : paymentCond.idPaymentType,

          deliveryBasisCommon[0].idBasisValue,
          deliveryBasisCommon[0]?.idPlaceLink || null,
          null
        )
        .pipe(
          map((res) => {
            const quotation: number = res.priceWithoutVat,
              price = this.getGoodsSpecifications(
                good.goodsSpecifications,
                IdInterfaceField.priceWithoutVAT
              ).fieldValueNumber;
            if (quotation && price !== quotation) {
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

  private formGoodsFinishArray(
    item: IEditOfferGood,
    endProperties: GoodPropertyValue[],
    goodArray: OfferGood[],
    isRemains?: boolean
  ): void {
    let adjustablePrice: boolean = this.adjustablePriceSubject.getValue();
    let generalInfo: IGeneralInfo = this.generalInfoSubject.getValue();

    item.goodsSpecifications.forEach((field) => {
      if (
        !field.isVirtual &&
        field.idInterfaceField &&
        (field.fieldValueNumber || field.fieldValue)
      ) {
        if (isRemains && field.idInterfaceField === IdInterfaceField.adjustedPrice) {
          field.fieldValue = isRemains ? 'false' : adjustablePrice.toString();
        }

        let fieldValueNumber: number | null = null;
        let fieldValueString: string | null = null;

        if (this.isNumberField(field) && !field.fieldValueArray) {
          fieldValueNumber = isRemains
            ? this.getRemainsFieldValueNumber(field, item)
            : field.fieldValueNumber;
        }

        if (this.isStringField(field) && !field.fieldValueArray) {
          fieldValueString = String(field.fieldValue);
        }

        endProperties.push({
          idInterfaceField: field.idInterfaceField,
          fieldValueNumber: fieldValueNumber,
          fieldValueString: fieldValueString,
          listFieldValues: field.fieldValueArray ? field.fieldValueArray : '',
        });
      }
    });

    const nsiGoodValues: INsiGoodValues[] = this.createNsiGoodValuesArray(item?.goodValues);

    //если есть nsiGoodValues - заявка с товаром-аналогом, значит idGood для отправки null
    const idGoodToSend: number = nsiGoodValues
      ? null
      : item.goodsSpecifications[0].idDemandOfferGood;

    goodArray.push({
      idGood: idGoodToSend,
      idGoodFromFront: item.goodsSpecifications[0].idDemandOfferGood,
      nsiGoodValues: nsiGoodValues,
      idGoodName: item.idGoodName,
      idGoodGroup: item.idGoodGroup,
      idNomenclature: item.idNomenclatureGroup,
      properties: endProperties,
      ...(generalInfo?.directionId === IdDirection.buy && {
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

  public isNumberField(field: IEditOfferGoodsSpecifications): boolean {
    const { controlFieldType, idInterfaceField } = field;
    return controlFieldType === 'dxNumberBox'
      || (controlFieldType === 'dxSelectBox'
        && idInterfaceField !== IdInterfaceField.productLocation);
  }

  public isStringField(field: IEditOfferGoodsSpecifications): boolean {
    const { controlFieldType, idInterfaceField } = field;
    return controlFieldType === 'dxTextBox'
      || controlFieldType === 'dxCheckBox'
      || (controlFieldType === 'dxSelectBox'
        && idInterfaceField === IdInterfaceField.productLocation);
  }

  public getRemainsFieldValueNumber(field: IEditOfferGoodsSpecifications, item: IEditOfferGood): number {
    const getOriginalSpec = (originalGood: GoodsOriginal, idInterfaceField: IdInterfaceField): number =>
      this.getGoodsSpecifications(
        originalGood.goodsSpecifications,
        idInterfaceField
      ).fieldValueNumber;

    switch (field.idInterfaceField) {
      case IdInterfaceField.quantity: {
        //при записи в остаточный массив если поле количество - то от количества которое пришло отнимаем текущее количество
        const originalGood: GoodsOriginal = this.getOriginalGood(getIdGood(item));
        return getOriginalSpec(originalGood, field.idInterfaceField) - field.fieldValueNumber;
      }
      case IdInterfaceField.currency:
      case IdInterfaceField.VATrate: {
        const originalGood: GoodsOriginal = this.getOriginalGood(getIdGood(item));
        return getOriginalSpec(originalGood, field.idInterfaceField);
      }
      default: {
        return field.fieldValueNumber;
      }
    }
  }

  //формируем объект nsiGoodValues для отправки
  private createNsiGoodValuesArray(goodValues: INsiGoodValues[]): INsiGoodValues[] {
    if (goodValues?.length === 0) return [];

    if (goodValues?.length > 0) {
      return goodValues.map(({ idReference, isAllowAnalogs }) => ({
        idReference,
        listValues: null,
        isAllowAnalogs
      }));
    }
  }

  private checkPriceValidations(): void {
    let isActiveCorridor: boolean = this.isActiveCorridorSubject.getValue();
    let isActiveQuotation: boolean = this.isActiveQuotationSubject.getValue();
    if (isActiveCorridor) {
      this.getRangeForGood().subscribe((hasError) => {
        if (hasError) {
          const errors: IServiceError = {
            error: true,
            errorStatus: 0,
            messageError:
              getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.deliveryConditions.warningPriceRange'),
          };
          this.errorServiceService.callErrorPopup(errors);
          return;
        } else {
          this.finalSave();
        }
      });
    } else if (isActiveQuotation) {
      this.getQuotationForGood().subscribe((hasError) => {
        if (hasError) {
          const errors: IServiceError = {
            error: true,
            errorStatus: 0,
            messageError:
              getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.deliveryConditions.priceQuoteError2'),
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
    let userToken: string = this.userTokenSubject.getValue();
    let goods: IEditOfferGood[] = this.goodsSubject.getValue();
    let sessionIds: SessionIds = this.sessionIdsSubject.getValue();
    let generalInfo: IGeneralInfo = this.generalInfoSubject.getValue();
    let VatField: IEditOfferGoodsSpecifications = this.VatFieldSubject.getValue();
    let editTermPayment: boolean = this.editTermPaymentSubject.getValue();
    let termsPaymentForm: FormGroup = this.termsPaymentFormSubject.getValue();
    let paymentCond: IPaymentCondition = this.paymentCondSubject.getValue();
    let deliveryBasisCommon: DeliveryBasis[] = this.deliveryBasisCommonSubject.getValue();
    let deliveryScopes: DeliveryScope[] = this.deliveryScopesSubject.getValue();
    let deliveryTermForm: FormGroup = this.deliveryTermFormSubject.getValue();
    let adjustablePrice: boolean = this.adjustablePriceSubject.getValue();
    let finishDelivSchPeriods: ScheduleData[] = this.finishDelivSchPeriodsSubject.getValue();
    let editTermCondition: boolean = this.editTermConditionSubject.getValue();
    let deliveryPeriodValue: IDeliveryPeriod = this.deliveryPeriodValueSubject.getValue();
    let uniqueDeliveryScopes: DemandOfferGoodScopes[] = this.uniqueDeliveryScopesSubject.getValue();

    let goodCurrent: OfferGood[] = [],
      goodRemains: OfferGood[] = [];
    goods.forEach((item) => {
      let endPropertiesCurrentOffer: GoodPropertyValue[] = [],
        endPropertiesRemainsOffer: GoodPropertyValue[] = [];
      //сравниваем текущий объем с первоначальным объемом, если объем в каком-либо товаре изменился, то на разницу этого объема отделяется новая заявка
      if (
        this.getGoodsSpecifications(item.goodsSpecifications, IdInterfaceField.quantity)
          .fieldValueNumber === 0
      ) {
        this.formGoodsFinishArray(
          item,
          endPropertiesRemainsOffer,
          goodRemains,
          true
        );
      } else if (
        this.getGoodsSpecifications(item.goodsSpecifications, IdInterfaceField.quantity)
          .fieldValueNumber ===
        this.getGoodsSpecifications(
          this.getOriginalGood(getIdGood(item)).goodsSpecifications,
          IdInterfaceField.quantity
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

    let finishDeliveryBasis: DemandDeliveryCondition[]
      = this.onCreateFinishBasis(deliveryBasisCommon, goods, sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction); //Для проверки, если один товар занулили

    const resultScopes: { finishDeliveryScopes, finishDeliveryScopesRemain } = this.onCreateFinishScopes(
      deliveryScopes,
      goods,
      sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
    );
    let finishDeliveryScopesRemain: FinishDeliveryScopes[] = resultScopes.finishDeliveryScopesRemain,
      finishDeliveryScopes: FinishDeliveryScopes[] = resultScopes.finishDeliveryScopes;

    if (uniqueDeliveryScopes?.length === 1) {
      deliveryScopes[0][1].forEach((good) => {
        good.volume = goodCurrent
          .find((g) => (g.idGood || g.idGoodFromFront) === good.idDemandOfferGood)
          .properties.find((el) => el.idInterfaceField === IdInterfaceField.quantity).fieldValueNumber;
      });
      finishDeliveryScopes = this.onCreateFinishScopes(
        deliveryScopes,
        goods,
        sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
      ).finishDeliveryScopes;
      finishDeliveryScopesRemain = JSON.parse(
        JSON.stringify(finishDeliveryScopes)
      );
      finishDeliveryScopesRemain[0].goods.forEach((good) => {
        good.volume =
          goodRemains
            .find((g) => (g.idGood || g.idGoodFromFront) ===  (good.idGood || good.idGoodFromFront))
            ?.properties.find((el) => el.idInterfaceField === IdInterfaceField.quantity)
            ?.fieldValueNumber || 0;
      });
    }
    //проходимся по массивам грузотправителей, чтобы было одинаковое количество товара и товаров в грузоотправителях
    if (finishDeliveryScopesRemain?.length > 0) {
      finishDeliveryScopesRemain.forEach((el) => {
        let goodArray: GoodItemScope[] = [];
        el.goods.forEach((good) => {
          if (goodRemains.find((g) => (g.idGood || g.idGoodFromFront) === (good.idGood || good.idGoodFromFront))) {
            goodArray.push(good);
          }
        });
        el.goods = goodArray;
      });
    }
    if (finishDeliveryScopes?.length > 0) {
      finishDeliveryScopes.forEach((el) => {
        let goodArray: GoodItemScope[] = [];
        el.goods.forEach((good) => {
          if (goodCurrent.find((g) => (g.idGood || g.idGoodFromFront) === (good.idGood || good.idGoodFromFront))) {
            goodArray.push(good);
          }
        });
        el.goods = goodArray;
      });
    }

    let payCondFull: PayCondFull,
      paymentPart: PaymentPart,
      deliveryPeriod: DeliveryPeriod;

    let rules: Demand = this.createRuleObject();

    if (editTermPayment) {
      //открыт блок редактирования условия оплаты
      payCondFull =
        Number(termsPaymentForm.controls['termsPayment']?.value) !==
        termsConditionsPaymentConst.partialPrepayment
          ? {
            idPaymentType: termsPaymentForm.controls['termsPayment']?.value,
            idDayType:
              termsPaymentForm.controls['dayTypeId']?.value || null,
            idShipmentVolume: termsPaymentForm.controls['volume']?.value,
            idPaymentMoment:
              Number(termsPaymentForm.controls['termsPayment']?.value) ===
              termsConditionsPaymentConst.prepayment100 ||
              Number(termsPaymentForm.controls['termsPayment']?.value) ===
              termsConditionsPaymentConst.paymentThroughExchange
                ? termsPaymentForm.controls['momentPrepayment']?.value
                : termsPaymentForm.controls['momentDelay']?.value,
            periodValueNumber:
              Number(termsPaymentForm.controls['termsPayment']?.value) !==
              termsConditionsPaymentConst.paymentDeferment
                ? termsPaymentForm.controls['prepaymentPeriodNumber']
                ?.value || null
                : termsPaymentForm.controls['defermentPeriodNumber']
                ?.value || null,
            periodValueDate:
              Number(termsPaymentForm.controls['termsPayment']?.value) !==
              termsConditionsPaymentConst.paymentDeferment
                ? termsPaymentForm.controls['prepaymentPeriodDate']?.value
                  ? toOADate(
                    termsPaymentForm.controls['prepaymentPeriodDate']
                      ?.value
                  )
                  : null
                : termsPaymentForm.controls['defermentPeriodDate']?.value
                  ? toOADate(
                    termsPaymentForm.controls['defermentPeriodDate']?.value
                  )
                  : null,
          }
          : null;
      paymentPart =
        termsPaymentForm.controls['termsPayment']?.value ===
        termsConditionsPaymentConst.partialPrepayment
          ? {
            idDayType:
              termsPaymentForm.controls['dayTypeId']?.value || null,
            idShipmentVolume: termsPaymentForm.controls['volume']?.value,
            idPaymentMomentPrepay:
            termsPaymentForm.controls['momentPrepayment']?.value,
            firstPercent:
            termsPaymentForm.controls['prepaymentAmount']?.value,
            firstPeriodValueNumber:
              Number(termsPaymentForm.controls['momentPrepayment']?.value) !== timberTicket
                ? termsPaymentForm.controls['prepaymentPeriodNumber']?.value
                : null,
            idPaymentMomentDelay:
            termsPaymentForm.controls['momentDelay']?.value,
            secondPercent:
            termsPaymentForm.controls['defermentAmount']?.value,
            secondPeriodValueNumber:
              termsPaymentForm.controls['defermentPeriodNumber']?.value ||
              null,
            thirdPeriodValueNumber:
              Number(termsPaymentForm.controls['momentPrepayment']?.value) === timberTicket &&
              Number(termsPaymentForm.controls['prepaymentAmount']?.value) < DEFAULT_DEFERMENT_PERIOD_NUMBER_2
                ? termsPaymentForm.controls['defermentPeriod2']?.value
                : null,
          }
          : null;
    } else {
      payCondFull =
        paymentCond.idPaymentType !==
        termsConditionsPaymentConst.partialPrepayment
          ? {
            idPaymentType: paymentCond.idPaymentType,
            idDayType: paymentCond.idDayType || null,
            idShipmentVolume: paymentCond.idShipmentVolume,
            idPaymentMoment: paymentCond.firstPaymentMomentId,
            periodValueNumber: paymentCond.firstPeriodValueNumber,
            periodValueDate: paymentCond.firstPeriodValueDate,
          }
          : null;
      paymentPart =
        paymentCond.idPaymentType ===
        termsConditionsPaymentConst.partialPrepayment
          ? {
            idDayType: paymentCond.idDayType || null,
            idShipmentVolume: paymentCond.idShipmentVolume,
            idPaymentMomentPrepay: paymentCond.firstPaymentMomentId,
            firstPercent: paymentCond.firstPercent,
            firstPeriodValueNumber:
              Number(paymentCond.firstPaymentMomentId) !== timberTicket
                ? paymentCond.firstPeriodValueNumber
                : null,
            idPaymentMomentDelay: paymentCond.secondPaymentMomentId,
            secondPercent: paymentCond.secondPercent,
            secondPeriodValueNumber:
              paymentCond.secondPeriodValueNumber || null,
            thirdPeriodValueNumber:
              Number(paymentCond.firstPaymentMomentId) === timberTicket &&
              Number(paymentCond.firstPercent) < DEFAULT_DEFERMENT_PERIOD_NUMBER_2
                ? paymentCond.thirdPeriodValueNumber
                : null,
          }
          : null;
    }

    if (editTermCondition) {
      //открыта форма редактирования Срока поставки
      deliveryPeriod = {
        idDeliveryMoment: deliveryTermForm.value.startDelivery,
        idPeriodType: deliveryTermForm.value.deliveryType,
        periodTypeValue: deliveryTermForm.value.deliveryTerm,
        dateBegin: deliveryTermForm.value?.startDate
          ? toOADate(deliveryTermForm.value?.startDate)
          : null,
        dateEnd: deliveryTermForm.value?.endDate
          ? toOADate(deliveryTermForm.value?.endDate)
          : null,
      };
    } else {
      deliveryPeriod = {
        idDeliveryMoment: Number(deliveryPeriodValue.idDeliveryMoment),
        idPeriodType: deliveryPeriodValue.idDeliveryType,
        periodTypeValue: deliveryPeriodValue.periodTypeValue,
        dateBegin: deliveryPeriodValue.dateBegin,
        dateEnd: deliveryPeriodValue.dateEnd,
      };
    }

    const hasRemains: boolean = goodRemains.length > 0;

    const createOfferBase = (goodsData, isRemains = false) => ({
      idDirection: generalInfo.directionId,
      idSection: Number(sessionIds.sectionId),
      setDemandOffer: {
        idDemandOffer: generalInfo.idDemandOffer,
        idSession: Number(sessionIds.sessionId),
        idModel: generalInfo.idModel,
        idFirmClient: generalInfo.idClientContractType === AgreementType.Agency
          ? generalInfo.clientId
          : null,
        idClientContractType: generalInfo.idClientContractType,
        idBranch: generalInfo.branchId,
        idCurrency: goods[0].goodsSpecifications.find(
          field => field.idInterfaceField === IdInterfaceField.currency
        )?.fieldValueNumber,
        vatPercent: getVatNumber(VatField, true),
        idPriceAdjustment: goods[0].goodsSpecifications.find(
          field => field.idInterfaceField === IdInterfaceField.amendmentType
        )?.fieldValueNumber,
        isPriceAdjusted: isRemains ? false : (adjustablePrice?.toString().toLowerCase() || false),     //всегда false в остаточной
        idFinance: goods[0].goodsSpecifications.find(
          field => field.idInterfaceField === IdInterfaceField.financeSource
        )?.fieldValueNumber,
        detailsImportDomestic: generalInfo.detailsImportDomestic,
        detailsExportForeign: generalInfo.detailsExportForeign,
        listDeletedDocuments: [],
        idDeliveryScheduleType: isRemains ? null : generalInfo.idDeliveryScheduleType || null,
      },
      goods: goodsData,
      payCondFull: payCondFull,
      paymentPart: paymentPart,
      deliveryPeriod: deliveryPeriod,
      delivConditions: finishDeliveryBasis,
      delivScope: isRemains ? finishDeliveryScopesRemain : finishDeliveryScopes,
      delivSchPeriods: isRemains ? [] : finishDelivSchPeriods,    //в остаточной заявке всегда стирается
      documents: [],
      idVatPercent: VatField.fieldValueNumber,
      idVatQuote: this.getGoodsSpecifications(
        goods[0].goodsSpecifications,
        IdInterfaceField.quoteCurrency
      )?.fieldValueNumber ?? 0,
      rules: rules,
    });

    const remainsOffer = hasRemains
      ? createOfferBase(goodRemains, true)         //выделяем остаточную заявку
      : null;

    const isBuyerAuction: boolean = sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction;

    const body = {
      [isBuyerAuction ? 'currentDemand' : 'currentOffer']: createOfferBase(goodCurrent, false),
      [isBuyerAuction ? 'remainsDemand' : 'remainsOffer']: remainsOffer,
    };

    if (
      sessionIds.session.idAuctionType !== auctionType.simpleBuyerAuction
    ) {
      this.demandService.editOffer(userToken, body).subscribe((res) => {
        this.finishEdit(res);
      });
    } else {
      saveWithPending(
        this.demandService.editDemand(userToken, body),
        (pending: boolean) => this.saveRequestPending.next(pending),
        {
          next: (res: EditOfferDemandResponse) => {
            this.finishEdit(res);
          },
        }
      );
    }
  }

  public createRuleObject(): Demand {
    let goods: IEditOfferGood[] = this.goodsSubject.getValue();
    let generalInfo: IGeneralInfo = this.generalInfoSubject.getValue();
    let editTermPayment: boolean = this.editTermPaymentSubject.getValue();
    let termsPaymentForm: FormGroup = this.termsPaymentFormSubject.getValue();
    let paymentCond: IPaymentCondition = this.paymentCondSubject.getValue();
    let deliveryBasisCommon: DeliveryBasis[] = this.deliveryBasisCommonSubject.getValue();
    let momentPrepayment: PrepayMoment = this.momentPrepaymentSubject.getValue();
    let deliveryTermForm: FormGroup = this.deliveryTermFormSubject.getValue();
    let dataForModel: DataForModel = this.dataForModelSubject.getValue();
    let finishDelivSchPeriods: ScheduleData[] = this.finishDelivSchPeriodsSubject.getValue();
    let deliveryPeriodValue: IDeliveryPeriod = this.deliveryPeriodValueSubject.getValue();
    let editTermCondition: boolean = this.editTermConditionSubject.getValue();

    let objForReq: DemandValues = {}; //объект для записи в боди
    goods.forEach((item) => {
      let endKeys: string[] = [];
      let endValues: any[] = [];
      let objectForValues: {} = {}; //объект заполненных полей 1 товара

      item.goodsSpecifications.forEach((field: any) => {
        for (let i: number = 0; i < field.length; i++) {
          if (field.idInterfaceField) {
            endKeys.push(
              'field' + field.blockId + 'n' + field.idInterfaceField
            );
            endValues.push(
              field.controlFieldType === 'dxSelectBox' ||
              field.controlFieldType === 'dxNumberBox'
                ? field.fieldValueNumber
                : field.controlFieldType === 'dxTextBox' ||
                field.controlFieldType === 'dxCheckBox'
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

      if (goods[0] === item) {
        const getValue = (editValue, normalValue) => editTermPayment ? editValue : normalValue;
        const isDeferment: boolean = paymentCond.idPaymentType === termsConditionsPaymentConst.paymentDeferment;
        const isPartialPrepayment: boolean = paymentCond.idPaymentType === termsConditionsPaymentConst.partialPrepayment;

        objectForValues['termsConditionsPayment'] = {
          paymentConditionId: getValue(termsPaymentForm.controls['termsPayment']?.value, paymentCond.idPaymentType),
          paymentVolumeId: getValue(termsPaymentForm.controls['volume']?.value, paymentCond.idShipmentVolume),
          prepayMomentId: getValue(
            termsPaymentForm.controls['momentPrepayment']?.value || null,
            (!isDeferment ? paymentCond.firstPaymentMomentId : null
            ) || null),
          delayMomentId: getValue(
            termsPaymentForm.controls['momentDelay']?.value || null,
            isPartialPrepayment
              ? paymentCond.secondPaymentMomentId
              : isDeferment
                ? paymentCond.firstPaymentMomentId
                : null
          ),
          dayTypeId: getValue(termsPaymentForm.controls['dayTypeId']?.value || null, paymentCond.idDayType || null),
          delayValue: getValue(
            termsPaymentForm.controls['defermentAmount']?.value || 0,
            isDeferment
              ? paymentCond.firstPercent || 0
              : isPartialPrepayment
                ? paymentCond.secondPercent || 0
                : 0
          ),
          delayValue2: getValue(
            termsPaymentForm.controls['defermentAmount2']?.value || null,
            (AMOUNT_OF_DEFERMENT_100 - (paymentCond?.firstPercent || 0)) - (paymentCond?.secondPercent || 0) || null
          ),
          prepayValue: getValue(termsPaymentForm.controls['prepaymentAmount']?.value || 0, !isDeferment ? paymentCond.firstPercent || 0 : 0),

          delayTerm: {
            applicableDayCount: getValue(
              momentPrepayment?.options.applicableDayCount
                ? termsPaymentForm.controls['defermentPeriodNumber']?.value
                : null,
              paymentCond.idDayType
                ? (isPartialPrepayment
                  ? paymentCond.secondPeriodValueNumber
                  : isDeferment
                    ? paymentCond.firstPeriodValueNumber
                    : null)
                : null
            ),
            calendarDayCount2: getValue(termsPaymentForm.controls['defermentPeriod2']?.value || null, paymentCond.thirdPeriodValueNumber),
            dayOfMonth: getValue(
              momentPrepayment?.options.dayOfMonth ? termsPaymentForm.controls['defermentPeriodNumber']?.value : null,
              !paymentCond.idDayType
                ? (isPartialPrepayment
                  ? paymentCond.secondPeriodValueNumber
                  : isDeferment
                    ? paymentCond.firstPeriodValueNumber
                    : null)
                : null
            ),
            date: getValue(
              momentPrepayment?.options.date
                ? termsPaymentForm.controls['defermentPeriodDate']?.value
                : null,
              paymentCond.firstPeriodValueDate || null),
          },

          prepayTerm: {
            applicableDayCount: getValue(
              momentPrepayment?.options.applicableDayCount
                ? termsPaymentForm.controls['prepaymentPeriodNumber']?.value
                : null,
              paymentCond.idDayType
                ? paymentCond.firstPeriodValueNumber
                : null
            ),
            dayOfMonth: getValue(
              momentPrepayment?.options.dayOfMonth
                ? termsPaymentForm.controls['prepaymentPeriodNumber']?.value
                : null,
              !paymentCond.idDayType
                ? paymentCond.firstPeriodValueNumber
                : null
            ),
            date: getValue(
              momentPrepayment?.options.date
                ? termsPaymentForm.controls['prepaymentPeriodDate']?.value
                : null,
              paymentCond.firstPeriodValueDate),
          },
        };
        if (deliveryBasisCommon?.length > 0) {
          let extra: DeliveryConditionIntersection[] = [];
          let main: DeliveryConditionIntersection;
          deliveryBasisCommon?.forEach((item) => {
            const itemData: DeliveryConditionIntersection = {
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
            if (item.coreBasis) {
              main = { ...itemData };
            } else {
              extra.push(itemData);
            }
          });
          objectForValues['deliveryCondition'] = Object.assign(
            { main: main },
            { extra: extra }
          );
        }

        const getValueTerm = (editValue, normalValue) => editTermCondition ? editValue : normalValue;
        objectForValues['deliveryTerm'] = {
          deliveryStartId: getValueTerm(deliveryTermForm.value.startDelivery, deliveryPeriodValue.idDeliveryMoment),
          deliveryTermId: getValueTerm(deliveryTermForm.value.deliveryType, deliveryPeriodValue.idDeliveryType),
          dayValue:
            Number(deliveryTermForm.value.deliveryType) === ID_DELIVERY_TYPE.DAY
            || Number(deliveryPeriodValue.idDeliveryType) === ID_DELIVERY_TYPE.DAY
              ? getValueTerm(deliveryTermForm.value.deliveryTerm, deliveryPeriodValue.periodTypeValue)
              : null,
          monthValue:
            Number(deliveryTermForm.value.deliveryType) === ID_DELIVERY_TYPE.MONTH
            || Number(deliveryPeriodValue.idDeliveryType) === ID_DELIVERY_TYPE.MONTH
              ? getValueTerm(deliveryTermForm.value.deliveryTerm, deliveryPeriodValue.periodTypeValue)
              : null,
          startDeliveryDate: deliveryTermForm.value?.startDate || deliveryPeriodValue.dateBegin
            ? getValueTerm(toOADate(deliveryTermForm.value?.startDate), deliveryPeriodValue.dateBegin)
            : null,
          endDeliveryDate: deliveryTermForm.value?.endDate || deliveryPeriodValue.dateEnd
            ? getValueTerm(toOADate(deliveryTermForm.value?.endDate), deliveryPeriodValue.dateEnd)
            : null,
        };

        if (finishDelivSchPeriods.length > 0) {
          let periods: PeriodsForRule[] = [];

          finishDelivSchPeriods.forEach((item) => {
            for (let i: number = 0; i < item.goods.length; i++) {
              periods.push({
                number: item.numberPeriod,
                startDate: item.startDate,
                endDate: item.endDate,
                volume: item.goods[i].volume,
                unit: goods.find(
                  (el) =>
                    el.goodsSpecifications[0].idDemandOfferGood ===
                    item.goods[i].idGood
                ).unitName,
              });
            }
          });

          objectForValues['deliverySchedule'] = Object.assign(
            {
              periodType: {
                id: finishDelivSchPeriods[0]?.idPeriod,
                name: '',
              },
            },
            { periods: periods }
          );
        }
      }

      let endObject: {} = {}; //объект с индексом товара

      endObject[goods.indexOf(item)] = objectForValues;
      objForReq = Object.assign(endObject, objForReq);
    });

    return {
      model: dataForModel,
      modelId: generalInfo.idModel,
      values: objForReq,
      sessionsParams: {
        tradeTypeId: dataForModel.tradeTypeId.toString(),
        marketTypeIds: dataForModel.marketTypeIds,
      },
      generalParams: {
        //!добавить свое
        validityPeriod: null,
        isMoveToNextSession: false,
      },
      demandParams: {
        //!добавить свое
        directionId: generalInfo.directionId,
        marketTypeIds: null,
        startDate: null,
      },
    };
  }

  public finishEdit(res: EditOfferDemandResponse): void {
    this.tradingService.nonDisabledSaveButton(false);
    let message: string = res.idDemandOfferRemains ?
      (getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.changesSavedSuccessful') +
        ' ' +
        getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.createdNewLot') +
        res.lotNumberRemains) :
      getTranslateResultByCurrentLang(this.translate.store.currentLang, 'editOffer.changesSavedSuccessful');

    this.toastService.onShowToast({ message: message, type: 'success' });
    this.closeModalSubject.next(true);
  }

  public searchTxtBoxValueChange(
    e: ValueChangedEvent,
    placeDataBasis: PlacesTree[],
    treeViewInstance: TreeView
  ): void {
    let _searchTextLength: number = e.value.length;
    treeViewInstance.beginUpdate();
    if (_searchTextLength === 0) {
      treeViewInstance.option('dataSource', []);
      treeViewInstance.repaint();
      treeViewInstance.option('dataSource', placeDataBasis);
      treeViewInstance.collapseAll();
      treeViewInstance.repaint();
      treeViewInstance.option('searchValue', '');
    } else {
      const filtered: PlacesTree[] = this.getFilteredDataWithParents(placeDataBasis, e.value.toLowerCase());
      treeViewInstance.option('dataSource', filtered);
      treeViewInstance.expandAll();
    }
    treeViewInstance.endUpdate();
  }

  public getFilteredDataWithParents(placeDataBasis: PlacesTree[], searchText: string): PlacesTree[] {
    const resultIds: Set<number> = new Set();

    const placeDataFiltered: PlacesTree[] = placeDataBasis.filter(item =>
      item.valueName.toLowerCase().includes(searchText)
    );

    placeDataFiltered.forEach(item => {
      let currentId: number = item.idLink;
      while (currentId) {
        resultIds.add(currentId);
        const parent: PlacesTree = placeDataBasis.find(p => p.idLink === currentId);
        currentId = parent?.idLinkParent;
      }
    });

    const itemsToShow: PlacesTree[] = placeDataBasis.filter(item => resultIds.has(item.idLink));

    const getAllChildren = (parentId: number, result: any[]) => {
      const children: PlacesTree[] = placeDataBasis.filter(child => Number(child.idLinkParent) === Number(parentId));
      children.forEach(child => {
        if (!resultIds.has(child.idLink)) {
          resultIds.add(child.idLink);
          result.push(child);
        }
        getAllChildren(child.idLink, result);
      });
    };

    placeDataFiltered.forEach(item => {
      getAllChildren(item.idLink, itemsToShow);
    });

    return placeDataBasis.filter(item => resultIds.has(item.idLink));
  }

  public getPrepareDeliveryPlaceValues(
    trees: PlacesTree[],
    idBasisValue: number,
    idAuctionType: number,
    marketTypesIds: string[]
  ): PlacesTree[] {
    const isValidDomesticOnly: boolean =
      marketTypesIds.length === 1 && marketTypesIds[0] === MARKET_TYPES.DOMESTIC;

    const isValidDomesticAndImport: boolean =
      marketTypesIds.length === 2 &&
      marketTypesIds.includes(MARKET_TYPES.DOMESTIC) &&
      marketTypesIds.includes(MARKET_TYPES.IMPORT);

    trees.find((el) => {
      if (el.lvl === 1) {
        // если базис поставки "Франко склад продавца" - значение "БЕЛАРУСЬ" недоступен
        if (idBasisValue === ID_STAT_DELIVERY.SELLERS_EX_WAREHOUSE && el.idLink === BELARUS_ID_LINK) {
          if (ciNodeDelivPlaceArray.includes(el.idLinkParent)) {
            el.disableCountries = true;
          }
        }
        el.idLinkParent = null;
      }
      //  "Внутренний рынок" или "Внутренний рынок"+ "Импорт", базис "Франко-вагон станция назначения" - место поставки только "Беларусь" без конкретных станций
      if (idBasisValue === ID_STAT_DELIVERY.FREE_CARRIAGE_DESTINATION_STATION
        && (isValidDomesticOnly || isValidDomesticAndImport)
        && el.idLink !== BELARUS_ID_LINK_DESTINATION_STATION(this.config)
        && Number(idAuctionType) === AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION) {
        el.disableCountries = true;
      }
    });

    if (this.domesticCondition(marketTypesIds) && idBasisValue === ID_STAT_DELIVERY.BUYERS_EX_WAREHOUSE) {
      //для ФРАНКО-СКЛАД ПОКУПАТЕЛЯ и модели на внутренний рынок в дереве оставляем только Беларусь
      return this.filterBelarusChildren(trees);
    }

    return trees;
  }

  public filterBelarusChildren(trees: PlacesTree[]): PlacesTree[] {
    const belarusRoot: PlacesTree = trees.find(
      (tree) => tree.idLink === BELARUS_ID_LINK && tree.lvl === 1
    );
    if (!belarusRoot) {
      return [];
    }

    const childrenMap = new Map<number, PlacesTree[]>();
    for (const tree of trees) {
      if (tree.idLinkParent !== null) {
        const list: PlacesTree[] = childrenMap.get(tree.idLinkParent) || [];
        list.push(tree);
        childrenMap.set(tree.idLinkParent, list);
      }
    }

    const result: PlacesTree[] = [belarusRoot];

    const findChildren = (parentId: number): void => {
      const children: PlacesTree[] = childrenMap.get(parentId);
      if (!children) {
        return;
      }
      for (const child of children) {
        result.push(child);
        findChildren(child.idLink);
      }
    };

    findChildren(belarusRoot.idLink);
    return result;
  }

  public domesticCondition(marketTypesIds: string[]): boolean {
    return marketTypesIds.some((el) =>
      [MARKET_TYPES.DOMESTIC, MARKET_TYPES.IMPORT].includes(el as MARKET_TYPES)
    );
  }

  public getGenerateGoodFields(good: Good, idUnit: boolean = false): GetGeneratedGoodFields {
    const result: GetGeneratedGoodFields = {
      goodName: good.goodName,
      properties: idUnit ? good.properties : good.goodDescription
    };
    if (idUnit) {
      result.unit = good.unitName;
    } else {
      result.unitName = good.unitName;
    }
    return result;
  }
}
