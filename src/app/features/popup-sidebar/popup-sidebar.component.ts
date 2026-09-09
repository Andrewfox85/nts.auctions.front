import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  WritableSignal
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import {
  TradingService,
  CommonService,
  PopupSidebarService,
  DemandService,
  TargetedService,
  TransactionService,
  CounterService,
  ObserveOffersService,
  DeliveryPeriodDemand,
  DeliveryScope
} from '@services';
import {
  DxPopupModule,
  DxTooltipModule,
  DxTabPanelModule,
  DxToastModule,
} from 'devextreme-angular';
import { CommonModule, DatePipe } from '@angular/common';
import {
  editingRules,
  POPUP_SIDEBAR_TYPE,
  IdInterfaceField,
  IdDirection,
  INTERSECTION_FIELD,
  NUMBER_OF_CASE,
  auctionType,
  IdSessionPeriods,
  IdActivationMode
} from '@constants';
import {
  AUCTION_TYPE,
  DELIVERY_SCHEDULE,
  DELIVERY_SCOPE_ITEMS,
  ID_DELIVERY_TYPE,
  ID_DIRECTION_TRADER_ROLE
} from '@enums';
import { PageCache, User } from '@classes';
import {
  BasisInfoComponent,
  CompareMainInfoComponent,
  CounteOfferEditComponent,
  DeliveryScheduleInfoComponent,
  DeliveryScopeComponent,
  DeliveryScopeEditComponent,
  EditOfferComponent,
  MainInfoComponent,
  RulesForEditingComponent,
  SubmittingBetComponent,
  SubmittingCounterOfferComponent,
  DeliveryScheduleEditComponent,
  BasisEditComponent,
  ViewDealComponent,
  CounterOffersComponent,
  EditDealComponent,
  DepositPopupComponent
} from '@components';
import { HomePageStore } from '@homepage-store';
import { downloadArchive, getAuctionPath, getIdGood, groupByConcatedCondition } from '@helpers';
import { GlobalStore } from '@store';
import {
  delay,
  filter,
  map,
  switchMap,
  takeUntil,
  tap,
  catchError,
} from 'rxjs/operators';
import { convertExcelSerialDateToMs } from '../../views/homepage/helpers';
import { Subject, EMPTY } from 'rxjs';
import { AnalogListResponse } from './../../services/counter-service/shared/interfaces/index';
import { AnalogsListComponent } from './../../components/analogs-list/analogs-list.component';
import {
  EditPurchaseOfferComponent
} from "../../views/dutch-down-auction/components/edit-purchase-offer/edit-purchase-offer.component";
import {
  SubmittingCounterDemandComponent
} from './../../views/dutch-down-auction/components/submitting-counter-demand/submitting-counter-demand.component';
import {
  AcceptCounterofferToSellComponent
} from "../../views/dutch-down-auction/components/accept-counteroffer-to-sell/accept-counteroffer-to-sell.component";
import { DemandCounter } from "../../components/analogs-list/interfaces";
import { ICounterOfferSelectedRow } from "@interfaces";
import { forkJoin } from 'rxjs';
import { ViewCounterOffer } from "../../components/popup-content/view-counter-offer/view-counter-offer";
import { ViewCounterOfferPopup } from "../../components/popups/view-counter-offer-popup/view-counter-offer-popup";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SECTIONS_TYPES } from "../header/enums";
import {
  ComplexLotProductType,
  DeliveryScopeGraded,
  EditDemandOfferServiceService
} from "../../services/edit-demand-offer-service.service";

@Component({
  selector: 'popup-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DxPopupModule,
    DxTooltipModule,
    DxTabPanelModule,
    DxToastModule,
    BasisInfoComponent,
    DeliveryScopeComponent,
    DeliveryScheduleInfoComponent,
    CompareMainInfoComponent,
    DeliveryScopeEditComponent,
    DeliveryScheduleEditComponent,
    BasisEditComponent,
    CounteOfferEditComponent,
    SubmittingCounterOfferComponent,
    RulesForEditingComponent,
    ViewDealComponent,
    EditOfferComponent,
    SubmittingBetComponent,
    MainInfoComponent,
    DepositPopupComponent,
    CounterOffersComponent,
    EditDealComponent,
    AnalogsListComponent,
    EditPurchaseOfferComponent,
    SubmittingCounterDemandComponent,
    AcceptCounterofferToSellComponent,
    ViewCounterOffer,
    ViewCounterOfferPopup,
  ],
  templateUrl: './popup-sidebar.component.html',
  styleUrls: ['./popup-sidebar.component.scss'],
})
export class PopupSidebarComponent implements OnInit, OnDestroy {
  private readonly demandService = inject(DemandService);
  private readonly globalStore = inject(GlobalStore);
  private readonly targetedService = inject(TargetedService);
  private readonly transactionService = inject(TransactionService);
  private readonly counterService = inject(CounterService);
  private readonly observeOffersService = inject(ObserveOffersService);
  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);

  @ViewChild(DeliveryScheduleEditComponent) DeliveryScheduleEditComponent;
  @ViewChild(BasisEditComponent) BasisEditComponent;
  @ViewChild(DeliveryScopeComponent) DeliveryScopeComponent;
  @ViewChild(DeliveryScopeEditComponent) DeliveryScopeEditComponent;
  @ViewChild(EditOfferComponent) EditOfferComponent;

  dataForReq = signal<any>([]);
  type: string;
  title: string = '';
  message: string = '';
  user: User;
  cache = {} as PageCache;
  isVisible: boolean = false;

  tabIndex: number;
  idOffer: number; //для просмотра заявки
  idDemandOffer: number;
  idDirection: number;
  fullInfo = signal<any>([]);
  totalBlockData: any;
  modelEditRules: any;
  dataForModel: any;
  dataForModelWithBasis: any;

  isVisibleToast = false;
  messageToast: string = ' ';

  depositPopup: boolean = false;
  depositRowData: any;
  dateBegin: any;
  dateEnd: any;
  isNeedChangeSchedule = false;
  isNeedChangeScope = false;
  isNeedChangeBasis = false;
  isFilterCounter = false;
  scheduleData = [];
  public isMine: boolean = false;
  idDirectionRole: number | null;
  deliveryBasisCommon = [];

  fullInfoParent: any;
  delivCond = [];
  fullInfoCopy;
  deletedScope: any;
  isSaveForm = false; //Вы действительно хотите выйти без сохранения последних изменений (правила редактирования)

  public isEditSaveRequestPending: boolean = false;

  counterScope: string; //удаленные грузоотправители для принятия встречного предложения
  directSession: boolean = false;
  private readonly store = inject(HomePageStore);
  private destroy$ = new Subject<void>();

  isLoading = false;
  public isAllowAnalog: boolean;
  public roleToAction: boolean;
  public analogList: AnalogListResponse;
  public isAvailableAnalogList: boolean;
  public viewInSingleCurrencyPopup: boolean = false;

  public isDisabledDownloadRegister: number;
  public conterInfo: DemandCounter | ICounterOfferSelectedRow;

  public readonly auctionType = auctionType;
  public readonly IdDirection = IdDirection;
  public readonly IdSessionPeriods = IdSessionPeriods;
  public readonly POPUP_SIDEBAR_TYPE = POPUP_SIDEBAR_TYPE;
  public deliveryScopes: WritableSignal<any[]> = signal([]);
  public delivSchPeriods: WritableSignal<any[]> = signal([]);
  public deliveryScopeGraded: DeliveryScopeGraded[];
  public isSameGradedSaleOffer: boolean = false;

  constructor(
    public translate: TranslateService,
    public router: Router,
    public commonService: CommonService,
    public popupSidebarService: PopupSidebarService,
    private tradingService: TradingService
  ) {
    window.addEventListener('popstate', () => {
      this.onHiddenPopup();
    });
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.type === POPUP_SIDEBAR_TYPE.VIEW_OFFER_FROM_OFFERS)
      this.cache = JSON.parse(sessionStorage.getItem('OFFERS')) || {};

    if (this.type === POPUP_SIDEBAR_TYPE.VIEW_OFFER_FROM_AUCTIONS)
      this.cache = JSON.parse(sessionStorage.getItem('AUCTIONS')) || {};

    this.popupSidebarService.componentMethodCalled$.subscribe((res) => {
      if (res) {
        this.isVisible = true;
        this.isFilterCounter = res.isFilterCounter;
        this.globalStore.setDataForReq(res.dataForReq);
        this.dataForReq.set(res.dataForReq);
        this.type = res.type;

        if (
          this.type === POPUP_SIDEBAR_TYPE.VIEW_OFFER_FROM_OFFERS ||
          this.type === POPUP_SIDEBAR_TYPE.VIEW_OFFER_FROM_AUCTIONS ||
          this.type === POPUP_SIDEBAR_TYPE.SUBMIT_BID_TO_BUY ||
          this.type === POPUP_SIDEBAR_TYPE.EDIT_OFFER ||
          this.type === POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS ||
          this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS ||
          this.type === POPUP_SIDEBAR_TYPE.COMPARE_OFFER ||
          this.type === POPUP_SIDEBAR_TYPE.ANALOG_LIST
        ) {
          this.tabIndex = 0;
          this.idOffer = res.idOffer;
          this.idDemandOffer = res.fullInfo?.generalInfo?.idDemandOffer;
          this.idDirection = res.idDirection;
          this.globalStore.setFullInfo(res.fullInfo);
          this.fullInfo.set(res.fullInfo);

          this.setDeliveryScopes();
          this.setDeliverySchedule();

          this.isMine = res.isMine;
          this.idDirectionRole = res.IdDirectionRole || null;
          this.directSession = res.directSession ? res.directSession : false;
          this.analogList = res.analogList;
          this.isAvailableAnalogList = res.isAvailableAnalogList;
          this.isAllowAnalog = res.isAllowAnalog;
          this.roleToAction = res.roleToAction;
          this.fullInfoCopy = Object.freeze(structuredClone(this.fullInfo()));

          if (this.deliveryScopes()?.length > 0) {
            this.getClientName();
          }
        }

        if (
          this.type === POPUP_SIDEBAR_TYPE.EDIT_OFFER ||
          this.type === POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS ||
          (this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS && this.isMine)
        ) {
          this.isLoading = true;
          this.getModel();
        }

        if (this.type === POPUP_SIDEBAR_TYPE.RULES_FOR_EDITING) {
          this.globalStore.setFullInfo(res.fullInfo);
          this.fullInfo.set(res.fullInfo);
          this.globalStore.setDataForReq(res.dataForReq);
          this.dataForReq.set(res.dataForReq);
        }

        if (this.type === POPUP_SIDEBAR_TYPE.VIEW_DEAL || this.type === POPUP_SIDEBAR_TYPE.EDIT_DEAL) {
          this.globalStore.setFullInfo(res.fullInfo);
          this.fullInfo.set(res.fullInfo);

          this.setDeliveryScopes();
          this.setDeliverySchedule();
          this.isDisabledDownloadRegister =
            this.fullInfo()?.transactionGeneral?.buyerInfo?.buyerIdFirm &&
            this.fullInfo()?.transactionGeneral?.sellerInfo?.sellerIdFirm;

          if (this.deliveryScopes()?.length > 0) {
            this.getClientName();
          }
        }

        if (this.type === POPUP_SIDEBAR_TYPE.COMPARE_OFFER) {
          this.fullInfoParent = res.fullInfoParent;
          this.delivCond = JSON.parse(
            JSON.stringify(res.fullInfo.deliveryConditions)
          );
        }

        this.tradingService.infoDeletedScopeFromCounter$.subscribe((data) => {
          if (this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS) {
            //&& !this.DeliveryScopeComponent
            this.deletedScope = data;
          }
        });
      } else if (this.type !== POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS) {
        this.onHiddenPopup();
      }
    });

    this.popupSidebarService.submitBidInfo$.subscribe((res: any) => {
      //инфа об изменении сведений по сессии
      if (
        this.type === POPUP_SIDEBAR_TYPE.SUBMIT_BID_TO_BUY ||
        this.type === POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS ||
        (this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS && this.isMine) ||
        this.type === POPUP_SIDEBAR_TYPE.EDIT_OFFER ||
        this.type === POPUP_SIDEBAR_TYPE.ANALOG_LIST ||
        this.type === POPUP_SIDEBAR_TYPE.VIEW_OFFER_FROM_AUCTIONS
      ) {
        this.globalStore.setDataForReq(res);
        this.dataForReq.set(res);
      }
    });

    this.popupSidebarService.counterOfferInfo$
      .pipe(
        filter((res) => this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS && this.isMine),
        tap((res: any) => {
          this.isLoading = true;

          this.idDirection = res.idDirection;
          this.globalStore.setFullInfo(res.fullInfo);
          this.fullInfo.set(res.fullInfo);
          this.setDeliveryScopes();
          this.setDeliverySchedule();
          this.prepareData();
        }),
        delay(0),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.idOffer = res.idOffer;
      });

    //слушаем событие добавление/удаления в наблюдамые и обновляем данные
    this.popupSidebarService.triggerWatched$.subscribe((res: any) => {
      this.updateWatchedOffer(res);
    });

    //слушаем событие о рассмотрении ТА и обновляем сооьщение на форме списка ТА
    this.popupSidebarService.triggerAnalogList$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: boolean) => {
        this.isAvailableAnalogList = res;
      });

    this.tradingService.clickEdit$.subscribe(() => {
      this.tabIndex = 1;
    });

    this.tradingService.changeVolume$.subscribe((res: any) => {
      //изменили количество, подсвечиваем грузоотправителей и график поставки
      this.fullInfo().goods = res.goods;
      this.isNeedChangeSchedule = this.delivSchPeriods()?.length > 0;
      if (this.deliveryScopes()?.length > 0) {
        const sumDeliveryScopes: number = this.deliveryScopes().reduce((acc, scope) => acc + scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO][0].volume, 0);
        const sumGoodVolumes: number =
          res.goods.reduce((acc, good) =>
              acc + this.getGoodsSpecifications(
                good.goodsSpecifications,
                IdInterfaceField.quantity
              ).fieldValueNumber,
            0);
        this.isNeedChangeScope = this.fullInfo().generalInfo.isDeliveryScopeGraded && this.deliveryScopes()?.length > 1 && sumGoodVolumes !== sumDeliveryScopes;
      }
      if (
        !this.BasisEditComponent &&
        (this.type === POPUP_SIDEBAR_TYPE.EDIT_OFFER ||
          (this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS &&
            this.isMine &&
            this.dataForReq().idSessionPeriod === IdSessionPeriods.offersAdjustment &&
            this.dataForReq().isActive))
      ) {
        if (this.fullInfo().deliveryConditions?.length > 0) {
          let vat,
            vatValue = this.fullInfo().goods[0].goodsSpecifications.find(
              (el) => el.idInterfaceField == 5
            );
          if (vatValue.fieldValueNumber != 1) {
            vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
          } else vat = 0;
          this.fullInfo().deliveryConditions.forEach((el) => {
            el[1].forEach((good) => {
              let goodOffer = this.fullInfo().goods.find(
                (g) =>
                  g.goodsSpecifications[0].idDemandOfferGood ==
                  good.idDemandOfferGood
              );
              good.volume = goodOffer.goodsSpecifications.find(
                (sp) => sp.idInterfaceField == 1
              ).fieldValueNumber;
              good.costVat = this.costVatBasis(
                good.priceWithoutVat,
                good.volume,
                vat
              );
            });
          });
          this.deliveryBasisCommon.forEach((basis) => {
            basis.goods.forEach((good) => {
              let goodOffer = this.fullInfo().goods.find(
                (g) =>
                  g.goodsSpecifications[0].idDemandOfferGood ==
                  good.idDemandOfferGood
              );
              good.volume = goodOffer.goodsSpecifications.find(
                (el) => el.idInterfaceField == 1
              ).fieldValueNumber;
              good.costVat = this.costVatBasis(good.cost, good.volume, vat);
            });
          });
        }
      }
    });

    this.tradingService.changeDeliveryParams$.subscribe((res: any) => {
      if (this.type === POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS) {
        return;
      }
      if (res.schedule) {
        this.delivSchPeriods.set(res.schedule);
        this.fullInfo().generalInfo.idDeliveryScheduleType = null;
      }
      if (!this.DeliveryScheduleEditComponent) {
        //если не открывали вкладку График поставки и при этом изменили срок поставки
        const hasDeliverySchedule: boolean = this.delivSchPeriods()?.length > 0;
        if (hasDeliverySchedule) {
          this.isNeedChangeSchedule = true;
        }

        if (res.deliveryType) {
          this.fullInfo().deliveryPeriod.idDeliveryType = res.deliveryType;
        }
        if (res.deliveryPeriodInDays) {
          if (this.fullInfo().deliveryPeriod.idDeliveryType == ID_DELIVERY_TYPE.DATE) {
            this.dateEnd = res.deliveryPeriodInDays;
          } else {
            this.fullInfo().deliveryPeriod.periodTypeValue =
              res.deliveryPeriodInDays;
          }
        }
        if (res.deliveryStartDate) {
          this.dateBegin = res.deliveryStartDate;
        }
        if (res.concatedStringDeliveryTerm) {
          this.fullInfo().generalInfo.concatedDeliveryPeriod =
            res.concatedStringDeliveryTerm;
          if (hasDeliverySchedule) {
            this.onRedFlag();
          }
        }
      }
    });

    this.tradingService.concatedDeletedClients$.subscribe((res: any) => {
      if (
        this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS &&
        this.isMine &&
        this.dataForReq().idSessionPeriod === IdSessionPeriods.offersAdjustment &&
        this.dataForReq().isActive &&
        !this.DeliveryScopeEditComponent
      ) {
        this.counterScope = res;
      }
    });
    //приняли встречку
    this.tradingService.changeScopes$.subscribe((res: any) => {
      if (
        this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS &&
        this.isMine &&
        Number(this.dataForReq().idSessionPeriod) === IdSessionPeriods.offersAdjustment &&
        this.dataForReq().isActive &&
        !this.DeliveryScopeEditComponent
      ) {
        if (!this.isSameGradedSaleOffer) {
          this.deliveryScopes.set(res);
        } else {
          this.deliveryScopeGraded = res;
        }
        this.isNeedChangeScope = false;
      }
    });

    this.tradingService.changeMainBasis$.subscribe((res: any) => {
      if (!this.BasisEditComponent) {
        if (res.str != 'basis') {
          let vat,
            vatValue = res.goods[0].goodsSpecifications.find(
              (el) => el.idInterfaceField == 5
            );
          if (vatValue.fieldValueNumber != 1) {
            vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
          } else vat = 0;

          this.fullInfo().deliveryConditions.forEach((el) => {
            if (el[1][0].isMain) {
              el[1].forEach((good) => {
                let goodOffer = res.goods.find(
                  (g) =>
                    g.goodsSpecifications[0].idDemandOfferGood ==
                    good.idDemandOfferGood
                );
                good.priceWithoutVat = goodOffer.goodsSpecifications.find(
                  (sp) => sp.idInterfaceField === IdInterfaceField.priceWithoutVAT
                ).fieldValueNumber;
                good.costVat = this.costVatBasis(
                  good.priceWithoutVat,
                  good.volume,
                  vat
                );
                good.minPriceWithoutVat = goodOffer.goodsSpecifications.find(
                  (sp) => sp.idInterfaceField === IdInterfaceField.minPrice
                )?.fieldValueNumber || null;
              });
            }
          });
          let countLargerPrice = 0,
            count = (this.deliveryBasisCommon.length - 1) * res.goods.length; //для проверки, чтобы убрать красный значок на табке. Количество всех товаров кроме основного базиса.
          this.deliveryBasisCommon.forEach((basis) => {
            if (basis.isMain) {
              basis.goods.forEach((good) => {
                let goodOffer = res.goods.find(
                  (g) =>
                    g.goodsSpecifications[0].idDemandOfferGood ==
                    good.idDemandOfferGood
                );
                good.cost = goodOffer.goodsSpecifications.find(
                  (el) => el.idInterfaceField == 3
                ).fieldValueNumber;
                good.costVat = this.costVatBasis(good.cost, good.volume, vat);
                good.minPrice = goodOffer.goodsSpecifications.find(
                  (sp) => sp.idInterfaceField === IdInterfaceField.minPrice
                )?.fieldValueNumber || null;
              });
            } else {
              //если указан признак isMinPriceMainBasis = true
              if (this.fullInfo().generalInfo.isMinPriceMainBasis) {
                basis.goods.forEach((good) => {
                  let goodOffer = res.goods.find(
                    (g) =>
                      g.goodsSpecifications[0].idDemandOfferGood ==
                      good.idDemandOfferGood
                  );
                  if (
                    good.cost <=
                    goodOffer.goodsSpecifications.find(
                      (el) => el.idInterfaceField == 3
                    ).fieldValueNumber
                  ) {
                    this.isNeedChangeBasis = true;
                  } else countLargerPrice = countLargerPrice + 1;
                });
              }
            }
          });
          if (countLargerPrice == count) {
            this.isNeedChangeBasis = false;
          }
        }
      }
    });

    this.tradingService.changeBasis$.subscribe((basis: any) => {
      this.deliveryBasisCommon = basis;
      if (
        this.deliveryBasisCommon?.length == 1 &&
        this.deliveryBasisCommon[0].minAddBasis > 0 &&
        this.deliveryBasisCommon?.length - 1 <
        this.deliveryBasisCommon[0].minAddBasis
      ) {
        this.isNeedChangeBasis = true;
      } else this.isNeedChangeBasis = false;
    });

    this.tradingService.changeAddBasis$.subscribe((res: any) => {
      if (res.str != 'basis') {
        let basisFind = this.deliveryBasisCommon.find(
          (el) =>
            el.idBasisLink == res.basis.idBasisLink &&
            el.idBasisValue == res.basis.idBasisValue &&
            el.idPlaceLink == res.basis.idPlaceLink &&
            el.idPlaceValue == res.basis.idPlaceValue &&
            el.specifyingLocation == res.basis.placeDetails
        );
        basisFind.goods = res.basis.goods;
      }
    });
  }

  get isViewScopeTab(): boolean {
    return this.fullInfo()?.deliveryScopes?.length > this.fullInfo().goods?.length ||
      this.fullInfo()?.deliveryScopesGraded?.length > 1;
  }

  public setDeliveryScopes(): void {
    if (this.fullInfo()) {
      const isGraded: boolean =
        this.fullInfo()?.generalInfo?.isDeliveryScopeGraded ??
        this.fullInfo()?.transactionGeneral?.isDeliveryScopeGraded ??
        false;

      this.deliveryScopes.set(
        isGraded ?
          this.fullInfo().deliveryScopesGraded :
          this.fullInfo().deliveryScopes
      );
    }
  }

  public setDeliverySchedule(): void {
    if (this.fullInfo()) {
      this.delivSchPeriods.set(
        this.fullInfo().delivSchPeriods.length ?
          this.fullInfo().delivSchPeriods :
          this.fullInfo().delivSchPeriodsGraded
      );
    }
  }

  get deliverySchPeriodsParent(): DeliveryPeriodDemand {
    return this.fullInfoParent?.delivSchPeriods?.length
      ? this.fullInfoParent?.delivSchPeriods
      : this.fullInfoParent?.delivSchPeriodsGraded;
  }

  get deliveryScopesParent(): DeliveryScope {
    const isGraded: boolean =
      this.fullInfoParent?.generalInfo?.isDeliveryScopeGraded ??
      this.fullInfoParent?.transactionGeneral?.isDeliveryScopeGraded ??
      false;

    return isGraded
      ? this.fullInfoParent?.deliveryScopesGraded
      : this.fullInfoParent?.deliveryScopes;
  }

  getModel() {
    this.tradingService
      .Get(
        this.user?.token,
        this.fullInfo().generalInfo.idModel,
        this.dataForReq().sectionId
      )
      .subscribe((res) => {
        this.dataForModel = res.data;

        this.isSameGradedSaleOffer = this.isSameGradesInSaleOffer(
          this.dataForReq().sectionId,
          this.dataForModel.complexLotProductTypes,
          this.dataForModel.tradeTypeId,
          this.fullInfo().generalInfo.directionId
        );
        if (this.dataForModel.blocks.length == 0) {
          alert('Ошибка при загрузке модели');
          /*this.error = true;
        this.messageError = this.translate.store.currentLang == 'RU' ? RU["errors"].loadingApplicationData : EN["errors"].loadingApplicationData*/
        } else {
          this.getDeliveryBasesTreeByModelId();
        }
        this.prepareData();
      });
  }

  public isSameGradesInSaleOffer(
    sectionId: number,
    complexLotProductTypes: ComplexLotProductType[],
    tradeTypeId: string,
    direction: number
  ): boolean {
    return Number(sectionId) === SECTIONS_TYPES.TIMBER &&
      this.commonService.isComplexLotBySameCharacteristics(complexLotProductTypes) &&
      Number(tradeTypeId) === AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION &&
      direction === IdDirection.sale;
  }

  prepareData(): void {
    this.dateBegin = this.fullInfo().deliveryPeriod.dateBegin
      ? convertExcelSerialDateToMs(this.fullInfo().deliveryPeriod?.dateBegin)
      : null;
    this.dateEnd = this.fullInfo().deliveryPeriod?.dateEnd
      ? convertExcelSerialDateToMs(this.fullInfo().deliveryPeriod?.dateEnd)
      : null;
    if (
      this.type === POPUP_SIDEBAR_TYPE.EDIT_OFFER ||
      (this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS && this.isMine)
    ) {
      this.editDemandOfferServiceService.fullInfoOriginalSubject.next(this.fullInfo());
      if (this.fullInfo().deliveryConditions?.length > 0) {
        this.deliveryBasisCommon = [];
        this.getBasisWithGoods();
      }
      if (this.delivSchPeriods()?.length > 0) {
        //если есть массив графиков - формируем его в соответствующий вид для отображения
        this.scheduleData = [];
        this.getScheduleWithGoods();
      }
      if (this.deliveryScopes()?.length > 0) {
        //если есть массив грузоотправителей - формируем его в соответствующий вид для отображения
        this.getScopesWithGoods();
      }
    }

    this.goodsOriginal = [];
    this.fullInfo().goods.forEach((good) => {
      this.goodsOriginal.push({
        idGood: good.idGood || good.goodsSpecifications[0].idDemandOfferGood,
        goodsSpecifications: JSON.parse(
          JSON.stringify(
            good.goodsSpecifications.filter((el) =>
              [
                IdInterfaceField.quantity,
                IdInterfaceField.priceWithoutVAT,
                IdInterfaceField.minPrice,
                IdInterfaceField.amendment,
                IdInterfaceField.quotation,
                IdInterfaceField.financeSource,
                IdInterfaceField.expirationDate,
                IdInterfaceField.wholesaleMarkup,
                IdInterfaceField.currency,
                IdInterfaceField.VATrate
              ].includes(el.idInterfaceField)
            )
          )
        ),
      });
    });

    if (this.type === POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS) {
      if (this.deliveryScopes()?.length > 0) {
        //если есть массив грузоотправителей - формируем его в соответствующий вид для отображения
        this.getScopesWithGoods();
      }
    }

    requestIdleCallback(() => (this.isLoading = false));
  }

  onRedFlag() {
    this.isNeedChangeSchedule = true;
    this.scheduleData = [];
    this.delivSchPeriods()?.forEach((sch) => {
      sch.periodVolume = 0;
    });
  }

  uniqueDeliveryScopes: any;

  //уникальные значения в массиве deliveryScopes
  getClientName() {
    this.uniqueDeliveryScopes = [
      ...new Map(
        this.deliveryScopes().map((item) => [
          item['idFirmClient'],
          item,
        ])
      ).values(),
    ];
    return this.uniqueDeliveryScopes;
  }

  // получение условий поставки
  public getDeliveryBasesTreeByModelId(): void {
    this.tradingService
      .getDeliveryBasesTreeByModelId(
        this.user.token,
        this.fullInfo().generalInfo.idModel,
        this.dataForReq().sectionId
      )
      .subscribe((res: any) => {
        for (let item in res.data) {
          const listToTree = (item = []) => {
            let map = {},
              node,
              res = [],
              i;
            for (i = 0; i < item.length; i += 1) {
              map[item[i].linkId] = i;
              item[i].children = [];
            }
            for (i = 0; i < item.length; i += 1) {
              node = item[i];
              if (node.parentId !== 0) {
                item[map[node.parentId]].children.push(node);
              } else {
                res.push(node);
              }
            }
            return res;
          };

          this.dataForModel.blocks.forEach((block) => {
            if (block.id == item) {
              block.deliveryConditions.selectedValues.bases = listToTree(
                res.data[item]
              );
            }
          });
        }
        this.searchIntersections();
        this.dataForModelWithBasis = this.dataForModel.blocks;
      });
  }

  deliveryConditions = []; //базисы пересечения
  deliverySchedule = []; //график поставки пересечения
  deliveryTerm = []; //срок оплаты пересечения
  termsConditionsPayment = []; //условия поставки пересечения
  error = false;
  isNotSpecified = null; //не указываются базисы
  isMinPriceOnBasicBasis = null; //мин цена на основном базисе поставки
  editRulesIntersections = []; //пересечения правил редактирования
  goodsOriginal = []; //массив товаров с первоначальными значениями, для ограничения полей по правилам
  currencyIntersections = []; //массив пересеченных значений валют
  VatIntersections = []; //массив пересеченных значений ставки НДС
  financeSourceIntersections = []; //массив пересеченных значений Источника Финансирования
  adjustablePriceIntersections = false; //есть ли в пересечении Корректируемая цена
  editRulesForSession = [];

  searchIntersections() {
    this.adjustablePriceIntersections = false;
    this.tradingService
      .getEditRules(
        this.user?.token,
        this.dataForReq().sectionId,
        this.dataForReq().sessionId,
        this.fullInfo().generalInfo.idModel
      )
      .subscribe((res) => {
          this.editRulesForSession = res;
          this.fullInfo().goods.forEach((good) => {
            this.intersections(good);
            //если товар добавлен через НСИ, то idGood заменяем на idDemandOfferGood
          });
        }
      );
  }

  findBlock(good) {
    //поиск товара в блоках модели: сначала по 3 уровню, затем по уровню - 2
    let blockFind: any = [];
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
    return blockFind;
  }

  intersections(good) {
    //поиск товара в блоках модели: сначала по 3 уровню, затем по уровню - 2
    let blockFind: any = [];
    blockFind = this.findBlock(good);

    const deliveryConditionsPrev = JSON.parse(
        JSON.stringify(this.deliveryConditions)
      ),
      deliverySchedulePrev = JSON.parse(JSON.stringify(this.deliverySchedule)),
      deliveryTermPrev = JSON.parse(JSON.stringify(this.deliveryTerm)),
      termsConditionsPaymentPrev = JSON.parse(
        JSON.stringify(this.termsConditionsPayment)
      );

    if (Object.keys(blockFind).length != 0) {
      const rulesEdit = this.editRulesForSession.filter((el) => el.idModelBlock === blockFind.id)
        .map(el => ({ ...el }));
      this.intersectionsBlocks(blockFind, good, rulesEdit);
    } //если не нашли товар в блоке модели
    else this.error = true;

    if (this.error) {
      this.deliveryConditions = deliveryConditionsPrev;
      this.deliverySchedule = deliverySchedulePrev;
      this.deliveryTerm = deliveryTermPrev;
      this.termsConditionsPayment = termsConditionsPaymentPrev;

      alert('Ошибка!!!!! при пересечении блоков');
      return false;
    } else {
      if (this.fullInfo().generalInfo.directionId === IdDirection.sale)
        good.isCanEditProductLocation = !!blockFind.fields.find(
          (el) => el.interfaceField.fieldId === IdInterfaceField.productLocation
        );
      // this.blockModal = blockFind;
      return true;
    }
  }

  intersectionsBlocks(blockFind, good, rulesEdit) {
    for (let i = 0; i < NUMBER_OF_CASE; i++) {
      if (!this.error) {
        switch (i) {
          //проверка пересечений по специальным блокам (условия поставки, срок поставки, график поставки, условия и срок оплаты)
          case INTERSECTION_FIELD.INTERSECTION_FIELD_DELIVERY_SCHEDULE: {
            if (this.deliverySchedule.length == 0) {
              //график поставки может быть не заполнен (это необязательное поле)
              this.deliverySchedule = JSON.parse(
                JSON.stringify(blockFind.deliverySchedule.selectedValues)
              ); //заполнение deliverySchedule значением из блока модели
            } else {
              this.deliverySchedule = this.deliverySchedule.filter((a) =>
                blockFind.deliverySchedule?.selectedValues.some(
                  (b) => a.id === b.id
                )
              );
              if (this.deliverySchedule.length == 0) {
                //если нет пересечения
                this.error = true;
              }
            }
            break;
          }
          case INTERSECTION_FIELD.INTERSECTION_FIELD_DELIVERY_CONDITIONS: {
            //условия поставки
            if (
              this.deliveryConditions.length == 0 &&
              this.isNotSpecified == undefined
            ) {
              this.isMinPriceOnBasicBasis =
                blockFind.deliveryConditions.selectedValues.isMinPriceOnBasicBasis;
              this.isNotSpecified =
                blockFind.deliveryConditions.selectedValues.isNotSpecified;
              this.deliveryConditions = JSON.parse(
                JSON.stringify(
                  blockFind.deliveryConditions.selectedValues.bases
                )
              );
            } else {
              this.deliveryConditionsIntersections(blockFind);
            }
            break;
          }
          case INTERSECTION_FIELD.INTERSECTION_FIELD_DELIVERY_TERM: {
            //срок поставки
            if (this.deliveryTerm.length == 0) {
              this.deliveryTerm = JSON.parse(
                JSON.stringify(blockFind.deliveryTerm.selectedValues)
              );
            } else {
              this.deliveryTermIntersections(blockFind);
            }
            break;
          }
          case INTERSECTION_FIELD.INTERSECTION_FIELD_TERMS_CONDITIONS_PAYMENT: {
            //условия и срок оплаты
            this.termsConditionsPayment =
              this.termsConditionsPayment.length == 0
                ? JSON.parse(
                  JSON.stringify(
                    blockFind.termsConditionsPayment.selectedValues
                  )
                )
                : this.termsConditionsPayment.filter((a) =>
                  blockFind.termsConditionsPayment.selectedValues.some(
                    (b) => {
                      if (
                        a.delayMomentId == b.delayMomentId &&
                        a.paymentConditionId == b.paymentConditionId &&
                        a.paymentVolumeId == b.paymentVolumeId &&
                        a.prepayMomentId == b.prepayMomentId
                      ) {
                        if (a?.dayTypeId?.length > 0) {
                          a.dayTypeId = a?.dayTypeId.filter((ad) =>
                            b?.dayTypeId.find(
                              (bd) => JSON.stringify(ad) == JSON.stringify(bd)
                            )
                          );
                          if (a?.dayTypeId?.length > 0) return true;
                        } else if (!a?.dayTypeId && !b?.dayTypeId) {
                          return true;
                        }
                      }
                    }
                  )
                );
            if (this.termsConditionsPayment.length == 0) {
              this.error = true;
            }
            break;
          }
          case INTERSECTION_FIELD.INTERSECTION_FIELD_EDIT_RULES: {
            //Пересечения правил редактирования в модели по товарам
            /*Поиск пересечений и запись в отдельный массив:
              37 Базис поставки, 38 Срок поставки, 36 Условия оплаты, 39 График поставки, 1 Количество;
               3 Цена без НДС; 54 Поправка; 56 Котировка; 22 Местонахождение 47 Корректируемая цена*/
            if (this.editRulesIntersections.length == 0) {
              // this.editRulesIntersections = blockFind.editRules.filter(el=> el.idSessionPeriod == this.dataForReq().idSessionPeriod) //!Margo
              //для встречного предложения берем правила периода корректировки
              let idSessionPeriod =
                this.type === POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS
                  ? IdSessionPeriods.offersAdjustment
                  : this.dataForReq().idSessionPeriod;
              this.editRulesIntersections = rulesEdit.filter(
                (el) => el.idSessionPeriod == idSessionPeriod
              );
            } else {
              //для встречного предложения берем правила периода корректировки
              let idSessionPeriod =
                this.type === POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS
                  ? IdSessionPeriods.offersAdjustment
                  : this.dataForReq().idSessionPeriod;

              let editNew = rulesEdit.filter(
                (el) => el.idSessionPeriod == idSessionPeriod
              );
              this.editRulesIntersections.forEach((rule) => {
                let newRule = editNew.find(
                  (el) => el.idInterfaceField == rule.idInterfaceField
                );
                if (rule.idEditRule != newRule?.idEditRule) {
                  rule.idEditRule = editingRules.editingIsNotAvailable;
                }
              });
            }
            this.editDemandOfferServiceService.editRulesIntersectionsSubject.next(this.editRulesIntersections);
            break;
          }
          case INTERSECTION_FIELD.INTERSECTION_FIELD_CURRENCY: {
            //валюта заявки
            let currency = blockFind?.fields.find(
              (el) => el.interfaceField.fieldId == 4
            ); //валюта

            if (currency) {
              if (this.currencyIntersections.length == 0) {
                this.currencyIntersections = currency.selectedValues
                  ? JSON.parse(JSON.stringify(currency.selectedValues))
                  : JSON.parse(
                    JSON.stringify(currency.interfaceField.allowedValues)
                  );
              } else {
                this.currencyIntersections = this.currencyIntersections.filter(
                  (a) =>
                    currency.selectedValues
                      ? currency?.selectedValues?.some(
                        (b) => JSON.stringify(a) == JSON.stringify(b)
                      )
                      : currency.interfaceField.allowedValues.some(
                        (b) => JSON.stringify(a) == JSON.stringify(b)
                      )
                );
              }

              if (this.currencyIntersections?.length == 0) this.error = true;
            } else {
              //если в одном блоке валюта была,а в другом - нет
              if (this.currencyIntersections?.length > 0) this.error = true;
            }
            break;
          }
          case INTERSECTION_FIELD.INTERSECTION_FIELD_VAT: {
            //ставка НДС
            let vat = blockFind?.fields.find(
              (el) => el.interfaceField.fieldId == IdInterfaceField.VATrate
            ); //ставка НДС
            if (vat) {
              if (this.VatIntersections.length == 0) {
                this.VatIntersections = vat.selectedValues
                  ? JSON.parse(JSON.stringify(vat.selectedValues))
                  : JSON.parse(
                    JSON.stringify(vat.interfaceField.allowedValues)
                  );
              } else {
                this.VatIntersections = this.VatIntersections?.filter((a) =>
                  vat?.selectedValues
                    ? vat.selectedValues.some(
                      (b) => JSON.stringify(a) == JSON.stringify(b)
                    )
                    : vat.interfaceField.allowedValues.some(
                      (b) => JSON.stringify(a) == JSON.stringify(b)
                    )
                );
              }

              if (this.VatIntersections?.length == 0) this.error = true;
            } else {
              //если в одном блоке ставка НДС была, а в другом - нет
              if (this.VatIntersections?.length > 0) this.error = true;
            }
            break;
          }
          case INTERSECTION_FIELD.INTERSECTION_FIELD_FINANCE_SOURCE: {
            let financeSources = blockFind.fields.find(
              (el) => el.interfaceField.fieldId == 11
            ); //источник финансирования

            if (financeSources) {
              if (this.financeSourceIntersections.length == 0) {
                this.financeSourceIntersections = financeSources?.selectedValues
                  ? JSON.parse(JSON.stringify(financeSources?.selectedValues))
                  : JSON.parse(
                    JSON.stringify(
                      financeSources.interfaceField.allowedValues
                    )
                  );
              } else {
                this.financeSourceIntersections =
                  this.financeSourceIntersections?.filter((a) =>
                    financeSources.selectedValues
                      ? financeSources.selectedValues.some(
                        (b) => JSON.stringify(a) == JSON.stringify(b)
                      )
                      : financeSources.interfaceField.allowedValues.some(
                        (b) => JSON.stringify(a) == JSON.stringify(b)
                      )
                  );
              }

              if (this.financeSourceIntersections?.length == 0)
                this.error = true;
            } else {
              if (this.financeSourceIntersections?.length > 0)
                this.error = true;
            }
            break;
          }
          case INTERSECTION_FIELD.INTERSECTION_FIELD_ADJUSTABLE_PRICE: {
            //корректируемая цена
            const adjustablePrice = blockFind.fields?.find(
              (el) =>
                el.interfaceField.fieldId == IdInterfaceField.adjustedPrice
            );
            this.adjustablePriceIntersections =
              this.adjustablePriceIntersections || !!adjustablePrice;
            break;
          }
        }
      }
    }
  }

  deliveryConditionsIntersections(blockFind) {
    if (
      this.isMinPriceOnBasicBasis ==
      blockFind.deliveryConditions.selectedValues.isMinPriceOnBasicBasis
    ) {
      //сравнение чекбокса isMinPriceOnBasicBasis
      if (
        this.isNotSpecified ==
        blockFind.deliveryConditions.selectedValues.isNotSpecified
      ) {
        //сравнение чекбокса isNotSpecified
        //сравнение массива значений
        this.deliveryConditions = this.deliveryConditions?.filter((a) =>
          blockFind.deliveryConditions.selectedValues.bases?.some((b) => {
            let equal = false;
            if (
              a.linkId == b.linkId &&
              a.minAddBasisPlaces == b.minAddBasisPlaces &&
              a.minAddBasis == b.minAddBasis &&
              a.isRequiredPlace == b.isRequiredPlace
            ) {
              if (a?.children?.length > 0) {
                a.children = a?.children.filter((child) =>
                  b?.children.find(
                    (Bchild) => JSON.stringify(child) == JSON.stringify(Bchild)
                  )
                );

                if (
                  a?.children?.length > 0 &&
                  a?.children?.length >= a.minAddBasis
                ) {
                  equal = true;
                }
              } else if (a?.children?.length == 0 && b?.children?.length == 0) {
                equal = true;
              }
            }
            return equal;
          })
        );

        if (this.deliveryConditions.length == 0 && !this.isNotSpecified) {
          this.error = true;
        }
      } else this.error = true;
    } else this.error = true;
  }

  deliveryTermIntersections(blockFind) {
    this.deliveryTerm = this.deliveryTerm.filter((a) =>
      blockFind.deliveryTerm.selectedValues.some((b) => {
        let equal = false;
        if (
          a.deliveryStartId == b.deliveryStartId &&
          a.deliveryTermId == b.deliveryTermId
        ) {
          if (a.dayValues) {
            //проверка данных массива дней
            a.dayValues = a.dayValues.filter((aDays) =>
              b.dayValues.includes(aDays)
            ); //записываем только общие данные в массив
            if (a.dayValues.length != 0) equal = true;
          }
          if (a.monthValues) {
            //проверка данных массива месяцев
            a.monthValues = a.monthValues.filter((aMonth) =>
              b.monthValues.includes(aMonth)
            ); //записываем только общие данные в массив
            if (a.monthValues.length != 0) equal = true;
          }
          if (
            a.endDeliveryDate == b.endDeliveryDate ||
            a.startDeliveryDate == b.startDeliveryDate
          ) {
            equal = true;
          }
        }
        return equal;
      })
    );
    if (this.deliveryTerm.length == 0) {
      this.error = true;
    }
  }

  getScheduleWithGoods() {
    const datepipe: DatePipe = new DatePipe('en-US'); //задает формат даты
    let delivSchPeriods = JSON.parse(
      JSON.stringify(this.delivSchPeriods())
    );

    if (this.fullInfo().delivSchPeriodsGraded?.length) {
      delivSchPeriods = delivSchPeriods.flatMap(sch =>
        this.fullInfo().goods.map(good => ({
          ...sch,
          idGood: good.idGood || good.goodsSpecifications[0].idDemandOfferGood,
          ...this.editDemandOfferServiceService.getGenerateGoodFields(good, true)
        }))
      );
    } else {
      delivSchPeriods.forEach((sch) => {
        // добавление полей необходимых для товаров
        this.fullInfo().goods.forEach((good) => {
          if (
            good.goodsSpecifications[0].idDemandOfferGood == sch.idDemandOfferGood
          ) {
            Object.assign(sch, {
              idGood: good.idGood || good.goodsSpecifications[0].idDemandOfferGood,
              ...this.editDemandOfferServiceService.getGenerateGoodFields(good, true)
            });
          }
        });
      });
    }

    delivSchPeriods.sort((a, b) => a.idGood - b.idGood);

    delivSchPeriods = delivSchPeriods.reduce(function (r, a) {
      //сгруппированы поля по periodDateBegin
      r[a.periodDateBegin] = r[a.periodDateBegin] || [];
      r[a.periodDateBegin].push(a);
      return r;
    }, {});
    delivSchPeriods = Object.entries(delivSchPeriods);

    delivSchPeriods.sort(function (a, b) {
      //сортировка по дате начала по возрастанию, чтобы отображался график в правильном порядке
      return a[0] - b[0];
    });

    delivSchPeriods.forEach((sch, index) => {
      let goods = [];
      sch[DELIVERY_SCHEDULE.SCH_INFO].forEach((good) => {
        goods.push({
          idGood: good.idGood || good.goodsSpecifications[0].idDemandOfferGood,
          name: good.goodName,
          volume: good.periodVolume,
          units: good.unit,
          properties: good.properties,
        });
      });

      this.scheduleData.push({
        numberPeriod: index + 1,
        startDate: datepipe.transform(
          (sch[1][0].periodDateBegin - 25569) * 24 * 3600 * 1000,
          'dd.MM.yyyy'
        ),
        endDate: datepipe.transform(
          (sch[1][0].periodDateEnd - 25569) * 24 * 3600 * 1000,
          'dd.MM.yyyy'
        ),
        goods: goods,
        idPeriod: this.fullInfo().generalInfo.idDeliveryScheduleType.toString(),
        periodVolume: sch[DELIVERY_SCHEDULE.SCH_INFO][0].periodVolume || null
      });
    });

    this.scheduleData.forEach((period) => {
      period.goods.sort((a, b) => {
        const orderA = this.fullInfo().goods.findIndex(
          (item) => getIdGood(item) === a.idGood
        );
        const orderB = this.fullInfo().goods.findIndex(
          (item) => getIdGood(item) === b.idGood
        );
        return orderA - orderB;
      });
    });
  }

  public getScopesWithGoods(): void {
    let scopes: any[] = this.deliveryScopes();
    if (this.fullInfo().generalInfo.isDeliveryScopeGraded) {
      this.deliveryScopeGraded = scopes.map(scope => ({
        idFirmClient: scope.idFirmClient,
        volume: scope.volume
      }));
      scopes = scopes.flatMap(scope =>
        this.fullInfo().goods.map(good => ({
          ...scope,
          idGood: getIdGood(good),
          idDemandOfferGood: good.goodsSpecifications[0].idDemandOfferGood,
          ...this.editDemandOfferServiceService.getGenerateGoodFields(good)
        }))
      );
    } else {
      scopes = scopes.flatMap(scope =>
        this.fullInfo().goods
          .filter(good => good.goodsSpecifications?.[0]?.idDemandOfferGood === scope.idDemandOfferGood)
          .map(good => ({
            ...scope,
            idGood: good.idGood || good.goodsSpecifications[0].idDemandOfferGood,
            ...this.editDemandOfferServiceService.getGenerateGoodFields(good)
          }))
      );
    }

    const grouped = scopes.reduce(
      function (r, a) {
        //сгруппированы поля по idFirmClient
        r[a.idFirmClient] = r[a.idFirmClient] || [];
        r[a.idFirmClient].push(a);
        return r;
      },
      {}
    );
    this.deliveryScopes.set(Object.entries(
      grouped
    ));
  }

  getBasisWithGoods() {
    if (this.fullInfo().deliveryConditions.length > 0) {
      //базисы поставки
      let vat,
        vatValue = this.fullInfo().goods[0].goodsSpecifications.find(
          (el) => el.idInterfaceField == 5
        );
      if (vatValue.fieldValueNumber != 1) {
        vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
      } else vat = 0;

      this.fullInfo().deliveryConditions.forEach((basis) => {
        this.fullInfo().goods.forEach((good) => {
          if (
            good.goodsSpecifications[0].idDemandOfferGood ==
            basis.idDemandOfferGood
          ) {
            Object.assign(basis, {
              goodName: good.goodName,
              unitName: good.unitName,
              properties: good.goodDescription,
              volume: good.goodsSpecifications.find(
                (el) => el.idInterfaceField == 1
              ).fieldValueNumber, //количество
              quotation:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == 56
                )?.fieldValue || null, //Котировка
              quoteCurrency:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == 55
                )?.fieldValue || null, //Валюта котировки
              amendment:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == 54
                )?.fieldValue || null, //поправка
              priceAdjustment:
                good.goodsSpecifications?.find(
                  (el) => el.idInterfaceField == 53
                )?.fieldValueNumber || null, //Тип поправки
              currency: good.goodsSpecifications.find(
                (el) => el.idInterfaceField == 4
              ).fieldValue, //Валюта
              costVat: this.costVatBasis(
                basis.priceWithoutVat,
                good.goodsSpecifications.find((el) => el.idInterfaceField == 1)
                  .fieldValueNumber,
                vat
              ),
              currencyPrecision: this.fullInfo().currencyPrecision,
              volumePrecision: good.goodsSpecifications.find(
                (field) => field.idInterfaceField == IdInterfaceField.quantity
              ).fieldPrecision,
            });
          }
        });
      });

      let mainBasis = this.fullInfo().deliveryConditions.find(
        (el) => el.isMain == true
      ); //главный базис из того, что пришло по заявке
      this.fullInfo().deliveryConditions.splice(
        this.fullInfo().deliveryConditions.indexOf(mainBasis),
        1
      );
      this.fullInfo().deliveryConditions.splice(0, 0, mainBasis);
      /*  this.deliveryBasisCommon = JSON.parse(JSON.stringify(this.deliveryBasis))*/
      this.fullInfo().deliveryConditions = groupByConcatedCondition(this.fullInfo().deliveryConditions ?? []);
      this.fullInfo().deliveryConditions = Object.entries(
        this.fullInfo().deliveryConditions
      );
      this.fullInfo().deliveryConditions.forEach((offer) => {
        let basis = offer[1][0];
        let goods = [];
        for (let i = 0; i < offer[1].length; i++) {
          let good = this.fullInfo().goods.find(
            (good) =>
              good.goodsSpecifications[0].idDemandOfferGood ==
              offer[1][i].idDemandOfferGood
          );

          offer[1][i].priceWithoutVat = basis.isMain
            ? good.goodsSpecifications?.find((el) => el.idInterfaceField == IdInterfaceField.priceWithoutVAT)
              ?.fieldValueNumber
            : offer[1][i].priceWithoutVat;
          goods.push({
            idDemandOfferGood: good.goodsSpecifications[0].idDemandOfferGood,
            idGood: good.idGood || good.goodsSpecifications[0].idDemandOfferGood, //для товара-аналога idDemandOfferGood
            goodName: good.goodName,
            unitName: good.unitName,
            properties: good.goodDescription,
            volume: good.goodsSpecifications.find(
              (el) => el.idInterfaceField == 1
            ).fieldValueNumber, //количество
            quotation:
              good.goodsSpecifications?.find((el) => el.idInterfaceField == 56)
                ?.fieldValue || null, //Котировка
            quoteCurrency:
              good.goodsSpecifications?.find((el) => el.idInterfaceField == 55)
                ?.fieldValue || null, //Валюта котировки
            amendment:
              good.goodsSpecifications?.find((el) => el.idInterfaceField == 54)
                ?.fieldValue || null, //поправка
            priceAdjustment:
              good.goodsSpecifications?.find((el) => el.idInterfaceField == 53)
                ?.fieldValueNumber || null, //Тип поправки
            currency: good.goodsSpecifications.find(
              (el) => el.idInterfaceField == 4
            ).fieldValue, //Валюта
            costVat: this.costVatBasis(
              offer[1][i].priceWithoutVat,
              good.goodsSpecifications.find((el) => el.idInterfaceField == 1)
                .fieldValueNumber,
              vat
            ),
            currencyPrecision: this.fullInfo().currencyPrecision,
            cost: offer[1][i].priceWithoutVat,
            volumePrecision: good.goodsSpecifications.find(
              (field) => field.idInterfaceField == IdInterfaceField.quantity
            ).fieldPrecision,
            ...(this.fullInfo().generalInfo?.directionId == IdDirection.buy && {
              minPrice: offer[1][i].minPriceWithoutVat || null,
            }),
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
          contradictoryValueId: basis.contradictoryValueId,
          contradictoryBasisName: basis.contradictoryBasisName,
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

  costVatBasis(priceWithoutVat, volume, vat) {
    return (
      Math.round(
        (volume * priceWithoutVat + (volume * priceWithoutVat * vat) / 100) *
        100
      ) / 100
    );
  }

  getRedFlagsScope(event) {
    //установлены ли какие-то красные флаги на вкладках при редактировании заявки
    event.callback(
      this.isNeedChangeScope
    );
  }

  getRedFlagsBasis(event) {
    //установлены ли какие-то красные флаги на вкладках при редактировании заявки
    event.callback(
      this.isNeedChangeBasis
    );
  }

  getRedFlagsSchedule(event) {
    //установлены ли какие-то красные флаги на вкладках при редактировании заявки
    event.callback(
      this.isNeedChangeSchedule
    );
  }

  getGoodsSpecifications(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    );
  }

  getTotalBlockData(e) {
    this.totalBlockData = e;
  }

  public observeOffer(isWatched: boolean, idDemandOffer: number): void {
    const context = {
      user: this.user,
      sessionIds: this.dataForReq(),
      cache: this.cache,
      isOpenedView: true,
      currentLang: this.translate.store.currentLang,
      popupSidebarService: this.popupSidebarService,
      showToast: (msg: string) => {
        this.isVisibleToast = true;
        this.messageToast = msg;
      }
    };

    const data = [{
      isWatched: isWatched,
      idDemandOffer: idDemandOffer,
      directionId: this.fullInfo().generalInfo.directionId
    }]

    this.observeOffersService.observeOffer(data, context, 'demand').subscribe(() => {
    });
  }

  public observeDirectOffer(isWatched: boolean, idOffer: number): void {
    const context = {
      user: this.user,
      sessionIds: this.dataForReq(),
      cache: this.cache,
      isOpenedView: true,
      currentLang: this.translate.store.currentLang,
      popupSidebarService: this.popupSidebarService,
      showToast: (msg: string) => {
        this.isVisibleToast = true;
        this.messageToast = msg;
      }
    };

    const data = [{
      isWatched: isWatched,
      idOffer: idOffer
    }]

    this.observeOffersService.observeOffer(data, context, 'direct').subscribe(() => {
    });
  }

  public onClickObserve(): void {
    if (this.directSession) {
      this.observeDirectOffer(
        this.fullInfo().generalInfo?.isWatched,
        this.fullInfo().generalInfo?.idOffer
      );
    } else {
      this.observeOffer(
        this.fullInfo().generalInfo?.isWatched,
        this.fullInfo().generalInfo?.idDemandOffer
      );
    }
  }

  updateWatchedOffer(data: any) {
    // обновляем признак наблюдаемости, если отметили в таблице
    this.fullInfo().generalInfo.isWatched = data[1] == 'delete' ? false : true;
  }

  onOpenDepositOffer() {
    this.depositRowData = Object.assign(
      this.fullInfo().generalInfo,
      this.dataForReq()
    );
    this.depositPopup = true;
  }

  closeDepositPopup(event) {
    this.depositPopup = event;
  }

  public openAnalogs(): void {
    forkJoin({
      analogList: this.counterService.getListDemandAnalogTradeInfo(
        this.user?.token,
        this.dataForReq().sectionId,
        this.dataForReq().sessionId,
        this.idOffer
      ),
      fullInfo: this.demandService.getDemandOfferFullInfo(
        this.user?.token,
        IdDirection.buy,
        this.dataForReq().sectionId,
        this.dataForReq().sessionId,
        this.idOffer,
        IdActivationMode.anyPeriod,
        this.getDisplayCurrency(this.isMine)
      ),
    })
      .pipe(catchError(() => EMPTY))
      .subscribe(({ analogList, fullInfo }) => {
        this.analogList = analogList;
        this.fullInfo.set(fullInfo);

        this.type = POPUP_SIDEBAR_TYPE.ANALOG_LIST;

        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: this.dataForReq(),
          type: POPUP_SIDEBAR_TYPE.ANALOG_LIST,
          idOffer: this.idOffer,
          fullInfo: this.fullInfo(),
          analogList: this.analogList,
          isAvailableAnalogList: this.isAvailableAnalogList,
          lotNumber: this.fullInfo()?.generalInfo?.lotNumber,
          isMine: this.isMine,
          roleToAction: this.getRoleToAction(),
        });
      });
  }

  public getRoleToAction(): boolean {
    return (
      (this.dataForReq()?.idAuctionType === auctionType.simpleSellerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.SALE) ||
      (this.dataForReq()?.idAuctionType === auctionType.simpleBuyerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.PURCHASE)
    );
  }

  private getDisplayCurrency(isMine: boolean): string {
    if (this.cache?.filters?.displayCurrency && !isMine) {
      return this.cache.filters.displayCurrency === -1
        ? ''
        : this.cache.filters.displayCurrency;
    }
    return '';
  }

  goToChat(): void {
    const idAuctionType = this.store.idAuctionType();
    const auctionRootPath = getAuctionPath(idAuctionType);
    const url = this.router.serializeUrl(
      this.router.createUrlTree([
        `auctions/${auctionRootPath}/main-page/chat/${
          this.dataForReq().sectionId
        }/${this.dataForReq().sessionId}/${this.dataForReq().idTrader}`,
      ])
    );
    window.open(url, '_blank');
  }

  onOpenCounterOffer(idOffer: number, idDirection: number) {
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    this.demandService
      .getDemandOfferFullInfo(
        this.user?.token,
        idDirection,
        this.dataForReq().sectionId,
        this.dataForReq().sessionId,
        idOffer,
        2,
        displayCurrency,
        this.isMine
      )
      .subscribe((res) => {
        this.fullInfo.set(res);
        this.globalStore.setFullInfo(res);
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: this.dataForReq(),
          type: POPUP_SIDEBAR_TYPE.COUNTER_OFFERS,
          idOffer: idOffer,
          idDirection: idDirection,
          fullInfo: Object.assign(this.fullInfo(), {
            filterIdCurrency: displayCurrency,
          }),
          isMine: this.isMine ? this.isMine : false,
        });
      });
  }

  onOpenCompareOffer(idOffer: number, idDirection: number) {
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    this.demandService
      .getDemandOfferFullInfo(
        this.user?.token,
        idDirection,
        this.dataForReq().sectionId,
        this.dataForReq().sessionId,
        idOffer,
        2,
        displayCurrency
      )
      .subscribe((res) => {
        this.demandService
          .getDemandOfferFullInfo(
            this.user?.token,
            idDirection,
            this.dataForReq().sectionId,
            this.dataForReq().sessionId,
            this.fullInfo().generalInfo?.idDemandOfferParent,
            2,
            displayCurrency
          )
          .subscribe((resParent) => {
            this.fullInfo.set(res);
            this.globalStore.setFullInfo(res);
            this.fullInfoParent = resParent;
            this.popupSidebarService.onShowPopupSidebar({
              dataForReq: this.dataForReq(),
              type: POPUP_SIDEBAR_TYPE.COMPARE_OFFER,
              idOffer: idOffer,
              idDirection: idDirection,
              fullInfo: this.fullInfo(),
              fullInfoParent: this.fullInfoParent,
            });
          });
      });
  }

  onOpenProgress(idOffer: number, lotNumber: number) {
    const idAuctionType = this.store.idAuctionType();
    const auctionRootPath = getAuctionPath(idAuctionType);
    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        [`auctions/${auctionRootPath}/main-page/bidding-process`],
        {
          queryParams: {
            idSection: this.globalStore.mainSessionInfo().sectionId,
            idSession: this.globalStore.mainSessionInfo().sessionId,
            lotNumber: lotNumber,
            idOffer: idOffer,
            sessionDate: this.dataForReq().datetimeBegin,
            sessionName: this.dataForReq().sessionName,
            auctionType: this.dataForReq().idAuctionType,
          },
        }
      )
    );
    window.open(`${url}`, '_blank');
  }

  public onViewInSingleCurrency(): void {
    this.viewInSingleCurrencyPopup = true;
  }

 public downloadRegister(idDeal: number): void {
    this.transactionService
      .getReestrsDealSheetContent(
        this.user?.token,
        this.dataForReq().sectionId,
        [idDeal]
      )
      .subscribe((res: Blob) => {
        downloadArchive(res);
     });
  }

  public onClosePopup(): void {
    this.type = null;
    this.onHiddenPopup();
  }

  public onEditSavePendingChange(isPending: boolean): void {
    this.isEditSaveRequestPending = isPending;
  }

  public closeSaveForm(): void {
    this.isSaveForm = false;
  }

  public onCloseSubmit(event: boolean): void {
    if (event) {
      this.type = null;
    }
    this.onHiddenPopup();
  }

  public isAnalogListChanged: boolean = true;

  public analogListChanged(event: boolean): void {
    this.isAnalogListChanged = event;
  }

  onHiddenPopup() {
    if (
      this.type === POPUP_SIDEBAR_TYPE.EDIT_OFFER ||
      this.type === POPUP_SIDEBAR_TYPE.SUBMIT_COUNTER_OFFERS ||
      this.type === POPUP_SIDEBAR_TYPE.EDIT_DEAL ||
      (
        this.type === POPUP_SIDEBAR_TYPE.ANALOG_LIST &&
        this.isAnalogListChanged &&
        this.isMine
      )
    ) {
      //предварительное окошка перед закрытием формы в правилах редактирования модели
      this.isSaveForm = true;
    } else {
      this.isVisible = false;
      this.globalStore.setFullInfo(null);
      this.fullInfo.set(null);
      this.globalStore.setDataForReq([]);
      this.dataForReq.set([]);
      this.deliveryScopes.set(null);
      this.delivSchPeriods.set(null);
      this.deliveryScopeGraded = [];
      this.type = null;
      this.title = '';
      this.message = '';
      this.tabIndex = 0;
      this.idOffer = null; //для просмотра заявки
      this.idDirection = null;
      this.totalBlockData = null;
      this.modelEditRules = null;
      this.uniqueDeliveryScopes = null;
      this.dataForModel = null;
      this.dataForModelWithBasis = null;
      this.dateBegin = null;
      this.dateEnd = null;
      this.isNotSpecified = null; //не указываются базисы
      this.isMinPriceOnBasicBasis = null;
      this.deliveryConditions = []; //базисы пересечения
      this.deliverySchedule = []; //график поставки пересечения
      this.scheduleData = [];
      this.deliveryTerm = []; //срок оплаты пересечения
      this.termsConditionsPayment = []; //условия поставки пересечения
      this.editRulesIntersections = []; //правила пересечения
      this.goodsOriginal = [];
      this.deliveryBasisCommon = [];
      this.error = false;
      this.currencyIntersections = []; //массив пересеченных значений валют
      this.VatIntersections = []; //массив пересеченных значений ставки НДС
      this.financeSourceIntersections = []; //массив пересеченных значений Источника Финансирования
      this.adjustablePriceIntersections = false; //есть ли в пересечении Корректируемая цена
      this.editRulesForSession = [];
      this.isNeedChangeScope = false;
      this.isNeedChangeSchedule = false;
      this.isNeedChangeBasis = false;
      this.isEditSaveRequestPending = false;
      this.isMine = null;
      if (this.BasisEditComponent) {
        this.BasisEditComponent.ngOnDestroy();
      }
      if (this.DeliveryScheduleEditComponent) {
        this.DeliveryScheduleEditComponent.ngOnDestroy();
      }
      if (this.DeliveryScopeEditComponent) {
        this.DeliveryScopeEditComponent.ngOnDestroy();
      }
      if (this.EditOfferComponent) {
        this.EditOfferComponent.ngOnDestroy();
      }
      this.popupSidebarService.onClosePopup(this.isVisible);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
