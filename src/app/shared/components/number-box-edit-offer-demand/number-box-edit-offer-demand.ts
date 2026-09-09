import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { auctionType, editingRules, IdDirection, IdInterfaceField, PRICE_ADJUSTMENT_TYPE } from "@constants";
import { IEditOfferGood, IEditOfferGoodsSpecifications, TotalRowData } from "@interfaces";
import { DxNumberBoxComponent, DxValidatorComponent } from "devextreme-angular";
import { DxNumberBoxClearDirective } from "@directives";
import { DxiValidationRuleComponent, DxoFormatComponent } from "devextreme-angular/ui/nested";
import { TranslateModule } from "@ngx-translate/core";
import {
  EditDemandOfferServiceService,
  EditRule,
  SessionIds
} from "../../../services/edit-demand-offer-service.service";
import { getIdGood, getVatNumber, round } from "@helpers";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TradingService } from "@services";
import { DisableNumberBoxWheel } from "../../directives/disable-number-box-wheel";

@Component({
  selector: 'app-number-box-edit-offer-demand',
  imports: [
    DisableNumberBoxWheel,
    DxNumberBoxComponent,
    DxNumberBoxClearDirective,
    DxiValidationRuleComponent,
    DxValidatorComponent,
    DxoFormatComponent,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './number-box-edit-offer-demand.html',
  styleUrl: './number-box-edit-offer-demand.scss',
  standalone: true
})
export class NumberBoxEditOfferDemand {
  @Input() goodForm: FormGroup;
  @Input() data: IEditOfferGoodsSpecifications;
  @Input() idGood: number;
  @Input() goods: IEditOfferGood[];
  @Input() currencyPrecision: number;
  @Input() directionId: number;
  @Output() updateTotalRow: EventEmitter<TotalRowData> = new EventEmitter<TotalRowData>();
  @Output() isShowNotific: EventEmitter<boolean> = new EventEmitter<boolean>();

  protected readonly editingRules = editingRules;
  protected readonly auctionType = auctionType;
  protected readonly IdInterfaceField = IdInterfaceField;
  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);
  private readonly tradingService = inject(TradingService);

  public CONST_MIN_PRICE: number = 0.1;

  public sessionIds: SessionIds;
  public VatField: IEditOfferGoodsSpecifications;

  public ngOnInit(){
    this.sessionIds = this.editDemandOfferServiceService.sessionIdsSubject.getValue();
    this.VatField = this.editDemandOfferServiceService.VatFieldSubject.getValue();
  }

  public getPlaceholder(): string {
    return `0${
      this.data?.fieldPrecision >= 2
        ? `.${'0'.repeat(this.data.fieldPrecision)}`
        : '0'
    }`;
  }

  public zeroComparison = (): number => 0;

  public minFieldValue(data: IEditOfferGoodsSpecifications, idGood: number): number {
    return this.editDemandOfferServiceService.editRuleInIntersections(data.idInterfaceField) ===
    editingRules.increaseValue
      ? this.editDemandOfferServiceService.getGoodsSpecifications(
        this.editDemandOfferServiceService.getOriginalGood(idGood)?.goodsSpecifications,
        data.idInterfaceField
      )?.fieldValueNumber
      : data.idInterfaceField === IdInterfaceField.minPrice
        ? this.CONST_MIN_PRICE
        : 0;
  }

  public maxFieldValue(data: IEditOfferGoodsSpecifications, idGood: number): number {
    if (this.editDemandOfferServiceService.editRuleInIntersections(data.idInterfaceField) ===
      editingRules.decreaseValue) {
      return this.editDemandOfferServiceService.getGoodsSpecifications(
        this.editDemandOfferServiceService.getOriginalGood(idGood)?.goodsSpecifications,
        data.idInterfaceField
      )?.fieldValueNumber;
    }
  }

  public minPriceCondition(data: IEditOfferGoodsSpecifications): boolean {
    return (
      this.editDemandOfferServiceService.getGoodsSpecifications(
        this.goods[0].goodsSpecifications,
        IdInterfaceField.minPrice
      ) &&
      this.sessionIds.session.idAuctionType ===
      auctionType.simpleBuyerAuction &&
      this.directionId === IdDirection.buy
    );
  }

  public minPriceComparison = (idGood: number): number => {
    return (
      this.goodForm.get(
        idGood.toString() + '_' + IdInterfaceField.minPrice.toString()
      )?.value || 0
    );
  };

  public checkQuantityNotZero(): boolean {
    let editRulesIntersections: EditRule[] = this.editDemandOfferServiceService.editRulesIntersectionsSubject.getValue();
    return (
      editRulesIntersections?.find((el) => el.idInterfaceField === IdInterfaceField.quantity)
        ?.isCheckQuantityNotZero || false
    );
  }

  public isDisabled(idInterfaceField: number): boolean {
    return (this.sessionIds.session.idAuctionType ===
        auctionType.simpleSellerAuction &&
        IdInterfaceField.minPrice ===
        idInterfaceField) ||
      this.editDemandOfferServiceService.editRuleInIntersections(idInterfaceField) ===
      editingRules.editingIsNotAvailable;
  }

  public getPrecision(): number {
    if (this.data.idInterfaceField === IdInterfaceField.minPrice) {
      return this.currencyPrecision;
    }

    if (this.data.idInterfaceField === IdInterfaceField.amendment) {
      return this.editDemandOfferServiceService.getGoodsSpecifications(
        this.editDemandOfferServiceService.getOriginalGood(this.idGood).goodsSpecifications,
        IdInterfaceField.amendmentType
      ).fieldValueNumber === PRICE_ADJUSTMENT_TYPE.absoluteType
        ? this.currencyPrecision
        : 0;
    }

    return this.data.fieldPrecision;
  }


  public calculate(idGood: number, idField: number): void {
    let vat: number = getVatNumber(this.VatField),
      volumeTotal: number = 0,
      costWithoutVatTotal: number = 0,
      amountVATTotal: number = 0,
      costVATTotal: number = 0;

    let good: IEditOfferGood = this.goods.find((el) => getIdGood(el) === idGood);

    good.goodsSpecifications.find(
      (el) => el.idInterfaceField === idField
    ).fieldValueNumber = Number(
      this.goodForm.controls[getIdGood(good).toString() + '_' + idField.toString()]
        .value
    );
    good.goodsSpecifications.find(
      (el) => el.idInterfaceField === idField
    ).fieldValue = Number(
      this.goodForm.controls[getIdGood(good).toString() + '_' + idField.toString()]
        .value
    ).toString();

    let count: number = Number(
      this.goodForm.controls[getIdGood(good).toString() + '_' + IdInterfaceField.quantity].value
    ); //количество
    let priceWithoutVat: number = Number(
      this.goodForm.controls[getIdGood(good).toString() + '_' + IdInterfaceField.priceWithoutVAT].value
    ); //Цена без НДС

    let costWithoutVAT: number = round(count * priceWithoutVat, this.currencyPrecision);
    let amountVAT: number = round(costWithoutVAT * (vat / 100), this.currencyPrecision);
    let costVAT: number = costWithoutVAT + amountVAT;

    good.goodsSpecifications.forEach((item) => {
      if (item.costWithoutVAT || item.costWithoutVAT === 0) {
        item.costWithoutVAT = costWithoutVAT;
        item.fieldValue = costWithoutVAT;
      }
      if (item.amountVAT || item.amountVAT === 0) {
        item.amountVAT = amountVAT;
        item.fieldValue = amountVAT;
      }
      if (item.costVAT || item.costVAT === 0) {
        item.costVAT = costVAT;
        item.fieldValue = costVAT;
      }
    });

    this.goods.forEach((good) => {
      good.goodsSpecifications.forEach((item) => {
        if (item.idInterfaceField === IdInterfaceField.quantity) {
          volumeTotal = volumeTotal + item.fieldValueNumber;
        }
        if (item.costWithoutVAT || item.costWithoutVAT === 0) {
          costWithoutVatTotal = costWithoutVatTotal + item.costWithoutVAT;
        }
        if (item.amountVAT || item.amountVAT === 0) {
          amountVATTotal = amountVATTotal + item.amountVAT;
        }
        if (item.costVAT || item.costVAT === 0) {
          costVATTotal = costVATTotal + item.costVAT;
        }
      });
    });

    const totalRowData: TotalRowData = {
      quantity: volumeTotal.toString(),
      costWithoutVat: costWithoutVatTotal.toString(),
      amountVAT: amountVATTotal.toString(),
      costVat: costVATTotal.toString()
    };

    this.updateTotalRow.emit(totalRowData);

    if (idField === IdInterfaceField.quantity) {
      //количество
      this.tradingService.editVolume({ goods: this.goods, str: 'edit' });
      this.isShowNotific.emit(true);
    } else {
      // цена
      this.tradingService.editMainBasisInfo({ goods: this.goods, str: 'edit' });
    }
  }
}
