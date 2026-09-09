import { Component, OnInit, Input, SimpleChanges, inject } from '@angular/core';
import { User } from '@classes';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DX_MODULES } from '@constants';
import { RuNumberFormatPipe, ToNumberPipe } from '@pipes';
import { DxGridContextMenuLocalizationDirective } from '../../shared/directives';
import { ICounterOfferGood } from "@interfaces";
import { SECTIONS_TYPES } from "../../features/header/enums";
import dxDataGrid, { CellPreparedEvent, Row } from "devextreme/ui/data_grid";
import { DELIVERY_SCOPE_ITEMS } from "@enums";
import { SumVolumePipe } from "../../shared/pipes/sumVolume/sum-volume-pipe";
import { EditDemandOfferServiceService } from "../../services/edit-demand-offer-service.service";
import { transformToFlatStructure } from "@helpers";
import { log } from "@angular-devkit/build-angular/src/builders/ssr-dev-server";

@Component({
  selector: 'app-delivery-scope',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    RuNumberFormatPipe,
    ToNumberPipe,
    ToNumberPipe,
    DxGridContextMenuLocalizationDirective,
    SumVolumePipe
  ],
  templateUrl: './delivery-scope.component.html',
  styleUrls: ['./delivery-scope.component.scss'],
})
export class DeliveryScopeComponent implements OnInit {
  @Input() deliveryScopes;
  @Input() goods;
  @Input() type;
  @Input() deletedScope;
  @Input() deliveryScopesParent;
  @Input() idSection: string | number;
  @Input() conterGoodsInfo: ICounterOfferGood[];
  @Input() isDeliveryScopeGraded: boolean = false;

  user: User;
  totalRowData = [];
  totalRowDataCounter = [];
  totalGoodData = [];
  precisionVolume: number;
  totalGoodsFromOffer: number;
  sumGoodsCounter: any; //для подсчета потоварно для встречки
  totalGoodsFromCounter: any;

  deletedScopeIds: any = []; //массив id удаленных грузоотправитлей
  isMineCounter: boolean; //для отображения столбца встречки

  scopes = []; //для сравнения грузоотправителей/грузополучателей первоначальный массив

  private subscription!: Subscription;
  protected readonly DELIVERY_SCOPE_ITEMS = DELIVERY_SCOPE_ITEMS;
  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);

  constructor() {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.precisionVolume = this.goods[0].goodsSpecifications.find(
      (field) => field.idInterfaceField == 1
    ).fieldPrecision;
  }

  ngOnChanges() {
    if (this.type == 'compareOffer') {
      this.scopes = JSON.parse(JSON.stringify(this.deliveryScopes));
    }

    if (this.deliveryScopes?.length > 0) {
      this.deliveryScopes = transformToFlatStructure(this.deliveryScopes);

    }

    if (this.deliveryScopes?.length > 0 && !this.deliveryScopes[0][1]) {
      if (this.isDeliveryScopeGraded) {
        this.deliveryScopes = this.deliveryScopes.flatMap(scope =>
          this.goods.map(good => ({
            ...scope,
            idDemandOfferGood: good.idGood,
            ...this.editDemandOfferServiceService.getGenerateGoodFields(good)
          }))
        );
      } else {
        this.deliveryScopes.forEach((scope) => {
          this.goods.forEach((good) => {
            if (
              good.goodsSpecifications[0].idDemandOfferGood ==
              scope.idDemandOfferGood
            ) {
              Object.assign(scope, this.editDemandOfferServiceService.getGenerateGoodFields(good));
            }
          });
        });
      }

      this.deliveryScopes = this.deliveryScopes.reduce(function (r, a) {
        //сгруппированы поля по idFirmClient
        r[a.idFirmClient] = r[a.idFirmClient] || [];
        r[a.idFirmClient].push(a);
        return r;
      }, {});
      this.deliveryScopes = Object.entries(this.deliveryScopes);
    }

    if (this.type == 'counterRegister') {
      this.compareScopesFromCounter();
    }
  }

  compareScopesFromCounter() {
    this.isMineCounter = this.deletedScope.isMine;
    this.deletedScopeIds = this.deletedScope.concatedDeletedScope
      ? this.deletedScope.concatedDeletedScope.split(', ')
      : [];
    this.sumGoodsCounter = {};
    this.deliveryScopes.forEach((scope) => {
      let sum = 0,
        sumCounter = 0;
      if (scope[2] && scope[2].hasOwnProperty('isDeleted')) {
        //добавляем признак удаленного грузоотпрвителя
        scope[2].isDeleted = this.deletedScopeIds.includes(scope[0]);
      } else {
        scope.push({ isDeleted: this.deletedScopeIds.includes(scope[0]) });
      }

      scope[1].forEach((s) => {
        s.volumeCounter = scope[2].isDeleted ? 0 : s.volume; //если грузотправитель был удален при подаче - обнуляем кол-во в столбце встречки

        sum = sum + s.volume;
        sumCounter = sumCounter + s.volumeCounter;
        if (Number(this.idSection) !== SECTIONS_TYPES.AGRI) {
          if (this.sumGoodsCounter[s.idDemandOfferGood]) {
            this.sumGoodsCounter[s.idDemandOfferGood] += s.volumeCounter;
          } else {
            this.sumGoodsCounter[s.idDemandOfferGood] = s.volumeCounter;
          }
        } else {
          const conterGood = this.conterGoodsInfo.find(good =>
            (good.idDemandGood || good.idOfferGood) === s.idDemandOfferGood
          );
          this.sumGoodsCounter[s.idDemandOfferGood] = conterGood?.volume;
        }
      });
      this.totalRowData[scope[0].toString()] = sum;
      this.totalRowDataCounter[scope[0].toString()] = sumCounter; //итого по отдельному грузоотпавителю
      this.totalGoodsFromCounter = Object.values(
        this.sumGoodsCounter as number[]
      ).reduce((sum, value) => sum + value, 0); //итого по всем грузоотпавителям, потоварно
    });
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

  getVolumeValue(goodsSpecifications) {
    return goodsSpecifications.find((field) => field.idInterfaceField == 1)
      .fieldValueNumber;
  }

  getCounterVolumeValue(id) {
    //return this.sumGoodsCounter.find(el => el.idGood == id).sum
    return this.sumGoodsCounter[id];
  }

  changeScope(scope) {
    //приходит всегда в одинаковом порядке, сравниваем объекты без учета товара, только по датам и количеству.
    let scopes = this.scopes.map((el) => ({
      firmClientName: el.firmClientName,
      idFirmClient: el.idFirmClient,
      volume: el.volume,
    }));
    let deliveryScopesParent = this.deliveryScopesParent.map((el) => ({
      firmClientName: el.firmClientName,
      idFirmClient: el.idFirmClient,
      volume: el.volume,
    }));
    let arrayForComparison = scopes.find(
      (el) => el.idFirmClient == scope[0].idFirmClient
    );
    let arrayParentForComparison = deliveryScopesParent.find(
      (el) => el.idFirmClient == scope[0].idFirmClient
    );
    return (
      JSON.stringify(arrayForComparison) ===
      JSON.stringify(arrayParentForComparison)
    );
  }

  public onCellPreparedDelivScope(event: CellPreparedEvent, goodsListCount: number, isSameGarade: boolean): void {
    if (isSameGarade) {
      if (event.rowType === 'data' && event.column.dataField === 'volume') {
        const dataGrid: dxDataGrid<any, any> = event.component;
        const visibleRows: Row[] = dataGrid.getVisibleRows();
        const rowIndex: number = event.rowIndex;
        const currentData: any = event.data;

        if (rowIndex > 0 && visibleRows[rowIndex - 1].data?.volume === currentData?.volume) {
          event.cellElement.style.display = 'none';
          return;
        }

        let rowSpan: number = goodsListCount;

        if (rowSpan > 1) {
          event.cellElement.setAttribute('rowspan', rowSpan.toString());
          event.cellElement.style.verticalAlign = 'middle';
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
