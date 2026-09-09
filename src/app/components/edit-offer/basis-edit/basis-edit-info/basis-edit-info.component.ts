import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  DxDataGridComponent,
  DxTextBoxComponent,
  DxTreeViewComponent,
} from 'devextreme-angular';
import { User } from '@classes';
import {
  editingRules,
  goodRefId,
  pricingType,
  searchIcon,
  DX_MODULES,
  IdInterfaceField,
  auctionType,
  IdDirection,
  IdSessionPeriods,
  ID_STAT_DELIVERY,
  BELARUS_ID_LINK
} from '@constants';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import TreeView from 'devextreme/ui/tree_view';
import RU from '@ru-translate';
import EN from '@en-translate';
import { TradingService, CurrencyService, SubmissionService, DemandService } from '@services';
import { CommonModule } from '@angular/common';
import { toOADate, round } from '@helpers';
import { RuNumberFormatPipe } from '@pipes';
import { HomePageStore } from '../../../../views/homepage/store';
import { AUCTION_TYPE } from '../../../../shared/enums';
import { DxGridContextMenuLocalizationDirective } from '../../../../shared/directives';
import { ValueChangedEvent as NumberBoxValueChangedEvent }  from 'devextreme/ui/number_box';
import { ValueChangedEvent as TextBoxValueChangedEvent }  from 'devextreme/ui/text_box';
import { DxNumberBoxComponent } from 'devextreme-angular';
import { DeliveryConditionIntersection, PlacesTree } from "../../../../services/submission-service/shared";
import { DisableNumberBoxWheel } from "../../../../shared/directives/disable-number-box-wheel";
import { EditDemandOfferServiceService } from "../../../../services/edit-demand-offer-service.service";


@Component({
  selector: 'app-basis-edit-info',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
    RuNumberFormatPipe,
    DxGridContextMenuLocalizationDirective,
    DisableNumberBoxWheel
  ],
  templateUrl: './basis-edit-info.component.html',
  styleUrls: ['./basis-edit-info.component.scss'],
})
export class BasisEditInfoComponent implements OnInit {
  private readonly currencyService = inject(CurrencyService);
  private readonly submissionService = inject(SubmissionService);
  private readonly homePageStore = inject(HomePageStore);

  @Input() deliveryBasisOffer; //базисы в заявке
  @Input() deliveryBasis;
  @Input() deliveryConditions: DeliveryConditionIntersection[]; //пересечения в базисе
  @Input() goodsList;
  @Input() vatValue;
  @Input() basisValue; //редактируем базис
  @Input() isMinPriceOnBasicBasis;
  @Input() pricingType;
  @Input() isActiveQuotation;
  @Input() isActiveCorridor;
  @Input() sessionsIds;
  @Input() paymentTypeId;
  @Input() editRulesIntersections;
  @Input() goodsOriginal;
  @Output() saveBasis = new EventEmitter<any>();

  @ViewChild('dataGridGood', { static: false }) dataGrid: DxDataGridComponent;
  @ViewChild(DxTreeViewComponent, { static: false })
  treeView: DxTreeViewComponent;
  @ViewChild('location', { static: false }) location: DxTextBoxComponent;

  setFocus(e) {
    setTimeout(() => {
      e.component.focus();
    });
    // this.location.instance.focus();
  }

  public readonly idAuctionType = this.homePageStore.idAuctionType();
  public readonly isShowMinPriceHint = signal<boolean>(false);

  basisForm = this.formBuilder.group({
    basis: null,
    placeName: [],
    specifyingLocation: null,
  });
  treeViewInstance: TreeView;

  user: User;
  searchIcon = searchIcon;
  basisChooseValue: DeliveryConditionIntersection;
  changeAmendment = []; //массив поправок изменений в таблице товаров

  choosenPlaceBasis: PlacesTree;

  searchValue: string;
  openPopupAddPlace = false;

  placeDataBasis: PlacesTree[];
  EnterPlaceName: string; //которое отображает значение выбранного или введенного поля
  delivery: DeliveryConditionIntersection[];
  basisGoods = [];

  enterPlace: string;

  pricingTypeConst = pricingType;
  changeCoreBasis = false; //изменение основного базиса
  vat: number;

  loadingVisible = false; //при поиске
  deliveryBasisCommon = [];

  constructor(
    private formBuilder: FormBuilder,
    public translate: TranslateService,
    public tradingService: TradingService,
    public demandService: DemandService,
    public editDemandOfferServiceService: EditDemandOfferServiceService
  ) {}

  isVisibleToast = false;
  messageToast: string = '';
  typeToast: string;

  saveInstance(e) {
    this.treeViewInstance = e.component;
  }

  setPricesQuote(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      let toastVisible = false;
      let nullQuotation = 0;
      this.basisGoods.forEach((good) => {
        let cost = good?.cost || null;
        if (good.quotation && cost != good.quotation) {
          good.cost = good.quotation;
          good.change = true;
          good.error ? (good.error = false) : null;
          toastVisible = true;
        }
        if (!good.quotation) {
          nullQuotation = nullQuotation + 1;
        }
      });
      if (nullQuotation == this.basisGoods.length) {
        this.messageToast =
          this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].deliveryConditions.infoMessPriceQoute
            : EN['editOffer'].deliveryConditions.infoMessPriceQoute;
        this.typeToast = 'warning';
      } else {
        this.messageToast = toastVisible
          ? this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].deliveryConditions.toastPriceAccordingQuote
            : EN['editOffer'].deliveryConditions.toastPriceAccordingQuote
          : this.translate.store.currentLang == 'RU'
          ? RU['editOffer'].deliveryConditions.toastPriceCorrespondQuote
          : EN['editOffer'].deliveryConditions.toastPriceCorrespondQuote;
        this.typeToast = 'success';
      }
      //todo добавить вызов тоста
      this.isVisibleToast = true;
    }
  }

  setPriceRange(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      let isToast = true;
      let nullRange = 0;
      this.basisGoods.forEach((good) => {
        let cost = good?.cost;
        if (
          (good.minPrice && cost < good.minPrice) ||
          (good.maxPrice && cost > good.maxPrice)
        ) {
          //если не входит в ценовой коридор
          good.range = true;
          isToast = false;
        }

        if (!good.minPrice && !good.maxPrice) {
          nullRange = nullRange + 1;
        }
      });

      if (nullRange == this.basisGoods.length) {
        this.messageToast =
          this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].deliveryConditions.infoMessPriceRange
            : EN['editOffer'].deliveryConditions.infoMessPriceRange;
        this.typeToast = 'warning';
        this.isVisibleToast = true;
      } else {
        if (isToast) {
          this.typeToast = 'success';
          this.messageToast =
            this.translate.store.currentLang == 'RU'
              ? RU['editOffer'].deliveryConditions.toastPriceCorrespondRange
              : EN['editOffer'].deliveryConditions.toastPriceCorrespondRange;
          this.isVisibleToast = true;
        }
      }
    }
  }

  ngOnInit(): void {
    this.vat = this.vatValue != 'без НДС' ? this.vatValue : 0;
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.deliveryBasis.length == 0 || this.basisValue[0]?.isMain) {
      this.delivery = this.deliveryConditions;
      if (
        this.basisValue[0]?.isMain &&
        this.editRuleInIntersections(IdInterfaceField.deliveryTerms) ===
          editingRules.changesDeliveryTerms &&
        this.deliveryBasisOffer.length === 1
      ) {
        this.delivery = this.deliveryConditions.filter(
          (el) => el.minAddBasis === null
        );
      }
    } else {
      this.delivery = this.deliveryConditions.find(
        (el) => el.linkId == this.deliveryBasis[0].idBasisLink
      ).children;
    }

    if (this.basisValue?.length > 0) {
      this.basisGoods = JSON.parse(JSON.stringify(this.basisValue[0].goods));
      this.basisForm.controls.basis.patchValue(this.basisValue[0]?.idBasisLink);
      this.onChangeBasis(this.basisForm.controls.basis.value);
      this.basisForm.controls.placeName?.patchValue(
        this.basisValue[0]?.placeName
      );
      this.basisForm.controls.specifyingLocation?.patchValue(
        this.basisValue[0]?.specifyingLocation
      );
      this.EnterPlaceName = this.basisValue[0]?.enterPlaceName;
    } else {
      this.basisGoods = JSON.parse(JSON.stringify(this.goodsList));
      this.basisGoods.forEach((good) => {
        good.cost = good.goodsSpecifications.find(
          (el) => el.idInterfaceField == 3
        ).fieldValueNumber;
        good.volume = good.goodsSpecifications.find(
          (el) => el.idInterfaceField == 1
        ).fieldValueNumber;
        good.costVat =
          round(good.volume * good.cost, 2) +
          round((good.volume * good.cost * this.vat) / 100, 2);
      });
    }
  }

  lengthValidationSearch(e) {
    return e.value.length >= 3;
  }

  onOpenedDropDown() {
    if (
      this.basisValue?.length > 0 &&
      this.basisForm.controls.placeName?.value ==
        this.basisValue[0]?.placeName &&
      this.treeView?.instance
    )
      this.treeView?.instance.selectItem(this.basisValue[0]?.placeName[0]);
  }

  clearPlaceName() {
    this.enterPlace = '';
    this.EnterPlaceName = '';
    this.choosenPlaceBasis = null;
    this.treeView?.instance?.unselectAll();
    this.basisForm.controls.placeName.patchValue(null);
    this.basisForm.controls.specifyingLocation?.patchValue(null);
  }

  get isDisabledBasis(): boolean {
    const editRule = this.editRuleInIntersections(
      IdInterfaceField.deliveryTerms
    );
    switch (editRule) {
      case editingRules.editingIsNotAvailable:
        return true;

      case editingRules.changesDeliveryTerms:
        return this.deliveryBasisOffer.length > 1 && this.basisValue[0]?.isMain;

      case editingRules.addingValueFromReferenceBook:
        const basisIndex = this.deliveryBasis.indexOf(this.basisValue[0]);
        return (
          basisIndex !== -1 && basisIndex < this.deliveryBasisOffer?.length
        );

      default:
        return false;
    }
  }

  onChangeBasis(e) {
    this.basisChooseValue = null;
    this.clearPlaceName();
    if (e) {
      this.basisChooseValue = this.delivery.find((el) => el.linkId === e);
      this.getDeliveryPlaces(e, this.basisChooseValue.valueId);
      this.searchValue = '';

      if (
        this.deliveryBasisOffer?.length > 1 &&
        this.basisValue[0]?.isMain &&
        this.basisValue[0]?.idBasisLink != e
      ) {
        //редактируем
        this.error = true;
        this.errorState = 0;
        this.messageError =
          this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].deliveryConditions.editingBasisTextAddition
            : EN['editOffer'].deliveryConditions.editingBasisTextAddition;
        this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
        this.changeCoreBasis = true;
      }
      if (
        !this.basisChooseValue?.placeTypeId &&
        this.isActiveQuotation &&
        this.sessionsIds.idSessionPeriod == 1
      ) {
        this.basisGoods.forEach((item) => {
          this.getQuoteForGood(item);
        });
      }

      if (
        !this.basisChooseValue?.placeTypeId &&
        this.isActiveCorridor &&
        this.sessionsIds.idSessionPeriod == 1
      ) {
        this.basisGoods.forEach((item) => {
          this.getRangeForGood(item);
        });
      }
    }
  }

  getQuoteForGood(good) {
    let isAnalog = this.goodsList.find((el) => el.idGood == good.idGood);
    if (isAnalog.characteristicsNSI) {
      //для товаров аналогов
      let GoodDescription = '';
      for (let ch in isAnalog.characteristicsNSI) {
        if (
          !ch.toString().startsWith('analogs') &&
          isAnalog.characteristicsNSI[ch]?.length > 0 &&
          ch != goodRefId.toString()
        ) {
          //не нужно наименование товара
          isAnalog.characteristicsNSI[ch].forEach((el) => {
            if (!isAnalog.characteristicsNSI['analogs' + ch])
              GoodDescription = GoodDescription + ch + ':' + el + ';';
          });
        }
      }
      this.submissionService
        .getPriceLimitQuotationAnalog(
          this.user?.token,
          this.sessionsIds.sectionId,
          this.sessionsIds.sessionId,
          this.sessionsIds.modelId,
          this.sessionsIds.direction,
          isAnalog.idNomenclatureGroup,
          isAnalog.idGoodGroup,
          isAnalog.idGoodName,
          GoodDescription,
          this.getGoodsSpecifications(this.goodsList[0].goodsSpecifications, 4)
            .fieldValueNumber,
          this.vatValue != 'без НДС' ? this.vatValue : null,
          this.goodsList.find((gL) => gL.idGood == good.idGood).unitId,
          good.volume,
          this.paymentTypeId,
          this.basisChooseValue.valueId,
          this.choosenPlaceBasis?.idLink || null,
          this.basisForm.controls?.specifyingLocation?.value ?
            String(this.basisForm.controls?.specifyingLocation.value) :
            null
        )
        .subscribe((res) => {
          good.quotation = res.priceWithoutVat; //котировка по товару
        });
    } else {
      this.submissionService
        .getPriceLimitQuotation(
          this.user?.token,
          this.sessionsIds.sectionId,
          this.sessionsIds.sessionId,
          this.sessionsIds.modelId,
          this.sessionsIds.direction,
          good.idGood,
          this.getGoodsSpecifications(this.goodsList[0].goodsSpecifications, 4)
            .fieldValueNumber,
          this.vatValue != 'без НДС' ? this.vatValue : null,
          this.goodsList.find((gL) => gL.idGood == good.idGood).unitId,
          good.volume,
          this.paymentTypeId,
          this.basisChooseValue.valueId,
          this.choosenPlaceBasis?.idLink || null,
          this.basisForm.controls?.specifyingLocation?.value ?
            String(this.basisForm.controls?.specifyingLocation.value) :
            null
        )
        .subscribe((res) => {
          good.quotation = res.priceWithoutVat; //котировка по товару
        });
    }
  }

  getRangeForGood(good) {
    let isAnalog = this.goodsList.find((el) => el.idGood == good.idGood);
    if (isAnalog.characteristicsNSI) {
      //для товаров аналогов
      let GoodDescription = '';
      for (let ch in isAnalog.characteristicsNSI) {
        if (
          !ch.toString().startsWith('analogs') &&
          isAnalog.characteristicsNSI[ch]?.length > 0 &&
          ch != goodRefId.toString()
        ) {
          //не нужно наименование товара
          isAnalog.characteristicsNSI[ch].forEach((el) => {
            if (!isAnalog.characteristicsNSI['analogs' + ch])
              GoodDescription = GoodDescription + ch + ':' + el + ';';
          });
        }
      }
      this.submissionService
        .getPriceLimitCorridorAnalog(
          this.user?.token,
          this.sessionsIds.sectionId,
          this.sessionsIds.sessionId,
          this.sessionsIds.modelId,
          this.sessionsIds.direction,
          isAnalog.idNomenclatureGroup,
          isAnalog.idGoodGroup,
          isAnalog.idGoodName,
          GoodDescription,
          this.getGoodsSpecifications(this.goodsList[0].goodsSpecifications, 4)
            .fieldValueNumber,
          this.vatValue != 'без НДС' ? this.vatValue : null,
          this.goodsList.find((gL) => gL.idGood == good.idGood).unitId,
          good.volume,
          this.paymentTypeId,
          this.basisChooseValue.valueId,
          this.choosenPlaceBasis?.idLink || null,
          this.basisForm.controls?.specifyingLocation?.value ?
            String(this.basisForm.controls?.specifyingLocation.value) :
            null
        )
        .subscribe((res) => {
          good.minPrice = res.leftBound; //нижняя граница коридора
          good.maxPrice = res.rightBound; //верхняя граница коридора
        });
    } else {
      this.submissionService
        .getPriceLimitCorridor(
          this.user?.token,
          this.sessionsIds.sectionId,
          this.sessionsIds.sessionId,
          this.sessionsIds.modelId,
          this.sessionsIds.direction,
          good.idGood,
          this.getGoodsSpecifications(this.goodsList[0].goodsSpecifications, 4)
            .fieldValueNumber,
          this.vatValue != 'без НДС' ? this.vatValue : null,
          this.goodsList.find((gL) => gL.idGood == good.idGood).unitId,
          good.volume,
          this.paymentTypeId,
          this.basisChooseValue.valueId,
          this.choosenPlaceBasis?.idLink || null,
          this.basisForm.controls?.specifyingLocation?.value ?
            String(this.basisForm.controls?.specifyingLocation.value) :
            null
        )
        .subscribe((res) => {
          good.minPrice = res.leftBound; //нижняя граница коридора
          good.maxPrice = res.rightBound; //верхняя граница коридора
        });
    }
  }

  public isDisabledSpecifyingLocation(): boolean {
    return !this.basisForm.controls.placeName.value ||
      this.basisForm.controls.placeName.value?.length == 0 || (
      this.editRuleInIntersections(IdInterfaceField.deliveryTerms) ==
      editingRules.editingIsNotAvailable ||
      (this.editRuleInIntersections(IdInterfaceField.deliveryTerms) ==
        editingRules.addingValueFromReferenceBook &&
        this.deliveryBasis.indexOf(this.basisValue[0]) != -1 &&
        this.deliveryBasis.indexOf(this.basisValue[0]) <
        this.deliveryBasisOffer?.length))
  }

  onChangePlaceType(e) {
    if (e.itemData.disableCountries) {      //не даем возможности выбрать страну
      e.component.unselectItem(e.itemData)
    }
    let placeNameString =
      (e.node.parent?.parent?.text ? e.node.parent?.parent?.text + ', ' : '') +
      (e.node.parent?.text ? e.node.parent?.text + ', ' : '') +
      e.node.text;
    this.EnterPlaceName = e.node.selected ? placeNameString : null;
    this.basisForm.controls.placeName.patchValue(
      e.component.getSelectedNodeKeys()
    );
    this.basisForm.controls.specifyingLocation?.patchValue(null);
    if (e.node.selected) {
      this.choosenPlaceBasis = this.placeDataBasis.find(
        (el) => el.idLink == e.component.getSelectedNodeKeys()
      );
      if (this.isActiveQuotation && this.sessionsIds.idSessionPeriod == 1) {
        //котировка
        this.basisGoods.forEach((item) => {
          this.getQuoteForGood(item);
        });
      }

      if (this.isActiveCorridor && this.sessionsIds.idSessionPeriod == 1) {
        //коридор
        this.basisGoods.forEach((item) => {
          this.getRangeForGood(item);
        });
      }
    }
    else {
      this.choosenPlaceBasis = null;
    }
  }

  onChangeSpecifyingLocation(e) {
    if (e.value?.length == 0) {
      e.value = null;
      this.basisForm.controls.specifyingLocation?.patchValue(null);
    }
    if (this.isActiveQuotation && this.sessionsIds.idSessionPeriod == 1) {
      this.basisGoods.forEach((item) => {
        this.getQuoteForGood(item);
      });
    }
    if (this.isActiveCorridor && this.sessionsIds.idSessionPeriod == 1) {
      this.basisGoods.forEach((item) => {
        this.getRangeForGood(item);
      });
    }
  }

  onChangePlaceTypeByEnter() {
    this.openPopupAddPlace = false;
    this.EnterPlaceName = this.enterPlace;
    this.treeView?.instance?.unselectAll();
    this.basisForm.controls.placeName.patchValue(-1);
    this.basisForm.controls.specifyingLocation?.patchValue(null);

    if (this.isActiveQuotation && this.sessionsIds.idSessionPeriod == 1) {
      //котировка
      this.basisGoods.forEach((item) => {
        this.getQuoteForGood(item);
      });
    }
    if (this.isActiveCorridor && this.sessionsIds.idSessionPeriod == 1) {
      //коридор
      this.basisGoods.forEach((item) => {
        this.getRangeForGood(item);
      });
    }
  }

  public getDeliveryPlaces(idBasisLink: number, idBasisValue: number): void {
    //получение названия места для каждого базиса
    this.submissionService
      .getDeliveryPlacesTree(this.user.token, idBasisLink)
      .subscribe((res) => {
        this.placeDataBasis =
          this.editDemandOfferServiceService.getPrepareDeliveryPlaceValues(
            res.trees,
            idBasisValue,
            this.sessionsIds.idAuctionType,
            this.sessionsIds.marketTypesIds
          );

        if (this.basisForm.controls.placeName.value != null) {
          this.choosenPlaceBasis = this.placeDataBasis.find(
            (el) => el.idLink === this.basisValue[0]?.placeName
          );
          if (this.isActiveQuotation && this.sessionsIds.idSessionPeriod === 1) {
            //котировка
            this.basisGoods.forEach((item) => {
              this.getQuoteForGood(item);
            });
          }

          if (this.isActiveCorridor && this.sessionsIds.idSessionPeriod === 1) {
            //коридор
            this.basisGoods.forEach((item) => {
              this.getRangeForGood(item);
            });
          }
        }
      });
  }

  public onChangePrices(
    e: NumberBoxValueChangedEvent,
    id: number,
    numberBox: DxNumberBoxComponent,
    minPrice: number
  ): void {
    this.isShowMinPriceHint.set(e.value < minPrice);
    let findGood = this.basisGoods.find((el) => el.idGood == id);

    if (numberBox && this.isMinPrice) {
      if (!numberBox.isValid) return;
    }
    findGood.cost = e.value;
    findGood.costVat =
      round(findGood.volume * e.value, 2) +
      round((findGood.volume * e.value * this.vat) / 100, 2);
  }

  public minPriceValidation(minPrice: number, e: any): boolean {
    const currentValue: number = e?.value as number;
    const isLessThanMin: boolean = currentValue !== null && currentValue < minPrice;
    this.isShowMinPriceHint.set(isLessThanMin);
    return currentValue >= minPrice;
  }

  get isMinPrice(): boolean {
    //проверка есть ли минимальная цена в заявке для добавления колонки в базисы
    const result = this.goodsList[0].goodsSpecifications.find(
      (field) => field.idInterfaceField === IdInterfaceField.minPrice
    );
    return (
      this.paymentTypeId != pricingType?.formulaWithoutQuotation &&
      this.sessionsIds.idAuctionType == auctionType.simpleBuyerAuction &&
      this.sessionsIds.direction == IdDirection.buy &&
      result
    );
  }

  onChangeMinPrices(e, id: number): void {
    let findGood = this.basisGoods.find((el) => el.idGood == id);
    findGood.minPrice = e.value;
  }

  keyDown(id) {
    let changeGood = this.basisGoods.find((el) => el.idGood == id);
    changeGood.change = changeGood.error = changeGood.range = false;
  }

  editRuleInIntersections(id) {
    /*3-цена без НДС, 37 - условия поставки*/
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField == id)
        ?.idEditRule || null
    );
  }

  getOriginalGood(idGood) {
    return this.goodsOriginal.find((el) => el.idGood == idGood);
  }

  getGoodsSpecifications(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    );
  }

  public searchTxtBoxValueChange(e: TextBoxValueChangedEvent): void {
    // от 3х и более символов или пришла пустота
    let result = e.value.length >= 3 || e.value.length == 0;
    if (result) {
      this.loadingVisible = true;
      this.editDemandOfferServiceService.searchTxtBoxValueChange(e, this.placeDataBasis, this.treeViewInstance)
      setTimeout(() => (this.loadingVisible = false), 1000);
    }
  }

  onChangeAmendment(e, id) {
    if (this.changeAmendment.find((el) => el.idGood == id)) {
      this.changeAmendment.splice(
        this.changeAmendment.findIndex((el) => el.idGood == id),
        1
      );
    }

    this.changeAmendment.push({
      id: id,
      amendment: e.value,
    });

    // todo refactor to avoid subscribe inside subscribe
    if (this.pricingType == this.pricingTypeConst?.formulaWithQuotation) {
      let amendmentSize, quotationCurr;
      let good = this.basisGoods.find((g) => g.idGood == id);
      let goodFromList = this.goodsList.find((el) => el.idGood == id);
      let date = new Date();
      this.currencyService
        .convertCurrency(
          this.user?.token,
          good.quotation,
          this.getGoodsSpecifications(goodFromList.goodsSpecifications, 55)
            .fieldValueNumber,
          this.getGoodsSpecifications(goodFromList.goodsSpecifications, 4)
            .fieldValueNumber,
          toOADate(date)
        )
        .subscribe((res) => {
          quotationCurr = res;

          if (good.priceAdjustment.id == 1) {
            //в процентном соотношении
            amendmentSize = (quotationCurr / 100) * e.value;
          } else amendmentSize = e.value;

          this.changeAmendment[this.changeAmendment.length - 1].cost = round(
            quotationCurr + amendmentSize,
            2
          );
        });
    }
  }

  public onCloseError(): void {
    this.error = false;
    this.isButtonPriceQuote = false;
  }

  priceAmendment(item) {
    let ch = this.changeAmendment.find((el) => el.idGood == item.idGood);
    if (ch) {
      return ch.cost;
    } else return item.cost;
  }

  OnClose() {
    if (this.basisValue?.length > 0) {
      this.basisGoods = this.basisValue[0].goods;
    }
    this.saveBasis.emit(false);
  }

  clearBasis() {
    this.basisForm.controls?.basis.patchValue(null);
    this.basisForm.controls?.placeName.patchValue(null);
    this.basisForm.controls?.specifyingLocation.patchValue(null);
    this.basisGoods = this.goodsList;

    // this.dataGrid.instance.cancelEditData();                            //отменяет редактирование в таблице товаров
  }

  getNumber(data) {
    return; //Number(data.replaceAll(/[^,\d]/g, '', '').replace(/,/, '.')) || Number(data)
  }

  errorState = 1;
  error = false;
  messageError: string;
  isButtonPriceQuote = false;
  goodArray = [];
  deliveryConditionName: string;

  async onSaveBasis(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      this.deliveryConditionName = '';
      if (
        (this.pricingType != this.pricingTypeConst.formulaWithoutQuotation &&
          !this.basisGoods.every((g) => g.cost > 0)) ||
        (this.pricingType == this.pricingTypeConst.formulaWithoutQuotation &&
          !this.basisGoods.every((g) => g.amendment > 0))
      ) {
        //цена должна быть больше 0
        this.error = true;
        this.messageError =
          this.translate.store.currentLang == 'RU'
            ? RU['editOffer'].deliveryConditions.price0Error1 +
            ' ' +
            (this.pricingType == this.pricingTypeConst.price
              ? RU['viewOffer'].priceWithoutVAT
              : RU['trading'].offersTable.amendment) +
            ' ' +
            RU['editOffer'].deliveryConditions.price0Error2
            : EN['editOffer'].deliveryConditions.price0Error1 +
            ' ' +
            (this.pricingType == this.pricingTypeConst.price
              ? EN['viewOffer'].priceWithoutVAT
              : EN['trading'].offersTable.amendment) +
            ' ' +
            EN['editOffer'].deliveryConditions.price0Error2;
        this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
        return;
      }

      const idPlaceLink = this.choosenPlaceBasis
        ? this.choosenPlaceBasis?.idLink
        : this.basisValue && this.basisValue[0]?.idBasisLink === this.basisForm.controls?.basis.value &&
        this.basisForm.controls.placeName?.value && this.basisForm.controls.placeName?.value?.length > 0
          ? this.basisValue[0].idPlaceLink
          : null;

      this.demandService.getDeliveryCondConcated(
        this.user?.token,
        this.basisChooseValue.linkId,
        idPlaceLink,
        this.basisForm.controls?.specifyingLocation?.value?.toString() || null).subscribe(
        (item) => {
          this.deliveryConditionName = item.result

          if (this.deliveryBasis.length > 0) {
            //добавление идентичного базиса с одинаковым местом поставки
            let deliveries = this.deliveryBasis.filter(
              el => el.concatedCondition === this.deliveryConditionName
            );/*(el.idBasisLink == this.basisForm.controls.basis.value ||
              el.basisName == this.basisChooseValue.basisName ||
              el.concatedCondition.includes(
                this.basisChooseValue.basisName.replace(/[:\-]/g, '')
              )) &&
            this.basisForm.controls?.placeName?.value &&
            el?.placeName[0] === this.basisForm.controls?.placeName?.value[0] &&
            el?.specifyingLocation?.toLowerCase() ==
            this.basisForm.controls?.specifyingLocation?.value
              ?.toString()
              ?.toLowerCase()*/

            deliveries.forEach((delivery) => {
              if (JSON.stringify(this.basisValue[0]) != JSON.stringify(delivery)) {
                if (
                  (delivery &&
                    this.basisValue[0]?.idBasisLink == delivery.idBasisLink) ||
                  (delivery && this.basisValue.length == 0) ||
                  (delivery &&
                    (this.basisValue[0]?.basisName == delivery.basisName ||
                      delivery.concatedCondition.includes(
                        this.basisValue[0]?.basisName?.replace(/[:\-]/g, '')
                      )))
                ) {
                  if (
                    delivery?.placeName ==
                    this.basisForm.controls?.placeName.value ||
                    delivery?.placeName[0] ==
                    this.basisForm.controls?.placeName.value ||
                    delivery?.specifyingLocation?.toLowerCase() ==
                    this.basisForm.controls?.specifyingLocation?.value
                      ?.toString()
                      ?.toLowerCase()
                  ) {
                    this.error = true;
                    this.messageError =
                      this.translate.store.currentLang == 'RU'
                        ? RU['editOffer'].deliveryConditions.errorMessage1 +
                        this.basisChooseValue.basisName +
                        RU['editOffer'].deliveryConditions.errorMessage2
                        : EN['editOffer'].deliveryConditions.errorMessage1 +
                        this.basisChooseValue.basisName +
                        EN['editOffer'].deliveryConditions.errorMessage2;
                    this.messageError = this.messageError.replace(
                      /\n\r?/g,
                      '<br />'
                    );
                    return;
                  }
                }
                if (this.error) {
                  return;
                }
              }
            });
          }
          if (!this.error) {
            if (this.basisValue?.length > 0) {
              //редактирование базиса
              let isMinPriceOnBasicBasisError = false,
                isPriceQuote = false,
                isPriceRangeError = false;
              /* let enterPlace = this.EnterPlaceName ? ' ' + this.EnterPlaceName : '';
               let location = this.basisForm.controls?.specifyingLocation.value
                 ? ' ' + this.basisForm.controls?.specifyingLocation.value
                 : '';
               let concatedCondition =
                 this.basisChooseValue.basisName + enterPlace + location;*/


              this.basisValue.forEach((item) => {
                item.idPlaceLink = idPlaceLink
                item.idPlaceValue = this.choosenPlaceBasis
                  ? this.choosenPlaceBasis?.idValue
                  : item.idBasisLink == this.basisForm.controls?.basis.value &&
                  this.basisForm.controls.placeName?.value
                    ? this.basisValue[0].idPlaceValue
                    : null;
                item.enterPlaceName = this.EnterPlaceName;
                item.placeName = this.basisForm.controls?.placeName.value;
                item.specifyingLocation =
                  this.basisForm.controls?.specifyingLocation.value;
                item.basisId = this.basisChooseValue.basisId;
                item.basisName = this.basisChooseValue.basisName;
                item.idBasisLink = this.basisChooseValue.linkId;
                item.idBasisValue = this.basisChooseValue.valueId;
                item.placeTypeId = this.basisChooseValue.placeTypeId;
                item.minAddBasis = this.basisChooseValue.minAddBasis;
                item.minAddBasisPlaces = this.basisChooseValue.minAddBasisPlaces;
                item.contradictoryValueId =
                  this.basisChooseValue.contradictoryValueId;
                item.contradictoryBasisName =
                  this.basisChooseValue.contradictoryBasisName;
                item.isRequiredPlace = this.basisChooseValue.isRequiredPlace;
                item.isRequiredAddBasis = this.basisChooseValue.isRequiredAddBasis;
                item.parentId = this.basisChooseValue.parentId;
                item.level = this.basisChooseValue.level;
                item.hasChildren = this.basisChooseValue.hasChildren;
                item.concatedCondition = this.deliveryConditionName;

                let cost, goodCost, amendment;

                item.goods.forEach((g) => {
                  //проверка есть ли в измененном массиве цены
                  //  cost = this.changePrice?.length > 0 ? (this.changePrice.find(el => el.id == g.id) ? this.changePrice.find(el => el.id == g.id)?.cost : Number(g?.cost)) : Number(g?.cost);
                  amendment =
                    this.changeAmendment?.length > 0
                      ? this.changeAmendment.find((el) => el.idGood == g.idGood)
                        ? this.changeAmendment.find((el) => el.idGood == g.idGood)
                          ?.amendment
                        : Number(g?.amendment)
                      : null;
                  goodCost = this.goodsList
                    .find((el) => el.idGood == g.idGood)
                    ?.goodsSpecifications.find(
                      (el) => el.idInterfaceField == IdInterfaceField.priceWithoutVAT
                    ).fieldValueNumber; //цена в основном базисе
                  cost = this.basisGoods.find((bg) => bg.idGood == g.idGood).cost;
                  // g.cost = cost;
                  g.costVat =
                    round(g.volume * cost, 2) +
                    round((g.volume * cost * this.vat) / 100, 2);
                  g.amendment = amendment;

                  if (this.idAuctionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION) {
                    g.minPrice = this.basisGoods.find(
                      (bg) => bg.idGood == g.idGood
                    ).minPrice;
                  }

                  if (
                    cost <= goodCost &&
                    this.isMinPriceOnBasicBasis &&
                    !this.basisValue[0]?.isMain
                  ) {
                    isMinPriceOnBasicBasisError = true;
                    return;
                  }

                  let goodBasis = this.basisGoods.find(
                    (bg) => bg.idGood == g.idGood
                  );
                  //проверка цен на котировку
                  if (
                    this.isActiveQuotation &&
                    this.sessionsIds.idSessionPeriod == IdSessionPeriods.pretrading
                  ) {
                    if (goodBasis.quotation && cost != goodBasis.quotation) {
                      goodBasis.error = true;
                      isPriceQuote = true;
                    } else g.error ? (g.error = false) : null;
                  }

                  //проверка цен на ценовой коридор
                  if (
                    this.isActiveCorridor &&
                    this.sessionsIds.idSessionPeriod == IdSessionPeriods.pretrading
                  ) {
                    if (
                      (goodBasis.minPrice && cost < goodBasis.minPrice) ||
                      (goodBasis.maxPrice && cost > goodBasis.maxPrice)
                    ) {
                      //если не входит в ценовой коридор
                      goodBasis.range = true;
                      isPriceRangeError = true;
                    }
                  }

                  if (!isPriceQuote && !isMinPriceOnBasicBasisError) {
                    g.cost = cost;
                  }
                });
              })

              if (isMinPriceOnBasicBasisError) {
                this.error = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['editOffer'].deliveryConditions.messageErrorMinPrice
                    : EN['editOffer'].deliveryConditions.messageErrorMinPrice;
              }

              if (isPriceQuote) {
                this.error = true;
                this.isButtonPriceQuote = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['editOffer'].deliveryConditions.priceQuoteError1
                    : EN['editOffer'].deliveryConditions.priceQuoteError1;
                return;
              }

              if (isPriceRangeError) {
                this.errorState = 1;
                this.error = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['editOffer'].deliveryConditions.warningPriceRange
                    : EN['editOffer'].deliveryConditions.warningPriceRange;
                return;
              }

              if (
                !this.error &&
                this.basisValue[0].isMain &&
                this.changeCoreBasis
              ) {
                //изменили основной базис (выбрали другой в выпадающем списке)
                this.deliveryBasis = [this.deliveryBasis[0]];
              }
            } else {
              //добавление нового базиса
              let goodArray = [];

              let isPriceQuote = false,
                isPriceRangeError = false;
              this.basisGoods.forEach((good) => {
                let cost = good?.cost || null,
                  unit,
                  currency,
                  amendment = good?.amendment || null;
                if (this.changeAmendment?.length > 0) {
                  //проверка есть ли в измененном массиве поправки
                  let findEl = this.changeAmendment?.find(
                    (el) => el.idGood == good.idGood
                  );
                  if (findEl) {
                    amendment = findEl.amendment;
                  }
                }

                let goodMainBasisCost = this.goodsList
                  .find((el) => el.idGood == good.idGood)
                  ?.goodsSpecifications.find(
                    (el) => el.idInterfaceField == IdInterfaceField.priceWithoutVAT
                  ).fieldValueNumber; //цена в основном базисе
                if (
                  cost <= goodMainBasisCost &&
                  this.isMinPriceOnBasicBasis &&
                  this.deliveryBasis.length > 0
                ) {
                  this.error = true;
                  this.messageError =
                    this.translate.store.currentLang == 'RU'
                      ? RU['editOffer'].deliveryConditions.messageErrorMinPrice
                      : EN['editOffer'].deliveryConditions.messageErrorMinPrice;
                  return;
                }
                //проверка цен на котировку
                if (
                  this.isActiveQuotation &&
                  this.sessionsIds.idSessionPeriod == IdSessionPeriods.pretrading
                ) {
                  if (good.quotation && cost != good.quotation) {
                    good.error = true; //подсвечиваем красным
                    isPriceQuote = true;
                  }
                }

                //проверка цен на ценовой коридор
                if (
                  this.isActiveCorridor &&
                  this.sessionsIds.idSessionPeriod == IdSessionPeriods.pretrading
                ) {
                  if (
                    (good.minPrice && cost < good.minPrice) ||
                    (good.maxPrice && cost > good.maxPrice)
                  ) {
                    //если не входит в ценовой коридор
                    good.range = true;
                    isPriceRangeError = true;
                  }
                }
                let volume = good.goodsSpecifications.find(
                  (el) => el.idInterfaceField == IdInterfaceField.quantity
                ).fieldValueNumber;

                if (!this.error && !isPriceQuote) {
                  goodArray.push({
                    idGood: good.idGood,
                    goodName: good.goodName,
                    volume: volume,
                    unitName: good.unitName,
                    properties: good.properties,
                    cost: cost || null,
                    currency: good.goodsSpecifications.find(
                      (el) => el.idInterfaceField == IdInterfaceField.currency
                    ).fieldValue,
                    quotation: good.quotation, //при ценовом контрое значение котировки, при торгах по формуле с котировкой - значение котировки оттуда
                    quoteCurrency: good.quoteCurrency,
                    priceAdjustment: good.priceAdjustment?.id,
                    minPrice: good.minPrice || null,
                    maxPrice: good.maxPrice || null,
                    amendment: amendment,
                    currencyPrecision: good.goodsSpecifications.find(
                      (el) => el.idInterfaceField == IdInterfaceField.priceWithoutVAT
                    ).fieldPrecision,
                    volumePrecision: good.goodsSpecifications.find(
                      (field) => field.idInterfaceField == IdInterfaceField.quantity
                    ).fieldPrecision,
                    costVat:
                      round(volume * cost, 2) +
                      round((volume * cost * this.vat) / 100, 2),
                  });
                }
              });
              if (isPriceQuote) {
                this.error = true;
                this.isButtonPriceQuote = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['editOffer'].deliveryConditions.priceQuoteError1
                    : EN['editOffer'].deliveryConditions.priceQuoteError1;
                return;
              }

              if (isPriceRangeError) {
                this.errorState = 1;
                this.error = true;
                this.goodArray = goodArray;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['editOffer'].deliveryConditions.warningPriceRange
                    : EN['editOffer'].deliveryConditions.warningPriceRange;
                return;
              }

              if (!this.error) {
                this.deliveryBasisPush(goodArray, this.deliveryConditionName);
              }
            }
            if (!this.error) this.saveBasis.emit(this.deliveryBasis);
          }
        })
    }
  }

  public deliveryBasisPush(goodArray, deliveryConditionName: string): void {
    this.deliveryBasis.push(
      Object.assign(
        this.basisForm.value,
        {
          minAddBasis: this.basisChooseValue.minAddBasis,
          basisName: this.basisChooseValue.basisName,
          enterPlaceName: this.EnterPlaceName,
          isMain: this.deliveryBasis.length == 0,
          idBasisLink: this.basisChooseValue.linkId,
          idBasisValue: this.basisChooseValue.valueId,
          idPlaceLink: this.choosenPlaceBasis?.idLink || null,
          idPlaceValue: this.choosenPlaceBasis?.idValue || null,
          minAddBasisPlaces: this.basisChooseValue.minAddBasisPlaces,
          contradictoryValueId: this.basisChooseValue.contradictoryValueId,
          contradictoryBasisName: this.basisChooseValue.contradictoryBasisName,
          isRequiredPlace: this.basisChooseValue.isRequiredPlace,
          isRequiredAddBasis: this.basisChooseValue.isRequiredAddBasis,
          placeTypeId: this.basisChooseValue.placeTypeId,
          parentId: this.basisChooseValue.parentId,
          level: this.basisChooseValue.level,
          hasChildren: this.basisChooseValue.hasChildren,
          basisId: this.basisChooseValue.basisId,
          specifyingLocation: this.basisForm.controls?.specifyingLocation.value,
          concatedCondition: deliveryConditionName,
        },
        {goods: goodArray}
      )
    );
  }

  continue() {
    if (
      this.basisValue?.length > 0 &&
      this.basisValue[0].isMain &&
      this.changeCoreBasis
    ) {
      //При редактировании базиса проверем основной ли базис (если основной, остальные сбрасывем)
      this.deliveryBasis = [this.deliveryBasis[0]];
    }
    if (this.basisValue?.length == 0) {
      //при добавлении нового базиса
      this.deliveryBasisPush(this.goodArray, this.deliveryConditionName);
    }
    this.saveBasis.emit(this.deliveryBasis);
  }

  public readonly editingRules = editingRules;
  public readonly IdInterfaceField = IdInterfaceField;
  public readonly IdSessionPeriods = IdSessionPeriods;
}
