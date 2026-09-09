import {
  Component,
  ElementRef,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import {
  DxTooltipModule,
  DxCheckBoxModule,
  DxSelectBoxModule,
} from 'devextreme-angular';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonService } from '@services';
import { User } from '@classes';
import {
  IdDirection,
  statusOffersFilters,
  statusDirectOffersFilters,
  statusDeals,
  statusDirectOffersFiltersTr,
  OFFERS_SESSION_STORAGE_KEY,
  DEALS_SESSION_STORAGE_KEY,
  TRADERS_SESSION_STORAGE_KEY,
  AUCTIONS_SESSION_STORAGE_KEY,
} from '@constants';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { HomePageStore } from '../../../views/homepage/store';
import { AUCTION_TYPE } from '@enums';
import { SessionStorageService, LocalStorageService } from '@shared-services';
import { getTranslateResultByCurrentLang } from '@helpers';
import { FloatingActionButtonsDirective } from '@directives';

@Component({
  selector: 'app-filters',
  imports: [
    CommonModule,
    DxTooltipModule,
    DxCheckBoxModule,
    DxSelectBoxModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    FloatingActionButtonsDirective,
  ],
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
})
export class FiltersComponent implements OnInit {
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  private readonly document: Document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly commonService = inject(CommonService);
  private readonly homePageStore = inject(HomePageStore);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly translate = inject(TranslateService);

  @Input() filtersOn: any = {
    idSession: '',
  };
  @Input() nameOfCachePage = '';
  @Input() filterValue;

  @Output() componentData = new EventEmitter<Object>();

  public readonly idAuctionType = this.homePageStore.idAuctionType();
  public readonly AUCTION_TYPES = AUCTION_TYPE;

  public user: User;
  public hideFilters = false;
  public today: Date = new Date();
  public filterDataCache: any;
  public filtersForm = this.formBuilder.group({
    tradersIn: [false],
    tradersOut: [false],
    directionBuy: [false],
    directionSale: [false],
    offers: [false],
    registrations: [false],
    activeStatus: [false],
    unactiveStatus: [false],
    rejectedStatus: [false],
    directionOffers: [null],
    statusOffers: [statusOffersFilters.active],
    statusDirectOffers: [null],
    statusDirectOffersTr: [statusDirectOffersFiltersTr.submitted],
    deals: [statusDeals.fixed],
    displayCurrency: [-1],
    internal: [false],
    external: [false],
    export: [false],
    import: [false],
    bidding: [false],
    observed: [false],
    corrected: [false],
    priceAdjustment: [false],
    multibasis: [false],
    isMine: [false],
    simpleLot: [false],
    compositeLot: [false],
    individualPriceStep: [false],
    myTransactions: [false],
    observedDeals: [false],
    unreliableRegister: [false],
    priceAdjustmentDeals: [false],
    simpleLotDeals: [false],
    compositeLotDeals: [false],
    ownFunds: [false],
    publicProcurement: [false],
    counter: [false],
    counterAnalogs: [false],
    reviewedAnalogs: [false],
    unreviewedAnalogs: [false],
  });

  public displayCurrency: any;
  public IdDirection = IdDirection;
  public statusOffersFilters = statusOffersFilters;
  public statusDirectOffersFilters = statusDirectOffersFilters;
  public statusDirectOffersFiltersTr = statusDirectOffersFiltersTr;
  public statusDeals = statusDeals;
  public offersGroupByStatus: any = [];

  public changedCurrency = false; //для перезапроса данных при изменении валюты отображения
  public changedDirection = false; //для перезапроса данных при изменении направления

  public ngOnInit(): void {
    this.user = this.localStorageService.getItemFromLocalStorage('user');
    this.enableFilters();

    //валюта
    this.commonService
      .getByName(this.user?.token, 'currencies')
      .subscribe((res: any) => {
        this.displayCurrency = res.refbooks;

        this.displayCurrency.unshift({
          id: -1,
          name: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'filters.offerСurrency'),
          description: null,
        });
      });
      
    this.componentData.emit(Object.assign(this.filtersForm.value));
  }

  public updateFilterStatus(newStatus): void {
    this.filtersForm.controls['statusOffers']?.setValue(newStatus);
  }

  public updateFilterStatusDirect(newStatus): void {
    this.filtersForm.controls['statusDirectOffers']?.setValue(newStatus);
  }

  public updateFilterStatusDirectTr(newStatus): void {
    this.filtersForm.controls['statusDirectOffersTr']?.setValue(newStatus);
  }

  public updateFilterDirection(newDirection): void {
    this.filtersForm.controls['directionOffers']?.setValue(newDirection);
  }

  public enableFilters(): void {
    let filterCacheProps = [];
    let previousFilters: any;

    if (this.nameOfCachePage) {
      if (this.nameOfCachePage === 'offers') {
        previousFilters = (
          this.sessionStorageService.getItemFromSessionStorage(
            OFFERS_SESSION_STORAGE_KEY
          ) as any
        )?.filters;

        if (previousFilters && !previousFilters['directionOffers'])
          previousFilters['directionOffers'] = this.determineAuctionDirection(
            this.idAuctionType
          );

        if (previousFilters && !previousFilters['statusDirectOffers']) {
          previousFilters['statusDirectOffers'] =
          this.offersGroupByStatus?.backlogged?.length == 0
              ? statusDirectOffersFilters.reviewed
              : statusDirectOffersFilters.backlogged;
        }

        if (!previousFilters) {
          this.updateFilterDirection(
            this.determineAuctionDirection(this.idAuctionType)
          );
          this.updateFilterStatusDirect(this.offersGroupByStatus?.backlogged?.length == 0
            ? statusDirectOffersFilters.reviewed
            : statusDirectOffersFilters.backlogged);
        }
      }

      if (this.nameOfCachePage === 'traders') {
        previousFilters = (
          this.sessionStorageService.getItemFromSessionStorage(
            TRADERS_SESSION_STORAGE_KEY
          ) as any
        )?.filters;
      }

      if (this.nameOfCachePage === 'auctions') {
        previousFilters = (
          this.sessionStorageService.getItemFromSessionStorage(
            AUCTIONS_SESSION_STORAGE_KEY
          ) as any
        )?.filters;
      }

      if (this.nameOfCachePage === 'deals') {
        previousFilters = (
          this.sessionStorageService.getItemFromSessionStorage(
            DEALS_SESSION_STORAGE_KEY
          ) as any
        )?.filters;
      }
    }

    if (previousFilters) {
      // ключи фильтров кэшированных
      this.filterDataCache = previousFilters;
      filterCacheProps = Object.keys(this.filterDataCache);
    }

    // перебор ключей приходящих фильтров и их отображение
    const responseFilterProps = Object.keys(this.filtersOn);

    for (const prop of responseFilterProps) {
      // перебор ключей приходящих фильтров и их отображение
      if (this.filtersOn[prop]) {
        // перебор ключей приходящих фильтров из кэша и установка значений
        if (this.nameOfCachePage && previousFilters) {
          for (const propCache of filterCacheProps) {
            if (prop === propCache) {
              this.filtersForm.controls[this.filtersOn[prop]]?.patchValue(
                this.filterDataCache[propCache]
              );
            }
          }
        }
      }
    }
  }

  public onCurrChanged(e: ValueChangedEvent): void {
    if (e.value != e.previousValue) {
      this.changedCurrency = true;
    }
  }

  public changeDirection(): void {
    this.changedDirection = true;
  }

  public sendFiltersData(): void {
    this.componentData.emit(Object.assign(this.filtersForm.value));
    this.scrollToTop();
  }

  public clearFilters(): void {
    this.filtersForm.get('tradersIn').reset(false);
    this.filtersForm.get('tradersOut').reset(false);
    this.filtersForm.get('directionBuy').reset(false);
    this.filtersForm.get('directionSale').reset(false);
    this.filtersForm.get('offers').reset(false);
    this.filtersForm.get('registrations').reset(false);
    this.filtersForm.get('activeStatus').reset(false);
    this.filtersForm.get('unactiveStatus').reset(false);
    this.filtersForm.get('rejectedStatus').reset(false);
    this.filtersForm
      .get('directionOffers')
      .setValue(this.determineAuctionDirection(this.idAuctionType));
    this.filtersForm.get('statusOffers').setValue(this.currentOffersStatus);
    this.filtersForm.get('statusDirectOffers').setValue(this.currentDirectOffersStatus);
    this.filtersForm.get('statusDirectOffersTr').setValue(this.currentDirectOffersStatusTrader);
    this.filtersForm.get('deals').setValue(statusDeals.fixed);
    this.filtersForm.get('displayCurrency').setValue(-1);
    this.filtersForm.get('internal').reset(false);
    this.filtersForm.get('external').reset(false);
    this.filtersForm.get('export').reset(false);
    this.filtersForm.get('import').reset(false);
    this.filtersForm.get('bidding').reset(false);
    this.filtersForm.get('observed').reset(false);
    this.filtersForm.get('priceAdjustment').reset(false);
    this.filtersForm.get('multibasis').reset(false);
    this.filtersForm.get('isMine').reset(false);
    this.filtersForm.get('simpleLot').reset(false);
    this.filtersForm.get('compositeLot').reset(false);
    this.filtersForm.get('individualPriceStep').reset(false);
    this.filtersForm.get('myTransactions').reset(false);
    this.filtersForm.get('observedDeals').reset(false);
    this.filtersForm.get('unreliableRegister').reset(false);
    this.filtersForm.get('priceAdjustmentDeals').reset(false);
    this.filtersForm.get('simpleLotDeals').reset(false);
    this.filtersForm.get('compositeLotDeals').reset(false);
    this.filtersForm.get('ownFunds').reset(false);
    this.filtersForm.get('publicProcurement').reset(false);
    this.filtersForm.get('counter').reset(false);
    this.filtersForm.get('corrected').reset(false);
    this.filtersForm.get('counterAnalogs').reset(false);
    this.filtersForm.get('reviewedAnalogs').reset(false);
    this.filtersForm.get('unreviewedAnalogs').reset(false);

    this.componentData.emit(this.filtersForm.value);
    this.scrollToTop();
  }

  private scrollToTop(): void {
    const host: HTMLElement = this.elementRef.nativeElement;
    const containers: Set<HTMLElement> = new Set<HTMLElement>();

    let current: HTMLElement = host;
    while (current) {
      if (current.scrollHeight > current.clientHeight) {
        containers.add(current);
      }
      current = current.parentElement;
    }

    const dxScrollableContainers: NodeListOf<HTMLElement> = this.document.querySelectorAll('.dx-scrollable-container');
    dxScrollableContainers.forEach((node: HTMLElement) => {
      if (node.scrollHeight > node.clientHeight) {
        containers.add(node);
      }
    });

    const scrollingElement: HTMLElement = this.document.scrollingElement as HTMLElement;
    if (scrollingElement) {
      containers.add(scrollingElement);
    }

    const applyScrollTop = (): void => {
      containers.forEach((container: HTMLElement) => {
        if (typeof container.scrollTo === 'function') {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        }
        container.scrollTop = 0;
      });
    };

    applyScrollTop();
  }

  get currentOffersStatus() {
    if (this.offersGroupByStatus?.active?.length > 0) return statusOffersFilters.active;
    if (this.offersGroupByStatus?.unactive?.length > 0) return statusOffersFilters.unactive;
    if (this.offersGroupByStatus?.rejected?.length > 0) return statusOffersFilters.rejectedBeforeBid;
    return statusOffersFilters.active;
  }

  get currentDirectOffersStatus() {
    if (this.offersGroupByStatus?.backlogged?.length > 0) return statusDirectOffersFilters.backlogged;
    if (this.offersGroupByStatus?.reviewed?.length > 0) return statusDirectOffersFilters.reviewed;
    if (this.offersGroupByStatus?.unapproved?.length > 0) return statusDirectOffersFilters.unapproved;
    if (this.offersGroupByStatus?.approved?.length > 0) return statusDirectOffersFilters.approved;
    if (this.offersGroupByStatus?.rejectedBeforeBid?.length > 0) return statusDirectOffersFilters.rejectedBeforeBid;
    return statusDirectOffersFilters.backlogged;
  }

  get currentDirectOffersStatusTrader() {
    if (this.offersGroupByStatus?.submitted?.length > 0) return statusDirectOffersFiltersTr.submitted;
    if (this.offersGroupByStatus?.approved?.length > 0) return statusDirectOffersFiltersTr.approved;
    if (this.offersGroupByStatus?.unapproved?.length > 0) return statusDirectOffersFiltersTr.unapproved;
    if (this.offersGroupByStatus?.reviewed?.length > 0) return statusDirectOffersFiltersTr.reviewed;
    if (this.offersGroupByStatus?.rejectedBeforeBid?.length > 0) return statusDirectOffersFiltersTr.rejectedBeforeBid;
    return statusDirectOffersFiltersTr.submitted;
  }


  private determineAuctionDirection(auctionType: AUCTION_TYPE): number {
    switch (auctionType) {
      case AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION:
        return IdDirection.sale;
      case AUCTION_TYPE.DUTCH_DOWN_AUCTION:
        return IdDirection.buy;
      default:
        return IdDirection.sale;
    }
  }
}
