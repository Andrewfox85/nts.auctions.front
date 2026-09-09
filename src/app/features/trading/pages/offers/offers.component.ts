import {
  Component,
  OnInit,
  Input,
  ViewChild,
  SimpleChanges,
  inject,
  DestroyRef,
  OnChanges,
  AfterViewInit,
  NgZone
} from '@angular/core';
import {
  DxTooltipModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxToastModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { User, PageCache } from '@classes';
import {
  auctionType,
  IdActivationMode,
  IdDirection,
  IdSessionPeriods,
  numberEntriesPage,
  searchIcon,
  sessionStage,
  statusDirectOffersFilters,
  statusRegs,
  statusOffersFilters,
  VOLUME_PRECISION,
  ACTUAL_SIZE_FIELDS,
  statusSession,
  statusDirectOffersFiltersTr,
  DEFAULT_COLUMN_CHOOSER_POSITION,
  sectionID,
  AgreementType,
  pricingType,
  PRICE_ADJUSTMENT_TYPE,
  IdInterfaceField
} from '@constants';
import {
  CommonService,
  TradingService,
  AppConfigService,
  TraderService,
  DataRefreshService,
  ObserveOffersService,
  DemandOffer,
  EditPriceStepService
} from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Tooltip from 'devextreme/ui/tooltip';
import { DxDataGridComponent } from 'devextreme-angular';
import { ChangeDetectorRef } from '@angular/core';
import {
  ToastService,
  PopupSidebarService,
  DemandService,
  AccessService,
  TargetedService,
  DemandOfferGood
} from '@services';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { HomePageStore } from '@homepage-store';
import {
  createArrayFieldHeaderFilterExpression,
  createContractTypeHeaderFilterExpression,
  getAuctionPath,
  getEmptyFilterLabel,
  getGridInfoText,
  getTranslateResultByCurrentLang,
  mapContractTypeToFilterOption,
  mapDescriptionToFilterOption,
  matchesHeaderFilterSearch,
  round,
} from '@helpers';
import { ActualDimensionsPipe, ToNumberPipe, RuNumberFormatPipe, IsRejectedOfferPipe } from '@pipes';
import {
  EditPriceStepPopupComponent,
  RejectionOfferPopupComponent,
  DepositPopupComponent,
  ApproveOfferPopupComponent,
  CheckActivationModeComponent,
  DeleteOfferPopupComponent,
  RestoreOfferPopupComponent,
  VolumePopupComponent,
} from '@components';
import { INewTabData } from '../../interfaces';
import { ResultPopupComponent } from '../../../../components/popups/result-popup/result-popup.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { LocalStorageService, SessionStorageService } from '@shared-services';
import {
  OFFERS_SESSION_STORAGE_KEY,
  OFFERS_HIDDEN_LOT_STATE_KEY,
} from '@constants';
import { DxGridContextMenuLocalizationDirective } from '../../../../shared/directives';
import { ApiStore, GlobalStore } from '@store';
import { CheckBoxComponent } from '../../../../shared/components/check-box/check-box.component';
import { DxGridState, FilterOption, IApiDataSection } from '@interfaces';
import { setPrecision } from './../../../../helpers/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { PositionConfig } from 'devextreme/common/core/animation';
import {
  applyHiddenLotGridColumnsVisibility,
  HIDDEN_LOT_EXTENDED_FIELDS,
  HIDDEN_LOT_MINIMAL_VISIBLE_FIELDS,
  HiddenLotDisplayMode,
  isHiddenLotCheckboxVisible,
  resolveHiddenLotDisplayMode,
} from '../../utils/hidden-lot-grid-columns.util';
import {
  buildTradingGridStateKey,
  sanitizeTradingGridStateFromLs,
  TradingGridStatePage,
} from '../../utils/grid-columns/resolve-offers-grid-state.util';
import { TableDataField } from '../../utils/grid-columns/table-data-field.enum';
import { SECTIONS_TYPES } from '../../../header/enums';
import { ISessionStateConfig } from '../../../../views/homepage/interfaces';
import { makeMainName } from '../../utils/main-name.util';
import { applyFilterValueToGridState } from '../../utils/apply-filter-value-to-grid-state.util';
import { DxGridFilterExpression } from '../../utils/registrations-trader-grid-filter.util';
import { TargetedOffer } from './../../../../services/targeted-service/shared/interfaces/index';


@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DxTooltipModule,
    DxCheckBoxModule,
    DxDataGridModule,
    DxToastModule,
    DxLoadPanelModule,
    VolumePopupComponent,
    DeleteOfferPopupComponent,
    ApproveOfferPopupComponent,
    EditPriceStepPopupComponent,
    RestoreOfferPopupComponent,
    RejectionOfferPopupComponent,
    DepositPopupComponent,
    CheckActivationModeComponent,
    FiltersComponent,
    ResultPopupComponent,
    CheckBoxComponent,
    ActualDimensionsPipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    DxGridContextMenuLocalizationDirective,
    IsRejectedOfferPipe
  ],
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss'],
})
export class OffersComponent implements OnInit, OnChanges, AfterViewInit {
  private readonly store = inject(HomePageStore);
  private readonly demandService = inject(DemandService);
  private readonly accessService = inject(AccessService);
  private readonly traderService = inject(TraderService);
  private readonly targetedService = inject(TargetedService);
  private readonly dataRefreshService = inject(DataRefreshService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly popupSidebarService = inject(PopupSidebarService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly observeOffersService = inject(ObserveOffersService);
  private readonly globalStore = inject(GlobalStore);
  private readonly apiStore = inject(ApiStore);
  private readonly editPriceStepService = inject(EditPriceStepService);

  @Input() sessionIds;
  @Input() sessionInfo;
  @Input() tabIndex: string;
  @Input() isFromTraders: boolean;
  @Input() dataForFilter: INewTabData | null;
  @Input() isAdmissionFinished: boolean;
  @Input() set isIntermediateTransfer(value: boolean) {
    if (!value) return;
    this.handleIntermediateTransfer();
  }

  @ViewChild(FiltersComponent)
  public filtersComponent: FiltersComponent;

  @ViewChild('dataGridRef')
  public dataGridRef: DxDataGridComponent;

  user: User;
  cache = {} as PageCache;
  numberEntriesPage = numberEntriesPage;
  offers: any[] = []; // TODO fix this type (DemandOffer)
  offersGroupByStatus: any;
  displayOffers: any[] = []; // TODO fix this type (DemandOffer)
  dynamicFields: any = [];
  currentTimeDate: Date;
  selectedRows = [];
  chooseOffers = [];
  privileges = false;
  searchIcon: any = searchIcon;
  search: string;
  restorePopupType: string;

  resultPopup = false;
  resultData;
  sessionsParam; //для передачи на форму результата

  idOffer: number;
  offerData: any;
  depositPopup = false;
  depositRowData: any;

  isVisibleToast = false;
  message = ' ';

  //isOpenSidebar = false;
  disableObserved = false;
  fullInfo: any = [];

  rejectionPopup = false;

  admissionOptions: any;
  restorePopup = false;
  approvePopup = false;
  deletePopup = false;
  volumePopup = false;
  volumeType;

  /* private grid: any;
  private isStateApplied = false;
  private readonly STATE_KEY = 'offerState';*/

  public openType: string; //какого формата открыто окно
  private isInitialLoad: boolean = true;
  public filterTraderName; //фильтруем по трейдеру если пришли из вкладки Трейдеры
  public filterValue: DxGridFilterExpression[] | DxGridFilterExpression | null = null;
  public focusedRowKey;
  public loadingVisible = false; //лодер

  public directSession = false; //параметр адресной части для вкладки Адресные заявки

  public readonly columnChooserPosition: PositionConfig = DEFAULT_COLUMN_CHOOSER_POSITION;

  public idOfferForRefresh: number;
  public idDirectionForRefresh: number;
  public isHiddenLot: boolean = true;
  public focusChangedTimer;

  public currentTemplateTooltip: string;

  private readonly hideLotColumnFields: readonly string[] = HIDDEN_LOT_EXTENDED_FIELDS;
  private readonly hideLotWorkerColumnFields: readonly string[] = [TableDataField.PriceSteps];
  private readonly minimalVisibleLotFields: readonly string[] = HIDDEN_LOT_MINIMAL_VISIBLE_FIELDS;
  private lastAppliedHiddenLotColumns: HiddenLotDisplayMode | null = null;
  private hiddenLotRafId: number = 0;

  public readonly auctionType = auctionType;
  public readonly statusDirectOffersFilters = statusDirectOffersFilters;
  public readonly VOLUME_PRECISION = VOLUME_PRECISION;
  public readonly statusOffersFilters = statusOffersFilters;
  public readonly statusSession = statusSession;
  public readonly sectionID = sectionID;
  public readonly pricingType = pricingType;
  public readonly PRICE_ADJUSTMENT_TYPE = PRICE_ADJUSTMENT_TYPE;
  public readonly AgreementType = AgreementType;
  public readonly TableDataField = TableDataField;
  public readonly HiddenLotDisplayMode = HiddenLotDisplayMode;

  public stateStoringEnabled: boolean = true;
  private readonly sessionInfoSubject: BehaviorSubject<ISessionStateConfig> =
    new BehaviorSubject<ISessionStateConfig>(null);

  private pendingHiddenLotApplyAfterStateLoad = false;

  public readonly loadGridState = (): Promise<DxGridState | null> => {
    this.pendingHiddenLotApplyAfterStateLoad = true;

    return firstValueFrom(
      this.sessionInfoSubject.pipe(
        filter((sessionInfo: ISessionStateConfig | null): boolean => Boolean(sessionInfo)),
        take(1),
        map((sessionInfo: ISessionStateConfig): DxGridState | null => {
          const state: DxGridState = sanitizeTradingGridStateFromLs(
            this.loadRawGridState(),
            sessionInfo.idCompositeLotAvailability
          );

          return applyFilterValueToGridState(state, this.filterValue);
        })
      )
    );
  };

  public onGridContentReady(): void {
    if (!this.pendingHiddenLotApplyAfterStateLoad) {
      return;
    }
    this.pendingHiddenLotApplyAfterStateLoad = false;
    this.lastAppliedHiddenLotColumns = null;
    this.scheduleHiddenLotColumnVisibilityForClick();
  }

  public readonly saveGridState = (state: DxGridState): void => {
    this.localStorageService.setItemToLocalStorage(this.modeGridStateKey, state);
  };

  constructor(
    private tradingService: TradingService,
    private translate: TranslateService,
    public commonService: CommonService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toastService: ToastService,
    private config: AppConfigService,
    private ngZone: NgZone,
  ) {
    this.orderHeaderFilterName = this.orderHeaderFilterName.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterDesc = this.orderHeaderFilterDesc.bind(this);
    this.orderHeaderFilterVol = this.orderHeaderFilterVol.bind(this);
    this.orderHeaderFilterUnits = this.orderHeaderFilterUnits.bind(this);
    this.orderHeaderFilterPrice = this.orderHeaderFilterPrice.bind(this);
    this.orderHeaderFilterPriceStep =
      this.orderHeaderFilterPriceStep.bind(this);
    this.orderHeaderFilterAmountVAT =
      this.orderHeaderFilterAmountVAT.bind(this);
    this.orderHeaderFilterTotalAmount =
      this.orderHeaderFilterTotalAmount.bind(this);
    this.orderHeaderFilterAmendment =
      this.orderHeaderFilterAmendment.bind(this);
    this.orderHeaderFilterQuotation =
      this.orderHeaderFilterQuotation.bind(this);
    this.orderHeaderFilterContractType =
      this.orderHeaderFilterContractType.bind(this);
  }

  get infoText(): string {
    return getGridInfoText(this.translate.store.currentLang, this.offers?.length);
  }

  get showRecalcPriceStepButton(): boolean {
    return (
      this.user?.IsWorker &&
      (this.sessionInfo?.idSessionPeriod === IdSessionPeriods.pretrading ||
        this.sessionInfo?.idSessionPeriod === IdSessionPeriods.offersAdjustment) &&
      this.sessionInfo?.idPricingType === pricingType.price
    );
  }

  get permittedVolume(): boolean {
    return (
      this.user?.IsWorker &&
      this.directSession &&
      Number(this.sessionIds.sectionId) === sectionID.forestProducts
    );
  }

  get approveBtnPosition(): boolean {
    return (Number(this.sessionIds.sectionId) === sectionID.agricultural);
  }

  public get isHiddenLotCheckboxVisible(): boolean {
    return isHiddenLotCheckboxVisible(this.sessionInfo?.idCompositeLotAvailability);
  }

  public get hiddenLotDisplayMode(): HiddenLotDisplayMode {
    return resolveHiddenLotDisplayMode(
      this.sessionInfo?.idCompositeLotAvailability,
      this.isHiddenLot
    );
  }

  public isActualSizeField(fieldName: string): boolean {
    return ACTUAL_SIZE_FIELDS.includes(Number(fieldName));
  }

  public ngOnInit(): void {
    this.restoreHiddenLotStateFromLocalStorage();
    this.initData();

    this.dataRefreshService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getData();
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.cache =
      this.sessionStorageService.getItemFromSessionStorage(
        OFFERS_SESSION_STORAGE_KEY
      ) || ({} as PageCache);

    if (changes['dataForFilter']?.currentValue) {
      this.isFromTraders = true;
    }

    if (this.filtersComponent && this.isFromTraders) {
      this.filtersComponent.updateFilterDirection(this.dataForFilter.direction);
      this.filtersComponent.updateFilterStatus(this.dataForFilter.status);
      this.filterOffersWorker();
    }

    if (this.user?.IsWorker && changes['dataForFilter']?.currentValue) {
      this.filterTraderName = this.dataForFilter?.traderFullName || '';
      this.filterValue = this.filterTraderName
        ? ['demoffOwner.traderName', '=', this.filterTraderName]
        : null;
    }

    if (changes['tabIndex'] && changes['tabIndex'].currentValue === 'offers') {
      this.focusedRowKey = this.displayOffers[0]?.demandOfferInfo?.lotNumber
        ? this.displayOffers[0]?.demandOfferInfo?.lotNumber
        : this.displayOffers[0]?.offerInfo?.lotNumber;
    }

    if (
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue
    ) {
      this.getData();
    }

    if (changes['sessionInfo']) {
      this.sessionInfoSubject.next(changes['sessionInfo'].currentValue ?? null);

      if (this.tabIndex == 'offers') {
        //передаем информацию на выезжающее окно
        if (this.offerData && this.openType == 'editOffer')
          this.popupSidebarService.submitBidToBuyUpdate(
            Object.assign(this.sessionInfo, this.sessionIds)
          );
      }
      //стартанули период подведения итогов
      if (
        changes['sessionInfo'].currentValue.isActive &&
        changes['sessionInfo'].currentValue.idSessionPeriod == IdSessionPeriods.tradingAndResult &&
        this.offers
      ) {
        this.offers.forEach((item) => {
          item.isExistCounterOffer = false;
        });
      }

      if (
        (this.directSession && changes['sessionInfo'].currentValue.isActive) ||
        changes['sessionInfo'].currentValue.isPaused
      ) {
        if (this.filtersComponent) {
          this.updateFiltersComponent();
          this.directFilterId =
            this.filtersComponent.filtersForm.get('statusDirectOffers')?.value;
        }
      }
    }
  }

  public ngAfterViewInit(): void {
    this.updateFiltersComponent();
    this.setFiltersFromLocalStorage();
  }

  public directFilterId: number;

  public initData(): void {
    if (
      this.sessionInfo.isAllowedTargetedTransact &&
      this.sessionInfo.sessionStageId ==
        sessionStage.transferAuctionCompleted &&
      this.sessionInfo.sessionStatusId == statusSession.bidding &&
      this.sessionInfo.datetimeEnd != null
    ) {
      this.directSession = true;
      this.getDirectData();
      if (this.filtersComponent) {
        this.directFilterId =
          this.filtersComponent.filtersForm.get('statusDirectOffers')?.value;
      }
    } else {
      this.getData(); //запрашиваем данные только первый раз - остальные разы по сокетам лиюо по допуску (баг 18 от 24/02/2025)
    }

    const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();
    let sectionDescription: string = sectionsArray.find(
      (el: IApiDataSection): boolean => Number(el.id) === Number(this.sessionIds.sectionId)
    )?.description;

    sectionDescription = 'TradingEditItem' + sectionDescription;
    this.privileges = this.commonService.checkPrivileges(sectionDescription);

    this.popupSidebarService.close$.subscribe((res: any) => {
      //инфа о закрытии попап окна
      this.isOpenedView = res;
    });

    //слушаем событие добавление/удаления в наблюдамые и обновляем данные
    this.popupSidebarService.triggerWatched$.subscribe((res: any) => {
      this.updateWatchedOffer(res);
    });

    //перешли из просмотра на редактирование/подачу ставки/ просмотр встречных
    this.tradingService.openTypeSidebar$.subscribe((res: string) => {
      this.openType = res;
    });
  }

  public get boundGridFilterValue(): DxGridFilterExpression[] | DxGridFilterExpression {
    return this.user?.IsWorker && this.filterValue?.length
      ? this.filterValue
      : null;
  }

  public onGridOptionChanged(event: DxDataGridTypes.OptionChangedEvent): void {
    if (event.name === 'filterValue') {
      if (this.isInitialLoad && event.value === null) {   //чтобы не перезатиралось значение при отрисовке таблицы, если перешли с вкладки Трейдеры
        this.isInitialLoad = false;
        return;
      }
      this.filterValue =
        event.value === undefined ||
        (Array.isArray(event.value) && event.value.length === 0)
          ? null
          : event.value;
    }
  }

  get stateKey(): string {
    // отдельные ключи для Адресных заявок
    if (this.directSession) {
      return this.user?.IsWorker
        ? `offers_direct_${this.cache?.filters?.statusDirectOffers ?? 'worker'}`
        : `offers_direct_tr_${this.cache?.filters?.statusDirectOffersTr ?? 'trader'}`;
    }

    return this.user?.IsWorker
      ? `offers_status${this.cache?.filters?.statusOffers}`
      : 'appOffersNts';
  }

  public get modeGridStateKey(): string {
    return buildTradingGridStateKey(
      TradingGridStatePage.Offers,
      this.hiddenLotDisplayMode,
      this.stateKey
    );
  }

  public getData(): void {
    if (!this.cache.filters) {
      this.cache.filters = {};
    }

    if (this.user?.IsWorker && this.isFromTraders && this.dataForFilter) {
      this.cache.filters.directionOffers = this.dataForFilter.direction;
      this.cache.filters.statusOffers = this.dataForFilter.status;
    }

    this.lastAppliedHiddenLotColumns = null;
    this.currentTimeDate = new Date();
    this.sessionStorageService.setItemToSessionStorage(
      OFFERS_SESSION_STORAGE_KEY,
      this.cache
    );

    if (this.user.IsWorker) {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : ' ';

      this.demandService
        .getListDemoffWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.cache?.filters?.directionOffers
            ? this.cache?.filters?.directionOffers
            : this.sessionInfo?.idAuctionType != auctionType.simpleBuyerAuction
            ? IdDirection.sale
            : IdDirection.buy,
          displayCurrency
        )
        .subscribe((res) => {
          this.offers = res.demandOffers;
          this.displayOffers = res.demandOffers;
          this.updateOffersAfterCounters();

          this.offers.sort((a, b) => {
            return a.demandOfferInfo.lotNumber - b.demandOfferInfo.lotNumber;
          });

          this.filerOffersAfterUpdate(res);
        });
    } else {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : ' ';

      this.demandService
        .getListDemoff(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.cache?.filters?.directionOffers
            ? this.cache?.filters?.directionOffers
            : this.sessionInfo?.idAuctionType != auctionType.simpleBuyerAuction
            ? IdDirection.sale
            : IdDirection.buy,
          displayCurrency
        )
        .subscribe((res) => {
          this.offers = res.demandOffers;
          this.displayOffers = this.offers;
          this.stateStoringEnabled = false;
          //у трейдера отображается только одна динамическая колонка Место назначения
          if (
            [SECTIONS_TYPES.AGRI, SECTIONS_TYPES.PERSPECTIVE].includes(
              Number(this.sessionIds.sectionId)
            )
          ) {
            this.dynamicFields = res.fields
              .filter(el => Number(el.fieldName) === IdInterfaceField.destination);
          }

          this.updateOffersAfterCounters();
          this.offers.sort((a, b) => {
            return a.demandOfferInfo.lotNumber - b.demandOfferInfo.lotNumber;
          });

          if (this.cache.filters) {
            this.filterOffers();
          }

          this.setOffersForFilters();

          this.lastAppliedHiddenLotColumns = null;
          this.scheduleHiddenLotColumnVisibilityForClick();
          this.stateStoringEnabled = true;
        });
    }
  }

  //при старте периода подведения итогов обновляю грид и убираю встречки
  public updateOffersAfterCounters(): void {
    if (
      this.sessionInfo.isActive &&
      this.sessionInfo.idSessionPeriod == IdSessionPeriods.tradingAndResult
    ) {
      this.offers?.forEach((item) => {
        item.isExistCounterOffer = false;
      });
    }
  }

  public setOffersForFilters(): void {
    this.offers.forEach((item) => {
      let names = item.goods.map((x) => x.goodName); //создаю массив имен и добавляю в объект для фильтрации
      item['names'] = names;

      let desc = item.goods.map((x) => x.goodDescription);
      item['desc'] = desc;

      let vol = item.goods.map((x) =>
        setPrecision(x.goodVolume, VOLUME_PRECISION)
      );
      item['vol'] = vol;

      let units = item.goods.map((x) => x.goodUnitName);
      item['units'] = units;

      let prices = item.goods.map((x) =>
        setPrecision(x.priceWithoutVat, item.priceParams.currencyPrecision)
      );
      item['prices'] = prices;

      if (this.user?.IsWorker) {
        let priceSteps = item.goods.map((x) =>
          setPrecision(x.priceStep, item.priceParams.currencyPrecision)
        );
        item['priceSteps'] = priceSteps;
      }

      let amountVAT = item.goods.map((x) =>
        setPrecision(x.vatAmount, item.priceParams.currencyPrecision)
      );
      item['amountVAT'] = amountVAT;

      let totalAmount = item.goods.map((x) =>
        setPrecision(x.totalAmount, item.priceParams.currencyPrecision)
      );
      item['totalAmount'] = totalAmount;

      item['mainName'] = makeMainName(
        item.goods,
        (g: DemandOfferGood) => ({
          goodName: g.goodName,
          goodDescription: g.goodDescription,
          goodGroup: g.goodGroup,
          nomenclatureGroup: g.nomenclatureGroup,
        }),
        this.sessionInfo?.sectionName
      );

      if (this.user?.IsWorker) {
        this.dynamicFields.forEach((dyn) => {
          let dynamic = item.goods.map(
            (x) => x.dynamicFields[dyn.fieldName.toString()]
          );
          item[dyn.fieldName] = dynamic;
        });
      }
    });

    this.cdr.detectChanges();
  }

  getDemandsOffersTradingUpdateStatus(data) {
    //обновление данных после получения сокета подача ставки

    if (data.idDirection == this.cache?.filters?.directionOffers) {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : '';
      this.demandService
        .tradingGetUpdateDetails(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          data.idDemandOffer,
          displayCurrency
        )
        .subscribe((res) => {
          let index = this.offers.findIndex(
            (el) => el.idDemandOffer == data.idDemandOffer
          );
          if (index >= 0) {
            this.offers[index].goods.forEach((good) => {
              let detail = res.goodDetails.find(
                (el) => el.idDemandOfferGood == good.idDemandOfferGood
              );
              if (detail) {
                good.lotSummaryPriceWithoutVat =
                  detail.summaryLot.lotSummaryPriceWithoutVat;
                good.lotSummaryVatAmount =
                  detail.summaryLot.lotSummaryVatAmount;
                good.lotSummaryTotalAmount =
                  detail.summaryLot.lotSummaryTotalAmount;
                good.lotSummaryTotalStart =
                  detail.summaryLot.lotSummaryTotalStart;
                good.priceWithoutVat = detail.priceParams.priceWithoutVat;
                good.priceAdjustment = detail.priceParams.priceAdjustment;
                good.vatAmount = detail.priceParams.vatAmount;
                good.totalAmount = detail.priceParams.totalAmount;
              }
            });
            if (this.openType == 'viewOfferFromAuctions') {
              this.onOpenViewOffer(
                data.idDemandOffer,
                data.idDirection,
                this.offers[index].idTrader
              );
              this.toastService.onShowToast({
                message: getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'general.updateOfferData'
                ),
                type: 'success',
              });
            }
          }
          let indexDisplay = this.offers.findIndex(
            (el) => el.idDemandOffer == data.idDemandOffer
          );
          if (indexDisplay >= 0) {
            this.displayOffers[indexDisplay].goods.forEach((good) => {
              let detail = res.goodDetails.find(
                (el) => el.idDemandOfferGood == good.idDemandOfferGood
              );
              if (detail) {
                good.lotSummaryPriceWithoutVat =
                  detail.summaryLot.lotSummaryPriceWithoutVat;
                good.lotSummaryVatAmount =
                  detail.summaryLot.lotSummaryVatAmount;
                good.lotSummaryTotalAmount =
                  detail.summaryLot.lotSummaryTotalAmount;
                good.lotSummaryTotalStart =
                  detail.summaryLot.lotSummaryTotalStart;
                good.priceWithoutVat = detail.priceParams.priceWithoutVat;
                good.priceAdjustment = detail.priceParams.priceAdjustment;
                good.vatAmount = detail.priceParams.vatAmount;
                good.totalAmount = detail.priceParams.totalAmount;
              }
            });
          }
        });
    }
  }

  public getUpdateDataSource(data: any): void {
    //обновление данных после получения сокета изменения статуса
    if (data.idDirection == this.cache?.filters?.directionOffers) {
      // Если статус заявки 8 заключена сделка, нужно не обновлять 4 поля в гриде, а удалить такую заявку из грида.
      if (data.state.statusId != 8) {
        //обновление данных в массиве offers
        let index = this.offers.findIndex(
          (el) =>
            el.idDemandOffer == data.idDemandOffer &&
            el.directionId == data.idDirection
        );

        if (index != -1) {
          this.offers[index].rejectionDate = data.state.rejectionDate;
          this.offers[index].rejectionReason = data.state.rejectionReason;
          this.offers[index].statusId = data.state.statusId;
          this.offers[index].statusName = data.state.statusName;
          this.offers[index].isCanReject = [
            statusOffersFilters.unactive,
            statusOffersFilters.active,
          ].includes(data.state.statusId); //возможность отклонить
          this.offers[index].isCanRestoreRejected =
            data.state.statusId === statusOffersFilters.rejectedBySystem ||
            data.state.statusId === statusOffersFilters.rejectedInBid; //возможность восстановить
          this.offers[index].isExistCounterOffer =
            data.state.isExistCounterOffer; //наличие встречки
        }
        //обновление данных в массиве displayOffers
        let indexDisplayOffers = this.displayOffers.findIndex(
          (el) =>
            el.idDemandOffer == data.idDemandOffer &&
            el.directionId == data.idDirection
        );

        if (indexDisplayOffers != -1) {
          this.displayOffers[indexDisplayOffers].rejectionDate =
            data.state.rejectionDate;
          this.displayOffers[indexDisplayOffers].rejectionReason =
            data.state.rejectionReason;
          this.displayOffers[indexDisplayOffers].statusId = data.state.statusId;
          this.displayOffers[indexDisplayOffers].statusName =
            data.state.statusName;
          this.displayOffers[indexDisplayOffers].isCanReject = [
            statusOffersFilters.unactive,
            statusOffersFilters.active,
          ].includes(data.state.statusId); //возможность отклонить
          this.displayOffers[indexDisplayOffers].isCanRestoreRejected =
            data.state.statusId === statusOffersFilters.rejectedBySystem ||
            data.state.statusId === statusOffersFilters.rejectedInBid; //возможность восстановить
          this.offers[indexDisplayOffers].isExistCounterOffer =
            data.state.isExistCounterOffer; //наличие встречки
        }
        //закрыть форму подробного просмотра (?) заявки с одним из указанных идентификаторов
        if (
          this.isOpenedView &&
          this.offerData.idDemandOffer == data.idDemandOffer
        ) {
          this.popupSidebarService.onClosePopupSideBar();

          /*todo я не знаю что за конкретное действие произошло (отклонение/сделка заключена или другое)
           const errors = {
             error: true,
             errorStatus: 0,
             messageError: this.translate.store.currentLang == 'RU' ? RU["errors"].appRejectByEmployeeInAuction : EN["errors"].appRejectByEmployeeInAuction
           }
           this.errorServiceService.callErrorPopup(errors);*/
        }
        //отфильтровываем данные
        this.user?.IsWorker ? this.filterOffersWorker() : this.filterOffers();

        if (this.user?.IsWorker) {
          //разбиваем по статусу
          this.offersGroupByStatus = {
            active: this.offers.filter(
              (offer) => offer.statusId === statusOffersFilters.active
            ),
            unactive: this.offers.filter(
              (offer) => offer.statusId === statusOffersFilters.unactive
            ),
            rejected: this.offers.filter((offer) =>
              [
                statusOffersFilters.rejectedBeforeBid,
                statusOffersFilters.rejectedBySystem,
                statusOffersFilters.rejectedInBid,
              ].includes(offer.statusId)
            ),
          };
          this.updateFiltersComponent(); //передаем количество заявок в каждом статусе на компонент с фильтрами
          //автоматическое переключение фильтра по статусу (если заявок 0 - перескакиваем на следующий)
          if (
            (this.cache.filters.statusOffers == statusOffersFilters.active &&
              this.offersGroupByStatus.active?.length == 0) ||
            (this.cache.filters.statusOffers == statusOffersFilters.unactive &&
              this.offersGroupByStatus.unactive?.length == 0) ||
            (this.cache.filters.statusOffers ==
              statusOffersFilters.rejectedBeforeBid &&
              this.offersGroupByStatus.rejected?.length == 0 &&
              !this.isFromTraders)
          ) {
            this.switchToNextFilter();
          }
        }
      } else {
        let index = this.offers.findIndex(
          (el) =>
            el.idDemandOffer == data.idDemandOffer &&
            el.directionId == data.idDirection
        );
        index != -1 ? this.offers.splice(index, 1) : null;
        let indexDisplayOffers = this.displayOffers.findIndex(
          (el) =>
            el.idDemandOffer == data.idDemandOffer &&
            el.directionId == data.idDirection
        );
        if (indexDisplayOffers != -1) {
          this.displayOffers.splice(indexDisplayOffers, 1);
        }
      }
    }
  }

  public getUpdateOffer(data): void {
    if (IdDirection.sale == this.cache?.filters?.directionOffers) {
      let demandsOffers: number[] = data.idOfferRemains
        ? [data.idOfferCurrent, data.idOfferRemains]
        : [data.idOfferCurrent];
      this.getUpdateAfterEditing(
        demandsOffers,
        data.idOfferCurrent,
        data.idOfferOld
      );
    }
  }

  public getUpdateDemands(data): void {
    if (IdDirection.buy == this.cache?.filters?.directionOffers) {
      let demandsOffers: number[] = data.idDemandRemains
        ? [data.idDemandCurrent, data.idDemandRemains]
        : [data.idDemandCurrent];
      this.getUpdateAfterEditing(
        demandsOffers,
        data.idDemandCurrent,
        data.idDemandOld
      );
    }
  }

  getUpdateAfterEditing(
    demandsOffers: number[],
    idCurrent: number,
    idOld: number
  ) {
    //после редактирования заявки
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    if (this.user?.IsWorker) {
      this.demandService
        .buceGetDemoff(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          demandsOffers,
          this.cache?.filters?.directionOffers,
          displayCurrency
        )
        .subscribe((res) => {
          res.demandsOffers.forEach((offer) => {
            if (offer.idDemandOffer != idCurrent)
              //если пришла инфа по остаткам
              this.offers.push(offer);
            else {
              let index = this.offers.findIndex(
                (el) => el.idDemandOffer == idOld
              );
              if (index != -1) {
                this.offers[index] = offer;
              } else this.offers.push(offer);
            }
          });
          this.displayOffers = this.offers;
          this.filerOffersAfterUpdate(res);
        });
    } else {
      this.demandService
        .getDemoff(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          demandsOffers,
          this.cache?.filters?.directionOffers,
          displayCurrency
        )
        .subscribe((res: any) => {
          res.demandsOffers.forEach((offer) => {
            if (offer.idDemandOffer != idCurrent)
              //если пришла инфа по остаткам
              this.offers.push(offer);
            else {
              let index = this.offers.findIndex(
                (el) => el.idDemandOffer == idOld
              );
              if (index != -1) {
                this.offers[index] = offer;
              } else this.offers.push(offer);
            }
          });

          this.displayOffers = this.offers;
          if (this.cache.filters) {
            this.filterOffers();
          }

          this.setOffersForFilters();
        });
    }
  }

  getAddLots(data) {
    if (data.idDirection == this.cache?.filters?.directionOffers) {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : '';
      let index = this.offers.findIndex(
        (el) => el.idDemandOffer == data.idDemandOfferEdited
      );
      index != -1 ? this.offers.splice(index, 1) : null;
      let demandsOffers = [data.idDemandOfferCreated];
      if (this.user?.IsWorker) {
        this.demandService
          .buceGetDemoff(
            this.user?.token,
            this.sessionIds.sectionId,
            this.sessionIds.sessionId,
            demandsOffers,
            this.cache?.filters?.directionOffers,
            displayCurrency
          )
          .subscribe((res) => {
            res.demandsOffers.forEach((offer) => {
              let index = this.offers.findIndex(
                (el) => el.idDemandOffer == data.idDemandOfferEdited
              );
              if (index != -1) {
                this.offers[index] = offer;
              } else this.offers.push(offer);
            });
            this.displayOffers = this.offers;
            this.filerOffersAfterUpdate(res);
          });
      } else {
        this.demandService
          .getDemoff(
            this.user?.token,
            this.sessionIds.sectionId,
            this.sessionIds.sessionId,
            demandsOffers,
            this.cache?.filters?.directionOffers,
            displayCurrency
          )
          .subscribe((res) => {
            res.demandsOffers.forEach((offer) => {
              let index = this.offers.findIndex(
                (el) => el.idDemandOffer == data.idDemandOfferEdited
              );
              if (index != -1) {
                this.offers[index] = offer;
              } else this.offers.push(offer);
            });

            this.displayOffers = this.offers;
            if (this.cache.filters) {
              this.filterOffers();
            }

            this.setOffersForFilters();
          });
      }
    }
  }

  public filerOffersAfterUpdate(res): void {
    this.offersGroupByStatus = {
      //группирую заявки по статусу
      active: this.offers.filter(
        (offer) => offer.statusId === statusOffersFilters.active
      ),
      unactive: this.offers.filter(
        (offer) => offer.statusId === statusOffersFilters.unactive
      ),
      rejected: this.offers.filter((offer) =>
        [
          statusOffersFilters.rejectedBeforeBid,
          statusOffersFilters.rejectedBySystem,
          statusOffersFilters.rejectedInBid,
        ].includes(offer.statusId)
      ),
    };
    this.updateFiltersComponent();
    if (this.filtersComponent && this.isFromTraders) {
      //проставляю фильтры если перешла из вкладки Трейдеры
      this.filtersComponent.updateFilterDirection(this.dataForFilter.direction);
      this.filtersComponent.updateFilterStatus(this.dataForFilter.status);
    }
    //автоматическое переключение фильтра по статусу (если заявок 0 - перескакиваем на следующий)
    if (
      (this.cache.filters.statusOffers == statusOffersFilters.active &&
        this.offersGroupByStatus.active?.length == 0) ||
      (this.cache.filters.statusOffers == statusOffersFilters.unactive &&
        this.offersGroupByStatus.unactive?.length == 0) ||
      (this.cache.filters.statusOffers ==
        statusOffersFilters.rejectedBeforeBid &&
        this.offersGroupByStatus.rejected?.length == 0 &&
        !this.isFromTraders)
    ) {
      this.switchToNextFilter();
    }

    this.dynamicFields = res.fields;
    if (this.cache.filters) {
      this.filterOffersWorker();
    }

    this.setOffersForFilters();
  }

  public updateOfferStatus(data) {
    if (data.idDirection == this.cache?.filters?.directionOffers) {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : '';
      this.demandService
        .buceGetDemoff(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          data.demandOffers,
          this.cache?.filters?.directionOffers,
          displayCurrency
        )
        .subscribe((res) => {
          res.demandsOffers.forEach((offer) => {
            let index = this.offers.findIndex(
              (el) => el.idDemandOffer == offer.idDemandOffer
            );
            if (index != -1) {
              this.offers[index] = offer;
            } else this.offers.push(offer);
          });
          this.displayOffers = this.offers;
          this.filerOffersAfterUpdate(res);
        });
    }
  }

  private switchToNextFilter(): void {
    if (this.offersGroupByStatus.active.length > 0) {
      this.cache.filters.statusOffers = statusOffersFilters.active;
      this.displayOffers = this.offersGroupByStatus.active;
    } else if (this.offersGroupByStatus.unactive.length > 0) {
      this.cache.filters.statusOffers = statusOffersFilters.unactive;
      this.displayOffers = this.offersGroupByStatus.unactive;
    } else if (this.offersGroupByStatus.rejected.length > 0) {
      this.cache.filters.statusOffers = statusOffersFilters.rejectedBeforeBid;
      this.displayOffers = this.offersGroupByStatus.rejected;
    } else {
      this.displayOffers = [];
    }
    if (this.filtersComponent) {
      this.filtersComponent.updateFilterStatus(this.cache.filters.statusOffers);
    }
  }

  public filterOffersWorker(): void {
    const filtersInfo: DxGridState | null = this.loadRawGridState();

    if (filtersInfo) {
      this.stateStoringEnabled = false;
    }

    this.displayOffers = this.offers.filter((i) => {
      if (this.isFromTraders) {
        this.cache.filters.directionOffers = this.dataForFilter.direction;
        this.cache.filters.statusOffers = this.dataForFilter.status;
      }

      const activeStatus =
        this.cache.filters.statusOffers == statusOffersFilters.active ? i.statusId == statusOffersFilters.active : true;
      const unactiveStatus =
        this.cache.filters.statusOffers == statusOffersFilters.unactive ? i.statusId == statusOffersFilters.unactive : true;
      const rejectedStatus =
        this.cache.filters.statusOffers == statusOffersFilters.rejectedBeforeBid
          ? [statusOffersFilters.rejectedBeforeBid,
            statusOffersFilters.rejectedBySystem,
            statusOffersFilters.rejectedInBid].includes(i.statusId)
          : true;

      const internalMarket =
        !this.cache.filters.internal || i.modelInfo.isSupportMarketDomestic;
      const externalMarket =
        !this.cache.filters.external || i.modelInfo.isSupportMarketForeign;
      const exportMarket =
        !this.cache.filters.export || i.modelInfo.isSupportMarketExport;
      const importMarket =
        !this.cache.filters.import || i.modelInfo.isSupportMarketImport;
      const observed = this.cache.filters.observed ? i.isWatched : true;
      const multibasis = this.cache.filters.multibasis
        ? i.goodInfo.isMultibasis
        : true;
      const corrected = this.cache.filters.corrected
        ? i.isEditedInTrading
        : true;
      const priceAdjustment = this.cache.filters.priceAdjustment
        ? i.goodInfo.isPriceAdjusted
        : true;
      const simpleLot = this.cache.filters.simpleLot
        ? !i.goodInfo.isComposite
        : true;
      const compositeLot = this.cache.filters.compositeLot
        ? i.goodInfo.isComposite
        : true;
      const individualPriceStep = this.cache.filters.individualPriceStep
        ? i.isIndividualPriceStepUsed
        : true;

      return (
        activeStatus &&
        unactiveStatus &&
        rejectedStatus &&
        internalMarket &&
        externalMarket &&
        exportMarket &&
        importMarket &&
        observed &&
        multibasis &&
        corrected &&
        priceAdjustment &&
        simpleLot &&
        compositeLot &&
        individualPriceStep
      );
    });

    this.cdr.detectChanges();

    if (!this.isFromTraders) {
      this.ngZone.onStable.pipe(take(1)).subscribe((): void => {
        if (!filtersInfo && !this.filterValue?.length) {
          this.dataGridRef.instance.clearFilter();
        }
        this.stateStoringEnabled = true;
        this.pendingHiddenLotApplyAfterStateLoad = true;
        this.lastAppliedHiddenLotColumns = null;
        this.scheduleHiddenLotColumnVisibilityForClick();
      });
    } else {
      this.lastAppliedHiddenLotColumns = null;
      this.scheduleHiddenLotColumnVisibilityForClick();
    }
  }

  filterOffers() {
    this.displayOffers = this.offers.filter((i) => {
      const internalMarket =
        !this.cache.filters.internal || i.modelInfo.isSupportMarketDomestic;
      const externalMarket =
        !this.cache.filters.external || i.modelInfo.isSupportMarketForeign;
      const exportMarket =
        !this.cache.filters.export || i.modelInfo.isSupportMarketExport;
      const importMarket =
        !this.cache.filters.import || i.modelInfo.isSupportMarketImport;

      const observed = this.cache.filters.observed ? i.isWatched : true;
      const multibasis = this.cache.filters.multibasis
        ? i.goodInfo.isMultibasis
        : true;
      const corrected = this.cache.filters.corrected
        ? i.isEditedInTrading
        : true;
      const priceAdjustment = this.cache.filters.priceAdjustment
        ? i.goodInfo.isPriceAdjusted
        : true;
      const simpleLot = this.cache.filters.simpleLot
        ? !i.goodInfo.isComposite
        : true;
      const compositeLot = this.cache.filters.compositeLot
        ? i.goodInfo.isComposite
        : true;

      return (
        internalMarket &&
        externalMarket &&
        exportMarket &&
        importMarket &&
        observed &&
        multibasis &&
        corrected &&
        priceAdjustment &&
        simpleLot &&
        compositeLot
      );
    });
  }

  //адресные заявки
  public getDirectData(): void {
    this.lastAppliedHiddenLotColumns = null;
    this.currentTimeDate = new Date();
    this.sessionStorageService.setItemToSessionStorage(
      OFFERS_SESSION_STORAGE_KEY,
      this.cache
    );

    if (this.user.IsWorker) {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : ' ';

      this.targetedService
        .getListOffersAllWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          displayCurrency
        )
        .subscribe((res) => {
          this.offers = res.offers;
          this.displayOffers = this.offers;

          this.offers.sort((a, b) => {
            return a.offerInfo.lotNumber - b.offerInfo.lotNumber;
          });
          this.dynamicFields = res.fields;
          this.groupByStatusAndFilterDataForWorker();

          this.lastAppliedHiddenLotColumns = null;
          this.scheduleHiddenLotColumnVisibilityForClick();

          /*  if (this.cache.filters) {
            this.filterDirectOffersWorker();
          }

          this.setOffersForFilters();*/
        });
    } else {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : ' ';

      this.targetedService
        .getListOffersAll(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          displayCurrency
        )
        .subscribe((res) => {
          this.offers = res.offers;
          this.displayOffers = this.offers;

          this.offers.sort((a, b) => {
            return a.offerInfo.lotNumber - b.offerInfo.lotNumber;
          });
          this.dynamicFields = res.fields;

          this.groupByStatusAndFilterDataForTrader();

          this.lastAppliedHiddenLotColumns = null;
          this.scheduleHiddenLotColumnVisibilityForClick();

          /*   if (this.cache.filters) {
            this.filterDirectOffers();
          }

          this.setOffersForFilters();*/
        });
    }
  }

  getUpdateDataSourceDirect(data) {
    //обновление данных после получения сокета изменения статуса АДРЕСНЫЕ
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    let offers = data.demandsOffers;

    if (this.user?.IsWorker) {
      this.targetedService
        .getListOffersFixedWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          offers,
          displayCurrency
        )
        .subscribe((res) => {
          res.offers.forEach((offer) => {
            if (offer) {
              let index = this.offers.findIndex(
                (el) => el.idOffer == offer.idOffer
              );

              if (index != -1) {
                this.offers[index] = offer; //обновляем заявку из грида
              } else {
                this.offers.push(offer); //добавляем заявку из грида
              }
            } else {
              //удаляем заявку из грида
              let index = this.offers.findIndex(
                (el) => el.idOffer == offer.idOffer
              );
              index != -1 ? this.offers.splice(index, 1) : null;
              let indexDisplayOffers = this.displayOffers.findIndex(
                (el) => el.idOffer == offer.idOffer
              );
              if (indexDisplayOffers != -1) {
                this.displayOffers.splice(indexDisplayOffers, 1);
              }
            }
          });

          this.displayOffers = this.offers;
          this.dynamicFields = res.fields;
          this.groupByStatusAndFilterDataForWorker();

          /* if (this.cache.filters) {
            this.filterDirectOffersWorker();
          }

          this.setOffersForFilters();*/
        });
    } else {
      this.targetedService
        .getListOffersFixed(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          offers,
          displayCurrency
        )
        .subscribe((res) => {
          res.offers.forEach((offer) => {
            if (offer) {
              let index = this.offers.findIndex(
                (el) => el.idOffer == offer.idOffer
              );
              if (index != -1) {
                this.offers[index] = offer; //обновляем заявку из грида
              } else {
                this.offers.push(offer); //добавляем заявку из грида
              }
            } else {
              //удаляем заявку из грида
              let index = this.offers.findIndex(
                (el) => el.idOffer == offer.idOffer
              );
              index != -1 ? this.offers.splice(index, 1) : null;
              let indexDisplayOffers = this.displayOffers.findIndex(
                (el) => el.idOffer == offer.idOffer
              );
              if (indexDisplayOffers != -1) {
                this.displayOffers.splice(indexDisplayOffers, 1);
              }
            }
          });

          this.displayOffers = this.offers;
          this.dynamicFields = res.fields;

          this.groupByStatusAndFilterDataForTrader();
          /*    if (this.cache.filters) {
            this.filterDirectOffers();
          }

          this.setOffersForFilters();*/
        });
    }
  }

  public groupByStatusAndFilterDataForWorker(): void {
    this.offersGroupByStatus = {
      //группирую заявки по статусу
      backlogged: this.offers.filter(
        (offer) => offer.statusId === statusDirectOffersFilters.backlogged
      ),
      reviewed: this.offers.filter(
        (offer) => offer.statusId === statusDirectOffersFilters.reviewed
      ),
      rejected: this.offers.filter((offer) =>
        [
          statusDirectOffersFilters.rejectedBeforeBid,
          statusDirectOffersFilters.rejectedBySystem,
          statusDirectOffersFilters.rejectedInBid,
        ].includes(offer.statusId)
      ),
      unapproved: this.offers.filter(
        (offer) => offer.statusId === statusDirectOffersFilters.unapproved
      ),
      approved: this.offers.filter(
        (offer) => offer.statusId === statusDirectOffersFilters.approved
      ),
    };
    this.updateFiltersComponent();

    //автоматическое переключение фильтра по статусу (если заявок 0 - перескакиваем на следующий)
    if (
      (this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.backlogged &&
        this.offersGroupByStatus.backlogged?.length == 0) ||
      (this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.reviewed &&
        this.offersGroupByStatus.reviewed?.length == 0) ||
      (this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.rejectedBeforeBid &&
        this.offersGroupByStatus.rejected?.length == 0) ||
      (this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.unapproved &&
        this.offersGroupByStatus.unapproved?.length == 0) ||
      (this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.approved &&
        this.offersGroupByStatus.approved?.length == 0)
    ) {
      this.switchToNextDirectFilter();
    }
    if (this.cache.filters) {
      this.filterDirectOffersWorker();
    }

    this.setOffersForFilters();
  }

  public groupByStatusAndFilterDataForTrader(): void {
    this.offersGroupByStatus = {
      //группирую заявки по статусу
      submitted: this.offers.filter((offer) =>
        [
          statusDirectOffersFilters.backlogged,
          statusDirectOffersFilters.reviewed,
        ].includes(offer.statusId)
      ),
      approved: this.offers.filter(
        (offer) => offer.statusId === statusDirectOffersFilters.approved
      ),
      rejected: this.offers.filter((offer) =>
        [
          statusDirectOffersFilters.rejectedBeforeBid,
          statusDirectOffersFilters.rejectedBySystem,
          statusDirectOffersFilters.rejectedInBid,
          statusDirectOffersFilters.unapproved,
        ].includes(offer.statusId)
      ),
    };
    this.updateFiltersComponent();

    //автоматическое переключение фильтра по статусу (если заявок 0 - перескакиваем на следующий)
    if (
      (this.cache.filters.statusDirectOffersTr ==
        statusDirectOffersFilters.backlogged &&
        this.offersGroupByStatus.submitted?.length == 0) ||
      (this.cache.filters.statusDirectOffersTr ==
        statusDirectOffersFilters.approved &&
        this.offersGroupByStatus.approved?.length == 0) ||
      (this.cache.filters.statusDirectOffersTr ==
        statusDirectOffersFilters.rejectedBeforeBid &&
        this.offersGroupByStatus.rejected?.length == 0)
    ) {
      this.switchToNextDirectFilter();
    }
    if (this.cache.filters) {
      this.filterDirectOffers();
    }

    this.setOffersForFilters();
  }

  getOffersTargetedExclude(data) {
    // удалить из грида заявку с указанным идентификатором
    let index = this.offers.findIndex((el) => el.idOffer == data.idOffer);
    if (index != -1) {
      this.offers.splice(index, 1);
    }
    this.displayOffers = this.offers;
    //закрыть форму подробного просмотра (?) заявки с одним из указанных идентификаторов
    if (this.isOpenedView && this.offerData?.idOffer == data.idOffer) {
      this.popupSidebarService.onClosePopupSideBar();
    }

    if (this.user?.IsWorker) {
      this.groupByStatusAndFilterDataForWorker();
    } else this.groupByStatusAndFilterDataForTrader();
  }

  filterDirectOffersWorker() {
    this.displayOffers = this.offers.filter((i) => {
      const backloggedStatus =
        this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.backlogged
          ? i.statusId == statusDirectOffersFilters.backlogged
          : true;
      const reviewedStatus =
        this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.reviewed
          ? i.statusId == statusDirectOffersFilters.reviewed
          : true;
      const rejectedStatus =
        this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.rejectedBeforeBid
          ? [
              statusDirectOffersFilters.rejectedBeforeBid,
              statusDirectOffersFilters.rejectedBySystem,
              statusDirectOffersFilters.rejectedInBid,
            ].includes(i.statusId)
          : true;
      const unapprovedStatus =
        this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.unapproved
          ? i.statusId == statusDirectOffersFilters.unapproved
          : true;
      const approvedStatus =
        this.cache.filters.statusDirectOffers ==
        statusDirectOffersFilters.approved
          ? i.statusId == statusDirectOffersFilters.approved
          : true;

      const internalMarket =
        !this.cache.filters.internal || i.modelInfo.isSupportMarketDomestic;
      const externalMarket =
        !this.cache.filters.external || i.modelInfo.isSupportMarketForeign;
      const exportMarket =
        !this.cache.filters.export || i.modelInfo.isSupportMarketExport;
      const importMarket =
        !this.cache.filters.import || i.modelInfo.isSupportMarketImport;
      const observed = this.cache.filters.observed ? i.isWatched : true;
      const priceAdjustment = this.cache.filters.priceAdjustment
        ? i.goodInfo.isPriceAdjusted
        : true;
      const simpleLot = this.cache.filters.simpleLot
        ? !i.goodInfo.isComposite
        : true;
      const compositeLot = this.cache.filters.compositeLot
        ? i.goodInfo.isComposite
        : true;

      return (
        backloggedStatus &&
        reviewedStatus &&
        rejectedStatus &&
        unapprovedStatus &&
        approvedStatus &&
        internalMarket &&
        externalMarket &&
        exportMarket &&
        importMarket &&
        observed &&
        priceAdjustment &&
        simpleLot &&
        compositeLot
      );
    });
  }

  filterDirectOffers() {
    this.displayOffers = this.offers.filter((i) => {
      const submittedStatus =
        this.cache.filters.statusDirectOffersTr ==
        statusDirectOffersFiltersTr.submitted
          ? [
              statusDirectOffersFiltersTr.submitted,
              statusDirectOffersFiltersTr.reviewed,
            ].includes(i.statusId)
          : true;
      const approvedStatus =
        this.cache.filters.statusDirectOffersTr ==
        statusDirectOffersFiltersTr.approved
          ? i.statusId == statusDirectOffersFiltersTr.approved
          : true;
      const rejectedStatus =
        this.cache.filters.statusDirectOffersTr ==
        statusDirectOffersFiltersTr.rejectedBeforeBid
          ? [
              statusDirectOffersFiltersTr.rejectedBeforeBid,
              statusDirectOffersFiltersTr.rejectedBySystem,
              statusDirectOffersFiltersTr.rejectedInBid,
              statusDirectOffersFiltersTr.unapproved,
            ].includes(i.statusId)
          : true;

      const internalMarket =
        !this.cache.filters.internal || i.modelInfo.isSupportMarketDomestic;
      const externalMarket =
        !this.cache.filters.external || i.modelInfo.isSupportMarketForeign;
      const exportMarket =
        !this.cache.filters.export || i.modelInfo.isSupportMarketExport;
      const importMarket =
        !this.cache.filters.import || i.modelInfo.isSupportMarketImport;

      const observed = this.cache.filters.observed ? i.isWatched : true;
      const priceAdjustment = this.cache.filters.priceAdjustment
        ? i.goodInfo.isPriceAdjusted
        : true;
      const simpleLot = this.cache.filters.simpleLot
        ? !i.goodInfo.isComposite
        : true;
      const compositeLot = this.cache.filters.compositeLot
        ? i.goodInfo.isComposite
        : true;

      return (
        submittedStatus &&
        approvedStatus &&
        rejectedStatus &&
        internalMarket &&
        externalMarket &&
        exportMarket &&
        importMarket &&
        observed &&
        priceAdjustment &&
        simpleLot &&
        compositeLot
      );
    });
  }

  //для адресных заявок
  switchToNextDirectFilter() {
    if (this.user.IsWorker) {
      if (this.offersGroupByStatus?.backlogged?.length > 0) {
        this.cache.filters.statusDirectOffers =
          statusDirectOffersFilters.backlogged;
        this.displayOffers = this.offersGroupByStatus.backlogged;
      } else if (this.offersGroupByStatus.reviewed.length > 0) {
        this.cache.filters.statusDirectOffers =
          statusDirectOffersFilters.reviewed;
        this.displayOffers = this.offersGroupByStatus.reviewed;
      } else if (this.offersGroupByStatus.rejected.length > 0) {
        this.cache.filters.statusDirectOffers =
          statusDirectOffersFilters.rejectedBeforeBid;
        this.displayOffers = this.offersGroupByStatus.rejected;
      } else if (this.offersGroupByStatus.unapproved.length > 0) {
        this.cache.filters.statusDirectOffers =
          statusDirectOffersFilters.unapproved;
        this.displayOffers = this.offersGroupByStatus.unapproved;
      } else if (this.offersGroupByStatus.approved.length > 0) {
        this.cache.filters.statusDirectOffers =
          statusDirectOffersFilters.approved;
        this.displayOffers = this.offersGroupByStatus.approved;
      } else {
        this.displayOffers = [];
      }
      if (this.filtersComponent) {
        this.filtersComponent.updateFilterStatusDirect(
          this.cache.filters.statusDirectOffers
        );

        this.directFilterId = this.cache.filters.statusDirectOffers; //обновляем переменную для состояния кнопки "Одобрить"
      }
    } else {
      if (this.offersGroupByStatus.submitted.length > 0) {
        this.cache.filters.statusDirectOffersTr =
          statusDirectOffersFiltersTr.submitted;
        this.displayOffers = this.offersGroupByStatus.submitted;
      } else if (this.offersGroupByStatus.approved.length > 0) {
        this.cache.filters.statusDirectOffersTr =
          statusDirectOffersFiltersTr.approved;
        this.displayOffers = this.offersGroupByStatus.approved;
      } else if (this.offersGroupByStatus.rejected.length > 0) {
        this.cache.filters.statusDirectOffersTr =
          statusDirectOffersFiltersTr.rejectedBeforeBid;
        this.displayOffers = this.offersGroupByStatus.rejected;
      } else {
        this.displayOffers = [];
      }
      if (this.filtersComponent) {
        this.filtersComponent.updateFilterStatusDirectTr(
          this.cache.filters.statusDirectOffersTr
        );
      }
    }
  }

  /**
   * @description updates filter cache, sends request to backend if currency or direction is changed, calls filtering methods
   * @param e data emitted by filter component - form values
   */
  public getFilterData(e: any): void {
    this.cache.filters = { ...this.cache.filters, ...e };

    if (this.isFromTraders && this.dataForFilter) {
      this.cache.filters.directionOffers = this.dataForFilter.direction;
    }

    this.sessionStorageService.setItemToSessionStorage(
      OFFERS_SESSION_STORAGE_KEY,
      this.cache
    );

    this.isFromTraders = false;

    if (
      this.filtersComponent?.changedCurrency ||
      this.filtersComponent?.changedDirection
    ) {
      this.directSession ? this.getDirectData() : this.getData();
    } else {
      if (this.directSession) {
        this.user?.IsWorker
          ? this.filterDirectOffersWorker()
          : this.filterDirectOffers();

        this.directFilterId =
          this.filtersComponent?.filtersForm?.get('statusDirectOffers')?.value;
      } else {
        this.user?.IsWorker ? this.filterOffersWorker() : this.filterOffers();
      }
    }
  }

  onSelectionChanged(data: any) {
    this.selectedRows = data.selectedRowsData;
    if (this.selectedRows.length == 1) {
      this.idOffer = this.selectedRows[0].idDemandOffer;
      this.offerData = this.selectedRows[0];
    }
    this.chooseOffers = this.selectedRows;
  }

  isOpenedView = false; //для переключения формы просомтра по клавишам

  onContextMenuPreparing(e: any) {
    if (e.row.rowType != 'header') {
      this.chooseOffers = [];
      if (!e.items) e.items = [];
      if (this.selectedRows.length > 0) {
        this.chooseOffers = this.selectedRows;
      } else {
        this.chooseOffers.push(e.row.data);
      }
      if (this.chooseOffers.length == 1) {
        this.idOffer = e.row.data.idDemandOffer;
        this.offerData = e.row.data;
      }

      if (this.chooseOffers.length > 1) {
        //проверка на разные статусы наблюдения заявок
        for (let i = 0; i < this.chooseOffers.length; i++) {
          this.chooseOffers[i - 1]?.isWatched == this.chooseOffers[i]?.isWatched
            ? (this.disableObserved = false)
            : (this.disableObserved = true);
        }
      }

      if (this.user?.IsWorker) {
        if (this.directSession) {
          // адресная сессия - меню для вкладки Адресные заявки
          e.items.push(
            {
              icon: './assets/img/icons/viewOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.viewApplication'
              ),
              disabled: this.chooseOffers?.length > 1,
              onItemClick: () => {
                this.isOpenedView = true;
                this.onOpenViewOffer(
                  e.row.data.idOffer,
                  e.row.data.directionId,
                  e.row.data.offerOwner.sellerIdTrader
                );
              },
            },
            {
              icon: './assets/img/icons/editOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.editApplication'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                !(
                  this.sessionInfo?.idSessionPeriod ==
                    IdSessionPeriods.direct &&
                  (this.sessionInfo.isActive || this.sessionInfo.isPaused) &&
                  [
                    statusDirectOffersFilters.backlogged,
                    statusDirectOffersFilters.reviewed,
                  ].includes(this.offerData.statusId)
                ),
              onItemClick: () => {
                this.editDirectOffer(e.row.data.idOffer);
              },
            },
            {
              icon: e.row.data.isWatched
                ? './assets/img/icons/greenObserveOfferBigger.svg'
                : './assets/img/icons/observeOffer.svg',
              text: e.row.data.isWatched
                ? getTranslateResultByCurrentLang(
                    this.translate.store.currentLang,
                    'trading.offersTable.deleteFromObserved'
                  )
                : getTranslateResultByCurrentLang(
                    this.translate.store.currentLang,
                    'trading.offersTable.addToObserved'
                  ),
              disabled: this.disableObserved,
              onItemClick: () => {
                this.observeDirectOffer(this.chooseOffers);
              },
            },
            {
              icon: './assets/img/icons/rejectOffer.svg',
              template: `<div class="flexContent8 center font-s14 redColor"><i class="rejectOffer"></i><span>${getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.rejectApplication'
              )}</span></div>`,
              disabled:
                !this.privileges ||
                this.sessionInfo.idSessionPeriod != IdSessionPeriods.direct ||
                ![
                  statusDirectOffersFilters.backlogged,
                  statusDirectOffersFilters.reviewed,
                ].includes(this.cache.filters.statusDirectOffers),
              onItemClick: () => {
                this.onOpenRejectionOffer();
              },
            },
            {
              icon: './assets/img/icons/restore.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.restoreApplication'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                !this.privileges ||
                this.sessionInfo.idSessionPeriod != IdSessionPeriods.direct ||
                ![
                  statusDirectOffersFilters.rejectedBeforeBid,
                  statusDirectOffersFilters.rejectedBySystem,
                  statusDirectOffersFilters.rejectedInBid,
                ].includes(this.cache.filters.statusDirectOffers),
              onItemClick: () => {
                this.restoreOffer();
              },
            },
            {
              icon: './assets/img/icons/reviewed.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.directOffersTab.moveToReviewed'
              ),
              disabled:
                this.cache.filters.statusDirectOffers !=
                  statusDirectOffersFilters.backlogged ||
                !this.privileges ||
                this.sessionInfo.idSessionPeriod != IdSessionPeriods.direct,
              onItemClick: () => {
                this.reviewOffers();
              },
            },
            {
              icon: './assets/img/icons/backlogged.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.directOffersTab.moveToBacklogged'
              ),
              disabled:
                this.cache.filters.statusDirectOffers !=
                  statusDirectOffersFilters.reviewed ||
                !this.privileges ||
                this.sessionInfo.idSessionPeriod != IdSessionPeriods.direct,
              onItemClick: () => {
                this.backlogOffers();
              },
            },
            {
              icon: './assets/img/icons/tradingProgress.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.viewProgress'
              ),
              disabled: this.chooseOffers?.length > 1 || !this.user?.IsWorker,
              onItemClick: () => {
                const idAuctionType = this.store.idAuctionType();
                const auctionRootPath = getAuctionPath(idAuctionType);
                const url = this.router.serializeUrl(
                  this.router.createUrlTree(
                    [`auctions/${auctionRootPath}/main-page/bidding-process`],
                    {
                      queryParams: {
                        idSection: this.globalStore.mainSessionInfo().sectionId,
                        idSession: this.globalStore.mainSessionInfo().sessionId,
                        lotNumber: this.directSession
                          ? e.row.data.offerInfo.lotNumber
                          : e.row.data.lotNumber,
                        idOffer: e.row.data.idOffer,
                        sessionDate: this.sessionInfo?.datetimeBegin,
                        sessionName: this.sessionInfo?.sessionName,
                        auctionType: this.sessionInfo?.idAuctionType,
                      },
                    }
                  )
                );
                window.open(`${url}`, '_blank');
              },
            }
          );
        } else {
          e.items.push(
            {
              icon: './assets/img/icons/viewOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.viewApplication'
              ),
              disabled: this.chooseOffers?.length > 1,
              onItemClick: () => {
                this.isOpenedView = true;
                this.onOpenViewOffer(
                  e.row.data.idDemandOffer,
                  e.row.data.directionId,
                  e.row.data.demoffOwner.idTrader
                );
              },
            },
            {
              icon: './assets/img/icons/editOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.editApplication'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                !(
                  (this.sessionInfo?.idAuctionType ==
                    auctionType.simpleSellerAuction ||
                    this.sessionInfo?.idAuctionType ==
                      auctionType.reverseWholesaleAuction ||
                    this.sessionInfo?.idAuctionType ==
                      auctionType.simpleBuyerAuction) &&
                  this.sessionInfo?.sessionStageId ==
                    sessionStage.transferAuctionCompleted &&
                  (this.sessionInfo.idSessionPeriod ==
                    IdSessionPeriods.pretrading ||
                    this.sessionInfo.idSessionPeriod ==
                      IdSessionPeriods.offersAdjustment) &&
                  (this.offerData.statusId == statusRegs.active ||
                    this.offerData.statusId == statusRegs.unactive)
                ),
              onItemClick: () => {
                this.editOfferWorker(
                  e.row.data.idDemandOffer,
                  e.row.data.directionId
                );
              },
            },
            {
              icon: './assets/img/icons/editOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.editPriceStep'
              ),
              disabled: this.chooseOffers?.length > 1,
              onItemClick: () => {
                this.onOpenEditPriceStep(
                  e.row.data.idDemandOffer,
                  e.row.data.directionId
                );
              },
            },
            {
              icon: e.row.data.isWatched
                ? './assets/img/icons/greenObserveOfferBigger.svg'
                : './assets/img/icons/observeOffer.svg',
              text: e.row.data.isWatched
                ? getTranslateResultByCurrentLang(
                    this.translate.store.currentLang,
                    'trading.offersTable.deleteFromObserved'
                  )
                : getTranslateResultByCurrentLang(
                    this.translate.store.currentLang,
                    'trading.offersTable.addToObserved'
                  ),
              disabled: this.disableObserved,
              onItemClick: () => {
                this.observeOffer(this.chooseOffers);
              },
            },
            {
              icon: './assets/img/icons/changesOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.showChanges'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                e.row.data.idDemandOfferParent == null,
              onItemClick: () => {
                this.onOpenCompareOffer(
                  e.row.data.idDemandOffer,
                  e.row.data.directionId
                );
              },
            },
            {
              icon: './assets/img/icons/tradingProgress.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.viewProgress'
              ),
              disabled: this.chooseOffers?.length > 1 || !this.user?.IsWorker,
              onItemClick: () => {
                const idAuctionType = this.store.idAuctionType();
                const auctionRootPath = getAuctionPath(idAuctionType);
                const url = this.router.serializeUrl(
                  this.router.createUrlTree(
                    [`auctions/${auctionRootPath}/main-page/bidding-process`],
                    {
                      queryParams: {
                        idSection: this.globalStore.mainSessionInfo().sectionId,
                        idSession: this.globalStore.mainSessionInfo().sessionId,
                        lotNumber: e.row.data.demandOfferInfo?.lotNumber,
                        idOffer: e.row.data.idDemandOffer,
                        sessionDate: this.sessionInfo?.datetimeBegin,
                        sessionName: this.sessionInfo?.sessionName,
                        auctionType: this.sessionInfo?.idAuctionType,
                      },
                    }
                  )
                );
                window.open(`${url}`, '_blank');
              },
            },
            {
              icon: './assets/img/icons/depositOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.viewDeposit'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                !this.offerData.isCanCalculateDeposit,
              onItemClick: () => {
                this.onOpenDepositOffer();
              },
            },
            {
              icon: './assets/img/icons/register.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.auctionsTab.register'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                !e.row.data.isExistCounterOffer,
              onItemClick: () => {
                this.isOpenedView = true;
                this.onOpenCounterOffer(
                  e.row.data.idDemandOffer,
                  e.row.data.directionId
                );
              },
            },
            {
              icon: './assets/img/icons/ruleEdit.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.auctionsTab.rulesForEditing'
              ),
              disabled: this.chooseOffers?.length > 1,
              onItemClick: () => {
                this.onOpenRulesForEditing(this.offerData);
              },
            }
          );
          if (this.cache.filters.statusOffers == statusOffersFilters.unactive) {
            e.items.push({
              icon: './assets/img/icons/restore.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.activateApplication'
              ),
              disabled:
                !this.privileges ||
                this.sessionInfo.sessionStageId !=
                  sessionStage.transferAuctionCompleted,
              onItemClick: () => {
                this.checkActivationMode('activate');
              },
            });
          }

          if (
            this.cache.filters.statusOffers == statusOffersFilters.active ||
            this.cache.filters.statusOffers == statusOffersFilters.unactive
          ) {
            e.items.push({
              icon: './assets/img/icons/rejectOffer.svg',
              template: `<div class="flexContent8 center font-s14 redColor"><i class="rejectOffer"></i><span>${getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.rejectApplication'
              )}</span></div>`,
              disabled:
                this.rejecteOfferWorker() ||
                !this.privileges ||
                this.sessionInfo.sessionStageId !=
                  sessionStage.transferAuctionCompleted,
              onItemClick: () => {
                this.onOpenRejectionOffer();
              },
            });
          }
          if (this.cache.filters.statusOffers == 1) {
            e.items.push({
              icon: './assets/img/icons/restore.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.restoreApplication'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                this.restoreOfferWorker() ||
                !this.privileges ||
                this.sessionInfo.sessionStageId !=
                  sessionStage.transferAuctionCompleted,
              onItemClick: () => {
                this.checkActivationMode('restore');
              },
            });
          }
        }
      } else {
        e.items.push(
          {
            icon: './assets/img/icons/viewOffer.svg',
            text: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.offersTable.viewApplication'
            ),
            disabled: this.chooseOffers?.length > 1,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenViewOffer(
                e.row.data.idDemandOffer
                  ? e.row.data.idDemandOffer
                  : e.row.data.idOffer,
                e.row.data.directionId,
                e.row.data.demoffOwner
                  ? e.row.data.demoffOwner.idTrader
                  : e.row.data.offerOwner.idTrader
              );
            },
          },
          {
            icon: './assets/img/icons/editOffer.svg',
            text: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.offersTable.editApplication'
            ),
            disabled: !this.directSession
              ? this.chooseOffers?.length > 1 ||
                !(
                  // this.offerData.directionId == IdDirection.sale &&
                  // (this.sessionInfo?.idAuctionType ==
                  //   auctionType.simpleSellerAuction ||
                  //   this.sessionInfo?.idAuctionType ==
                  //     auctionType.reverseWholesaleAuction) &&
                  (
                    this.sessionInfo?.sessionStageId ==
                      sessionStage.transferAuctionCompleted &&
                    ((this.sessionInfo.idSessionPeriod ==
                      IdSessionPeriods.pretrading &&
                      (this.offerData.statusId == statusRegs.active ||
                        this.offerData.statusId == statusRegs.unactive)) ||
                      (this.sessionInfo.idSessionPeriod ==
                        IdSessionPeriods.offersAdjustment &&
                        (this.offerData.statusId == statusRegs.active ||
                          (this.sessionInfo.idDemoffActivationMode ==
                            IdActivationMode.anyPeriod &&
                            this.offerData.statusId ==
                              statusRegs.unactive)))) &&
                    this.sessionInfo.isActive
                  )
                )
              : this.chooseOffers?.length > 1 ||
                !(
                  this.sessionInfo?.idSessionPeriod ==
                    IdSessionPeriods.direct &&
                  this.sessionInfo.isActive &&
                  [
                    statusDirectOffersFilters.backlogged,
                    statusDirectOffersFilters.reviewed,
                    5,
                  ].includes(this.offerData.statusId) &&
                  this.offerData.isMine
                ),
            onItemClick: () => {
              !this.directSession
                ? this.onEditOffer(
                    e.row.data.idDemandOffer,
                    e.row.data.directionId
                  )
                : this.editDirectOffer(e.row.data.idOffer);
            },
          },
          {
            icon: e.row.data.isWatched
              ? './assets/img/icons/greenObserveOfferBigger.svg'
              : './assets/img/icons/observeOffer.svg',
            text: e.row.data.isWatched
              ? getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'trading.offersTable.deleteFromObserved'
                )
              : getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'trading.offersTable.addToObserved'
                ),
            disabled: this.disableObserved,
            onItemClick: () => {
              !this.directSession
                ? this.observeOffer(this.chooseOffers)
                : this.observeDirectOffer(this.chooseOffers);
            },
          }
        );
        if (!this.directSession) {
          //обычная вкладка заявки
          e.items.push(
            {
              icon: './assets/img/icons/changesOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.showChanges'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                e.row.data.idDemandOfferParent == null,
              onItemClick: () => {
                this.onOpenCompareOffer(
                  e.row.data.idDemandOffer,
                  e.row.data.directionId
                );
              },
            },
            {
              icon: './assets/img/icons/depositOffer.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.offersTable.viewDeposit'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                !this.offerData.isCanCalculateDeposit,
              onItemClick: () => {
                this.onOpenDepositOffer();
              },
            },
            {
              icon: './assets/img/icons/register.svg',
              text: getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.auctionsTab.register'
              ),
              disabled:
                this.chooseOffers?.length > 1 ||
                !e.row.data.isExistCounterOffer,
              onItemClick: () => {
                this.isOpenedView = true;
                this.onOpenCounterOffer(
                  e.row.data.idDemandOffer,
                  e.row.data.directionId,
                  true
                );
              },
            }
          );
        }
        if (this.directSession) {
          // адресная сессия - меню для вкладки Адресные заявки
          e.items.push({
            icon: './assets/img/icons/rejectOffer.svg',
            disabled:
              this.chooseOffers?.length > 1 ||
              !this.sessionInfo.isActive ||
              ![
                statusDirectOffersFiltersTr.submitted,
                statusDirectOffersFiltersTr.reviewed,
                statusDirectOffersFiltersTr.rejectedBySystem,
                statusDirectOffersFiltersTr.rejectedInBid,
              ].includes(this.chooseOffers[0]?.statusId) ||
              !this.offerData.isMine,
            template: `<div class="flexContent8 center font-s14 redColor"><i class="rejectOffer"></i><span>${getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'btns.deleteApplication'
            )}</span></div>`,
            onItemClick: () => {
              this.onOpenDeleteOffer();
            },
          });
        }
      }
    }
  }

  public editOfferWorker(idOffer: number, direction: number): void {
    this.demandService.workerEditOffer(
      idOffer,
      this.sessionInfo,
      this.sessionIds,
      this.offerData.modelInfo.id,
      this.offerData.modelMarketTypes,
      direction
    );
  }

  editDirectOffer(idOffer) {
    this.demandService.editDirectOffer(
      idOffer,
      this.sessionInfo,
      this.sessionIds,
      this.offerData.modelInfo.id,
      this.offerData.modelMarketTypes
    );
  }

  rejecteOfferWorker() {
    let disabled = false;
    this.chooseOffers.forEach((item) => {
      if (!item.isCanReject) {
        disabled = true;
      }
    });
    return disabled;
  }

  restoreOfferWorker() {
    let disabled = false;
    this.chooseOffers.forEach((item) => {
      if (!item.isCanRestoreRejected) {
        disabled = true;
      }
    });
    return disabled;
  }

  //для тултипов
  onCellPrepared(e) {
    const container = document.createElement('div');
    e.cellElement.appendChild(container);
    //делаем тултип только для определенных ячеек
    if (
      e.rowType === 'data' &&
      ((e.column.dataField === 'demandOfferInfo.conditionsDelivery' &&
        e.data.goodInfo.isMultibasis == true) ||
        (e.column.dataField === 'prices' &&
          e.data.goodInfo.isPriceAdjusted == true))
    ) {
      new Tooltip(container, {
        target: e.cellElement,
        visible: false,
        showEvent: 'mouseenter',
        hideEvent: 'mouseleave click',
        contentTemplate: (content) => {
          if (e.column.dataField === 'demandOfferInfo.conditionsDelivery') {
            let multipleLot = getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'filters.multibasisLot'
            );

            this.currentTemplateTooltip =
              multipleLot +
              '<br>' +
              e.data.demandOfferInfo.concatedConditionsDelivery;
          }
          if (e.column.dataField === 'prices') {
            this.currentTemplateTooltip = getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'general.adjustablePrice'
            );
          }
          const label = document.createElement('div');
          label.innerHTML = this.currentTemplateTooltip;
          content.appendChild(label);
        },
      });
    }
  }

  onOpenViewOffer(idOffer: number, idDirection: number, idTrader) {
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    if (!this.directSession) {
      //неадресная заявка
      this.demandService
        .getDemandOfferFullInfo(
          this.user?.token,
          idDirection,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          idOffer,
          1,
          displayCurrency
        )
        .subscribe((res) => {
          this.fullInfo = res;
          let dataForReq = Object.assign(this.sessionInfo, this.sessionIds, {
            idTrader: idTrader,
          });
          this.openType = 'viewOfferFromOffers';
          this.popupSidebarService.onShowPopupSidebar({
            dataForReq: dataForReq,
            type: 'viewOfferFromOffers',
            idOffer: idOffer,
            idDirection: idDirection,
            fullInfo: this.fullInfo,
            isMine: !this.user?.IsWorker,
            directSession: this.directSession,
          });
        });
    } else {
      //адресная заявка
      this.targetedService
        .getOfferFullInfo(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          idOffer,
          displayCurrency
        )
        .subscribe((res) => {
          this.fullInfo = res;
          let dataForReq = Object.assign(this.sessionInfo, this.sessionIds, {
            idTrader: idTrader,
          });
          this.openType = 'viewOfferFromOffers';

          this.popupSidebarService.onShowPopupSidebar({
            dataForReq: dataForReq,
            type: 'viewOfferFromOffers',
            idOffer: idOffer,
            fullInfo: this.fullInfo,
            isMine: this.user?.IsWorker
              ? false
              : this.fullInfo?.genaralInfo?.isMine,
            directSession: this.directSession,
          });
        });
    }
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
          idDirection === IdDirection.sale
            ? getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'editOffer.editingSalesRequest'
              )
            : getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'editOffer.editingPurchaseOrders'
              );

        const lotLabel: string = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.offersTable.lot'
        );
        let name: string = `${editingWithDirection}: ${lotLabel} №${this.offerData.demandOfferInfo?.lotNumber}`;

        let dataForReq = Object.assign(
          { name: name },
          this.sessionInfo,
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
      });
  }

  onOpenRulesForEditing(offerData) {
    this.openType = 'rulesForEditing';
    this.popupSidebarService.onShowPopupSidebar({
      type: 'rulesForEditing',
      fullInfo: offerData,
      dataForReq: {
        sectionId: this.sessionIds?.sectionId,
        sessionId: this.sessionIds?.sessionId,
      },
    });
  }

  fullInfoParent: any;

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
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        idOffer,
        1,
        displayCurrency
      )
      .subscribe((res) => {
        this.fullInfo = res;

        if (this.fullInfo.generalInfo?.idDemandOfferParent) {
          this.demandService
            .getDemandOfferFullInfo(
              this.user?.token,
              idDirection,
              this.sessionIds.sectionId,
              this.sessionIds.sessionId,
              this.fullInfo.generalInfo?.idDemandOfferParent,
              1,
              displayCurrency
            )
            .subscribe((res) => {
              this.fullInfoParent = res;
              let dataForReq = Object.assign(this.sessionInfo, this.sessionIds);
              this.openType = 'compareOffer';
              this.popupSidebarService.onShowPopupSidebar({
                dataForReq: dataForReq,
                type: 'compareOffer',
                idOffer: idOffer,
                idDirection: idDirection,
                fullInfo: this.fullInfo,
                fullInfoParent: this.fullInfoParent,
              });
            });
        } else {
          this.toastService.onShowToast({
            message: 'Нет родительской заявки',
            type: 'error',
          });
        }
      });
  }

  onOpenDepositOffer() {
    this.depositRowData = Object.assign(this.chooseOffers[0], this.sessionIds);
    this.depositPopup = true;
  }

  closeDepositPopup(event) {
    this.depositPopup = event;
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
        this.chooseOffers.filter((el) => el.directionId == IdDirection.sale)
          ?.length,
        this.chooseOffers.filter((el) => el.directionId == IdDirection.buy)
          ?.length
      )
      .then((res: any) => {
        if (res.isCanBeActivated && type === 'restore') {
          this.popupIsActivatedTransferToBids = true;
        } else this.checkAdmissionProcessed(type);
      });
  }

  // todo refactor to avoid subscribe inside subscribe
  // выполнялась ли процедура допуска и получение его параметров если выполнялась
  public checkAdmissionProcessed(type: string): void {
    this.accessService
      .isAdmissionProcessed(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId
      )
      .subscribe((res) => {
        if (res == true) {
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

  restoreOffer() {
    if (!this.directSession) {
      //неадресная заявка
      const body = {
        idDirection: this.chooseOffers[0].directionId,
        idSection: this.sessionIds.sectionId,
        idSession: this.sessionIds.sessionId,
        idDemandOffer: this.chooseOffers[0].idDemandOffer,
        isControlViolations: true,
        isControlDeposit: true,
        isLockDeposit: true,
      };

      this.demandService
        .restoreRejected(this.user?.token, body)
        .subscribe(() => {
          this.isVisibleToast = true;
          const translations = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.offersTable.offerRestoreMess'
          );
          const translateMessage = (
            template: string,
            params: { [key: string]: any }
          ) => {
            return template.replace(
              /{{\s*([^{}\s]*)\s*}}/g,
              (_, key) => params[key] ?? ''
            );
          };
          this.message = translateMessage(translations, {
            lotNumber: this.chooseOffers[0].demandOfferInfo.lotNumber,
          });
        });
    } else {
      const body = {
        idSection: this.sessionIds.sectionId,
        idSession: this.sessionIds.sessionId,
        idOffer: this.chooseOffers[0].idOffer,
      };

      this.targetedService
        .offersBuceRestoreReject(this.user?.token, body)
        .subscribe((res) => {
          this.isVisibleToast = true;
          const translations = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.offersTable.offerRestoreMess'
          );
          const translateMessage = (
            template: string,
            params: { [key: string]: any }
          ) => {
            return template.replace(
              /{{\s*([^{}\s]*)\s*}}/g,
              (_, key) => params[key] ?? ''
            );
          };
          this.message = translateMessage(translations, {
            lotNumber: this.chooseOffers[0].offerInfo.lotNumber,
          });
        });
    }
  }

  private activateOffer(): void {
    this.resultPopup = false;
    this.resultData = null;
    let demandOfferIds = this.chooseOffers.map((offer) => offer.idDemandOffer);
    const body = {
      idDirection: this.chooseOffers[0].directionId,
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      demandOfferIds: demandOfferIds,
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
          this.dataRefreshService.triggerRefresh();
        }
      });
  }

  closeRestorePopup(event) {
    this.restorePopup = event;
  }

  public observeOffer(data: DemandOffer[]): void {
    const context = {
      user: this.user,
      sessionIds: this.sessionIds,
      cache: this.cache,
      isOpenedView: this.isOpenedView,
      currentLang: this.translate.store.currentLang,
      popupSidebarService: this.popupSidebarService,
      filterOffersWorker: () => this.filterOffersWorker(),
      filterOffers: () => this.filterOffers(),
      showToast: (msg: string) => {
        this.isVisibleToast = true;
        this.message = msg;
      }
    };

    this.observeOffersService.observeOffer(data, context, 'demand').subscribe(() => {
      this.dataGridRef.instance.clearSelection();
      this.chooseOffers = [];
      this.selectedRows = [];
      this.onSelectionChanged({ selectedRowsData: [] });
      this.cdr.detectChanges();
    });
  }

  public observeDirectOffer(data: TargetedOffer[]): void {
    const context = {
      user: this.user,
      sessionIds: this.sessionIds,
      cache: this.cache,
      isOpenedView: this.isOpenedView,
      currentLang: this.translate.store.currentLang,
      popupSidebarService: this.popupSidebarService,
      filterDirectOffersWorker: () => this.filterDirectOffersWorker(),
      filterDirectOffers: () => this.filterDirectOffers(),
      showToast: (msg: string) => {
        this.isVisibleToast = true;
        this.message = msg;
      }
    };

    this.observeOffersService.observeOffer(data, context, 'direct').subscribe(() => {
      this.dataGridRef.instance.clearSelection();
      this.chooseOffers = [];
      this.selectedRows = [];
      this.onSelectionChanged({ selectedRowsData: [] });
      this.cdr.detectChanges();
    });
  }

  updateWatchedOffer(data: any) {
    // обновляем признак наблюдаемости, если отметили на форме просмотра
    if (this.directSession) {
      this.displayOffers.find((el) => el.idOffer == data[0]).isWatched =
        data[1] == 'delete' ? false : true;
    } else {
      this.displayOffers.find((el) => el.idDemandOffer == data[0]).isWatched =
        data[1] == 'delete' ? false : true;
    }
  }

  infoForPriceStep: any = [];
  editPriceStepPopup: boolean = false;

  onOpenEditPriceStep(idOffer: number, idDirection: number) {
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
        1,
        displayCurrency
      )
      .subscribe((res) => {
        this.fullInfo = res;
        this.infoForPriceStep = {
          idDemandOffer: idOffer,
          idDirection: idDirection,
          pricingTypeId: this.fullInfo.generalInfo.pricingTypeId,
          deliveryConditions: this.fullInfo.deliveryConditions,
          goods: this.fullInfo.goods,
          currencyPrecision: this.chooseOffers[0].priceParams.currencyPrecision,
          volumePrecision: this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 1
          ).fieldPrecision,
          quoteCurrencyPrecision:
            this.chooseOffers[0].priceParams.currencyPrecision || null,
        };

        this.editPriceStepService.prepareDeliveryConditions(
          this.infoForPriceStep,
          this.chooseOffers[0].priceParams.vatPercent
        );

        this.editPriceStepPopup = true;
      });
  }

  closeEditPriceStepPopup(event) {
    this.editPriceStepPopup = event;
    this.getData();
  }

  costVatBasis(priceWithoutVat, vatBasis, volume) {
    let vat;
    if (vatBasis.fieldValueNumber != 1) {
      vat = Number(vatBasis.fieldValue.replace(/[^0-9]/g, ''));
    } else vat = 0;
    return (
      round(volume * priceWithoutVat, 2) +
      round((volume * priceWithoutVat * vat) / 100, 2)
    );
  }

  onOpenCounterOffer(idOffer: number, idDirection: number, isMine?) {
    //владельцу заявки показываем в валюте заявки вне зав-сти от фильтра
    let displayCurrency =
      this.cache?.filters?.displayCurrency && !isMine
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
        displayCurrency,
        isMine
      )
      .subscribe((res) => {
        this.fullInfo = res;
        let dataForReq = Object.assign(this.sessionInfo, this.sessionIds);
        this.openType = 'counterOffers';
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'counterOffers',
          idOffer: idOffer,
          idDirection: idDirection,
          fullInfo: Object.assign(this.fullInfo, {
            filterIdCurrency: displayCurrency,
          }),
          isMine: isMine ? isMine : false,
        });
      });
  }

  reviewOffers() {
    let listOffers = this.chooseOffers.map((item) => item.idOffer);
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      listOffers: listOffers,
    };

    this.targetedService
      .offersBuceMarkChecked(this.user?.token, body)
      .subscribe((res) => {
        if (res) {
          this.isVisibleToast = true;

          const translations = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.directOffersTab.reviewOffersMess'
          );
          const translateMessage = (
            template: string,
            params: { [key: string]: any }
          ) => {
            return template.replace(
              /{{\s*([^{}\s]*)\s*}}/g,
              (_, key) => params[key] ?? ''
            );
          };
          this.message = translateMessage(translations, {
            numberProcessed: res.numberProcessed ? res.numberProcessed : 0,
            all: this.chooseOffers?.length,
          });
        }
      });
  }

  backlogOffers() {
    let listOffers = this.chooseOffers.map((item) => item.idOffer);
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      listOffers: listOffers,
    };

    this.targetedService
      .offersBuceRevokeChecked(this.user?.token, body)
      .subscribe((res) => {
        if (res) {
          this.isVisibleToast = true;
          const translations = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.directOffersTab.backlogOffersMess'
          );
          const translateMessage = (
            template: string,
            params: { [key: string]: any }
          ) => {
            return template.replace(
              /{{\s*([^{}\s]*)\s*}}/g,
              (_, key) => params[key] ?? ''
            );
          };

          /*  //todo посмотреть перенос
        const translateMessage = (template, params) => {
        const message = template.replace(/{{\s*([^{}\s]*)\s*}}/g, (_, key) => params[key] || '');
        return message.replace(/\n/g, '<br>');
      }; */

          this.message = translateMessage(translations, {
            numberProcessed: res.numberProcessed ? res.numberProcessed : 0,
            all: this.chooseOffers?.length,
          });
        }
      });
  }

  onOpenApproveOffer() {
    this.approvePopup = true;
  }

  closeApprovePopup(event) {
    this.approvePopup = event;
  }

  onOpenDeleteOffer() {
    this.deletePopup = true;
  }

  closeDeletePopup(event) {
    this.deletePopup = event;
  }

  volumeDynamicFields: any;
  volumeData;

  checkVolumeType() {
    //проверяем какой контроль установлен на объем

    // 0 общий (отчет со статичным набором полей)
    // 1 по котировальным позициям (отчет с динамическим набором полей)
    // 2 без контроля

    this.targetedService
      .getAdTimberVolume(this.user?.token, this.sessionIds.sessionId)
      .subscribe((res) => {
        this.volumeType = res.typeVolumeControl;
        if (this.volumeType == 0) {
          this.volumeData = res.commonVolumes.volumes;
          this.volumeData.forEach((v) => {
            v.volumeApprove = v.volumeAvailable - v.volumeRemaining;
          });
          this.volumePopup = true;
        }
        if (this.volumeType == 1) {
          this.volumeData = res.quotePosVolumes.volumes;
          this.volumeDynamicFields = res.quotePosVolumes.fields;
          this.volumeData.forEach((v) => {
            v.volumeApprove = v.volumeAvailable - v.volumeRemaining;
          });
          this.volumePopup = true;
        }
        if (this.volumeType == 2) {
          this.isVisibleToast = true;
          this.message = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.directOffersTab.noVolumeType'
          );
        }
      });
  }

  closeVolumePopup(event) {
    this.volumePopup = event;
  }

  onFocusedRowChanged(e) {
    const focusedRowData = e.row?.data;

    if (this.isOpenedView) {
      if (this.focusChangedTimer) {
        clearTimeout(this.focusChangedTimer);
      }

      this.focusChangedTimer = setTimeout(() => {
        if (focusedRowData)
          this.onOpenViewOffer(
            focusedRowData.idDemandOffer
              ? focusedRowData.idDemandOffer
              : focusedRowData.idOffer,
            focusedRowData.directionId,
            focusedRowData.demoffOwner?.idTrader
              ? focusedRowData.demoffOwner.idTrader
              : focusedRowData.offerOwner.idTrader
          );
      }, 500);
    }
  }

  public hideCompositeLot(isHiddenLotVisible: boolean): void {
    this.loadingVisible = true;
    this.isHiddenLot = isHiddenLotVisible;
    this.lastAppliedHiddenLotColumns = null;

    if (this.isHiddenLotCheckboxVisible) {
      this.localStorageService.setItemToLocalStorage(
        OFFERS_HIDDEN_LOT_STATE_KEY,
        isHiddenLotVisible
      );
    }

    this.scheduleHiddenLotColumnVisibilityForClick();
  }

  public onShown(): void {
    setTimeout(() => {
      this.loadingVisible = false;
    }, 2000);
  }

  recalcPriceStep() {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
    };

    this.traderService
      .bucePeriodsUpdatePriceStep(this.user?.token, body)
      .subscribe(() => {
        let message = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.auctionsTab.recalcPriceStepMess'
        );
        this.toastService.onShowToast({ message: message, type: 'success' });
        this.getData();
      });
  }

  //-------------------------для фильтрации в таблице-------------------
  orderHeaderFilterName(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }
      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.goodName],
          value: el.goodName,
          text: el.goodName,
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  orderHeaderFilterDesc(data) {
    let searchQuery = '';
    data.dataSource.load = function (options) {
      if (options && options?.filter) {
        let filterValue;
        if (options?.filter?.length == 1) {
          filterValue = options?.filter?.find(
            (el) => Array.isArray(el) && !el.find((a) => a.columnIndex)
          )?.[2];
        } else {
          filterValue = options?.filter?.find(
            (el) =>
              Array.isArray(el) &&
              Array.isArray(el[0]) &&
              !el[0].find((a) => a.columnIndex)
          )?.[0]?.[2];
        }
        searchQuery = filterValue || '';
      } else {
        searchQuery = '';
      }
    };

    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }

      const emptyLabel: string = getEmptyFilterLabel(
        this.translate.store.currentLang
      );
      const results: FilterOption[] = this.offers.reduce((acc: FilterOption[], item: any): FilterOption[] => {
        const goodsItems: FilterOption[] = item.goods?.map((el: any): FilterOption =>
          mapDescriptionToFilterOption(
            el.goodDescription,
            emptyLabel
          )
        );
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];

      if (searchQuery) {
        uniqueResult = uniqueResult.filter((item: FilterOption): boolean =>
          matchesHeaderFilterSearch(item, searchQuery)
        );
      }

      return uniqueResult;
    };
  }

  orderHeaderFilterVol(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }
      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [setPrecision(el.goodVolume, VOLUME_PRECISION)],
          value: setPrecision(el.goodVolume, VOLUME_PRECISION),
          text: setPrecision(el.goodVolume, VOLUME_PRECISION),
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  orderHeaderFilterUnits(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }
      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.goodUnitName],
          value: el.goodUnitName,
          text: el.goodUnitName,
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  orderHeaderFilterPrice(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }
      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [
            setPrecision(
              el.priceWithoutVat,
              item.priceParams.currencyPrecision
            ),
          ],
          value: setPrecision(
            el.priceWithoutVat,
            item.priceParams.currencyPrecision
          ),
          text: setPrecision(
            el.priceWithoutVat,
            item.priceParams.currencyPrecision
          ),
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  orderHeaderFilterPriceStep(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }
      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [setPrecision(el.priceStep, item.priceParams.currencyPrecision)],
          value: setPrecision(el.priceStep, item.priceParams.currencyPrecision),
          text: setPrecision(el.priceStep, item.priceParams.currencyPrecision),
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  orderHeaderFilterAmountVAT(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }
      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [setPrecision(el.vatAmount, item.priceParams.currencyPrecision)],
          value: setPrecision(el.vatAmount, item.priceParams.currencyPrecision),
          text: setPrecision(el.vatAmount, item.priceParams.currencyPrecision),
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  orderHeaderFilterTotalAmount(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }

      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [
            setPrecision(el.totalAmount, item.priceParams.currencyPrecision),
          ],
          value: setPrecision(
            el.totalAmount,
            item.priceParams.currencyPrecision
          ),
          text: setPrecision(
            el.totalAmount,
            item.priceParams.currencyPrecision
          ),
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  orderHeaderFilterAmendment(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }

      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [
            setPrecision(
              el.priceAdjustment,
              item.priceParams.currencyPrecision
            ),
          ],
          value: setPrecision(
            el.priceAdjustment,
            item.priceParams.currencyPrecision
          ),
          text: setPrecision(
            el.priceAdjustment,
            item.priceParams.currencyPrecision
          ),
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  orderHeaderFilterQuotation(data) {
    data.dataSource.postProcess = () => {
      if (!this.offers?.length) {
        return [];
      }
      const results = this.offers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [
            setPrecision(el.quotationValue, item.priceParams.currencyPrecision),
          ],
          value: setPrecision(
            el.quotationValue,
            item.priceParams.currencyPrecision
          ),
          text: setPrecision(
            el.quotationValue,
            item.priceParams.currencyPrecision
          ),
        }));
        return [...acc, ...goodsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  public orderHeaderFilterContractType(data: any): void {
    data.dataSource.postProcess = (results: any): FilterOption[] => {
      results.length = 0;
      const currentLang: string = this.translate.store.currentLang;

      this.offers.forEach((item: any): void => {
        const contractType: number | null = item.demoffOwner.clientContractType;
        results.push(mapContractTypeToFilterOption(contractType, currentLang));
      });

      return this.getUniqueResults(results);
    };
  }

  //для фильтрации в таблице
  calculateFilterExpression(value, selectedFilterOperations, target) {
    const column = this as any;
    if (
      target === 'headerFilter' ||
      target === 'filterBuilder' ||
      target === 'search'
    ) {
      return [column.dataField, 'contains', value];
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  public calculateFilterExpressionDesc(
    filterValue: string | null,
    selectedFilterOperations: string,
    target: string
  ): unknown {
    const column = this as any;

    if (
      target === 'headerFilter' ||
      target === 'filterBuilder' ||
      target === 'search'
    ) {
      return createArrayFieldHeaderFilterExpression(
        column.dataField,
        filterValue
      );
    }

    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  public calculateFilterExpressionContract = (
    value: unknown,
    selectedFilterOperation: string | null,
    target: string
  ): unknown => createContractTypeHeaderFilterExpression('demoffOwner.clientContractType', value);

  /*              фильтрация динамических колонок                */
  getDataSourceDynFilter(idFieild) {
    let hasNonEmptyValues = false;
    let results = [];
    this.offers.forEach((item) => {
      item.goods.forEach((el) => {
        if (el.dynamicFields[idFieild.toString()]) {
          let actualDimentionValue = this.commonService.actualDimensions(
            el.dynamicFields[idFieild.toString()],
            0
          );

          results.push({
            key: [el.dynamicFields[idFieild.toString()]],
            value: el.dynamicFields[idFieild.toString()],
            text: ACTUAL_SIZE_FIELDS.includes(Number(idFieild))
              ? actualDimentionValue
              : el.dynamicFields[idFieild.toString()],
          });
        } else {
          hasNonEmptyValues = true;
        }
      });
    });

    // Добавляем отдельную запись для пустых значений
    if (hasNonEmptyValues) {
      results.unshift({
        key: [null],
        value: null,
        text: getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'filters.empty'
        ),
      });
    }

    return this.getUniqueResults(results);
  }

  private getUniqueResults(results: FilterOption[]): FilterOption[] {
    return [...new Map(results.map((item) => [item['value'], item])).values()];
  }

  // TODO fix this method
  calculateFilterExpressionDynamic(filterValue: string) {
    const column = this as any;
    return function (data: { [key: string]: any }): boolean {
      const fieldValue = data[column.dataField];
      return Array.isArray(fieldValue) && fieldValue.includes(filterValue);
    };
  }

  private handleIntermediateTransfer(): void {
    this.directSession ? this.getDirectData() : this.getData();
  }

  private updateFiltersComponent(): void {
    if (this.filtersComponent) {
      this.filtersComponent.offersGroupByStatus = this.offersGroupByStatus;
      this.directFilterId =
        this.filtersComponent.filtersForm.get('statusDirectOffers')?.value;
    }
  }

  private restoreHiddenLotStateFromLocalStorage(): void {
    if (!this.isHiddenLotCheckboxVisible) {
      return;
    }

    const isHiddenLot = this.localStorageService.getItemFromLocalStorage(
      OFFERS_HIDDEN_LOT_STATE_KEY
    );

    if (typeof isHiddenLot === 'boolean') {
      this.isHiddenLot = isHiddenLot;
    }
  }

  private setFiltersFromLocalStorage(): void {
    this.restoreHiddenLotStateFromLocalStorage();
  }

  private scheduleHiddenLotColumnVisibilityForClick(): void {
    if (this.hiddenLotRafId) {
      cancelAnimationFrame(this.hiddenLotRafId);
    }

    this.hiddenLotRafId = requestAnimationFrame(() => {
      this.ngZone.runOutsideAngular(() => {
        this.runHiddenLotColumnVisibilityUpdate();
      });
    });
  }

  private runHiddenLotColumnVisibilityUpdate(): void {
    this.lastAppliedHiddenLotColumns = applyHiddenLotGridColumnsVisibility(
      this.dataGridRef?.instance,
      {
        mode: this.hiddenLotDisplayMode,
        extendedFields: this.hideLotColumnFields,
        workerFields: this.hideLotWorkerColumnFields,
        isWorker: this.user?.IsWorker,
        dynamicFields: this.dynamicFields,
        minimalVisibleFields: this.minimalVisibleLotFields,
        lastApplied: this.lastAppliedHiddenLotColumns,
      }
    );
  }

  private loadRawGridState(): DxGridState | null {
    return this.localStorageService.getItemFromLocalStorage<DxGridState>(
      this.modeGridStateKey
    );
  }
}
