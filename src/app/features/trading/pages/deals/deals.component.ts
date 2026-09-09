import {
  Component,
  OnInit,
  Input,
  ViewChild,
  SimpleChanges,
  inject,
  DestroyRef,
  ViewEncapsulation,
  OnChanges,
  NgZone,
} from '@angular/core';
import {
  DxCheckBoxModule,
  DxDataGridModule,
  DxTooltipModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { User, PageCache } from '@classes';
import {
  numberEntriesPage,
  DEALS_SESSION_STORAGE_KEY,
  DEALS_HIDDEN_LOT_STATE_KEY,
  AgreementType,
  VOLUME_PRECISION,
  CURRENCY_PRECISION,
  auctionType,
  FileTypes,
  statusDeals,
  pricingType,
  PRICE_ADJUSTMENT_TYPE,
  IdSessionPeriods,
  DEFAULT_COLUMN_CHOOSER_POSITION,
} from '@constants';
import { CommonService, CurrencyService, TransactionService } from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PopupSidebarService } from '@services';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  RestoreDealPopupComponent,
  RefuseDealPopupComponent,
} from '@components';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { HomePageStore } from '@homepage-store';
import {
  createArrayFieldHeaderFilterExpression,
  createContractTypeHeaderFilterExpression,
  downloadArchive,
  getAuctionPath,
  getEmptyFilterLabel,
  getGridInfoText,
  getTranslateResultByCurrentLang,
  mapContractTypeToFilterOption,
  mapDescriptionToFilterOption,
  matchesHeaderFilterSearch,
} from '@helpers';
import { ToNumberPipe, RuNumberFormatPipe, ExcelDatePipe } from '@pipes';
import { DxDataGridComponent } from 'devextreme-angular';
import { RowPreparedEvent, CellPreparedEvent } from 'devextreme/ui/data_grid';
import {
  applyHiddenLotGridColumnsVisibility,
  HIDDEN_LOT_EXTENDED_FIELDS,
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
import { matchesFinanceSourceFilter } from '../../utils/finance-source-filter.util';
import { DxGridContextMenuLocalizationDirective } from '../../../../shared/directives';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { BehaviorSubject, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalStore } from '@store';
import { CheckBoxComponent } from '../../../../shared/components/check-box/check-box.component';
import { SessionStorageService, LocalStorageService } from '@shared-services';
import { setPrecision } from './../../../../helpers/common';
import { TransactionData } from './../../interfaces/index';
import { ExportService } from './../../../../services/export-service.service';
import { ExportingEvent } from 'devextreme/ui/data_grid';
import { DxGridState, FilterOption } from "@interfaces";
import { PositionConfig } from 'devextreme/common/core/animation';
import { ISessionStateConfig } from '../../../../views/homepage/interfaces';
import { makeMainName } from '../../utils/main-name.util';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    CommonModule,
    DxCheckBoxModule,
    DxDataGridModule,
    DxTooltipModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxLoadPanelModule,
    TranslateModule,
    RestoreDealPopupComponent,
    RefuseDealPopupComponent,
    CheckBoxComponent,
    FormsModule,
    ReactiveFormsModule,
    FiltersComponent,
    ToNumberPipe,
    RuNumberFormatPipe,
    DxGridContextMenuLocalizationDirective,
    ExcelDatePipe
  ],
  templateUrl: './deals.component.html',
  styleUrls: ['./deals.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DealsComponent implements OnInit, OnChanges {
  private readonly currencyService = inject(CurrencyService);
  private readonly transactionService = inject(TransactionService);
  private readonly popupSidebarService = inject(PopupSidebarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly globalStore = inject(GlobalStore);
  private readonly store = inject(HomePageStore);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly exportService = inject(ExportService);

  @ViewChild(DxDataGridComponent) public dataGrid: DxDataGridComponent;
  @ViewChild(FiltersComponent) public filtersComponent: FiltersComponent;

  @Input() sessionIds;
  @Input() sessionInfo;
  @Input() tabIndex: string;
  @Input() isAdmissionFinished: boolean;
  @Input() isCalcFeeFinished: boolean;

  public readonly columnChooserPosition: PositionConfig = DEFAULT_COLUMN_CHOOSER_POSITION;

  public user: User;
  public cache = {} as PageCache;
  public numberEntriesPage = numberEntriesPage;
  public currentTimeDate: Date;
  public currentTimeDateOnPopup: Date;
  public deals: any;
  public displayDeals: any;
  public selectedRows = [];
  public chooseDeals = [];
  public idDeal: number;
  public dealData: any;
  public disableObserved: boolean = false;
  public fullInfo: any;
  public statistic: any;
  public displayCurrency: any;
  public statisticPopup: boolean = false; //просмотр статистики
  public refusePopup: boolean = false;
  public restorePopup: boolean = false;
  public resultPopup: boolean = false;

  public currencyForm = this.formBuilder.group({
    currency: [null],
    currencyName: [null],
  });

  public currencyPrecision: any; //точность валюты
  public isHiddenLot: boolean = true;
  public loadingVisible: boolean = false; // лодер

  private readonly hideLotColumnFields: readonly string[] = [
    ...HIDDEN_LOT_EXTENDED_FIELDS,
    TableDataField.GoodsSummaryLotSummaryTotalAmount,
    TableDataField.Place,
  ];
  private readonly minimalVisibleLotFields: readonly string[] = [
    TableDataField.SummaryLotSummaryVolume,
    TableDataField.PriceParamsCurrencyName,
  ];
  private lastAppliedHiddenLotColumns: HiddenLotDisplayMode | null = null;
  private hiddenLotRafId: number = 0;
  private readonly ngZone: NgZone = inject(NgZone);

  public readonly AgreementType = AgreementType;
  public readonly VOLUME_PRECISION = VOLUME_PRECISION;
  public readonly statusDeals = statusDeals;
  public readonly pricingType = pricingType;
  public readonly PRICE_ADJUSTMENT_TYPE = PRICE_ADJUSTMENT_TYPE;
  public readonly TableDataField = TableDataField;
  public readonly HiddenLotDisplayMode = HiddenLotDisplayMode;

  public get isHiddenLotCheckboxVisible(): boolean {
    return isHiddenLotCheckboxVisible(this.sessionInfo?.idCompositeLotAvailability);
  }

  public get hiddenLotDisplayMode(): HiddenLotDisplayMode {
    return resolveHiddenLotDisplayMode(
      this.sessionInfo?.idCompositeLotAvailability,
      this.isHiddenLot
    );
  }

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
        map((sessionInfo: ISessionStateConfig): DxGridState | null =>
          sanitizeTradingGridStateFromLs(
            this.loadRawGridState(),
            sessionInfo.idCompositeLotAvailability
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
    return TradingGridStatePage.Deals;
  }

  public get modeGridStateKey(): string {
    return buildTradingGridStateKey(
      TradingGridStatePage.Deals,
      this.hiddenLotDisplayMode,
      this.stateKey
    );
  }

  constructor(
    private translate: TranslateService,
    private commonService: CommonService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.orderHeaderFilterName = this.orderHeaderFilterName.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterDesc = this.orderHeaderFilterDesc.bind(this);
    this.orderHeaderFilterVol = this.orderHeaderFilterVol.bind(this);
    this.orderHeaderFilterUnits = this.orderHeaderFilterUnits.bind(this);
    this.orderHeaderFilterPrice = this.orderHeaderFilterPrice.bind(this);
    this.orderHeaderFilterAmountVAT =
      this.orderHeaderFilterAmountVAT.bind(this);
    this.orderHeaderFilterTotalAmount =
      this.orderHeaderFilterTotalAmount.bind(this);
    this.orderHeaderFilterAmendment =
      this.orderHeaderFilterAmendment.bind(this);
    this.orderHeaderFilterQuotation =
      this.orderHeaderFilterQuotation.bind(this);
    this.orderHeaderFilterSellerContractType =
      this.orderHeaderFilterSellerContractType.bind(this);
    this.orderHeaderFilterBuyerContractType =
      this.orderHeaderFilterBuyerContractType.bind(this);
    this.orderHeaderFilterPlace = this.orderHeaderFilterPlace.bind(this);
  }

  get infoText(): string {
    return getGridInfoText(this.translate.store.currentLang, this.deals?.length);
  }

  public ngOnInit(): void {
    this.restoreHiddenLotStateFromLocalStorage();

    this.popupSidebarService.close$
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value: boolean) => {
        if (value) return;
        this.getData();
      });

    this.transactionService.edittingTriggered$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getData();
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.user = this.localStorageService.getItemFromLocalStorage('user');
    this.cache =
      this.sessionStorageService.getItemFromSessionStorage(
        DEALS_SESSION_STORAGE_KEY
      ) || ({} as PageCache);

    if (changes['sessionInfo']) {
      this.sessionInfoSubject.next(changes['sessionInfo'].currentValue ?? null);
    }

    if (
      this.sessionInfo.idSessionPeriod !== IdSessionPeriods.pretrading &&
      changes['tabIndex'] &&
      changes['tabIndex'].currentValue === 'deals'
    ) {
      this.getData();
    }

    if (
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue &&
      this.tabIndex === 'deals'
    ) {
      this.getData();
    }
    if (
      changes['isCalcFeeFinished'] &&
      changes['isCalcFeeFinished'].currentValue &&
      this.tabIndex === 'deals'
    ) {
      this.getData();
    }
  }

  public getData(): void {
    this.lastAppliedHiddenLotColumns = null;
    this.currentTimeDate = new Date();
    let displayCurrency = this.cache?.filters?.displayCurrency
      ? this.cache?.filters?.displayCurrency == -1
        ? ''
        : this.cache?.filters?.displayCurrency
      : '';
    if (this.user?.IsWorker) {
      this.transactionService
        .buceGetListTransactionsWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          displayCurrency
        )
        .subscribe((res) => {
          this.deals = res.transactions;
          this.deals.forEach((deal) => {
            this.transactionService
              .buceGetListGoodsTransactionWorker(
                this.user?.token,
                this.sessionIds.sectionId,
                this.sessionIds.sessionId,
                [deal.idTransaction],
                displayCurrency
              )
              .subscribe((resGoods) => {
                deal.goods = resGoods.goods;
                this.setDealsForFilter(deal);
                this.displayDeals = this.deals;

                if (this.cache.filters) {
                  this.filterOffersWorker();
                }

                this.lastAppliedHiddenLotColumns = null;
                this.scheduleHiddenLotColumnVisibilityForClick();
              });
          });
        });
    } else {
      this.transactionService
        .getListTransactionsTrader(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          displayCurrency
        )
        .subscribe((res) => {
          this.deals = res.transactions;
          this.deals.forEach((deal) => {
            this.transactionService
              .getListGoodsTransactionTrader(
                this.user?.token,
                this.sessionIds.sectionId,
                this.sessionIds.sessionId,
                [deal.idTransaction],
                displayCurrency
              )
              .subscribe((resGoods) => {
                deal.goods = resGoods.goods;
                this.setDealsForFilter(deal);
                this.displayDeals = this.deals;

                if (this.cache.filters) {
                  this.filterOffers();
                }

                this.lastAppliedHiddenLotColumns = null;
                this.scheduleHiddenLotColumnVisibilityForClick();
              });
          });
        });
    }
  }

  public setDealsForFilter(deal: TransactionData): void {
    deal['mainName'] = makeMainName(
      deal.goods,
      (g) => ({
        goodName: g.goodInfo.goodName,
        goodDescription: g.goodInfo.goodDescription,
        goodGroup: g.goodGroupName,
        nomenclatureGroup: g.goodNomenclatureGroupName,
      }),
      this.sessionInfo?.sectionName
    );

    let names = deal.goods.map((x) => x.goodInfo.goodName); //создаю массив имен и добавляю в объект для фильтрации
    deal['names'] = names;

    let desc = deal.goods.map((x) => x.goodInfo.goodDescription);
    deal['desc'] = desc;

    let vol = deal.goods.map((x) =>
      setPrecision(x.goodInfo.goodVolume, VOLUME_PRECISION)
    );
    deal['vol'] = vol;

    let units = deal.goods.map((x) => x.goodInfo.goodUnitName);
    deal['units'] = units;

    let prices = deal.goods.map((x) =>
      setPrecision(x.priceParams.priceWithoutVat, CURRENCY_PRECISION)
    );
    deal['prices'] = prices;

    let amountVAT = deal.goods.map((x) =>
      setPrecision(x.priceParams.vatAmount, CURRENCY_PRECISION)
    );
    deal['amountVAT'] = amountVAT;

    let totalAmount = deal.goods.map((x) =>
      setPrecision(x.priceParams.totalAmount, CURRENCY_PRECISION)
    );
    deal['totalAmount'] = totalAmount;

    let place = deal.goods.map((x) => x.goodInfo.goodLocation);
    deal['place'] = place;
  }

  public getFilterData(e: any): void {
    this.cache.filters = e;
    this.sessionStorageService.setItemToSessionStorage(
      DEALS_SESSION_STORAGE_KEY,
      this.cache
    );

    if (this.filtersComponent?.changedCurrency) {
      // перезапрашиваем данные если изменили валюту
      this.getData();
    } else {
      this.user?.IsWorker ? this.filterOffersWorker() : this.filterOffers();
    }
  }

  private filterOffersWorker(): void {
    this.displayDeals = this.deals?.filter((i) => {
      const fixedStatus =
        this.cache.filters.deals === statusDeals.fixed ? !i.dateTerminate : true;
      const deniedStatus =
        this.cache.filters.deals === statusDeals.denied ? i.dateTerminate : true;
      const internalMarket =
        !this.cache.filters.internal || i.modelInfo.isSupportMarketDomestic;
      const externalMarket =
        !this.cache.filters.external || i.modelInfo.isSupportMarketForeign;
      const exportMarket =
        !this.cache.filters.export || i.modelInfo.isSupportMarketExport;
      const importMarket =
        !this.cache.filters.import || i.modelInfo.isSupportMarketImport;
      const observed = this.cache.filters.observedDeals ? i.isWatched : true;
      const priceAdjustmentDeals = this.cache.filters.priceAdjustmentDeals
        ? i.goodInfo.isPriceAdjusted
        : true;
      const simpleLotDeals = this.cache.filters.simpleLotDeals
        ? !i.goodInfo.isComposite
        : true;
      const compositeLotDeals = this.cache.filters.compositeLotDeals
        ? i.goodInfo.isComposite
        : true;
      const financeSource: boolean = matchesFinanceSourceFilter(
        i.transactionInfo.isGovernmentPurchase,
        this.cache.filters.ownFunds,
        this.cache.filters.publicProcurement,
      );
      /*Фильтр по неблагонадёжным реализуется через проверку двух полей BUYER_IS_UNRELIABLE / SELLER_IS_UNRELIABLE:*/
      const unreliable = this.cache.filters.unreliableRegister
        ? i.sellerInfo.sellerIsUnreliable || i.buyerInfo.buyerIsUnreliable
        : true;

      return (
        fixedStatus &&
        deniedStatus &&
        internalMarket &&
        externalMarket &&
        exportMarket &&
        importMarket &&
        observed &&
        priceAdjustmentDeals &&
        simpleLotDeals &&
        compositeLotDeals &&
        financeSource &&
        unreliable
      );
    });
  }

  public filterOffers(): void {
    this.displayDeals = this.deals.filter((i) => {
      const fixedStatus =
        this.cache.filters.deals === statusDeals.fixed ? !i.dateTerminate : true;
      const deniedStatus =
        this.cache.filters.deals === statusDeals.denied ? i.dateTerminate : true;
      const internalMarket =
        !this.cache.filters.internal || i.modelInfo.isSupportMarketDomestic;
      const externalMarket =
        !this.cache.filters.external || i.modelInfo.isSupportMarketForeign;
      const exportMarket =
        !this.cache.filters.export || i.modelInfo.isSupportMarketExport;
      const importMarket =
        !this.cache.filters.import || i.modelInfo.isSupportMarketImport;

      const myTransactions = this.cache.filters.myTransactions
        ? i.buyerInfo.buyerIdFirm && i.sellerInfo.sellerIdFirm
        : true;
      const observed = this.cache.filters.observedDeals ? i.isWatched : true;
      const priceAdjustmentDeals = this.cache.filters.priceAdjustmentDeals
        ? i.goodInfo.isPriceAdjusted
        : true;
      const simpleLotDeals = this.cache.filters.simpleLotDeals
        ? !i.goodInfo.isComposite
        : true;
      const compositeLotDeals = this.cache.filters.compositeLotDeals
        ? i.goodInfo.isComposite
        : true;
      const financeSource: boolean = matchesFinanceSourceFilter(
        i.transactionInfo.isGovernmentPurchase,
        this.cache.filters.ownFunds,
        this.cache.filters.publicProcurement,
      );

      return (
        fixedStatus &&
        deniedStatus &&
        internalMarket &&
        externalMarket &&
        exportMarket &&
        importMarket &&
        myTransactions &&
        observed &&
        priceAdjustmentDeals &&
        simpleLotDeals &&
        compositeLotDeals &&
        financeSource
      );
    });
  }

  public onRowPrepared(e: RowPreparedEvent): void {
    if (e.rowType === 'data') {
      if (
        !this.user.IsWorker &&
        e.data.buyerInfo.buyerIdFirm &&
        e.data.sellerInfo.sellerIdFirm
      ) {
        e.rowElement.classList.add('mine-row');
        e.rowElement.style.setProperty('color', 'green', 'important');
        e.rowElement.style.setProperty('font-weight', '500', 'important');
      }
    }
  }

  public onCellPrepared(e: CellPreparedEvent): void {
    if (e.rowType === 'data') {
      if (
        !this.user.IsWorker &&
        e.data.buyerInfo?.buyerIdFirm &&
        e.data.sellerInfo?.sellerIdFirm
      ) {
        e.cellElement.classList.add('mine-cell');
      }
    }
  }

  onSelectionChanged(data) {
    this.selectedRows = data.selectedRowsData;
    if (this.selectedRows.length == 1) {
      this.idDeal = this.selectedRows[0].idTransaction;
      this.dealData = this.selectedRows[0];
    }
    this.chooseDeals = this.selectedRows;
  }

  onContextMenuPreparing(e) {
    if (e.row.rowType != 'header') {
      this.chooseDeals = [];

      if (!e.items) {
        e.items = [];
      }

      if (this.selectedRows.length > 0) {
        this.chooseDeals = this.selectedRows;
      } else {
        this.chooseDeals.push(e.row.data);
      }

      if (this.chooseDeals.length == 1) {
        this.idDeal = e.row.data.idTransaction;
        this.dealData = e.row.data;
      }

      if (this.chooseDeals.length > 1) {
        //проверка на разные статусы наблюдения заявок
        for (let i = 0; i < this.chooseDeals.length; i++) {
          this.chooseDeals[i - 1]?.isWatched == this.chooseDeals[i]?.isWatched
            ? (this.disableObserved = false)
            : (this.disableObserved = true);
        }
      }

      if (this.user?.IsWorker) {
        e.items.push(
          {
            icon: './assets/img/icons/viewOffer.svg',
            text: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.dealsTab.viewDeal'
            ),
            disabled: this.chooseDeals?.length > 1,
            onItemClick: () => {
              this.onOpenViewDeal(e.row.data.idTransaction);
            },
          },
          {
            icon: './assets/img/icons/register.svg',
            text: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.dealsTab.generate'
            ),
            onItemClick: () => {
              this.downloadRegister();
            },
          },
          {
            icon: './assets/img/icons/editOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.dealsTab.editDeal'),
            disabled:
              this.chooseDeals?.length > 1 ||
              e.row.data.dateTerminate ||
              (this.sessionInfo?.idAuctionType ===
                auctionType.simpleSellerAuction &&
                e.row.data?.buyerInfo?.buyerIdClientContractType ===
                  AgreementType.Commission) ||
              (this.sessionInfo?.idAuctionType ===
                auctionType.simpleBuyerAuction &&
                e.row.data?.sellerInfo?.sellerIdClientContractType ===
                  AgreementType.Commission),
            onItemClick: () => {
              this.onOpenEditDeal(e.row.data.idTransaction);
            },
          },
          {
            icon: './assets/img/icons/tradingProgress.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.viewProgress'),
            disabled: this.chooseDeals?.length > 1 || !this.user?.IsWorker,
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

        if (this.cache.filters.deals === statusDeals.denied) {
          e.items.push({
            icon: './assets/img/icons/restore.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.dealsTab.restoreDeal'),
            onItemClick: () => {
              this.onOpenRestorePopup();
            },
          });
        }

        if (this.cache.filters.deals === statusDeals.fixed) {
          e.items.push({
            icon: './assets/img/icons/refuse.svg',
            template: `<div class="flexContent8 center font-s14 redColor"><i class="rejectOffer"></i><span>${
              getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.dealsTab.refuse')
            }</span></div>`,
            disabled: this.chooseDeals?.length > 1,
            onItemClick: () => {
              this.onOpenRefusePopup();
            },
          });
        }
      } else {
        e.items.push(
          {
            icon: './assets/img/icons/viewOffer.svg',
            text: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.dealsTab.viewDeal'),
            disabled: this.chooseDeals?.length > 1,
            onItemClick: () => {
              this.onOpenViewDeal(e.row.data.idTransaction);
            },
          },
          {
            icon: './assets/img/icons/register.svg',
            text: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.dealsTab.generate'
            ),
            disabled: this.chooseDeals.some(
              (item) =>
                !item.buyerInfo?.buyerIdFirm && !item.sellerInfo?.sellerIdFirm
            ),
            onItemClick: () => {
              this.downloadRegister();
            },
          }
        );
      }
    }
  }

  public onOpenViewDeal(idDeal: number): void {
    this.transactionService
      .getTransactionFullInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        idDeal
      )
      .subscribe((res) => {
        this.fullInfo = res;
        let dataForReq = Object.assign(this.sessionInfo, this.sessionIds);
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'viewDeal',
          idOffer: idDeal,
          fullInfo: this.fullInfo,
        });
      });
  }

  public onOpenEditDeal(idDeal: number): void {
    this.transactionService
      .getTransactionFullInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        idDeal
      )
      .subscribe((res) => {
        this.fullInfo = res;
        let dataForReq = Object.assign(this.sessionInfo, this.sessionIds);
        this.popupSidebarService.onShowPopupSidebar({
          dataForReq: dataForReq,
          type: 'editDeal',
          idOffer: idDeal,
          fullInfo: this.fullInfo,
        });
      });
  }

  public onOpenStatsPopup(): void {
    //валюта
    this.commonService
      .getByName(this.user?.token, 'currencies')
      .subscribe((res: any) => {
        this.displayCurrency = res.refbooks;
        let displayCurrency = this.cache?.filters?.displayCurrency
          ? this.cache?.filters?.displayCurrency == -1
            ? '1'
            : this.cache?.filters?.displayCurrency
          : '1';
        this.currencyForm.get('currency').patchValue(displayCurrency);
        this.currencyForm
          .get('currencyName')
          .patchValue(
            this.displayCurrency.find((c) => c.id == displayCurrency)?.name
          );
      });
    this.statisticPopup = true;
  }

  public getStatistic(e?: ValueChangedEvent): void {
    this.currentTimeDateOnPopup = new Date();

    const currency = this.currencyForm.getRawValue().currency;

    this.currencyService
      .getPrecision(this.user?.token, currency)
      .subscribe((res) => {
        this.currencyPrecision = res;
      });

    if (e?.value) {
      this.currencyForm.get('currency').patchValue(e.value);
      this.currencyForm
        .get('currencyName')
        .patchValue(this.displayCurrency.find((c) => c.id == e.value).name);
    }

    this.transactionService
      .buceGetTransactStats(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        currency
      )
      .subscribe((res) => {
        this.statistic = res.transactStats;

        //подсчет строки и столбца Итого
        let totalTransactionNumber = 0;
        let totalBuyerAmount = 0;
        let totalSellerAmount = 0;
        let totalAmount = 0;

        this.statistic.forEach((row) => {
          totalTransactionNumber += row.transactionNumber;
          totalBuyerAmount += row.exchFeeBuyerTotalAmount;
          totalSellerAmount += row.exchFeeSellerTotalAmount;
          row.totalInColumn =
            row.exchFeeBuyerTotalAmount + row.exchFeeSellerTotalAmount;
          totalAmount += row.totalInColumn;
        });

        this.statistic.push({
          unitName: 'Итого',
          transactionNumber: totalTransactionNumber,
          exchFeeBuyerTotalAmount: totalBuyerAmount,
          exchFeeSellerTotalAmount: totalSellerAmount,
          totalInColumn: totalAmount,
        });
      });
  }

  public onOpenRefusePopup(): void {
    this.refusePopup = true;
  }

  closeRefusePopup(event) {
    //просто закрыли окно
    this.refusePopup = event;
  }

  public closeRefuseResultPopup(event: boolean): void {
    this.resultPopup = event;
    this.getData();
  }

  public onOpenRestorePopup(): void {
    this.restorePopup = true;
  }

  public closeRestorePopup(event: boolean): void {
    this.restorePopup = event;
    this.getData();
  }

  public downloadRegister(): void {
    const idsDeals: number[] = this.chooseDeals.map(
      (item) => item.idTransaction
    );

    this.transactionService
      .getReestrsDealSheetContent(
        this.user?.token,
        this.sessionIds.sectionId,
        idsDeals
      )
      .subscribe((res: Blob) => {
         downloadArchive(res);
      });
  }

  public hideCompositeLot(isHiddenLotVisible: boolean): void {
    this.isHiddenLot = isHiddenLotVisible;
    this.lastAppliedHiddenLotColumns = null;

    if (this.isHiddenLotCheckboxVisible) {
      this.localStorageService.setItemToLocalStorage(
        DEALS_HIDDEN_LOT_STATE_KEY,
        isHiddenLotVisible
      );
    }

    this.scheduleHiddenLotColumnVisibilityForClick();
  }

  // todo refactor this magic code
  public onShown(): void {
    setTimeout(() => {
      this.loadingVisible = false;
    }, 2000);
  }

  public onExporting(e: ExportingEvent): void {
    const fileName: string = `${getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'trading.deals'
    )}, ${this.sessionInfo?.sectionName}, № ${this.sessionIds.sessionId}`;

    this.exportService.onExporting(e, fileName, FileTypes.DEALS);
  }

  //-------------------------для фильтрации в таблице-------------------

  orderHeaderFilterName(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.goodInfo.goodName],
          value: el.goodInfo.goodName,
          text: el.goodInfo.goodName,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
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
      if (!this.deals?.length) {
        return [];
      }
      const emptyLabel: string = getEmptyFilterLabel(this.translate.store.currentLang);
      const results: FilterOption[] = this.deals.reduce((acc: FilterOption[], item: any): FilterOption[] => {
        const goodsItems: FilterOption[] = item.goods?.map((el: any): FilterOption =>
          mapDescriptionToFilterOption(
            el.goodInfo.goodDescription,
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
        uniqueResult = uniqueResult.filter((item: FilterOption) =>
          matchesHeaderFilterSearch(item, searchQuery)
        );
      }
      return uniqueResult;
    };
  }

  orderHeaderFilterVol(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [setPrecision(el.goodInfo.goodVolume, VOLUME_PRECISION)],
          value: setPrecision(el.goodInfo.goodVolume, VOLUME_PRECISION),
          text: setPrecision(el.goodInfo.goodVolume, VOLUME_PRECISION),
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterUnits(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.goodInfo.goodUnitName],
          value: el.goodInfo.goodUnitName,
          text: el.goodInfo.goodUnitName,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterPrice(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [
            setPrecision(el.priceParams.priceWithoutVat, CURRENCY_PRECISION),
          ],
          value: setPrecision(
            el.priceParams.priceWithoutVat,
            CURRENCY_PRECISION
          ),
          text: setPrecision(
            el.priceParams.priceWithoutVat,
            CURRENCY_PRECISION
          ),
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterAmountVAT(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [setPrecision(el.priceParams.vatAmount, CURRENCY_PRECISION)],
          value: setPrecision(el.priceParams.vatAmount, CURRENCY_PRECISION),
          text: setPrecision(el.priceParams.vatAmount, CURRENCY_PRECISION),
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterTotalAmount(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [setPrecision(el.priceParams.totalAmount, CURRENCY_PRECISION)],
          value: setPrecision(el.priceParams.totalAmount, CURRENCY_PRECISION),
          text: setPrecision(el.priceParams.totalAmount, CURRENCY_PRECISION),
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterAmendment(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [
            setPrecision(el.priceParams.priceAdjustment, CURRENCY_PRECISION),
          ],
          value: setPrecision(
            el.priceParams.priceAdjustment,
            CURRENCY_PRECISION
          ),
          text: setPrecision(
            el.priceParams.priceAdjustment,
            CURRENCY_PRECISION
          ),
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterQuotation(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [
            setPrecision(el.priceParams.quotationValue, CURRENCY_PRECISION),
          ],
          value: setPrecision(
            el.priceParams.quotationValue,
            CURRENCY_PRECISION
          ),
          text: setPrecision(el.priceParams.quotationValue, CURRENCY_PRECISION),
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterPlace(data) {
    data.dataSource.postProcess = () => {
      if (!this.deals?.length) {
        return [];
      }
      const results = this.deals.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.goodInfo.goodLocation],
          value: el.goodInfo.goodLocation,
          text: el.goodInfo.goodLocation,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  public orderHeaderFilterSellerContractType(data: any): void {
    data.dataSource.postProcess = (results: any): FilterOption[] => {
      results.length = 0;
      const currentLang: string = this.translate.store.currentLang;

      this.deals.forEach((item: any): void => {
        const contractType: number | null = item.sellerInfo.sellerIdClientContractType;
        results.push(mapContractTypeToFilterOption(contractType, currentLang));
      });

      return [
        ...new Map(results.map((item: any) => [item['value'], item])).values(),
      ] as FilterOption[];
    };
  }

  public orderHeaderFilterBuyerContractType(data: any): void {
    data.dataSource.postProcess = (results: any): FilterOption[] => {
      results.length = 0;
      const currentLang: string = this.translate.store.currentLang;

      this.deals.forEach((item: any): void => {
        const contractType: number | null = item.buyerInfo.buyerIdClientContractType;
        results.push(mapContractTypeToFilterOption(contractType, currentLang));
      });

      return [
        ...new Map(results.map((item: any) => [item['value'], item])).values(),
      ] as FilterOption[];
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
    const column: any = this as any;

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

  public calculateFilterExpressionSellerContractType = (
    value: unknown,
    selectedFilterOperation: string | null,
    target: string
  ): unknown => createContractTypeHeaderFilterExpression('sellerInfo.sellerIdClientContractType', value);

  public calculateFilterExpressionBuyerContractType = (
    value: unknown,
    selectedFilterOperation: string | null,
    target: string
  ): unknown => createContractTypeHeaderFilterExpression('buyerInfo.buyerIdClientContractType', value);

  private restoreHiddenLotStateFromLocalStorage(): void {
    if (!this.isHiddenLotCheckboxVisible) {
      return;
    }

    const isHiddenLot = this.localStorageService.getItemFromLocalStorage(
      DEALS_HIDDEN_LOT_STATE_KEY
    );

    if (typeof isHiddenLot === 'boolean') {
      this.isHiddenLot = isHiddenLot;
    }
  }

  private scheduleHiddenLotColumnVisibilityForClick(): void {
    if (this.hiddenLotRafId) {
      cancelAnimationFrame(this.hiddenLotRafId);
    }

    this.hiddenLotRafId = requestAnimationFrame(() => {
      this.ngZone.runOutsideAngular(() => this.runHiddenLotColumnVisibilityUpdate());
    });
  }

  private runHiddenLotColumnVisibilityUpdate(): void {
    this.lastAppliedHiddenLotColumns = applyHiddenLotGridColumnsVisibility(
      this.dataGrid?.instance,
      {
        mode: this.hiddenLotDisplayMode,
        extendedFields: this.hideLotColumnFields,
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
