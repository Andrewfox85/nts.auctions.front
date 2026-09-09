import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';

import {
  editingRules,
  IdDirection,
  DX_MODULES,
  IdInterfaceField,
  auctionType,
  POPUP_SIDEBAR_TYPE,
  IdSessionPeriods
} from '@constants';
import { TradingService } from '@services';
import RU from '@ru-translate';
import EN from '@en-translate';
import { ToastService } from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToNumberPipe, RuNumberFormatPipe } from '@pipes';
import { SECTIONS_TYPES } from "../../../features/header/enums";
import { DemandGood } from "../../analogs-list/interfaces";
import { OfferGood } from "../../../services/counter-service/shared";
import { ICounterOfferGood, IEditOfferGoodsSpecifications } from "@interfaces";
import { DisableNumberBoxWheel } from "../../../shared/directives/disable-number-box-wheel";
import { ValueChangedEvent } from "devextreme/ui/number_box";
import { SumVolumePipe } from "../../../shared/pipes/sumVolume/sum-volume-pipe";
import { takeUntil } from "rxjs/operators";
import { DELIVERY_SCOPE_ITEMS } from "@enums";
import {
  DeliveryScopeGraded,
  EditDemandOfferServiceService
} from "../../../services/edit-demand-offer-service.service";

@Component({
  selector: 'app-delivery-scope-edit',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    ToNumberPipe,
    RuNumberFormatPipe,
    DisableNumberBoxWheel,
    SumVolumePipe
  ],
  templateUrl: './delivery-scope-edit.component.html',
  styleUrls: ['./delivery-scope-edit.component.scss'],
})
export class DeliveryScopeEditComponent implements OnInit, OnChanges {
  @Input() deliveryScopes;
  @Input() goods;
  @Input() direction;
  @Input() idSection: string | number;
  @Input() conterGoodsInfo: DemandGood[] | OfferGood[] | ICounterOfferGood[];
  @Input() idSessionPeriod: number;
  @Input() idAuctionType: number;
  @Input() editRulesIntersections;
  @Input() isSameGradedSaleOffer: boolean = false;
  @Input() deliveryScopeGraded: DeliveryScopeGraded[];
  @Input() counterScope; //удаленные грузоотправители, применяется для принятия встречек
  @Input() type; //чтобы отличить редактируем заявку или направляем встречку
  @Output() onRedFlag = new EventEmitter();
  @Output() onHideRedFlag = new EventEmitter();

  idDirection = IdDirection;

  totalRowData = [];
  totalRowDataCounter = [];
  totalRowDataCounterGood = [];
  totalGoodData = [];
  precisionVolume: number;
  totalGoodsFromOffer: number;
  isVisibleDeletePopup = false;
  scope: any;
  //deliveryScopesOriginal = []

  deletedScopeForCounter: any = [];

  changeVolume: Subscription;
  concatedDeletedClients: Subscription;
  changeScopes: Subscription;

  protected readonly editingRules = editingRules;
  protected readonly JSON = JSON;
  private destroy$: Subject<void> = new Subject<void>();
  private updateTotalTableSubject: Subject<DeliveryScopeGraded[]> = new Subject<DeliveryScopeGraded[]>();
  private sumVolumePipe: SumVolumePipe = inject(SumVolumePipe);

  protected readonly DELIVERY_SCOPE_ITEMS = DELIVERY_SCOPE_ITEMS;
  protected readonly auctionType = auctionType;

  constructor(
    private tradingService: TradingService,
    public toastService: ToastService,
    private translate: TranslateService,
    public editDemandOfferServiceService: EditDemandOfferServiceService
  ) {

  }

  public isViewAdditionalColumns(): boolean {
    return this.type === POPUP_SIDEBAR_TYPE.COUNTER_OFFERS &&
      !(this.isSameGradedSaleOffer || this.idAuctionType === auctionType.simpleBuyerAuction);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['conterGoodsInfo']) {
      if (this.type === 'counterOffers') {
        if (Number(this.idSection) === SECTIONS_TYPES.AGRI) {
          this.conterGoodsInfo = changes['conterGoodsInfo'].currentValue;
          this.countVolumes();
        }
      }
    }
    if (changes['goods']) {
      this.goods = this.goods.map(good => {
        const volumeField: IEditOfferGoodsSpecifications = good.goodsSpecifications?.find(
          field => field.idInterfaceField === IdInterfaceField.quantity
        );

        return {
          ...good,
          volume: volumeField?.fieldValueNumber || 0
        };
      });
    }
  }

  public getGradedValue(idFirmClient: string): number {
    return this.deliveryScopeGraded?.find(client => client.idFirmClient === Number(idFirmClient))?.volume || 0;
  }

  public getMaxGradedValue(idFirmClient: string): number {
    return this.deliveryScopes?.find(client => client[DELIVERY_SCOPE_ITEMS.ID_SCOPE] === idFirmClient)
      ?.[DELIVERY_SCOPE_ITEMS.SCOPE_INFO][0]?.volume || 0;
  }

  ngOnInit(): void {
    this.counterScope = this.counterScope?.split(', ');
    this.precisionVolume = this.goods[0].goodsSpecifications.find(
      (field) => field.idInterfaceField == 1
    ).fieldPrecision;
    this.countVolumes();
    this.changeVolume = this.tradingService.changeVolume$.subscribe(
      (res: any) => {
        if (res.str !== 'scope') {
          this.goods = res.goods.map((good) => {
            return {
              ...good,
              volume: this.getVolumeValue(good.goodsSpecifications) || 0
            };
          });

          this.isNeedFlag();
        }
      }
    );

    if (this.type == 'counterOffers') {
      this.concatedDeletedClients =
        this.tradingService.concatedDeletedClients$.subscribe((res: any) => {
          this.counterScope = res?.split(', ');
          this.countVolumes();
        });
    }
    //приняли встречку или при подаче встречке изменили брокера
    this.changeScopes = this.tradingService.changeScopes$.subscribe(
      (res: any) => {
        if (!this.isSameGradedSaleOffer) {
          this.deliveryScopes = res;
        } else {
          this.deliveryScopes?.forEach((scope) => {
            scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].isDeletedScope = false;
          });
          this.updateTotalTableSubject.next(res);
        }
        this.countVolumes();
        this.isNeedFlag();
        if (this.type == 'submitCounterOffers') {
          this.deletedScopeForCounter = [];
          this.tradingService.deletedScopeForCounter = this.deletedScopeForCounter;
        }
      }
    );
    this.updateTotalTableSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((array: any[]) => {
        this.deliveryScopeGraded = [...array];
        this.tradingService.nonDisabledSaveButton({
          deliveryScopeGraded: this.deliveryScopeGraded,
        });
      });
  }

  countVolumes() {
    this.deliveryScopes.forEach((scope) => {
      let sum = 0;
      scope[1].forEach((good) => {
        sum = sum + good.volume;
      });
      this.totalRowData[scope[0].toString()] = sum;

      //для встречки
      if (this.type == 'counterOffers') {
        let sumCounter = 0;
        scope[1].forEach((good) => {
          good.volumeCounter = this.counterScope?.includes(scope[0])
            ? 0
            : good.volume;
          sumCounter = sumCounter + good.volumeCounter;
        });
        this.totalRowDataCounter[scope[0].toString()] = sumCounter;
      }
    });

    this.goods.forEach((item) => {
      let sumGood = 0,
        sumGoodCounter = 0;
      this.deliveryScopes.forEach((scope) => {
        if (!scope[1].isDeletedScope) {
          scope[1].forEach((good) => {
            if (Number(item.idGood) === Number(good.idGood)) {
              sumGood = sumGood + good.volume;
            }
          });
        }
        if (this.type == 'counterOffers') {
          scope[1].forEach((good) => {
            if (Number(item.idGood) === Number(good.idGood)) {
              sumGoodCounter =
                sumGoodCounter +
                (this.counterScope?.includes(scope[0]) ? 0 : good.volume);
            }
          });
        }
      });
      this.totalGoodData[item.idGood] = sumGood;
      if (this.type === 'counterOffers') {
        if (Number(this.idSection) !== SECTIONS_TYPES.AGRI) {
          this.totalRowDataCounterGood[item.idGood] = sumGoodCounter;
        } else {
          const conterGood = this.conterGoodsInfo.find(good => {
            if (this.isDemandGood(good)) {
              return good.idDemandGood === item.goodsSpecifications[0].idDemandOfferGood;
            } else if (this.isOfferGood(good)) {
              return good.idOfferGood === item.goodsSpecifications[0].idDemandOfferGood;
            }
            return false;
          });
          this.totalRowDataCounterGood[item.idGood] = conterGood?.volume;
        }
      }

    });
  }

  public isDemandGood(good: DemandGood | OfferGood | ICounterOfferGood): good is DemandGood {
    return 'idDemandGood' in good;
  }

  public isOfferGood(good: DemandGood | OfferGood | ICounterOfferGood): good is OfferGood {
    return 'idOfferGood' in good;
  }

  onChangeScopeDelivery(idFirm, idGood) {
    let scopes = this.deliveryScopes.find((el) => el[0] == idFirm)[1];
    // if(this.onSameUnits()){
    let sum = 0;
    scopes.forEach((good) => {
      sum = sum + good.volume;
    });
    this.totalRowData[idFirm.toString()] = sum;

    let sumGood = 0;
    this.deliveryScopes.forEach((scope) => {
      if (!scope[1].isDeletedScope) {
        scope[1].forEach((good) => {
          if (idGood == good.idGood) sumGood = sumGood + good.volume;
        });
      }
    });
    this.totalGoodData[idGood] = sumGood;

    this.isNeedFlag();
  }

  public isNeedFlag(): void {
    const isEqual: boolean = this.isSameGradedSaleOffer ?
      this.isEqualsGraded() :
      this.isEquals();
    if (isEqual) {
      this.onHideRedFlag.emit();
      this.tradingService.nonDisabledSaveButton({
        deliveryScope: this.deliveryScopes,
      });
    } else {
      this.onRedFlag.emit();
    }
  }

  maxGoodVolume(idGood) {
    return this.getVolumeValue(
      this.goods.find((good) => good.idGood == idGood).goodsSpecifications
    );
  }

  getVolumeValue(goodsSpecifications) {
    return goodsSpecifications.find((field) => field.idInterfaceField == 1)
      .fieldValueNumber;
  }

  getTotalGoodsFromScope() {
    let sum = 0;
    this.goods.forEach((good) => {
      sum = sum + this.totalGoodData[good.idGood];
    });
    return sum;
  }

  getTotalGoodsFromScopeCounter() {
    let sum = 0;
    this.goods.forEach((good) => {
      sum = sum + this.totalRowDataCounterGood[good.idGood];
    });
    return sum;
  }

  Number(e) {
    return Number(e);
  }

  public onDeleteScope(): void {
    this.isVisibleDeletePopup = false;
    this.processingDataForDeleteRestore(this.scope, true);

    this.tradingService.nonDisabledSaveButton({
      deliveryScope: this.deliveryScopes,
    });
    if (this.type == 'submitCounterOffers') {
      this.deletedScopeForCounter.push(Number(this.scope[0]));
      this.tradingService.deletedScopeForCounter = this.deletedScopeForCounter;
    }
  }

  protected isDeleteOrRestoreGradedScope(isDelete: boolean, idFirmClient: string): void {
    this.deliveryScopeGraded.find(scope => scope.idFirmClient === Number(idFirmClient)).isDeletedScope = isDelete;
    this.updateTotalTableSubject.next(this.deliveryScopeGraded);
    this.isNeedFlag();
  }

  public onDelete(scopes): void {
    const isEqual: boolean = this.isSameGradedSaleOffer ?
      this.isEqualsGraded() :
      this.isEquals();
    if (isEqual) {
      this.scope = scopes;
      this.isVisibleDeletePopup = true;
    } else {
      let message = `${
        this.translate.store.currentLang == 'RU'
          ? RU['editOffer'].unableDeleteShipper
          : EN['editOffer'].unableDeleteShipper
      }`; //todo Сообщение!!!!!
      this.toastService.onShowToast({ message: message, type: 'error' });
    }
  }

  public isCanDelete(): boolean {
    const deletedScopeCount = this.deliveryScopes.filter(scope => scope[1]?.isDeletedScope === true).length;
    return this.deliveryScopes.length - deletedScopeCount !== 1;
  }

  public onRestoreScope(scope): void {
    this.processingDataForDeleteRestore(scope, false);

    if (this.type === 'submitCounterOffers') {
      this.deletedScopeForCounter = this.deletedScopeForCounter.filter(
        (item) => item !== Number(this.scope[0])
      );
      this.tradingService.deletedScopeForCounter = this.deletedScopeForCounter;
    }
  }

  private processingDataForDeleteRestore(scope, isDelete: boolean): void {
    scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].isDeletedScope = isDelete;
    if (!this.isSameGradedSaleOffer) {
      this.goods.forEach((item) => {
        let sumGood: number = 0;
        this.deliveryScopes.forEach((scope) => {
          if (!scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].isDeletedScope) {
            scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].forEach((good) => {
              if (item.idGood === good.idGood) {
                sumGood = sumGood + good.volume;
              }
            });
          }
        });
        if (this.idAuctionType !== auctionType.simpleBuyerAuction) {
          let goodValue: number = item.goodsSpecifications.find(
            (field) => field.idInterfaceField === IdInterfaceField.quantity
          ).fieldValueNumber; //общее количество в заявке
          scope[DELIVERY_SCOPE_ITEMS.SCOPE_INFO].forEach((good) => {
            if (item.idGood === good.idGood) {
              const newVolume: number = isDelete ? (goodValue - good.volume) : (goodValue + good.volume);
              item.goodsSpecifications.find(
                (field) => field.idInterfaceField === IdInterfaceField.quantity
              ).fieldValueNumber = newVolume; //заменяем количество
              item.goodsSpecifications.find(
                (field) => field.idInterfaceField === IdInterfaceField.quantity
              ).fieldValue = newVolume.toString().replace('.', ','); //заменяем количество
            }
          });
        }
        this.totalGoodData[item.idGood] = sumGood;
      });
      this.tradingService.editVolume({ goods: this.goods, str: 'scope' });
      this.isNeedFlag();
    } else {
      this.isDeleteOrRestoreGradedScope(isDelete, scope[DELIVERY_SCOPE_ITEMS.ID_SCOPE]);
    }
  }

  public isEquals(): boolean {
    //проверяет равно ли общее количество в заявке и в грузополучателях/грузоотправителях
    return this.sumVolumePipe.transform(this.goods, 'volume') === Number(this.getTotalGoodsFromScope());
  }

  public isEqualsGraded(): boolean {
    return this.sumVolumePipe.transform(this.goods, 'volume') ===
      this.sumVolumePipe.transform(this.filteredWithoutDeleted(), 'volume');
  }

  public filteredWithoutDeleted(){
    return this.deliveryScopeGraded.filter(el=> !el.isDeletedScope)
  }

  onSameUnits() {
    let count = 0,
      sum = 0;
    this.goods.forEach((item) => {
      if (item.unitId == this.goods[0].unitId) {
        count = count + 1;
      }
      //подсчет из заявки итого по товару
      sum = sum + this.getVolumeValue(item.goodsSpecifications);
    });
    this.totalGoodsFromOffer = sum;
    return count == this.goods.length;
  }

  editRuleInIntersections() {
    //если количество нельзя редактировать, то запрещается удалять грузоотправителей
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField == 1)
        ?.idEditRule || null
    );
  }

  public onChangeTotalScopeValue(event: ValueChangedEvent, idBroker: string): void {
    const delivScope = this.deliveryScopeGraded.find(el => el.idFirmClient === Number(idBroker));
    if (!delivScope) {
      return;
    }
    delivScope.volume = Number(event.value) || 0;
    this.updateTotalTableSubject.next(this.deliveryScopeGraded);
    this.isNeedFlag();
  }

  ngOnDestroy() {
    this.changeVolume?.unsubscribe();
    this.concatedDeletedClients?.unsubscribe();
    this.changeScopes?.unsubscribe();
  }

  protected readonly IdSessionPeriods = IdSessionPeriods;
}
