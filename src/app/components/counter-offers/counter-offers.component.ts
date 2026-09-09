import {
  Component,
  OnInit,
  Input,
  ViewChild,
  SimpleChanges,
  inject,
  HostListener,
  ElementRef,
  input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageCache, User } from '@classes';
import {
  CommonService,
  ToastService,
  CurrencyService,
  CounterService,
  DemandService,
} from '@services';
import { FormBuilder } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import {
  DX_MODULES,
  pricingType,
  auctionType,
  IdInterfaceField,
  SPECIAL_FIELDS_AGRI,
  IdSessionPeriods,
  goodRefId,
  FULL_PERCENT
} from '@constants';
import { IGoodsSpecifications, ICounterOfferSelectedRow } from '@interfaces';
import {
  CounterOfferTableComponent,
  CounterOffersPurchaseSaleTermsComponent,
  CounterOffersGoodsTableComponent,
  CounterOffersSellerInfoComponent,
  CounterOffersBuyerInfoComponent,
} from '../index';
import {
  round,
  checkSameUnits,
  getVatNumber,
  getTranslateResultByCurrentLang,
  transformToFlatStructure
} from '@helpers';
import { FilterOption } from './../../features/trading/pages/messages/shared/interfaces/index';
import { SelectionChangedEvent } from 'devextreme/ui/list';
import { HomePageStore } from '../../views/homepage/store';
import { AUCTION_TYPE, DELIVERY_SCOPE_ITEMS } from '../../shared/enums';
import { SECTIONS_TYPES } from './../../features/header/enums/index';
import { OffersAdditionalInfoComponent } from '../../features/trading/components/offers-additional-info/offers-additional-info.component';
import {
  OfferCountersGoodsResponse,
  OfferGood,
  DemandCountersGoodsResponse,
  DemandGood,
  ListDemandCountersResponse,
  ListDemandCountersWorkerResponse,
  DemandCounter,
  ListOfferCountersResponse,
  ListOfferCountersWorkerResponse,
  OfferCounter
} from './../../services/counter-service/shared/interfaces/index';
import { VALUE_WITHOUT_VAT_ID } from './../../views/dutch-down-auction/components/submitting-counter-demand/constants/index';
import { switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-counter-offers',
  standalone: true,
  imports: [
    ...DX_MODULES,
    CommonModule,
    TranslateModule,
    AngularSplitModule,
    CounterOfferTableComponent,
    CounterOffersPurchaseSaleTermsComponent,
    CounterOffersGoodsTableComponent,
    CounterOffersSellerInfoComponent,
    CounterOffersBuyerInfoComponent,
    OffersAdditionalInfoComponent
  ],
  templateUrl: './counter-offers.component.html',
  styleUrls: ['./counter-offers.component.scss'],
})
export class CounterOffersComponent implements OnChanges {
  public readonly idDemandOffer = input.required<number>();

  private readonly translate = inject(TranslateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly currencyService = inject(CurrencyService);
  public readonly toastService = inject(ToastService);
  private readonly counterService = inject(CounterService);
  private readonly commonService = inject(CommonService);
  private readonly homePageStore = inject(HomePageStore);
  private readonly demandService = inject(DemandService);

  protected readonly auctionType = auctionType;
  protected readonly IdInterfaceField = IdInterfaceField;
  public readonly IdSessionPeriods = IdSessionPeriods;

  @Input() fullInfo;
  @Input() isMine;
  @Input() sessionIds;
  @Input() idOffer;
  @Input() deliveryConditions;
  @Input() goodsOriginal;
  @Input() editRulesIntersections;
  @Input() uniqueDeliveryScopes;
  @Input() isAllowAnalog: boolean;
  @Output() counterInfo = new EventEmitter<ICounterOfferSelectedRow>();

  @ViewChild('showFilter') showFilter: ElementRef;
  @ViewChild('showFilterList') showFilterList: ElementRef;

  public readonly idAuctionType = this.homePageStore.idAuctionType();
  public readonly AUCTION_TYPE = AUCTION_TYPE;
  public stateMyCounter = false;
  user: User;
  cache = {} as PageCache;
  selectedRow: ICounterOfferSelectedRow; //выделеная встречка
  counters: any;
  countersGoods: any;
  showDifferences: boolean = false; //чекбокс показат отличия

  currencyPrecision: number;
  uniqueDelConditions = []; //уникальные значения в массиве deliveryConditions
  basisValue: string; //выбранное значение для базисов
  deliveryConditionsChoose = []; //выбранный базис

  VatField: any; //Ставка НДС
  pricingType = pricingType;
  totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
    costVatForCompare: [],
    quantityForCompare: [],
    currency: [],
  });
  goodInfo = false;
  viewInfoGood = null;
  totalRowData: any; //инфа в строку Итого по товарам

  isVisibleDeletePopup = false;

  public showFilters = false;
  public currencyForFilter = []; //фильтр валюты
  public selectedItemKeysFilter: FilterOption[] = []; //выбранные элементы в фильтре

  @ViewChild('dataGridRegister') dataGridRegister: DxDataGridComponent;


  ngOnChanges(changes: SimpleChanges): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.cache =
      JSON.parse(sessionStorage.getItem('AUCTIONS')) ||
      JSON.parse(sessionStorage.getItem('OFFERS')) ||
      {};
    if (changes['fullInfo']) {
      if (this.selectedRow) {
        this.selectedRow.goods = null;
        this.selectedRow = null;
      }
    }

    if (
      this.sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
    ) {
      this.getCurrencyForFilter();
    } else {
      this.getListOfferCounters();
    }
    this.currencyPrecision = null;
    this.getPrecision();
  }

  private getCurrencyForFilter(): void {
    this.commonService
      .getByName(this.user?.token, 'currencies')
      .subscribe((res) => {
        this.currencyForFilter = res.refbooks;
        this.currencyForFilter.unshift({
          id: '-1',
          name: 'по умолчанию',
          description: null,
        });

        this.selectedItemKeysFilter = [this.currencyForFilter[0]];

        this.getListDemandCounters();
      });
  }

  public toggleShowFilters(): void {
    this.showFilters = !this.showFilters;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (
      !this.showFilter?.nativeElement.contains(event.target) &&
      !this.showFilterList?.nativeElement.contains(event.target)
    ) {
      if (this.showFilters) {
        this.showFilters = false;
      }
    }
  }

  private getDisplayCurrency(): string | number {
    if (this.isMine) {
      return '';
    }

    const cashedCurrency =
      this.sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
        ? this.selectedItemKeysFilter[0]?.id
        : this.cache?.filters?.displayCurrency;

    if (cashedCurrency == -1) {
      return '';
    } else {
      return cashedCurrency;
    }
  }

  public onCurrencyFilterChanged(e: SelectionChangedEvent): void {
    this.getListDemandCounters();
    let displayCurrency = this.getDisplayCurrency();
    this.demandService
      .getOfferShortInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idDemandOffer(),
        2,
        'GetDemandShortInfo',
        'IdDemand',
        String(displayCurrency)
      )
      .subscribe((res) => {
        this.fullInfo.generalInfo = res.generalInfo;
        this.fullInfo.goods = res.goods;
        this.fullInfo.deliveryConditions = res.deliveryConditions;
        this.getPrecision();
      });
  }

  private getListOfferCounters(): void {
    const displayCurrency: string | number = this.getDisplayCurrency();

    const counters$: Observable<ListOfferCountersWorkerResponse | ListOfferCountersResponse> = this.user?.IsWorker
    ? this.counterService.getListOfferCountersWorker(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idOffer,
        String(displayCurrency)
      )
    : this.counterService.getListOfferCountersTrader(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idOffer,
        String(displayCurrency),
        this.isMine
      );

      counters$
      .pipe(
        switchMap((res: ListOfferCountersResponse) => {
          const rawCounters: OfferCounter[] = res.offerCounters;
  
          rawCounters.forEach((item, index) => {
            item.counterNumber = index + 1;
          });
  
          return this.getListOfferCountersGoods(rawCounters);
        })
      )
      .subscribe({
        next: (completedCounters: OfferCounter[]) => {
          this.counters = completedCounters; //триггерим инпут в дочерней компоненте только после того как добавили товары во встречки
          this.selectedRow = this.counters[0];
          this.compareFields();
        }
      });
  }

  private getListOfferCountersGoods(rawCounters: OfferCounter[]): Observable<OfferCounter[]> {
    const displayCurrency: string | number = this.getDisplayCurrency();

    return this.counterService
      .getListOfferCountersGoods(
        this.user?.token,
        this.idOffer,
        String(displayCurrency)
      )
      .pipe(
        map((res: OfferCountersGoodsResponse) => {
          this.countersGoods = res.goods;
  
          //добавляем товары в массив встречек
          rawCounters.forEach((counter) => {
            let findedGoods: OfferGood[] = this.countersGoods.filter(
              (good) => good.idOfferCounter === counter.idOfferCounter
            );
  
            counter.goods = findedGoods;
          });
  
          return rawCounters;
        })
      );
  }


  private getListDemandCounters(): void {
    let displayCurrency = this.getDisplayCurrency();

    const counters$: Observable<ListDemandCountersResponse | ListDemandCountersWorkerResponse> = this.user?.IsWorker
      ? this.counterService.getListDemandCountersWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer,
          String(displayCurrency)
        )
      : this.counterService.getListDemandCountersTrader(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idOffer,
          String(displayCurrency),
          this.isMine
        );

    counters$
      .pipe(
        switchMap((res: ListDemandCountersResponse) => {
          const rawCounters: DemandCounter[] = res.demandCounters;

          rawCounters.forEach((item, index) => {
            item.counterNumber = index + 1;
          });

          return this.getListDemandCountersGoods(rawCounters);
        })
      )
      .subscribe({
        next: (completedCounters: DemandCounter[]) => {

          let finalCounters: DemandCounter[] = completedCounters;

          if (this.stateMyCounter) {
            finalCounters = finalCounters.filter((counter) => counter.isMine);
          }

          this.counters = finalCounters; //триггерим инпут в дочерней компоненте только после того как добавили товары во встречки

          this.selectedRow = this.selectedRow?.idDemandCounter
            ? this.counters.find(
                (c) => c.idDemandCounter === this.selectedRow?.idDemandCounter
              )
            : this.counters[0];

          this.compareFields();
        }
      });
  }

  private getListDemandCountersGoods(rawCounters: DemandCounter[]): Observable<DemandCounter[]> {
    const displayCurrency: string | number = this.getDisplayCurrency();

    return this.counterService
      .getListDemandCountersGoods(
        this.user?.token,
        this.idOffer,
        String(displayCurrency)
      )
      .pipe(
        map((res: DemandCountersGoodsResponse) => {
          this.countersGoods = res.goods;

          //добавляем товары в массив встречек
          rawCounters.forEach((counter) => {
            let findedGoods: DemandGood[] = this.countersGoods.filter(
              (good) => good.idDemandCounter === counter.idDemandCounter
            );

            //рассчитываем сумму ндс для товаров встречки
            findedGoods.forEach((good) => {
              const costWithoutVAT: number = good.volume * good.priceWithoutVat;
              good.amountVAT = counter.vatPercent
                ? costWithoutVAT * (counter.vatPercent / FULL_PERCENT)
                : 0;
            });

            counter.goods = findedGoods;
            counter.goodName = findedGoods[0]?.values?.find(
              (item) => item.idReference === goodRefId
            )?.nameValue;
          });

          return rawCounters;
        })
      );
  }

  private getPrecision(): void {
    if (this.currencyPrecision) {
      this.prepareGoods();
      return;
    }

    this.currencyService
      .getPrecision(
        this.user?.token,
        this.fullInfo.goods[0].goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.currency
        )?.fieldValueNumber
      )
      .subscribe((res) => {
        this.currencyPrecision = res;
        this.prepareGoods();
      });
  }

  private prepareGoods(): void {
    if (this.fullInfo.deliveryConditions?.length > 0) {
      this.fullInfo.deliveryConditions = transformToFlatStructure(this.fullInfo.deliveryConditions);
      this.uniqueDelConditions = [
        ...new Map(
          this.fullInfo.deliveryConditions.map(
            (
              item //уникальные значения в массиве deliveryConditions
            ) => [item['concatedCondition'], item]
          )
        ).values(),
      ];
      let main = this.uniqueDelConditions.find((basis) => basis.isMain == true);
      this.basisValue = main?.concatedCondition;
      this.uniqueDelConditions.splice(
        this.uniqueDelConditions.indexOf(main),
        1
      );
      this.uniqueDelConditions.splice(0, 0, main);
    }

    //добавляем в товары стоимость ндс/стоимость с/без ндс
    this.fullInfo.goods.forEach((good) => {
      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField == 5
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
          (field) => field.idInterfaceField == 4
        ).fieldValue,
      }); //добавляем каждому товару Валюта

      if (
        this.fullInfo.generalInfo.pricingTypeId ==
        this.pricingType.formulaWithQuotation
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
        this.fullInfo.generalInfo.pricingTypeId ==
        this.pricingType.formulaWithoutQuotation
      ) {
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 53
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }
    });

    this.totalForm.controls.vat.patchValue(this.VatField.fieldValue); //Ставка НДС (%)
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
      this.totalForm.controls.quantityForCompare.patchValue(Number(volumeSum));
    }
    if (this.fullInfo.deliveryConditions?.length > 0) {
      this.onChangeBasis({ value: this.basisValue }); //сразу рассчитываем с проставленным базисом
    } else this.changeTotalCost(); //сразу рассчитываем без базиса

    //получаем точность валюты
    if (
      this.fullInfo.generalInfo.pricingTypeId ==
      pricingType.formulaWithQuotation
    ) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.fullInfo.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          ).fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
        });
    }
  }

  private changeTotalCost(): void {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat: number = getVatNumber(this.VatField);
    if (
      this.fullInfo.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      this.fullInfo.goods.forEach((good) => {
        if (this.fullInfo.deliveryConditions?.length > 0) {
          this.deliveryConditionsChoose.forEach((basis) => {
            if (
              basis.idDemandOfferGood ==
              good.goodsSpecifications[0].idDemandOfferGood
            ) {
              let count = Number(
                good.goodsSpecifications.find(
                  (field) => field.idInterfaceField == 1
                ).fieldValueNumber
              ); //количество
              let priceWithoutVat = basis?.priceWithoutVat; //Цена без НДС

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
            }
          });
        } else {
          let count = Number(
            good.goodsSpecifications.find(
              (field) => field.idInterfaceField == 1
            ).fieldValueNumber
          ); //количество
          let priceWithoutVat = Number(
            good.goodsSpecifications.find(
              (field) => field.idInterfaceField == 3
            ).fieldValueNumber
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
        })
      );
      this.totalForm.controls.currency.patchValue(
        this.fullInfo.goods?.[0]?.currency
      );

      this.totalForm.controls.costVatForCompare.patchValue(costVATTotal);

      this.totalRowData = this.totalForm.value;
    }
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.fullInfo.goods);
  }

  public onChangeBasis(e: { value?: string }): void {
    this.deliveryConditionsChoose = [];
    this.deliveryConditionsChoose = this.fullInfo.deliveryConditions.filter(
      (it) => it.concatedCondition == e.value
    );
    if (
      this.fullInfo.generalInfo.pricingTypeId !=
      pricingType.formulaWithoutQuotation
    ) {
      this.changeTotalCost();
    }
    if (this.deliveryConditionsChoose?.length > 0) {
      this.compareBasis();
      this.compareGoods();
    }
  }

  public getValue(
    goodsSpecifications: IGoodsSpecifications[],
    idInterfaceField: number
  ): string {
    return goodsSpecifications.find(
      (it) => it.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  public changeWithMyCounterstate(stateMyCounter: boolean): void {
    this.stateMyCounter = stateMyCounter;
  }

  public compareFields(): void {
    if (!this.selectedRow) return;
    if (
      this.sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
    ) {
      this.selectedRow.currencyMatch =
        this.getValue(
          this.fullInfo.goods[0].goodsSpecifications,
          IdInterfaceField.currency
        ) === this.selectedRow.currencyName;

      const vatString: string = this.getValue(
        this.fullInfo.goods[0].goodsSpecifications,
        IdInterfaceField.VATrate
      );

      let vatNumber: number | null;

      if (vatString === VALUE_WITHOUT_VAT_ID) {
        vatNumber = null;
      } else {
        vatNumber = Number(vatString.replace('%', ''));
      }

      this.selectedRow.vatMatch = vatNumber === this.selectedRow.vatPercent;

      if (this.isSpecialFields()) {
        this.makeArrayAndCompareForSpecialFields();
      }
    }

    this.selectedRow.paymentConditionsMatch =
      this.fullInfo.generalInfo.concatedPaymentConditions ===
      this.selectedRow.concatedPaymentConditions;
    this.selectedRow.deliveryPeriodMatch =
      this.fullInfo.generalInfo.concatedDeliveryPeriod ===
      this.selectedRow.concatedDeliveryPeriod;
    this.selectedRow.totalAmountMatch =
      this.totalRowData?.costVatForCompare === this.selectedRow.totalAmount;
    this.selectedRow.totalVolumeMatch =
      this.totalRowData?.quantityForCompare === this.selectedRow.totalVolume;
    this.selectedRow.priceAdjustedMatch =
      this.selectedRow.isPriceAdjusted != null
        ? this.getValue(
            this.fullInfo.goods[0].goodsSpecifications,
            IdInterfaceField.adjustedPrice
          ) == this.selectedRow.isPriceAdjusted.toString()
        : false;
    this.compareGoods();
    this.compareBasis();
  }

  private compareGoods(): void {
    if (!this.selectedRow) return;
    if (this.selectedRow.goods?.length > 0) {
      this.selectedRow?.goods.forEach((counterGood) => {
        let matchingGood = this.fullInfo.goods.find((good) =>
          good.goodsSpecifications.some(
            (spec) =>
              spec.idDemandOfferGood === counterGood.idOfferGood ||
              counterGood.idDemandGood
          )
        );
        if (matchingGood) {
          let volume = matchingGood.goodsSpecifications.find(
            (spec) =>
              spec.idDemandOfferGood ===
                (counterGood.idOfferGood || counterGood.idDemandGood) &&
              spec.idInterfaceField === IdInterfaceField.quantity
          )?.fieldValueNumber;
          counterGood.volumeMatch = volume === counterGood.volume;

          let price; //цену/поправка первый раз сравниаем из goods, при смене базисов берем хар-ки из базисов
          if (this.deliveryConditionsChoose.length > 0)
            price =
              Number(
                this.deliveryConditionsChoose?.find(
                  (b) =>
                    b.idDemandOfferGood == counterGood.idOfferGood ||
                    counterGood.idDemandGood
                )?.priceWithoutVat
              ) || null;
          else
            price = matchingGood.goodsSpecifications.find(
              (spec) =>
                spec.idDemandOfferGood ===
                  (counterGood.idOfferGood || counterGood.idDemandGood) &&
                spec.idInterfaceField === IdInterfaceField.priceWithoutVAT
            ).fieldValueNumber;

          counterGood.priceWithoutVatMatch =
            price === counterGood.priceWithoutVat;

          let priceAdjustment;
          if (this.deliveryConditionsChoose.length > 0)
            priceAdjustment =
              Number(
                this.deliveryConditionsChoose?.find(
                  (b) =>
                    b.idDemandOfferGood == counterGood.idOfferGood ||
                    counterGood.idDemandGood
                )?.priceAdjustment
              ) || null;
          else
            priceAdjustment = matchingGood.goodsSpecifications.find(
              (spec) =>
                spec.idDemandOfferGood ===
                  (counterGood.idOfferGood || counterGood.idDemandGood) &&
                spec.idInterfaceField === IdInterfaceField.amendment
            ).fieldValueNumber;

          counterGood.priceAdjustmentMatch =
            priceAdjustment === counterGood.priceAdjustment;

          let costVat = matchingGood.goodsSpecifications.find(
            (spec) => 'costVAT' in spec
          );
          counterGood.costVatMatch =
            costVat.fieldValue === counterGood.totalAmount;
        }
      });
    }
  }

  private compareBasis(): void {
    if (!this.selectedRow) return;
    this.selectedRow.deliveryConditionMatch =
      this.deliveryConditionsChoose?.[0]?.concatedCondition ===
      this.selectedRow?.concatedDeliveryCondition;
  }

  public isSpecialFields(): boolean {
    const result = this.fullInfo.goods[0].goodsSpecifications.filter((field) =>
      SPECIAL_FIELDS_AGRI.includes(field.idInterfaceField)
    );
    return this.selectedRow.goods?.length > 0 &&
    this.sessionIds.sectionId == SECTIONS_TYPES.AGRI &&
    this.sessionIds.session.idAuctionType ===
    auctionType.simpleBuyerAuction
    && result?.length > 0;
  }

  public makeArrayAndCompareForSpecialFields(): void {
    const specMap = this.fullInfo?.goods.reduce((acc, item) => {
      const id = item.goodsSpecifications?.[0]?.idDemandOfferGood;
      if (id) {
        acc[id] = item.goodsSpecifications;
      }
      return acc;
    }, {});

    this.selectedRow.goods = this.selectedRow?.goods.map((good) => {
      const specs = (specMap[good.idDemandGood] || []).map((spec) => {
        switch (spec.idInterfaceField) {
          case IdInterfaceField.expirationDate:
            return { ...spec, fieldValue: good.expirationName };
          case IdInterfaceField.wholesaleMarkup:
            return { ...spec, fieldValue: good.tradeDiscountName };
          default:
            return spec;
        }
      });

      return { ...good, goodsSpecifications: specs };
    });
  }

  public onRowSelected(row): void {
    this.selectedRow = row;
    this.counterInfo.emit(this.selectedRow);
  }

  public deleteCounter(): void {
    const processResult = (res) => {
      this.isVisibleDeletePopup = false;
      let message: string = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'counterOffers.deleteCounterOffersNote');
      this.toastService.onShowToast({ message: message, type: 'error' });
      this.sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
        ? this.getListDemandCounters()
        : this.getListOfferCounters();
      setTimeout(() => {
        if (this.counters.length > 0) {
          this.selectedRow = this.counters[0];
          this.compareFields();
        }
      }, 100);
    };

    if (
      this.sessionIds.session.idAuctionType === auctionType.simpleBuyerAuction
    ) {
      const body = {
        idSection: this.sessionIds.sectionId,
        idDemand: this.fullInfo.generalInfo.idDemandOffer,
        idDemandCounter: this.selectedRow.idDemandCounter,
      };

      this.counterService
        .demandCounterDelete(this.user?.token, body)
        .subscribe(processResult);
    } else {
      const body = {
        idSection: this.sessionIds.sectionId,
        idOffer: this.fullInfo.generalInfo.idDemandOffer,
        idOfferCounter: this.selectedRow.idOfferCounter,
      };

      this.counterService
        .offerCounterDelete(this.user?.token, body)
        .subscribe(processResult);
    }
  }

  public onCheckboxValueChange(): void {
    this.showDifferences = !this.showDifferences;
  }

  public showDeleteVisiblePopup(): void {
    this.isVisibleDeletePopup = true;
  }

  public hideDeleteVisiblePopup(): void {
    this.isVisibleDeletePopup = false;
  }
}
