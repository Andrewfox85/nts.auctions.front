import { CompareCounterComponent } from './components/compare-counter/compare-counter.component';
import { AnalogsTableComponent } from './components/analogs-table/analogs-table.component';
import {
  Component,
  ViewChild,
  ElementRef,
  HostListener,
  Input,
  inject,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FULL_PERCENT, IdInterfaceField, IdSessionPeriods } from '@constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DynamicColumns } from './interfaces/index';
import { CounterService, CurrencyService } from '@services';
import { PageCache, User } from '@classes';
import { CounterOfferTableComponent } from './../counter-offer-table/counter-offer-table.component';
import { round, getTranslateResultByCurrentLang, getVatNumber } from '@helpers';
import { FormBuilder } from '@angular/forms';
import { IGoodsSpecifications } from '@interfaces';
import { Status } from './constants';
import { AngularSplitModule } from 'angular-split';
import { ID_REFERENCE_NAME, FILTER_ITEMS } from './constants';
import { DemandCounter } from './interfaces';
import {
  DxScrollViewModule,
  DxListModule,
  DxCheckBoxModule,
  DxPopupModule,
} from 'devextreme-angular';
import { GlobalStore } from '@store';
import { DxCheckBoxTypes } from 'devextreme-angular/ui/check-box';
import { ChangeDetectorRef } from '@angular/core';
import { TCounterOffer } from './../counter-offer-table/interfaces/index';
import { VALUE_WITHOUT_VAT_ID } from './../../views/dutch-down-auction/components/submitting-counter-demand/constants/index';
import { FILTER_ITEM_ID } from './enums';

@Component({
  selector: 'app-analogs-list',
  imports: [
    CommonModule,
    DxScrollViewModule,
    DxListModule,
    DxCheckBoxModule,
    DxPopupModule,
    TranslateModule,
    AngularSplitModule,
    AnalogsTableComponent,
    CounterOfferTableComponent,
    CompareCounterComponent,
  ],
  templateUrl: './analogs-list.component.html',
  styleUrl: './analogs-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalogsListComponent implements OnInit, OnChanges {
  private readonly translate = inject(TranslateService);
  private readonly counterService = inject(CounterService);
  private readonly currencyService = inject(CurrencyService);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly IdInterfaceField = IdInterfaceField;
  public readonly IdSessionPeriods = IdSessionPeriods;
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() fullInfo;
  @Input({ required: true }) analogs: any[];
  @Input({ required: true }) sessionIds: any;
  @Input({ required: true }) idDemand: number;
  @Input({ required: true }) isMine: boolean;
  @Input({ required: true }) roleToAction: boolean;
  @Input({ required: true }) isAvailableAnalogListIcon: boolean; //значение иконки в гриде для отображение правильного сообщения о статусе списка
  @Output() availableAnalogListChanged = new EventEmitter<boolean>();
  @ViewChild('showFilter') showFilter: ElementRef;
  @ViewChild('showFilterList') showFilterList: ElementRef;

  public user: User;
  public cache = {} as PageCache;

  public showFilters = false;
  public currencyForFilter = []; //фильтр валюты
  public selectedItemKeysFilter = []; //выбранные элементы в фильтре
  public analogsForShow = signal<any[]>([]);
  public filteredCounters = signal<TCounterOffer[]>([]); //встречки по конкретному товару
  public counters: TCounterOffer[];
  public countersGoods: any;
  public isMyAnalogs = false;
  public showCounters = false;
  public showDifferences = false;
  public selectedRow: any; // выделеный аналог
  public selectedCountersRow: DemandCounter; // выделенная встречка
  public dynamicColumns = signal<DynamicColumns[]>([]);

  public currencyPrecision: number;
  public VatField: any; //Ставка НДС
  public uniqueDelConditions = []; //уникальные значения в массиве deliveryConditions
  public basisValue: string; //выбранное значение для базисов
  public deliveryConditionsChoose = []; //выбранный базис
  public totalRowData: any;
  public changedPopup = false;

  public Status = Status;

  public listAnalogsToAccept = [];
  public listAnalogsToDecline = [];

  public isInvalidPeriod: boolean;
  private readonly globalStore = inject(GlobalStore);

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

  public filterItems = FILTER_ITEMS;

  public ngOnInit(): void {
    this.prepareListsForChanging();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!changes) return;
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.cache = JSON.parse(sessionStorage.getItem('AUCTIONS')) || {};
    this.analogsForShow.set(
      this.isMyAnalogs //учитываем установленный фильтр "Мои товары-аналоги"
        ? this.analogs.filter((an) => an.isMine)
        : this.analogs
    );
    this.updateDynamicColumns();
    this.getListDemandCounters();
    this.getPrecision();

    const sessionInfo = !changes['sessionIds']?.currentValue?.session
      ? this.globalStore.computedSessionInfo()
      : changes['sessionIds']?.currentValue?.session;

    this.isInvalidPeriod =
      !sessionInfo.isActive ||
      sessionInfo.idSessionPeriod !== IdSessionPeriods.offersAdjustment;

    this.availableAnalogListChanged.emit(this.isAvailableAnalogList());
  }

  private prepareListsForChanging(): void {
    this.listAnalogsToAccept = this.analogsForShow()
      .filter((item) => item.idStatus === Status.Approved)
      .map((item) => item.idGood);

    this.listAnalogsToDecline = this.analogsForShow()
      .filter((item) => item.idStatus === Status.Rejected)
      .map((item) => item.idGood);
  }

  public updateDynamicColumns(): void {
    const rows = this.analogsForShow();
    const allValues = rows.flatMap((a) => a.values);
    const uniqueNames = Array.from(
      new Map(allValues.map((v) => [v.nameReference, v])).values()
    );

    this.dynamicColumns.set(
      uniqueNames
        .sort((a, b) => {
          if (a.idReference === ID_REFERENCE_NAME) return -1;
          if (b.idReference === ID_REFERENCE_NAME) return 1;

          return a.nameReference.localeCompare(b.nameReference);
        })
        .map((v) => ({
          caption: v.nameReference,
          dataField: v.nameReference,
        }))
    );

    this.analogsForShow.set(
      rows.map((a) => {
      const flat = {
        ...a,
        admission: a.idStatus === Status.Approved ? true : false,
        changed: false, //для проверки, что я что-то щелкнула
        needToSave: false, //для отображения синей иконки (изменили статус но НЕ сохранили)
      };
      a.values.forEach((v) => {
        flat[v.nameReference] = v.nameValue;
      });
      return flat;
    })
    );
  }

  public toggleShowFilters(): void {
    this.showFilters = !this.showFilters;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (
      !this.showFilter.nativeElement.contains(event.target) &&
      !this.showFilterList?.nativeElement.contains(event.target)
    ) {
      if (this.showFilters) {
        this.showFilters = false;
      }
    }
  }

  public onFilterList(e): void {
    const selectedId = e.addedItems?.[0]?.id;

    if (!selectedId || selectedId === FILTER_ITEM_ID.All) {
      this.analogsForShow.set([...this.analogs]);
    } else {
      this.analogsForShow.set(
        this.analogs.filter((item) => item.idStatus === selectedId)
      );
    }

    this.updateDynamicColumns();
  }

  public showGoodsFromDemand(e: DxCheckBoxTypes.ValueChangedEvent): void {
    this.isMyAnalogs = e.value;
    this.analogsForShow.set(
      this.isMyAnalogs
        ? this.analogs.filter((an) => an.isMine)
        : this.analogs
    );
    this.updateDynamicColumns();
  }

  public onRowSelected(row): void {
    this.selectedRow = row;
    this.filterCounters(this.selectedRow?.idGood);

    if (this.showCounters) {
      this.showCounters = !this.showCounters;
    }
  }

  public filterCounters(idGood: number): void {
    const filteredList: TCounterOffer[] = this.counters.filter((c) =>
      c.goods?.some((good) => good.idGood === idGood)
    );
    
    this.filteredCounters.set(filteredList);
  }

  public onAdmissionChanged(event: { item: any; value: boolean }): void {
    const idGood: number = event.item.idGood;
    const value: boolean = event.value;

    event.item.changed = value !== event.item.admission; //ставим иконку об изменении только если текущий выбор отличается от первоначального

    if (event.item.idStatus !== Status.Default) {
      //синяя иконка об обязательном сохранении
      event.item.needToSave = event.item.changed;
    }

    const acceptIndex = this.listAnalogsToAccept.indexOf(idGood);
    const declineIndex = this.listAnalogsToDecline.indexOf(idGood);

    if (value) {
      if (acceptIndex === -1) {
        this.listAnalogsToAccept.push(idGood);
      }
      if (declineIndex !== -1) {
        this.listAnalogsToDecline.splice(declineIndex, 1);
      }
    } else {
      if (declineIndex === -1) {
        this.listAnalogsToDecline.push(idGood);
      }
      if (acceptIndex !== -1) {
        this.listAnalogsToAccept.splice(acceptIndex, 1);
      }
    }
  }

  public onCountersRowSelected(row): void {
    this.selectedCountersRow = row;
    this.compareFields();
  }

  public getListDemandCounters(): void {
    let displayCurrency = this.getDisplayCurrency();

    const processResult = (res) => {
      this.counters = res.demandCounters;
      this.counters.forEach((item, index) => {
        item.counterNumber = index + 1;
      });
      this.getListDemandCountersGoods();
    };

    if (this.user?.IsWorker) {
      this.counterService
        .getListDemandCountersWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idDemand,
          String(displayCurrency)
        )
        .subscribe(processResult);
    } else {
      this.counterService
        .getListDemandCountersTrader(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.idDemand,
          String(displayCurrency),
          this.isMine
        )
        .subscribe(processResult);
    }
  }

  public getListDemandCountersGoods(): void {
    let displayCurrency = this.getDisplayCurrency();

    this.counterService
      .getListDemandCountersGoods(
        this.user?.token,
        this.idDemand,
        String(displayCurrency)
      )
      .subscribe((res) => {
        this.countersGoods = res.goods;

         //добавляем товары в массив встречек
         this.counters.forEach((counter) => {
          let findedGoods: any = this.countersGoods.filter(
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
          counter.goodName = findedGoods[0]?.values?.find((item) => item.idReference === ID_REFERENCE_NAME)?.nameValue;
        });

        if (this.selectedRow?.idGood) {
          this.filterCounters(this.selectedRow?.idGood);
        }
      });
  }

  public getDisplayCurrency(): string | number {
    if (this.isMine) {
      return '';
    }

    const cashedCurrency = this.cache?.filters?.displayCurrency;

    if (cashedCurrency == -1) {
      return '';
    } else {
      return cashedCurrency;
    }
  }

  public onCheckboxValueChange(): void {
    this.showDifferences = !this.showDifferences;
  }

  public getPrecision(): void {
    if (this.currencyPrecision) {
      this.prepareCounterGood();
      return;
    }

    this.currencyService
      .getPrecision(
        this.user?.token,
        this.fullInfo.goods?.[0].goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.currency
        )?.fieldValueNumber
      )
      .subscribe((res) => {
        this.currencyPrecision = res;
        this.prepareCounterGood();
      });
  }

  public prepareCounterGood(): void {
    if (this.fullInfo.deliveryConditions?.length > 0) {
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
    this.fullInfo.goods?.forEach((good) => {
      good.goodValues.sort((a, b) =>
        a.idReference === ID_REFERENCE_NAME
          ? -1
          : b.idReference === ID_REFERENCE_NAME
          ? 1
          : 0
      );

      //создаем строку всех значений хар-к
      good.goodValues.forEach((ref) => {
        if (!ref.listValues || ref.listValues.length === 0) {
          ref.valueNamesString = '-';
        } else {
          const baseString = ref.listValues
            .map((val) => val.valueName)
            .join(', ');
          ref.valueNamesString = ref.isAllowAnalogs
            ? `${baseString}, аналоги`
            : baseString;
        }
      });

      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField == IdInterfaceField.VATrate
      ); //Ставка НДС

      // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
      let count = Number(
        good.goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.quantity
        ).fieldValueNumber
      ); //количество
      let priceWithoutVat = Number(
        good.goodsSpecifications.find(
          (field) => field.idInterfaceField == IdInterfaceField.priceWithoutVAT
        ).fieldValueNumber
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

      Object.assign(good, {
        currency: good.goodsSpecifications.find(
          (field) => field.idInterfaceField === IdInterfaceField.currency
        ).fieldValue,
      }); //добавляем каждому товару Валюта
    });

    this.totalForm.controls.vat.patchValue(this.VatField.fieldValue); //Ставка НДС (%)
    //Количество
    let volumeSum = 0,
      precision;
    this.fullInfo.goods?.forEach((good) => {
      let volume = good.goodsSpecifications.find(
        (field) => field.idInterfaceField === IdInterfaceField.quantity
      );
      volumeSum = volumeSum + volume.fieldValueNumber;
      precision = volume.fieldPrecision;
    });
    this.totalForm.controls.quantity.patchValue(
      Number(volumeSum).toLocaleString('ru', {
        maximumFractionDigits: precision,
      }) +
        ' ' +
        this.fullInfo.goods?.[0].unitName
    );
    this.totalForm.controls.quantityForCompare.patchValue(Number(volumeSum));

    if (this.fullInfo.deliveryConditions?.length > 0) {
      this.onChangeBasis({ value: this.basisValue }); //сразу рассчитываем с проставленным базисом
    } else this.changeTotalCost(); //сразу рассчитываем без базиса
  }

  public changeTotalCost(): void {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat: number = getVatNumber(this.VatField);

    this.fullInfo.goods?.forEach((good) => {
      if (this.fullInfo.deliveryConditions?.length > 0) {
        this.deliveryConditionsChoose.forEach((basis) => {
          if (
            basis.idDemandOfferGood ==
            good.goodsSpecifications[0].idDemandOfferGood
          ) {
            let count = Number(
              good.goodsSpecifications.find(
                (field) => field.idInterfaceField === IdInterfaceField.quantity
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
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.quantity)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField === IdInterfaceField.priceWithoutVAT)
            .fieldValueNumber
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

  public onChangeBasis(e: { value?: string }): void {
    this.deliveryConditionsChoose = [];
    this.deliveryConditionsChoose = this.fullInfo.deliveryConditions.filter(
      (it) => it.concatedCondition == e.value
    );

    this.changeTotalCost();

    if (this.deliveryConditionsChoose?.length > 0) {
      /*  this.compareBasis();
      this.compareGoods(); */
    }
  }

  public compareFields(): void {
    this.selectedCountersRow.currencyMatch =
      this.getValue(
        this.fullInfo.goods?.[0].goodsSpecifications,
        IdInterfaceField.currency
      ) === this.selectedCountersRow.currencyName;

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

    this.selectedCountersRow.vatMatch = vatNumber === this.selectedCountersRow.vatPercent;

    this.selectedCountersRow.paymentConditionsMatch =
      this.fullInfo?.generalInfo?.concatedPaymentConditions ===
      this.selectedCountersRow.concatedPaymentConditions;
    this.selectedCountersRow.deliveryPeriodMatch =
      this.fullInfo?.generalInfo?.concatedDeliveryPeriod ===
      this.selectedCountersRow.concatedDeliveryPeriod;
    this.selectedCountersRow.totalAmountMatch =
      this.totalRowData?.costVatForCompare ===
      this.selectedCountersRow.totalAmount;
    this.selectedCountersRow.totalVolumeMatch =
      this.totalRowData?.quantityForCompare ===
      this.selectedCountersRow.totalVolume;
    this.selectedCountersRow.priceAdjustedMatch =
      this.selectedCountersRow.isPriceAdjusted != null
        ? this.getValue(
            this.fullInfo.goods?.[0].goodsSpecifications,
            IdInterfaceField.adjustedPrice
          ) == this.selectedCountersRow.isPriceAdjusted.toString()
        : false;

    this.compareReferences();
    this.compareBasis();
  }

  public compareReferences(): void {
    const goodValues = this.fullInfo.goods?.[0].goodValues;

    this.selectedCountersRow.goods?.[0]?.values.forEach((val) => {
      const matchingRef = goodValues.find(
        (ref) => ref.idReference === val.idReference
      );
      if (matchingRef) {
        val.valueMatch = matchingRef.valueNamesString === val.nameValue;
      } else {
        val.valueMatch = false;
      }
    });
  }

  public compareBasis(): void {
    this.selectedCountersRow.deliveryConditionMatch =
      this.deliveryConditionsChoose[0].concatedCondition ===
      this.selectedCountersRow?.concatedDeliveryCondition;
  }

  public getValue(
    goodsSpecifications: IGoodsSpecifications[],
    idInterfaceField: number
  ): string {
    return goodsSpecifications?.find(
      (it) => it.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  public updateAnalogList(): void {
    this.counterService
      .getListDemandAnalogTradeInfo(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.idDemand
      )
      .subscribe((res) => {
        this.analogs = res.analogues;
        this.analogsForShow.set([...this.analogs]);
        this.updateDynamicColumns();
      });
  }

  public isExistChangedRow(): boolean {
    //проверяем есть ли кликнутые строки
    return this.analogsForShow().some((a) => a.changed);
  }

  public isAvailableAnalogList(): boolean {
    //проверяем сформирован ли список (наличие статуса НЕ РАССМОТРЕН)
    return (
      this.analogsForShow().some((a) => a.idStatus === Status.Default) ||
      this.analogsForShow().some((a) => a.idStatus === Status.Empty)
    );
  }

  public saveChanges(): void {
    const isExistChangedRow: boolean = this.isExistChangedRow();
    const isAvailableAnalogList: boolean = this.isAvailableAnalogList();
    const allProcessed: boolean =
      this.listAnalogsToAccept?.length + this.listAnalogsToDecline?.length ===
      this.analogsForShow().length;

    if (isAvailableAnalogList && !allProcessed) {
      this.changedPopup = true;
    }
    if ((isExistChangedRow && !isAvailableAnalogList) || allProcessed) {
      this.acceptAndDecline();
    }
  }

  public declineAndContinie(): void {
    this.listAnalogsToDecline = this.analogsForShow()
      .filter((item) => {
        const isUnchangedAndInitial: boolean =
          !item.changed &&
          [Status.Empty, Status.Default].includes(item.idStatus);

        return isUnchangedAndInitial || item.idStatus === Status.Rejected;
      })

      .map((item) => item.idGood);

    this.acceptAndDecline();
    this.changedPopup = false;
  }

  public acceptAndDecline(): void {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      idDemand: this.idDemand,
      listGoodsAccepted:
        this.listAnalogsToAccept?.length > 0 ? this.listAnalogsToAccept : null,
        listGoodsDeclined:
        this.listAnalogsToDecline?.length > 0
          ? this.listAnalogsToDecline
          : null,
    };

    this.counterService
      .demandAnalogAcceptAndDecline(this.user?.token, body)
      .subscribe((res) => {
        this.listAnalogsToAccept = [];
        this.listAnalogsToDecline = [];
        this.updateAnalogList();
        this.availableAnalogListChanged.emit(false);
      });
  }

  public openCounters(): void {
    this.showCounters = !this.showCounters;
    this.onCountersRowSelected(this.filteredCounters()[0]); //сразу выбираем первую встречку в списке
  }

  public closeChangedPopup(): void {
    this.changedPopup = false;
  }
}
