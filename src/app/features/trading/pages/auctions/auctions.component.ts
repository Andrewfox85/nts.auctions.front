import { AnalogListResponse } from './../../../../services/counter-service/shared/interfaces/index';
import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  ViewChild,
  ChangeDetectorRef,
  inject,
  OnChanges,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import {
  DxDataGridModule,
  DxTooltipModule,
  DxToastModule,
  DxPopupModule,
} from 'devextreme-angular';
import {
  auctionType,
  numberEntriesPage,
  sessionStage,
  IdDirection,
  IdSessionPeriods,
  AUCTIONS_SESSION_STORAGE_KEY,
  AUCTIONS_HIDDEN_LOT_STATE_KEY,
  VOLUME_PRECISION,
  AgreementType,
  ACTUAL_SIZE_FIELDS,
  pricingType,
  PRICE_ADJUSTMENT_TYPE,
  DEFAULT_COLUMN_CHOOSER_POSITION,
  IdInterfaceField, POPUP_SIDEBAR_TYPE
} from '@constants';
import { User, PageCache } from '@classes';
import {
  CommonService,
  TradingService,
  PopupSidebarService,
  ToastService,
  DemandService,
  AuctionsService,
  TraderService,
  GeneralService,
  TransactionService,
  CounterService,
  AppConfigService,
  ObserveOffersService,
  DemandOffer,
  EditPriceStepService
} from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import RU from '@ru-translate';
import EN from '@en-translate';
import { BehaviorSubject, firstValueFrom, interval } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { DxDataGridComponent } from 'devextreme-angular';
import Tooltip from 'devextreme/ui/tooltip';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  EditPriceStepPopupComponent,
  RejectionOfferPopupComponent,
  DepositPopupComponent,
} from '@components';
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
import {
  FormatTimePipe,
  SubstringFromPipe,
  ActualDimensionsPipe,
  ToNumberPipe,
  RuNumberFormatPipe,
} from '@pipes';
import dxDataGrid, {
  RowPreparedEvent,
  CellPreparedEvent,
} from 'devextreme/ui/data_grid';
import { ApiStore, GlobalStore } from '@store';
import { ID_DIRECTION_TRADER_ROLE } from '@enums';
import { DxGridContextMenuLocalizationDirective } from '../../../../shared/directives';
import { IdActivationMode } from './../../../../shared/constants/api.constants';
import { CheckBoxComponent } from '../../../../shared/components/check-box/check-box.component';
import { SessionStorageService, LocalStorageService } from '@shared-services';
import { DxGridState, FilterOption, IApiDataSection } from '@interfaces';
import { setPrecision } from './../../../../helpers/common';
import { GetTradingListResponse, DemandOfferList, DemandOfferGood } from './../../../../services/auctions-service/shared/interfaces/index';
import { PositionConfig } from 'devextreme/common/core/animation';
import {
  applyHiddenLotGridColumnsVisibility,
  HIDDEN_LOT_EXTENDED_FIELDS,
  HIDDEN_LOT_MINIMAL_VISIBLE_FIELDS,
  HiddenLotDisplayMode,
  isHiddenLotCheckboxVisible,
  resolveHiddenLotDisplayMode
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

@Component({
  selector: 'app-auctions',
  standalone: true,
  imports: [
    DxDataGridModule,
    DxTooltipModule,
    DxToastModule,
    DxPopupModule,
    CommonModule,
    TranslateModule,
    EditPriceStepPopupComponent,
    RejectionOfferPopupComponent,
    DepositPopupComponent,
    FiltersComponent,
    CheckBoxComponent,
    FormatTimePipe,
    SubstringFromPipe,
    ActualDimensionsPipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './auctions.component.html',
  styleUrls: ['./auctions.component.scss'],
})
export class AuctionsComponent implements OnInit, OnChanges, AfterViewInit {
  private readonly demandService = inject(DemandService);
  private readonly auctionsService = inject(AuctionsService);
  private readonly traderService = inject(TraderService);
  private readonly generalService = inject(GeneralService);
  private readonly transactionService = inject(TransactionService);
  private readonly popupSidebarService = inject(PopupSidebarService);
  private readonly counterService = inject(CounterService);
  private readonly tradingService = inject(TradingService);
  private readonly commonService = inject(CommonService);
  private readonly translate = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly observeOffersService = inject(ObserveOffersService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone: NgZone = inject(NgZone);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly config = inject(AppConfigService);
  private readonly apiStore = inject(ApiStore);
  private readonly editPriceStepService = inject(EditPriceStepService);

  @Input() sessionIds;
  @Input() sessionInfo;
  @Input() tabIndex: string;
  @Input() isAdmissionFinished: boolean;
  @Input() idDirectionRole: number | null;

  @ViewChild(FiltersComponent)
  public filtersComponent: FiltersComponent;

  @ViewChild('dataGridRef')
  public dataGridRef: DxDataGridComponent;

  public user: User;
  cache = {} as PageCache;
  numberEntriesPage = numberEntriesPage;
  currentTimeDate: Date;
  privileges: boolean = false;
  offers: any;
  displayOffers: any = [];
  dynamicFields: any = [];
  serverTime: number; //серверное время, на которое было начато получение данных
  selectedRows = [];
  chooseOffers = [];

  isOpenSidebar = false;
  disableObserved: boolean = false;
  fullInfo: any = [];

  idOffer: number;
  offerData: any;

  depositPopup: boolean = false;
  depositRowData: any;
  rejectionPopup: boolean = false;

  isVisibleToast = false;
  messageToast: string = ' ';
  focusedRowKey: any;
  subscriptions: [] = [];
  openType: string; //какого формата открыто окно
  isOpenedView: boolean = false; //для переключения формы просмотра по клавишам

  popupSubmission: boolean = false;

  loadingVisible: boolean = false; //лодер
  isHiddenLot: boolean = true;

  infoForPriceStep: any = [];
  editPriceStepPopup: boolean = false;

  public focusChangedTimer;

  public analogList: AnalogListResponse;

  public currentTemplateTooltip: string;

  private readonly hideLotColumnFields: readonly string[] = HIDDEN_LOT_EXTENDED_FIELDS;
  private readonly hideLotWorkerColumnFields: readonly string[] = [TableDataField.PriceSteps];
  private readonly minimalVisibleLotFields: readonly string[] = HIDDEN_LOT_MINIMAL_VISIBLE_FIELDS;
  private lastAppliedHiddenLotColumns: HiddenLotDisplayMode | null = null;
  private hiddenLotRafId: number = 0;
  private readonly sessionInfoSubject: BehaviorSubject<ISessionStateConfig> =
    new BehaviorSubject<ISessionStateConfig>(null);

  private readonly store = inject(HomePageStore);
  private readonly globalStore = inject(GlobalStore);

  public readonly auctionType = auctionType;
  public readonly IdSessionPeriods = IdSessionPeriods;
  public readonly VOLUME_PRECISION = VOLUME_PRECISION;
  public readonly AgreementType = AgreementType;
  public readonly pricingType = pricingType;
  public readonly PRICE_ADJUSTMENT_TYPE = PRICE_ADJUSTMENT_TYPE;
  public readonly TableDataField = TableDataField;
  public readonly HiddenLotDisplayMode = HiddenLotDisplayMode;

  public readonly columnChooserPosition: PositionConfig = DEFAULT_COLUMN_CHOOSER_POSITION;

  public stateStoringEnabled: boolean = true;

  private pendingHiddenLotApplyAfterStateLoad: boolean = false;

  public readonly loadGridState = (): Promise<DxGridState | null> => {
    this.pendingHiddenLotApplyAfterStateLoad = true;

    return firstValueFrom(
      this.sessionInfoSubject.pipe(
        filter((sessionInfo: ISessionStateConfig | null): boolean => Boolean(sessionInfo)),
        take(1),
        map((sessionInfo: ISessionStateConfig): DxGridState | null =>
          sanitizeTradingGridStateFromLs(
            this.loadRawGridState(),
            sessionInfo?.idCompositeLotAvailability
          )
        )
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

  public get stateKey(): string {
    return TradingGridStatePage.Auctions;
  }

  public get modeGridStateKey(): string {
    return buildTradingGridStateKey(
      TradingGridStatePage.Auctions,
      this.hiddenLotDisplayMode,
      this.stateKey
    );
  }

  get filtersOn(): Record<string, string> {
    const baseFilters = {
      hideFilters: 'hideFilters',
      displayCurrency: 'displayCurrency',
      internal: 'internal',
      external: 'external',
      export: 'export',
      import: 'import',
      bidding: 'bidding',
      observed: 'observed',
      corrected: 'corrected',
      counter: 'counter',
      priceAdjustment: 'priceAdjustment',
      multibasis: 'multibasis',
      simpleLot: 'simpleLot',
      compositeLot: 'compositeLot',
    };

    const workerFilters = this.user?.IsWorker
      ? { individualPriceStep: 'individualPriceStep' }
      : { isMine: 'isMine' };

    const analogFilters = this.sessionInfo.isAllowedAnalogues
      ? {
          counterAnalogs: 'counterAnalogs',
          reviewedAnalogs: 'reviewedAnalogs',
          unreviewedAnalogs: 'unreviewedAnalogs',
        }
      : {};

    return {
      ...baseFilters,
      ...workerFilters,
      ...analogFilters,
    };
  }

  get infoText(): string {
    return getGridInfoText(this.translate.store.currentLang, this.offers?.length);
  }

  constructor() {
    this.orderHeaderFilterName = this.orderHeaderFilterName.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterDesc = this.orderHeaderFilterDesc.bind(this);
    this.orderHeaderFilterVol = this.orderHeaderFilterVol.bind(this);
    this.orderHeaderFilterUnits = this.orderHeaderFilterUnits.bind(this);
    this.orderHeaderFilterPrice = this.orderHeaderFilterPrice.bind(this);
    this.orderHeaderFilterPriceStep = this.orderHeaderFilterPriceStep.bind(this);
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

  public ngOnInit(): void {
    const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();

    let sectionDescription: string = sectionsArray.find(
      (el: IApiDataSection): boolean => Number(el.id) === Number(this.sessionIds.sectionId)
    )?.description;

    sectionDescription = 'TradingEditItem' + sectionDescription;

    this.privileges = this.commonService.checkPrivileges(sectionDescription);

    this.restoreHiddenLotStateFromLocalStorage();
    this.getData(); //запрашиваем данные только первый раз - остальные разы по сокетам лиюо по допуску (баг 18 от 24/02/2025)
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.user = this.localStorageService.getUser() as User;
    this.cache =
      this.sessionStorageService.getItemFromSessionStorage(
        AUCTIONS_SESSION_STORAGE_KEY
      ) || ({} as PageCache);

    if (changes['tabIndex'] && changes['tabIndex'].currentValue === 'trading') {
      //this.getData();
      this.focusedRowKey = this.displayOffers[0]?.demandOfferInfo?.lotNumber;
    }
    if (
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue
    ) {
      this.getData();
    }

    if (changes['sessionInfo']) {
      this.sessionInfoSubject.next(changes['sessionInfo'].currentValue ?? null);

      if (this.tabIndex == 'trading') {
        //передаем информацию на выезжающее окно
        if (
          this.offerData &&
          (this.openType == 'submitBidToBuy' ||
            this.openType == 'submitCounterOffers' ||
            this.openType == 'counterOffers' ||
            this.openType == 'editOffer' ||
            this.openType == 'analogList' ||
            this.openType == 'viewOfferFromAuctions')
        )
          this.popupSidebarService.submitBidToBuyUpdate(
            { ...this.sessionInfo, ...this.sessionIds }
          );
      }
      if (!this.sessionInfo.isActive) {
        //поставили на паузу
        this.subscriptions?.every((el: any) => el?.unsubscribe());
      }
      //стартанули период торгов и подведения итогов
      if (
        changes['sessionInfo'].currentValue.isActive &&
        (changes['sessionInfo'].currentValue.idSessionPeriod == 2 ||
          changes['sessionInfo'].currentValue.idSessionPeriod == 4) &&
        changes['sessionInfo'].previousValue &&
        !changes['sessionInfo'].previousValue.isActive
      ) {
        this.offers.forEach((item) => {
          if (item.bidDateFinish || item.bidDateFinish != null) {
            let bidDateFinish =
              Number(new Date().getTime() / 1000) + Number(item.bidDateFinish); //дата и время в секундах прибавляем до завершения в секундах (время в секундах в которое должен завершиться период)
            const name = item.idDemandOffer + '';
            this.subscriptions[name] = interval(1000).subscribe(() => {
              if (item.bidDateFinish != 10800 && this.sessionInfo.isActive)
                item.bidDateFinish = (
                  bidDateFinish -
                  new Date().getTime() / 1000
                ).toFixed(0);
              //предварительное время завершения отнимаем текущее время (все в секундах)
              else {
                this.subscriptions[name]?.unsubscribe();
              }
            });
          }
        });
      }
      //переключили период не на торги - убираем таймер
      if (
        !(
          changes['sessionInfo'].currentValue.idSessionPeriod == 2 ||
          changes['sessionInfo'].currentValue.idSessionPeriod == 4
        ) ||
        changes['sessionInfo'].currentValue.isFinished
      ) {
        this.offers?.forEach((item) => {
          item.bidDateFinish = null;
        });
      }

      //стартанули период подведения итогов
      if (
        changes['sessionInfo'].currentValue.isActive &&
        changes['sessionInfo'].currentValue.idSessionPeriod == 4 &&
        this.offers
      ) {
        this.offers.forEach((item) => {
          item.isExistCounterOffer = false;
        });
      }
    }
    this.popupSidebarService.close$.subscribe((res: any) => {
      //инфа о закрытии попап окна
      this.isOpenedView = res;
      this.openType = null;
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

  public ngAfterViewInit(): void {
    this.setFiltersFromLocalStorage();
  }

  async getData() {
    let gridState: dxDataGrid<any, any>;

    // Сброс кэша, нужно заново применить настройки по скрытым колонкам после загрузки данных
    this.lastAppliedHiddenLotColumns = null;
    this.currentTimeDate = new Date();
    this.sessionStorageService.setItemToSessionStorage(
      AUCTIONS_SESSION_STORAGE_KEY,
      this.cache
    );

    if (this.user.IsWorker) {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : ' ';
      this.auctionsService
        .buceGetListTradingWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          displayCurrency
        )
        .subscribe((res) => {
          this.offers = res.demandOffers;

          this.serverTime = res.serverTime;

          this.dynamicFields = res.fields;

          const savedState: DxGridState = this.loadRawGridState();

          if (savedState) {
            this.dynamicFields.forEach((field) => {
              const savedColumn = savedState.columns.find(
                (c) => c.dataField === field.fieldName
              );

              if (savedState && field.visible) {
                field.visible = savedColumn.visible;
              } else {
                field.visible = true;
              }
            });
          }

          if (this.dataGridRef && this.dataGridRef.instance) {
            gridState = this.dataGridRef.instance.state();

          //  this.dataGridRef.instance.state(gridState);
          }

          this.offers.sort((a, b) => {
            return a.demandOfferInfo.lotNumber - b.demandOfferInfo.lotNumber;
          });

          this.onStartBidTimer();
          if (
            this.sessionInfo.isActive &&
            this.sessionInfo.idSessionPeriod == IdSessionPeriods.tradingAndResult
          ) {
            //при старте периода подведения итогов обновляю грид и убираю встречки
            this.offers?.forEach((item) => {
              item.isExistCounterOffer = false;
            });
          }

          this.setOffersForFilter(gridState);

          this.displayOffers = this.offers;

          if (this.cache.filters) {
            this.filterOffersWorker();
          }

          this.lastAppliedHiddenLotColumns = null;
          this.scheduleHiddenLotColumnVisibilityForClick();
        });
    } else {
      let displayCurrency = this.cache?.filters?.displayCurrency
        ? this.cache?.filters?.displayCurrency == -1
          ? ''
          : this.cache?.filters?.displayCurrency
        : ' ';

      this.auctionsService
        .getListTrading(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          displayCurrency
        )
        .subscribe((res) => {
          this.offers = res.demandOffers;
          this.serverTime = res.serverTime;
          this.dynamicFields = res.fields;
          this.offers.sort((a, b) => {
            return a.demandOfferInfo.lotNumber - b.demandOfferInfo.lotNumber;
          });

          this.displayOffers = this.offers;

          //у трейдера отображается только одна динамическая колонка Место назначения
          if (
            [SECTIONS_TYPES.AGRI, SECTIONS_TYPES.PERSPECTIVE].includes(
              Number(this.sessionIds.sectionId)
            )
          ) {
            this.dynamicFields = res.fields
              .filter(el => Number(el.fieldName) === IdInterfaceField.destination);
          }


          this.onStartBidTimer();
          if (
            this.sessionInfo.isActive &&
            this.sessionInfo.idSessionPeriod == 4
          ) {
            //при старте периода подведения итогов обновляю грид и убираю встречки
            this.offers?.forEach((item) => {
              item.isExistCounterOffer = false;
            });
          }

          if (this.cache.filters) {
            this.filterOffers();
          }

          this.setOffersForFilter();

          this.lastAppliedHiddenLotColumns = null;
          this.scheduleHiddenLotColumnVisibilityForClick();
        });
      // })
    }
  }

  public setOffersForFilter(gridState?): void {
    this.offers.forEach((item, index) => {
      let names = item.goods.map((x) => x.goodName); //создаю массив имен и добавляю в объект для фильтрации
      item['names'] = names.toString();

      let desc = item.goods.map((x) => x.goodDescription);
      item['desc'] = desc;

      let vol = item.goods.map((x) => setPrecision(x.goodVolume, VOLUME_PRECISION));
      item['vol'] = vol;

      let units = item.goods.map((x) => x.goodUnitName);
      item['units'] = units;

      let prices = item.goods.map((x) => setPrecision(x.priceWithoutVat, item.priceParams.currencyPrecision));
      item['prices'] = prices;

      if(this.user?.IsWorker) {
        let priceSteps = item.goods.map((x) => setPrecision(x.priceStep, item.priceParams.currencyPrecision));
        item['priceSteps'] = priceSteps;
      }

      let amountVAT = item.goods.map((x) => setPrecision(x.vatAmount, item.priceParams.currencyPrecision));
      item['amountVAT'] = amountVAT;

      let totalAmount = item.goods.map((x) => setPrecision(x.totalAmount, item.priceParams.currencyPrecision));
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

      if(this.user?.IsWorker) {
        this.dynamicFields.forEach((dyn) => {
          let dynamic = item.goods.map(
            (x) => x.dynamicFields[dyn.fieldName.toString()]
          );
          item[dyn.fieldName] = dynamic;
        });
      }
    });
    if(this.user?.IsWorker) {
      requestIdleCallback(() => {
        if (this.dataGridRef && this.dataGridRef.instance && gridState) {
          this.dataGridRef.instance.state(gridState);
        }
      });
      return;
    }
  }

  onStartBidTimer() {
    this.subscriptions?.every((el: any) => el?.unsubscribe());
    if (!this.sessionInfo.isActive) {
      //отнять от времени планируемого заключения сделки время, на которое было начато получение данных
      this.offers.forEach((item) => {
        if (item.bidDateFinish || item.bidDateFinish != null) {
          item.bidDateFinish =
            typeof item.bidDateFinish === 'string'
              ? item.bidDateFinish
              : ((item.bidDateFinish - this.serverTime) * 86400).toFixed(0);
        }
      });
    } else {
      /*  -получить текущее серверное время;
          -отнять от времени планируемого заключения сделки текущее время.*/
      this.generalService.getServerDatetime().subscribe((t) => {
        //получаем серверное время
        let time = t;
        this.offers.forEach((item) => {
          if (item.bidDateFinish || item.bidDateFinish != null) {
            item.bidDateFinish =
              typeof item.bidDateFinish === 'string'
                ? item.bidDateFinish
                : Math.floor((item.bidDateFinish - time) * 86400); //превращаем double в секунды
            let bidDateFinish =
              new Date().getTime() / 1000 + Number(item.bidDateFinish); // - 10800 дата и время в секундах прибавляем до завершения в секундах (время в секундах в которое должен завершиться период) - 3часа

            const name = item.idDemandOffer + '';
            this.subscriptions[name] = interval(1000).subscribe(() => {
              if (item.bidDateFinish != 10800 && this.sessionInfo.isActive)
                item.bidDateFinish = (
                  bidDateFinish -
                  new Date().getTime() / 1000
                ).toFixed(0);
              //предварительное время завершения отнимаем текущее время (все в секундах)
              else {
                this.subscriptions[name]?.unsubscribe();
              }
            });
          }
        });
      });
    }
  }

  // todo avoid subscribe inside subscribe
  getDemandsOffersTradingUpdateStatus(data) {
    let find = this.offers.find((el) => el.idDemandOffer == data.idDemandOffer);
    if (find) {
      this.auctionsService
        .tradingGetUpdateMaster(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          data.idDemandOffer
        )
        .subscribe((res) => {
          const name = data.idDemandOffer + ''; //todo
          this.subscriptions[name]?.unsubscribe();
          find.bidNumberOfBidders = res.info[0].bidNumberOfBidders;
          find.bidIsMyLeading = res.info[0].bidIsMyLeading;
          find.isExistCounterOffer = res.info[0].isExistCounterOffer;
          let offerBidDateFinish = res.info[0].bidDateFinish;
          if (offerBidDateFinish) {
            if (!this.sessionInfo.isActive) {
              //отнять от времени планируемого заключения сделки время, на которое было начато получение данных
              offerBidDateFinish = Number(
                ((offerBidDateFinish - res.serverTime) * 86400).toFixed(0)
              );
            } else {
              /*  получить текущее серверное время;
                отнять от времени планируемого заключения сделки текущее время.*/
              this.generalService.getServerDatetime().subscribe((t) => {
                //получаем серверное время
                if (!res.info[0].isExistCounterOffer) {
                  let time = t;
                  offerBidDateFinish = Math.floor(
                    (offerBidDateFinish - time) * 86400
                  ); //превращаем double в секунды
                  let bidDateFinish =
                    new Date().getTime() / 1000 + offerBidDateFinish; //дата и время в секундах прибавляем до завершения в секундах (время в секундах в которое должен завершиться период) - 3часа

                  this.subscriptions[name] = interval(1000).subscribe(() => {
                    if (
                      find.bidDateFinish != 10800 &&
                      this.sessionInfo.isActive
                    )
                      find.bidDateFinish = (
                        bidDateFinish -
                        new Date().getTime() / 1000
                      ).toFixed(0);
                    //предварительное время завершения отнимаем текущее время (все в секундах)
                    else {
                      this.subscriptions[name]?.unsubscribe();
                    }
                  });
                }
              });
            }
          } else {
            find.bidDateFinish = null;
          }
        });
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
          find.goods.forEach((good) => {
            let detail = res.goodDetails.find(
              (el) => el.idDemandOfferGood == good.idDemandOfferGood
            );

            if (detail) {
              good.lotSummaryPriceWithoutVat =
                detail.summaryLot.lotSummaryPriceWithoutVat;
              good.lotSummaryVatAmount = detail.summaryLot.lotSummaryVatAmount;
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
        });

      if (this.offerData?.idDemandOffer == data.idDemandOffer) {
        if (this.openType == 'submitBidToBuy') {
          this.onOpenSubmitBidToBuy(
            data.idDemandOffer,
            data.idDirection,
            this.offerData?.isAllowAnalogs,
            this.offerData?.isAvailableAnalogList,
          );
          this.toastService.onShowToast({
            message:
              this.translate.store.currentLang == 'RU'
                ? RU['general'].updateOfferData
                : EN['general'].updateOfferData,
            type: 'success',
          });
        }

        if (this.openType == 'viewOfferFromAuctions') {
          this.onOpenViewOffer(
            data.idDemandOffer,
            data.idDirection,
            find.idTrader,
            find.isMine,
            find.isAllowAnalogs,
            find.isAvailableAnalogList
          );
          this.toastService.onShowToast({
            message:
              this.translate.store.currentLang == 'RU'
                ? RU['general'].updateOfferData
                : EN['general'].updateOfferData,
            type: 'success',
          });
        }

        //закрыть форму подробного встречек заявки с одним из указанных идентификаторов
        if (this.openType == 'counterOffers') {
          this.popupSidebarService.onClosePopupSideBar();
          this.toastService.onShowToast({
            message:
              this.translate.store.currentLang == 'RU'
                ? RU['counterOffers'].noCountersMess
                : EN['counterOffers'].noCountersMess,
            type: 'success',
          });
        }

        if (
          this.openType == 'submitCounterOffers' &&
          this.offerData?.isExistCounterOffer
        ) {
          this.popupSidebarService.onClosePopupSideBar();
          this.toastService.onShowToast({
            message:
              this.translate.store.currentLang == 'RU'
                ? RU['counterOffers'].newStatus
                : EN['counterOffers'].newStatus,
            type: 'success',
          });
        }
      }
    }
  }

  getDemandsOffersTradingReinstate(data) {
    //редактирование: приходят 2 или 3 ид (первый - старая заявка ее удаляем из таблицы, второй - обновленная заявка, третий - остатки)
    //let index = this.offers.findIndex(el => el.idDemandOffer == data.idDemandOffer)
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    let demandsOffers;
    data.demandsOffers?.length == 1
      ? (demandsOffers = [data.demandsOffers[0]])
      : data.demandsOffers?.length == 2
      ? (demandsOffers = [data.demandsOffers[1]])
      : (demandsOffers = [data.demandsOffers[1], data.demandsOffers[2]]);

    this.subscriptions?.every((el: any) => el?.unsubscribe());

    if (this.user?.IsWorker) {
      this.auctionsService
        .buceGetTradingWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          demandsOffers,
          displayCurrency
        )
        .subscribe((res) => {
          this.processTradingResponse(res, data.demandsOffers);
        });
    } else {
      this.auctionsService
        .getTrading(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          demandsOffers,
          displayCurrency
        )
        .subscribe((res) => {
          this.processTradingResponse(res, data.demandsOffers);
        });
    }

    if (this.idOffer === data.demandsOffers[0]) {
      this.idOffer = data.demandsOffers[1];
      if (this.openType === 'viewOfferFromAuctions') {
        this.onOpenViewOffer(
          data.demandsOffers[1],
          this.offerData.directionId,
          this.offerData.demoffOwner.idTrader,
          this.offerData.isMine
        );
      }

      if (this.openType === 'counterOffers') {
        this.onOpenCounterOffer(
          data.demandsOffers[1],
          this.offerData.directionId,
          this.offerData.isAllowAnalogs,
          this.offerData?.isAvailableAnalogList,
          this.offerData.isMine,
          true
        );
      }
    }
  }

  private processTradingResponse(
    res: GetTradingListResponse,
    demandsOffersIds: number[]
  ): void {
    /* пришел 1 ид оффера - удаляем из таблицы, добавляем новый (по возрастанию номера лота)
        пришло 2 ид оффера - заменяем в таблице
        пришло 3 ид - заменяем первый на второй, третий вниз добавляем в конец */

    if (demandsOffersIds?.length === 1) {
      const lotNumberUpdatedOffer: number = res.demandOffers[0].demandOfferInfo?.lotNumber;
      const newOffer: DemandOfferList = res.demandOffers[0];

      // находим индекс первого элемента, у которого lotNumber больше
      const index = this.offers.findIndex((app) => {
        const currentLot = app.demandOfferInfo?.lotNumber;
        return currentLot > lotNumberUpdatedOffer;
      });

      if (index === -1) {
        //eсли не нашли элемент больше нашего - пушим в конец
        this.offers.push(newOffer);
      } else {
        //вставляем на нужную позицию
        this.offers.splice(index, 0, newOffer);
      }
    } else {
      res.demandOffers.forEach((offer) => {
        if (offer.idDemandOffer !== demandsOffersIds[1]) {
          //если пришла инфа по остаткам
          this.offers.push(offer);
        } else {
          //заменяем старую заявку на новую
          let index = this.offers.findIndex(
            (el) => el.idDemandOffer === demandsOffersIds[0]
          );
          if (index !== -1) {
            this.offers[index] = offer;

            if (offer?.isAvailableAnalogList) { //обновляем сообщение на форме списка ТА
              this.popupSidebarService.updateAnalogListStatus(offer.isAvailableAnalogList)
            }

          } else {
            this.offers.push(offer);
          }
        }
      });
    }

    this.serverTime = res.serverTime;
    this.dynamicFields = res.fields;
    this.displayOffers = this.offers;

    this.onStartBidTimer();

    if (this.cache.filters) {
      this.user?.IsWorker ? this.filterOffersWorker() : this.filterOffers();
    }

    const gridState = this.dataGridRef?.instance.state();
    this.setOffersForFilter(gridState);
  }

  getDemandsOffersTradingExclude(data) {
    // удалить из грида заявки с указанными идентификаторами
    data.demandsOffers.forEach((id) => {
      let index = this.offers.findIndex((el) => el.idDemandOffer == id);
      if (index != -1) {
        const name = id + '';
        this.subscriptions[name]?.unsubscribe();
        this.offers.splice(index, 1);
      }
      this.displayOffers = this.offers;
      if (this.cache.filters) {
        this.user.IsWorker ? this.filterOffersWorker() : this.filterOffers();
      }
      //закрыть форму подробного просмотра (?) заявки с одним из указанных идентификаторов
      if (this.isOpenedView && this.offerData?.idDemandOffer == id) {
        this.popupSidebarService.onClosePopupSideBar();

        /*todo я не знаю что за конкретное действие произошло (отклонение/сделка заключена или другое)
        const errors = {
          error: true,
          errorStatus: 0,
          messageError: this.translate.store.currentLang == 'RU' ? RU["errors"].appRejectByEmployeeInAuction : EN["errors"].appRejectByEmployeeInAuction
        }
        this.errorServiceService.callErrorPopup(errors);*/
      }
    });
  }

  filterOffersWorker() {
    this.displayOffers = this.offers?.filter((i) => {
      const internalMarket =
        !this.cache.filters.internal || i.modelInfo.isSupportMarketDomestic;
      const externalMarket =
        !this.cache.filters.external || i.modelInfo.isSupportMarketForeign;
      const exportMarket =
        !this.cache.filters.export || i.modelInfo.isSupportMarketExport;
      const importMarket =
        !this.cache.filters.import || i.modelInfo.isSupportMarketImport;
      const bidding = this.cache.filters.bidding
        ? i.bidDateFinish != null
        : true;
      const counter = this.cache.filters.counter ? i.isExistCounterOffer : true;
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

      const counterAnalogs = this.cache.filters.counterAnalogs
        ? i.isExistCounterOffer && i.isAllowAnalogs
        : true;

      const reviewedAnalogs = this.cache.filters.reviewedAnalogs
        ? i.isAvailableAnalogList
        : true;

      const unreviewedAnalogs = this.cache.filters.unreviewedAnalogs
        ? i.isAvailableAnalogList === false
        : true;

      return (
        internalMarket &&
        externalMarket &&
        exportMarket &&
        importMarket &&
        bidding &&
        counter &&
        observed &&
        multibasis &&
        corrected &&
        priceAdjustment &&
        simpleLot &&
        compositeLot &&
        individualPriceStep &&
        counterAnalogs &&
        reviewedAnalogs &&
        unreviewedAnalogs
      );
    });
  }

  filterOffers() {
    this.displayOffers = this.offers?.filter((i) => {
      const internalMarket =
        !this.cache.filters.internal || i.modelInfo.isSupportMarketDomestic;
      const externalMarket =
        !this.cache.filters.external || i.modelInfo.isSupportMarketForeign;
      const exportMarket =
        !this.cache.filters.export || i.modelInfo.isSupportMarketExport;
      const importMarket =
        !this.cache.filters.import || i.modelInfo.isSupportMarketImport;

      const isMine = this.cache.filters.isMine ? i.isMine : true;
      const bidding = this.cache.filters.bidding
        ? i.bidDateFinish != null
        : true;
      const counter = this.cache.filters.counter ? i.isExistCounterOffer : true;
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

      const counterAnalogs = this.cache.filters.counterAnalogs
        ? i.isExistCounterOffer && i.isAllowAnalogs
        : true;

      const reviewedAnalogs = this.cache.filters.reviewedAnalogs
        ? i.isAvailableAnalogList
        : true;

      const unreviewedAnalogs = this.cache.filters.unreviewedAnalogs
        ? i.isAvailableAnalogList === false
        : true;

      return (
        internalMarket &&
        externalMarket &&
        exportMarket &&
        importMarket &&
        isMine &&
        bidding &&
        counter &&
        observed &&
        multibasis &&
        corrected &&
        priceAdjustment &&
        simpleLot &&
        compositeLot &&
        counterAnalogs &&
        reviewedAnalogs &&
        unreviewedAnalogs
      );
    });
  }

  public getFilterData(e: any): void {
    this.cache.filters = e;

    this.sessionStorageService.setItemToSessionStorage(
      AUCTIONS_SESSION_STORAGE_KEY,
      this.cache
    );

    if (this.filtersComponent?.changedCurrency) {
      //перезапрашиваем данные если изменили валюту
      this.getData();
    } else {
      this.user?.IsWorker ? this.filterOffersWorker() : this.filterOffers();
    }
  }

  onRowPrepared(e: RowPreparedEvent) {
    if (e.rowType === 'data') {
      if (e.data.isMine) {
        e.rowElement.classList.add('mine-row');
        e.rowElement.style.setProperty('color', 'green', 'important');
        e.rowElement.style.setProperty('font-weight', '500', 'important');
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

  onContextMenuPreparing(e) {
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
        e.items.push(
          {
            icon: './assets/img/icons/viewOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.viewApplication'),
            disabled: this.chooseOffers?.length > 1,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenViewOffer(
                e.row.data.idDemandOffer,
                e.row.data.directionId,
                e.row.data.demoffOwner.idTrader,
                e.row.data.isMine,
                e.row.data.isAllowAnalogs,
                e.row.data.isAvailableAnalogList
              );
            },
          },
          {
            icon: './assets/img/icons/editOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.editApplication'),
            disabled:
              this.chooseOffers?.length > 1 ||
              !(
                (this.sessionInfo?.idAuctionType ===
                  auctionType.simpleSellerAuction ||
                  this.sessionInfo?.idAuctionType ===
                    auctionType.reverseWholesaleAuction ||
                  this.sessionInfo?.idAuctionType ===
                    auctionType.simpleBuyerAuction) &&
                this.sessionInfo?.sessionStageId ===
                  sessionStage.transferAuctionCompleted &&
                (this.sessionInfo.idSessionPeriod === 1 ||
                  this.sessionInfo.idSessionPeriod === 3)
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
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.editPriceStep'),
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
              ? getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.deleteFromObserved')
              : getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.addToObserved'),
            disabled: this.disableObserved,
            onItemClick: () => {
              this.observeOffer(this.chooseOffers);
            },
          },
          {
            icon: './assets/img/icons/changesOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.showChanges'),
            disabled:
              this.chooseOffers?.length > 1 ||
              e.row.data.idDemandOfferParent == null,
            onItemClick: () => {
              this.onOpenCompareOffer(
                e.row.data.idDemandOffer,
                e.row.data.directionId,
                e.row.data.isMine
              );
            },
          },
          {
            icon: './assets/img/icons/tradingProgress.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.viewProgress'),
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
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.viewDeposit'),
            disabled:
              this.chooseOffers?.length > 1 ||
              !e.row.data.isCanCalculateDeposit,
            onItemClick: () => {
              this.onOpenDepositOffer();
            },
          },
          {
            icon: './assets/img/icons/register.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.auctionsTab.register'),
            disabled:
              this.chooseOffers?.length > 1 || !e.row.data.isExistCounterOffer,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenCounterOffer(
                e.row.data.idDemandOffer,
                e.row.data.directionId,
                e.row.data.isAllowAnalogs,
                e.row.data.isAvailableAnalogList,
              );
            },
          },
          {
            icon: './assets/img/icons/ruleEdit.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.auctionsTab.rulesForEditing'),
            disabled: this.chooseOffers?.length > 1,
            onItemClick: () => {
              this.onOpenRulesForEditing(this.offerData);
            },
          },
          {
            icon: './assets/img/icons/rejectOffer.svg',
            template: `<div class="flexContent8 center font-s14 redColor"><i class="rejectOffer"></i><span>${getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.offersTable.rejectApplication'
            )}</span></div>`,
            disabled:
              !e.row.data.isCanReject ||
              !this.privileges ||
              this.sessionInfo.sessionStageId != 7 ||
              e.row.data.bidDateFinish,
            onItemClick: () => {
              this.onOpenRejectionOffer();
            },
          }
        );
        if (this.sessionInfo.isAllowedAnalogues) {
          e.items.push({
            icon: './assets/img/icons/analogsList.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'analogsList.viewList'),
            disabled:
              this.chooseOffers?.length > 1 ||
              this.sessionInfo.idSessionPeriod == IdSessionPeriods.pretrading ||
              !e.row.data.isAllowAnalogs ||
               e.row.data.isAvailableAnalogList === null,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenAnalogList(
                e.row.data.idDemandOffer,
                e.row.data.demandOfferInfo.lotNumber,
                e.row.data.isMine,
                e.row.data.isAvailableAnalogList
              );
            },
          });
        }
      } else {
        //трейдер
        e.items.push(
          {
            icon: './assets/img/icons/viewOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.viewApplication'),
            disabled: this.chooseOffers?.length > 1,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenViewOffer(
                e.row.data.idDemandOffer,
                e.row.data.directionId,
                e.row.data.demoffOwner.idTrader,
                e.row.data.isMine,
                e.row.data.isAllowAnalogs,
                e.row.data.isAvailableAnalogList
              );
            },
          },
          {
            icon: './assets/img/icons/editOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.editApplication'),
            disabled:
              this.chooseOffers?.length > 1 ||
              !(
                (this.sessionInfo?.idAuctionType ===
                  auctionType.simpleSellerAuction ||
                  this.sessionInfo?.idAuctionType ===
                    auctionType.reverseWholesaleAuction ||
                  this.sessionInfo?.idAuctionType ===
                    auctionType.simpleBuyerAuction) &&
                this.sessionInfo?.sessionStageId ===
                  sessionStage.transferAuctionCompleted &&
                (this.sessionInfo.idSessionPeriod === 1 ||
                  this.sessionInfo.idSessionPeriod === 3) &&
                this.sessionInfo.isActive &&
                this.offerData.isMine
              ),
            onItemClick: () => {
              this.onEditOffer(
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
              ? getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.deleteFromObserved')
              : getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.addToObserved'),
            disabled: this.disableObserved,
            onItemClick: () => {
              this.observeOffer(this.chooseOffers);
            },
          },
          {
            icon: './assets/img/icons/changesOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.showChanges'),
            disabled:
              this.chooseOffers?.length > 1 ||
              e.row.data.idDemandOfferParent == null,
            onItemClick: () => {
              this.onOpenCompareOffer(
                e.row.data.idDemandOffer,
                e.row.data.directionId,
                e.row.data.isMine
              );
            },
          },
          {
            icon: './assets/img/icons/depositOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.viewDeposit'),
            disabled:
              this.chooseOffers?.length > 1 ||
              !e.row.data.isCanCalculateDeposit,
            onItemClick: () => {
              this.onOpenDepositOffer();
            },
          },
          {
            icon: './assets/img/icons/submitBid.svg',
            text: this.isSimpleBuyerAuction
              ? getTranslateResultByCurrentLang(this.translate.store.currentLang, 'btns.apply')
              : getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.auctionsTab.submitBidToBuy'),
            disabled:
              this.chooseOffers?.length > 1 ||
              !(
                this.sessionInfo.isActive &&
                [
                  IdSessionPeriods.trading,
                  IdSessionPeriods.tradingAndResult,
                ].includes(this.sessionInfo.idSessionPeriod)
              ) ||
              e.row.data.isMine ||
              this.getRoleToAction,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenSubmitBidToBuy(
                e.row.data.idDemandOffer,
                e.row.data.directionId,
                e.row.data.isAllowAnalogs,
                e.row.data.isAvailableAnalogList,
              );
            },
          },
          {
            icon: './assets/img/icons/counteroffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.auctionsTab.sendСounteroffer'),
            disabled:
              this.chooseOffers?.length > 1 ||
              !(
                this.sessionInfo.isActive &&
                this.sessionInfo.idSessionPeriod == IdSessionPeriods.trading
              ) ||
              this.getRoleToAction ||
              e.row.data.isMine ||
              e.row.data.bidDateFinish,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenSubmitCounterOffer(
                e.row.data.idDemandOffer,
                e.row.data.directionId,
                e.row.data.isAllowAnalogs
              );
            },
          },
          {
            icon: './assets/img/icons/register.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.auctionsTab.register'),
            disabled:
              this.chooseOffers?.length > 1 || !e.row.data.isExistCounterOffer,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenCounterOffer(
                e.row.data.idDemandOffer,
                e.row.data.directionId,
                e.row.data.isAllowAnalogs,
                e.row.data.isAvailableAnalogList,
                e.row.data.isMine,
              );
            },
          }
        );
        if (this.sessionInfo.isAllowedAnalogues) {
          e.items.push({
            icon: './assets/img/icons/analogsList.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'analogsList.viewList'),
            disabled:
              this.chooseOffers?.length > 1 ||
              this.sessionInfo.idSessionPeriod == IdSessionPeriods.pretrading ||
              !e.row.data.isAllowAnalogs ||
              e.row.data.isAvailableAnalogList === null,
            onItemClick: () => {
              this.isOpenedView = true;
              this.onOpenAnalogList(
                e.row.data.idDemandOffer,
                e.row.data.demandOfferInfo.lotNumber,
                e.row.data.isMine,
                e.row.data.isAvailableAnalogList
              );
            },
          });
        }
      }
    }
  }

  get getRoleToAction(): boolean {
    return (
      (this.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.SALE) ||
      (this.sessionInfo?.idAuctionType === auctionType.simpleBuyerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.PURCHASE)
    );
  }

  get isSimpleBuyerAuction(): boolean {
    return this.sessionInfo?.idAuctionType === auctionType.simpleBuyerAuction;
  }

  get isTradingPeriod(): boolean {
    return [
      IdSessionPeriods.trading,
      IdSessionPeriods.tradingAndResult,
    ].includes(this.sessionInfo?.idSessionPeriod);
  }

  get showFixDealsButton(): boolean {
    return (
      this.user?.IsWorker &&
      this.isTradingPeriod &&
      !this.sessionInfo?.isFinished
    );
  }

  get showRecalcPriceStepButton(): boolean {
    return (
      this.user?.IsWorker &&
      (this.sessionInfo?.idSessionPeriod === IdSessionPeriods.pretrading ||
        this.sessionInfo?.idSessionPeriod === IdSessionPeriods.offersAdjustment) &&
      this.sessionInfo?.idPricingType === pricingType.price
    );
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

  public showBidButton(isMine: boolean): boolean {
    return (
      this.sessionInfo &&
      !this.user?.IsWorker &&
      !isMine &&
      this.isTradingPeriod &&
      !this.getRoleToAction
    );
  }

  //для тултипов
  public onCellPrepared(e: CellPreparedEvent): void {
    if (e.rowType === 'data') {
      if (e.data.isMine) {
        e.cellElement.classList.add('mine-cell');
      }
    }
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

  public onOpenViewOffer(
    idOffer: number,
    idDirection: number,
    idTrader: number,
    isMine: boolean,
    isAllowAnalog: boolean = false,
    isAvailableAnalogList: boolean = false
  ): void {

    const IsNeedOriginalVat: boolean = this.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction &&
      idDirection === IdDirection.sale &&
      this.user?.userInfo.isResident;

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
        2,
        displayCurrency,
        IsNeedOriginalVat
      )
      .subscribe((res) => {
        this.fullInfo = res;
        let dataForReq = Object.assign(this.sessionInfo, this.sessionIds, {
          idTrader: idTrader,
        });
        this.openType = 'viewOfferFromAuctions';
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'viewOfferFromAuctions',
          idOffer: idOffer,
          idDirection: idDirection,
          fullInfo: this.fullInfo,
          isMine: isMine,
          IdDirectionRole: this.idDirectionRole,
          isAllowAnalog: isAllowAnalog,
          isAvailableAnalogList: isAvailableAnalogList
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

  onOpenSubmitCounterOffer(
    idOffer: number,
    idDirection: number,
    isAllowAnalog: boolean
  ) {
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
        2,
        displayCurrency
      )
      .subscribe((res) => {
        this.fullInfo = res;
        let dataForReq = Object.assign(this.sessionInfo, this.sessionIds);
        this.openType = 'submitCounterOffers';
        this.globalStore.setSessionInfo(this.sessionInfo);
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'submitCounterOffers',
          idOffer: idOffer,
          idDirection: idDirection,
          fullInfo: Object.assign(this.fullInfo, {
            filterIdCurrency: displayCurrency,
          }),
          isAllowAnalog: isAllowAnalog,
        });
      });
  }

  public onOpenCounterOffer(idOffer: number, idDirection: number, isAllowAnalog: boolean, isAvailableAnalogList: boolean, isMine?, isUpdate?): void {
    //владельцу заявки показываем в валюте заявки вне зав-сти от фильтра (в повышении)
    //в понижении фильтр валюты не влияет совсем (на форме встречек есть собственный фильтр валюты)
    let displayCurrency: string = '';

    if (
      this.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction &&
      this.cache?.filters?.displayCurrency &&
      !isMine
    ) {
      displayCurrency =
        Number(this.cache?.filters?.displayCurrency) === -1
          ? ''
          : this.cache?.filters?.displayCurrency;
    }

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
        if (isUpdate) {
          this.popupSidebarService.counterOfferInfoUpdate({
            dataForReq: dataForReq,
            idOffer: idOffer,
            fullInfo: Object.assign(this.fullInfo, {
              filterIdCurrency: displayCurrency,
              currencyPrecision:
                this.chooseOffers[0].priceParams.currencyPrecision,
            }),
          });
        } else {
          this.openType = 'counterOffers';
          this.popupSidebarService.onShowPopupSidebar({
            dataForReq: dataForReq,
            type: 'counterOffers',
            idOffer: idOffer,
            idDirection: idDirection,
            fullInfo: Object.assign(this.fullInfo, {
              filterIdCurrency: displayCurrency,
              currencyPrecision:
                this.chooseOffers[0].priceParams.currencyPrecision,
            }),
            isMine: !!isMine,
            isFilterCounter: this.cache?.filters?.counter,
            isAllowAnalog: isAllowAnalog,
            isAvailableAnalogList: isAvailableAnalogList,
            IdDirectionRole: this.idDirectionRole,
          });
        }
      });
  }

  public onOpenAnalogList(
    idDemand: number,
    lotNumber: number,
    isMine: boolean,
    isAvailableAnalogList: boolean
  ): void {
    this.counterService
      .getListDemandAnalogTradeInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        idDemand
      )
      .subscribe((res) => {
        this.analogList = res;
        let dataForReq = { ...this.sessionInfo, ...this.sessionIds };

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
            IdDirection.buy,
            this.sessionIds.sectionId,
            this.sessionIds.sessionId,
            idDemand,
            IdActivationMode.anyPeriod,
            displayCurrency
          )
          .subscribe((res) => {
            this.fullInfo = res;

            this.openType = 'analogList';
            this.popupSidebarService.onShowPopupSidebar({
              dataForReq: dataForReq,
              type: 'analogList',
              idOffer: idDemand,
              fullInfo: this.fullInfo,
              analogList: this.analogList,
              isAvailableAnalogList: isAvailableAnalogList,
              lotNumber: lotNumber,
              isMine: isMine,
              roleToAction: this.getRoleToAction,
            });
          });
      });
  }

  fullInfoParent: any;

  public onOpenCompareOffer(idOffer: number, idDirection: number, isMine: boolean): void {
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
        2,
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
              2,
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
                isMine: isMine
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
        this.messageToast = msg;
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

  updateWatchedOffer(data: any) {
    // обновляем признак наблюдаемости, если отметили на форме просмотра
    this.displayOffers.find((el) => el.idDemandOffer == data[0]).isWatched =
      data[1] == 'delete' ? false : true;
  }

  public onOpenSubmitBidToBuy(
    idOffer: number,
    idDirection: number,
    isAllowAnalog?: boolean,
    isAvailableAnalogList?: boolean
  ): void {
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
        2,
        displayCurrency
      )
      .subscribe((res) => {
        this.fullInfo = res;
        let dataForReq = Object.assign(this.sessionInfo, this.sessionIds);
        this.openType = 'submitBidToBuy';
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'submitBidToBuy',
          idOffer: idOffer,
          idDirection: idDirection,
          fullInfo: Object.assign(this.fullInfo, {
            filterIdCurrency: displayCurrency,
          }),
          isAllowAnalog: isAllowAnalog,
          isAvailableAnalogList: isAvailableAnalogList
        });
      });
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

  onEditOffer(idOffer, idDirection) {
    this.demandService
      .getDemandOfferFullInfo(
        this.user?.token,
        idDirection,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        idOffer,
        2,
        '',
        true
      )
      .subscribe((res) => {
        this.fullInfo = res;
        const editingWithDirection: string =
          idDirection === IdDirection.sale
            ? this.translate.store.currentLang == 'RU' ? RU['editOffer'].editingSalesRequest : EN['editOffer'].editingSalesRequest
            : this.translate.store.currentLang == 'RU' ? RU['editOffer'].editingPurchaseOrders : EN['editOffer'].editingPurchaseOrders;
        let name =
          this.translate.store.currentLang == 'RU'
            ? editingWithDirection +
              ': ' +
              RU['trading'].offersTable.lot +
              ' №' +
              this.offerData.demandOfferInfo?.lotNumber
            : editingWithDirection +
              ': ' +
              EN['trading'].offersTable.lot +
              ' №' +
              this.offerData.demandOfferInfo?.lotNumber;
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
          fullInfo: Object.assign(this.fullInfo, {
            currencyPrecision:
              this.chooseOffers[0].priceParams.currencyPrecision,
          }),
        });
      });
  }

  onOpenDepositOffer() {
    this.depositRowData = Object.assign(this.offerData, this.sessionIds);
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

  onSetDeals() {
    const body = {
      idSection: this.sessionIds?.sectionId,
      idSession: this.sessionIds?.sessionId,
    };

    this.transactionService
      .tradingSetTransactions(this.user?.token, body)
      .subscribe((res) => {
        if (res.numberTransactions == 0) {
          this.toastService.onShowToast({
            message:
              this.translate.store.currentLang == 'RU'
                ? RU['trading'].auctionsTab.fixDealsNoRes
                : EN['trading'].auctionsTab.fixDealsNoRes,
            type: 'error',
          });
        }
        if (res.numberTransactions > 0) {
          const str =
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].auctionsTab.fixDealsRes
              : EN['trading'].auctionsTab.fixDealsRes;
          this.messageToast = str + res.numberTransactions;
          this.toastService.onShowToast({
            message: this.messageToast,
            type: 'success',
          });
        }
      });
  }

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
        2,
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

  recalcPriceStep() {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
    };

    this.traderService
      .bucePeriodsUpdatePriceStep(this.user?.token, body)
      .subscribe(() => {
        let message =
          this.translate.store.currentLang == 'RU'
            ? RU['trading'].auctionsTab.recalcPriceStepMess
            : EN['trading'].auctionsTab.recalcPriceStepMess;
        this.toastService.onShowToast({ message: message, type: 'success' });
        this.getData();
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

  protected onClickLotNumber(data: DemandOfferList): void {
    this.isOpenedView = true;
    this.idOffer = data.idDemandOffer;
    this.offerData = data;
    this.onOpenViewOffer(
      data.idDemandOffer,
      data.directionId,
      data.demoffOwner.idTrader,
      data.isMine || false,
      data.isAllowAnalogs,
      data.isAvailableAnalogList
    );
  }

  onFocusedRowChanged(e) {
    const focusedRowKey = e.row?.key;

    if (this.isOpenedView) {
      if (this.focusChangedTimer) {
        clearTimeout(this.focusChangedTimer);
      }

      this.focusChangedTimer = setTimeout(() => {
        if (focusedRowKey) {
          const dataGrid = this.dataGridRef.instance;
          const focusedRowData = dataGrid.getDataSource().items().find(
            item => item.demandOfferInfo.lotNumber === focusedRowKey
          );
          if (focusedRowData) {
            const oldFocusLotNumber: number = this.offerData?.demandOfferInfo?.lotNumber;
            this.idOffer = focusedRowData.idDemandOffer;
            this.offerData = focusedRowData;
            if (this.openType === POPUP_SIDEBAR_TYPE.VIEW_OFFER_FROM_AUCTIONS) {
              this.onOpenViewOffer(
                focusedRowData.idDemandOffer,
                focusedRowData.directionId,
                focusedRowData.demoffOwner.idTrader,
                focusedRowData.isMine,
                focusedRowData.isAllowAnalogs,
                focusedRowData.isAvailableAnalogList
              );
            }
            if (this.openType === POPUP_SIDEBAR_TYPE.SUBMIT_BID_TO_BUY && oldFocusLotNumber !== focusedRowKey) {
              this.onOpenSubmitBidToBuy(
                focusedRowData.idDemandOffer,
                focusedRowData.directionId,
                focusedRowData.isAllowAnalogs,
                focusedRowData.isAvailableAnalogList,
              );
            }
            if (this.openType === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS && this.cache?.filters?.counter && oldFocusLotNumber !== focusedRowKey) {
              this.onOpenCounterOffer(
                focusedRowData.idDemandOffer,
                focusedRowData.directionId,
                focusedRowData.isAllowAnalogs,
                focusedRowData.isAvailableAnalogList,
                focusedRowData.isMine,
              );
            }
          }
        }
      }, 500);
    }
  }

  public hideCompositeLot(isHiddenLotVisible: boolean): void {
    this.isHiddenLot = isHiddenLotVisible;
    this.lastAppliedHiddenLotColumns = null;

    if (this.isHiddenLotCheckboxVisible) {
      this.localStorageService.setItemToLocalStorage(
        AUCTIONS_HIDDEN_LOT_STATE_KEY,
        isHiddenLotVisible
      );
    }

    /** Логика по обновлению таблицы применяется в следующем кадре
     * чтобы не блокировать клик по чекбоксу
     */
    this.scheduleHiddenLotColumnVisibilityForClick();
  }

  public onShown(): void {
    setTimeout(() => {
      this.loadingVisible = false;
    }, 2000);
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
          filterValue = options?.filter?.find(el =>
            Array.isArray(el) && !el.find(a => a.columnIndex)
          )?.[2]
        } else {
          filterValue = options?.filter?.find(el =>
            Array.isArray(el) && Array.isArray(el[0]) && !el[0].find(a => a.columnIndex)
          )?.[0]?.[2]
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
      const emptyLabel: string = getEmptyFilterLabel(this.translate.store.currentLang);
      const results: FilterOption[] = this.offers.reduce((acc: FilterOption[], item: any): FilterOption[] => {
        const goodsItems: FilterOption[] = item.goods?.map((el: any): FilterOption =>
          mapDescriptionToFilterOption(el.goodDescription, emptyLabel)
        );
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult: FilterOption[] = [
        ...new Map(results.map((item: FilterOption) => [item['value'], item])).values(),
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
          key: [setPrecision(el.priceWithoutVat, item.priceParams.currencyPrecision)],
          value: setPrecision(el.priceWithoutVat, item.priceParams.currencyPrecision),
          text: setPrecision(el.priceWithoutVat, item.priceParams.currencyPrecision),
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
          key: [setPrecision(el.totalAmount, item.priceParams.currencyPrecision)],
          value: setPrecision(el.totalAmount, item.priceParams.currencyPrecision),
          text: setPrecision(el.totalAmount, item.priceParams.currencyPrecision),
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
          key: [setPrecision(el.priceAdjustment, item.priceParams.currencyPrecision)],
          value: setPrecision(el.priceAdjustment, item.priceParams.currencyPrecision),
          text: setPrecision(el.priceAdjustment, item.priceParams.currencyPrecision),
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
          key: [setPrecision(el.quotationValue, item.priceParams.currencyPrecision)],
          value: setPrecision(el.quotationValue, item.priceParams.currencyPrecision),
          text: setPrecision(el.quotationValue, item.priceParams.currencyPrecision),
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
  ): (data: {[p: string]: unknown}) => boolean {
    const column: any = this;

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
          )

          results.push({
            key: [el.dynamicFields[idFieild.toString()]],
            value: el.dynamicFields[idFieild.toString()],
            text: ACTUAL_SIZE_FIELDS.includes(Number(idFieild))
                ? actualDimentionValue
                : el.dynamicFields[idFieild.toString()],
          });
        } else {
          hasNonEmptyValues = true
        }
      });
    });

     // Добавляем отдельную запись для пустых значений
     if (hasNonEmptyValues) {
      results.unshift({
        key: [null],
        value: null,
        text: this.translate.store.currentLang == 'RU'
          ? RU['filters'].empty
          : EN['filters'].empty
      });
    }

    return this.getUniqueResults(results);
  }

  private getUniqueResults(results: FilterOption[]): FilterOption[] {
    return [...new Map(results.map((item) => [item['value'], item])).values()];
  }

  calculateFilterExpressionDynamic(
    filterValue: string,
    selectedFilterOperation: string,
    target: string
  ) {
    const column = this as any;
    return function (data: { [key: string]: any }): boolean {
      const fieldValue = data[column.dataField];
      return Array.isArray(fieldValue) && fieldValue.includes(filterValue);
    };
  }

  public pagingChange(): void {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  private restoreHiddenLotStateFromLocalStorage(): void {
    if (!this.isHiddenLotCheckboxVisible) {
      return;
    }

    const isHiddenLot = this.localStorageService.getItemFromLocalStorage(
      AUCTIONS_HIDDEN_LOT_STATE_KEY
    );

    if (typeof isHiddenLot === 'boolean') {
      this.isHiddenLot = isHiddenLot;
    }
  }

  private setFiltersFromLocalStorage(): void {
    this.restoreHiddenLotStateFromLocalStorage();
  }

  /** Клик по чекбоксу:
   * в случае частых кликов - обрабатывается только последний, остальные отменяются
   * логика обновления таблиы запускается вне ангуляра чтобы не триггерить Change Detection
   * */
  private scheduleHiddenLotColumnVisibilityForClick(): void {
    if (this.hiddenLotRafId) {
      cancelAnimationFrame(this.hiddenLotRafId);
    }

    this.hiddenLotRafId = requestAnimationFrame(() => {
      this.ngZone.runOutsideAngular(() => this.runHiddenLotColumnVisibilityUpdate());
    });
  }

  /** Обновление грида с учетом настроек */
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
