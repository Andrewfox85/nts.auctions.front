import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
  inject,
} from '@angular/core';
import { User } from '@classes';
import {
  editingRules,
  pricingType,
  DX_MODULES,
  auctionType,
  IdDirection,
  IdInterfaceField,
  IdSessionPeriods,
} from '@constants';
import { CommonService, TradingService } from '@services';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BasisEditInfoComponent } from './basis-edit-info/basis-edit-info.component';
import { RuNumberFormatPipe, ToNumberPipe } from '@pipes';
import { SubmissionService } from '@services';
import { AUCTION_TYPE } from '@enums';
import { HomePageStore } from '../../../views/homepage/store';
import { DxGridContextMenuLocalizationDirective } from '../../../shared/directives';
import { SummaryFormatterService } from '@services';
@Component({
  selector: 'app-basis-edit',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    BasisEditInfoComponent,
    ToNumberPipe,
    RuNumberFormatPipe,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './basis-edit.component.html',
  styleUrls: ['./basis-edit.component.scss'],
})
export class BasisEditComponent implements OnChanges, OnDestroy {
  @Input() deliveryBasis;
  @Input() deliveryBasisCommon; //в виде, в котором отрисовываем
  @Input() idSessionPeriod;
  @Input() goods;
  @Input() pricingTypeId;
  @Input() generalInfo;
  @Input() sessionIds;
  @Input() deliveryConditions; //пересеченные базисы
  @Input() editRulesIntersections; //пересеченные правила
  @Input() goodsOriginal;
  @Output() onHideRedFlag = new EventEmitter<any>();
  @Output() onRedFlag = new EventEmitter<any>();

  // @ViewChild('dataGridDeliveryCondition', {static: false}) dataGrid: DxDataGridComponent;
  @ViewChildren(DxDataGridComponent) dataGrids!: QueryList<DxDataGridComponent>;

  private readonly submissionService = inject(SubmissionService);
  private readonly homePageStore = inject(HomePageStore);
  private readonly idAuctionType = this.homePageStore.idAuctionType();
  readonly summaryFormatterService = inject(SummaryFormatterService);

  public readonly AUCTION_TYPE = AUCTION_TYPE;
  user: User;
  pricingType = pricingType;
  changeVolume: Subscription;
  changeMainBasis: Subscription;
  changeBasis: Subscription;
  changedAddBasis: Subscription;

  openBasis = [];
  addBasisValue = false;
  vat: number;
  //deliveryBasisCommon = []
  isActiveQuotation = false; //наличие контроля по ценовым параметрам котировки
  isActiveCorridor = false; //наличие контроля по ценовым параметрам коридора

  constructor(
    private tradingService: TradingService,
    private commonService: CommonService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['deliveryBasis']) {
      this.initializeComponent();
    }
  }

  initializeComponent(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    let vatValue = this.goods[0].goodsSpecifications.find(
      (el) => el.idInterfaceField == 5
    );
    if (vatValue.fieldValueNumber != 1) {
      this.vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
    } else this.vat = 0;

    if (this.generalInfo.isMinPriceMainBasis) {
      let countLargerPrice = 0,
        countForGood = {},
        count = (this.deliveryBasisCommon.length - 1) * this.goods.length; //для проверки, чтобы убрать красный значок на табке. Количество всех товаров кроме основного базиса.
      this.goods.forEach((g) => {
        countForGood[g.idGood] = 0;
      });
      this.deliveryBasisCommon.forEach((basis) => {
        if (!basis.isMain) {
          basis.goods.forEach((good) => {
            let goodOffer = this.goods.find((g) => g.idGood == good.idGood);
            if (
              good.cost <=
              goodOffer.goodsSpecifications.find(
                (el) => el.idInterfaceField == 3
              ).fieldValueNumber
            ) {
              this.deliveryBasisCommon
                .find((el) => el.isMain)
                .goods.find((gb) => gb.idGood == good.idGood).isMinPriceError =
                true;
              this.onRedFlag.emit();
            } else {
              countForGood[good.idGood] = countForGood[good.idGood] + 1;
              countLargerPrice = countLargerPrice + 1;
            }
          });
        }
      });
      this.goods.forEach((g) => {
        if (countForGood[g.idGood] == this.deliveryBasisCommon.length - 1) {
          this.deliveryBasisCommon
            .find((el) => el.isMain)
            .goods.find((gb) => gb.idGood == g.idGood).isMinPriceError = false;
        }
      });
      if (countLargerPrice == count) {
        this.onHideRedFlag.emit();
        this.deliveryBasisCommon
          .find((el) => el.isMain)
          .goods.forEach((good) => {
            good.isMinPriceError = false;
          });
      }
    }

    this.submissionService
      .checkActivePriceLimit(
        this.user.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.generalInfo.idModel,
        this.generalInfo.directionId
      )
      .subscribe((res) => {
        this.isActiveQuotation = res.activePriceLimit.isActiveQuotation;
        this.isActiveCorridor = res.activePriceLimit.isActiveCorridor;
      });

    this.changeVolume = this.tradingService.changeVolume$.subscribe(
      (res: any) => {
        this.goods = res.goods;

        this.deliveryBasis.forEach((el) => {
          el[1].forEach((good) => {
            let goodOffer = this.goods.find(
              (g) =>
                g.goodsSpecifications[0].idDemandOfferGood ==
                good.idDemandOfferGood
            );
            good.volume = goodOffer.goodsSpecifications.find(
              (sp) => sp.idInterfaceField == 1
            ).fieldValueNumber;
            good.costVat = this.costVatBasis(good.priceWithoutVat, good.volume);
          });
        });
        this.deliveryBasisCommon.forEach((basis) => {
          basis.goods.forEach((good) => {
            let goodOffer = this.goods.find(
              (g) =>
                g.goodsSpecifications[0].idDemandOfferGood ==
                good.idDemandOfferGood
            );
            good.volume = goodOffer.goodsSpecifications.find(
              (el) => el.idInterfaceField == 1
            ).fieldValueNumber;
            good.costVat = this.costVatBasis(good.cost, good.volume);
          });
        });

        this.dataGrids.forEach((dataGrid) => {
          dataGrid.instance.refresh(); // Вызываем refresh() для каждой таблицы
        });
      }
    );

    this.changeMainBasis = this.tradingService.changeMainBasis$.subscribe(
      (res: any) => {
        if (res.str != 'basis') {
          this.goods = res.goods;

          let vatValue = this.goods[0].goodsSpecifications.find(
            (el) => el.idInterfaceField == 5
          );
          if (vatValue.fieldValueNumber != 1) {
            this.vat = Number(vatValue.fieldValue.replace(/[^0-9]/g, ''));
          } else this.vat = 0;

          this.deliveryBasis.forEach((el) => {
            if (el[1][0].isMain) {
              el[1].forEach((good) => {
                let goodOffer = this.goods.find(
                  (g) =>
                    g.goodsSpecifications[0].idDemandOfferGood ==
                    good.idDemandOfferGood
                );
                good.priceWithoutVat = goodOffer.goodsSpecifications.find(
                  (sp) => sp.idInterfaceField == 3
                ).fieldValueNumber;
                good.costVat = this.costVatBasis(
                  good.priceWithoutVat,
                  good.volume
                );
                good.minPriceWithoutVat =
                  goodOffer.goodsSpecifications.find(
                    (sp) => sp.idInterfaceField === IdInterfaceField.minPrice
                  )?.fieldValueNumber || null;
              });
            }
          });
          let countLargerPrice = 0,
            countForGood = {},
            count = (this.deliveryBasisCommon.length - 1) * this.goods.length; //для проверки, чтобы убрать красный значок на табке. Количество всех товаров кроме основного базиса.
          this.goods.forEach((g) => {
            countForGood[g.idGood] = 0;
          });
          this.deliveryBasisCommon.forEach((basis) => {
            if (basis.isMain) {
              basis.goods.forEach((good) => {
                let goodOffer = this.goods.find(
                  (g) =>
                    g.goodsSpecifications[0].idDemandOfferGood ==
                    good.idDemandOfferGood
                );
                good.cost = goodOffer.goodsSpecifications.find(
                  (el) => el.idInterfaceField == 3
                ).fieldValueNumber;
                good.costVat = this.costVatBasis(good.cost, good.volume);
                good.minPrice =
                  goodOffer.goodsSpecifications?.find(
                    (sp) => sp.idInterfaceField === IdInterfaceField.minPrice
                  )?.fieldValueNumber || null;
              });
            } else {
              //если указан признак isMinPriceMainBasis = true
              if (this.generalInfo.isMinPriceMainBasis) {
                basis.goods.forEach((good) => {
                  let goodOffer = this.goods.find(
                    (g) => g.idGood == good.idGood
                  );
                  if (
                    good.cost <=
                    goodOffer.goodsSpecifications.find(
                      (el) => el.idInterfaceField == 3
                    ).fieldValueNumber
                  ) {
                    this.deliveryBasisCommon
                      .find((el) => el.isMain)
                      .goods.find(
                        (gb) => gb.idGood == good.idGood
                      ).isMinPriceError = true;
                    this.onRedFlag.emit();
                  } else {
                    countForGood[good.idGood] = countForGood[good.idGood] + 1;
                    countLargerPrice = countLargerPrice + 1;
                  }
                });
              }
            }
          });
          this.goods.forEach((g) => {
            if (countForGood[g.idGood] == this.deliveryBasisCommon.length - 1) {
              this.deliveryBasisCommon
                .find((el) => el.isMain)
                .goods.find((gb) => gb.idGood == g.idGood).isMinPriceError =
                false;
            }
          });
          if (countLargerPrice == count) {
            this.onHideRedFlag.emit();
            this.deliveryBasisCommon
              .find((el) => el.isMain)
              .goods.forEach((good) => {
                good.isMinPriceError = false;
              });
          }
        }
        this.dataGrids.forEach((dataGrid) => {
          dataGrid.instance.refresh(); // Вызываем refresh() для каждой таблицы
        });
      }
    );

    if (this.minAddBasis()) {
      this.onRedFlag.emit();
    }

    this.changedAddBasis = this.tradingService.changeAddBasis$.subscribe(
      (res: any) => {
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
      }
    );

    this.changeBasis = this.tradingService.changeBasis$.subscribe(
      (basis: any) => {
        //  this.deliveryBasis = basis
        this.deliveryBasisCommon = basis;
        if (this.minAddBasis()) {
          this.onRedFlag.emit();
        } else {
          this.onHideRedFlag.emit();
        }
      }
    );
  }

  minAddBasis() {
    return (
      this.deliveryBasisCommon?.length == 1 &&
      this.deliveryBasisCommon[0].minAddBasis > 0 &&
      this.deliveryBasisCommon?.length - 1 <
        this.deliveryBasisCommon[0].minAddBasis
    );
  }

  costVatBasis(priceWithoutVat, volume) {
    return (
      Math.round(
        (volume * priceWithoutVat +
          (volume * priceWithoutVat * this.vat) / 100) *
          100
      ) / 100
    );
  }

  viewAddBasis() {
    //отображение кнопки Добавить базис
    let view = false;
    if (
      this.deliveryConditions.find(
        (el) =>
          el.linkId == this.deliveryBasisCommon[0].idBasisLink &&
          el.valueId == this.deliveryBasisCommon[0].idBasisValue
      ).children?.length > 0 &&
      this.editRuleInIntersections(37) != editingRules.editingIsNotAvailable &&
      this.editRuleInIntersections(37) != editingRules.changesDeliveryTerms
    ) {
      view = true;
    }
    return view;
  }

  isVisibleEditPencil(i: number): boolean {
    return (
      ((this.editRuleInIntersections(IdInterfaceField.priceWithoutVAT) !=
        editingRules.editingIsNotAvailable ||
        this.editRuleInIntersections(IdInterfaceField.deliveryTerms) ===
          editingRules.changesDeliveryTerms ||
        (this.editRuleInIntersections(IdInterfaceField.amendment) &&
          this.editRuleInIntersections(IdInterfaceField.amendment) !=
            editingRules.editingIsNotAvailable) ||
        i >= this.deliveryBasis.length) &&
        this.idSessionPeriod === IdSessionPeriods.pretrading) ||
      this.idSessionPeriod === IdSessionPeriods.offersAdjustment
    );
  }

  onEditBasis(e, b, id, place) {
    e.event.stopPropagation();
    this.addBasisValue = true;
    this.openBasis = this.deliveryBasisCommon.filter(
      (el) => el.idBasisLink == id && el.placeName === place
    );
  }

  deleteBasis = false; //попап окно для удаления базиса
  deleteBasisId: any;
  deletePlaceName: any;

  onDeleteBasisPopup(e, item) {
    e.event.stopPropagation();
    this.deleteBasis = true;
    this.deleteBasisId = item.idBasisLink;
    this.deletePlaceName = item.enterPlaceName;
  }

  onDeleteBasis() {
    let deleteArray = this.deliveryBasisCommon.filter(
      (el) =>
        el.idBasisLink == this.deleteBasisId &&
        el.enterPlaceName === this.deletePlaceName
    );
    this.deliveryBasisCommon = this.deliveryBasisCommon.filter(
      (el) => !deleteArray.includes(el)
    );
    this.tradingService.nonDisabledSaveButton({
      deliveryConditions: this.deliveryBasisCommon,
    });
    this.openBasis = [];
    this.deleteBasis = false;
    this.addBasisValue = false;
  }

  get isMinPrice(): boolean {
    //проверка есть ли минимальная цена в заявке для добавления колонки в базисы
    const result = this.goods[0].goodsSpecifications.find(
      (field) => field.idInterfaceField === IdInterfaceField.minPrice
    );
    return (
      this.pricingTypeId != pricingType?.formulaWithoutQuotation &&
      this.sessionIds.idAuctionType == auctionType.simpleBuyerAuction &&
      this.generalInfo.directionId == IdDirection.buy &&
      result
    );
  }

  editRuleInIntersections(id) {
    /*3-цена без НДС, 37 - условия поставки*/
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField == id)
        ?.idEditRule || null
    );
  }

  /*getNameBasis(basis) {
    let enterPlace = basis?.enterPlaceName ? ' ' + basis?.enterPlaceName : '';
    let location = basis?.specifyingLocation
      ? ' ' + basis?.specifyingLocation
      : '';
    return basis.basisName + enterPlace + location;
  }*/

  saveBasis(item) {
    if (!item) {
      this.openBasis = [];
      this.addBasisValue = false;
      return;
    }
    this.deliveryBasisCommon = item;
    /*  if (this.dataGrid)
      this.dataGrid.instance.refresh();*/
    this.dataGrids.forEach((dataGrid) => {
      dataGrid.instance.refresh(); // Вызываем refresh() для каждой таблицы
    });

    if (this.isActiveCorridor) {
      this.deliveryBasisCommon.forEach((basis) => {
        basis.goods.forEach((good) => {
          //проверка на соответствии ценового коридора
          if (
            (good.minPrice && good.cost < good.minPrice) ||
            (good.maxPrice && good.cost > good.maxPrice)
          ) {
            //если не входит в ценовой коридор
            good.range = true;
          } else good.range = false;
        });
      });
    }
    //если поменяли цену товара в основном базисе, то заменяем цену в массиве товаров
    if (
      this.openBasis?.length > 0 &&
      this.openBasis[0]?.isMain &&
      this.pricingTypeId != pricingType?.formulaWithoutQuotation
    ) {
      //при редактировании
      this.openBasis[0].goods.forEach((good) => {
        let findGood = this.goods.find(
          (el) =>
            el.goodsSpecifications[0].idDemandOfferGood ==
            good.idDemandOfferGood
        );
        if (findGood) {
          findGood.goodsSpecifications.find(
            (field) => field.idInterfaceField == 3
          ).fieldValue = good.cost;

          findGood.goodsSpecifications.find(
            (field) => field.idInterfaceField == 3
          ).fieldValueNumber = good.cost;

          if (this.idAuctionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION) {
            const field = findGood.goodsSpecifications.find(
              (field) => field.idInterfaceField === IdInterfaceField.minPrice
            );

            if (field) {
              field.fieldValue = good.minPrice;
              field.fieldValueNumber = good.minPrice;
            }
          }
        }
      });

      this.tradingService.editMainBasisInfo({
        goods: this.goods,
        str: 'basis',
      });
    }

    if (this.generalInfo.isMinPriceMainBasis) {
      let countLargerPrice = 0,
        countForGood = {},
        count = (this.deliveryBasisCommon.length - 1) * this.goods.length; //для проверки, чтобы убрать красный значок на табке. Количество всех товаров кроме основного базиса.
      this.goods.forEach((g) => {
        countForGood[g.idGood] = 0;
      });
      this.deliveryBasisCommon.forEach((basis) => {
        if (!basis.isMain) {
          basis.goods.forEach((good) => {
            let goodOffer = this.goods.find((g) => g.idGood == good.idGood);
            if (
              good.cost <=
              goodOffer.goodsSpecifications.find(
                (el) => el.idInterfaceField == 3
              ).fieldValueNumber
            ) {
              this.deliveryBasisCommon
                .find((el) => el.isMain)
                .goods.find((gb) => gb.idGood == good.idGood).isMinPriceError =
                true;
              this.onRedFlag.emit();
            } else {
              countForGood[good.idGood] = countForGood[good.idGood] + 1;
              countLargerPrice = countLargerPrice + 1;
            }
          });
        }
      });
      this.goods.forEach((g) => {
        if (countForGood[g.idGood] == this.deliveryBasisCommon.length - 1) {
          this.deliveryBasisCommon
            .find((el) => el.isMain)
            .goods.find((gb) => gb.idGood == g.idGood).isMinPriceError = false;
        }
      });
      if (countLargerPrice == count && !this.minAddBasis()) {
        this.onHideRedFlag.emit();
        this.deliveryBasisCommon
          .find((el) => el.isMain)
          .goods.forEach((good) => {
            good.isMinPriceError = false;
          });
      }
    } else {
      if (!this.minAddBasis()) this.onHideRedFlag.emit();
    }
    this.tradingService.nonDisabledSaveButton({
      deliveryConditions: this.deliveryBasisCommon,
    });
    this.openBasis = [];
    this.addBasisValue = false;
  }

  ngOnDestroy() {
    this.changeBasis.unsubscribe();
    this.changedAddBasis.unsubscribe();
    this.changeVolume.unsubscribe();
    this.changeMainBasis.unsubscribe();
  }

  public readonly editingRules = editingRules;
}
