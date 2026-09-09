import {Component, EventEmitter, Input, Output} from '@angular/core';
import {editingRules, IdInterfaceField} from "@constants";
import {DxCheckBoxComponent, DxSelectBoxComponent, DxTooltipComponent, DxValidatorComponent} from "devextreme-angular";
import {IEditOfferGood, IEditOfferGoodsSpecifications} from "@interfaces";
import {DxiValidationRuleComponent} from "devextreme-angular/ui/nested";
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'app-additional-fields-for-sale',
  imports: [
    DxTooltipComponent,
    DxSelectBoxComponent,
    DxValidatorComponent,
    DxiValidationRuleComponent,
    DxCheckBoxComponent,
    TranslateModule
  ],
  templateUrl: './additional-fields-for-sale.component.html',
  styleUrl: './additional-fields-for-sale.component.scss',
  standalone: true
})
export class AdditionalFieldsForSaleComponent {
  @Input({required: true}) goods: IEditOfferGood[];

  @Input({required: true}) productLocations: any[] = [];

  @Input({required: true}) productLocationValue: any;

  @Input({required: true}) adjustablePrice: boolean = false;

  @Input({required: true}) isDisabledAdjustablePrice: boolean = false;

  @Input({required: true}) returnGoodsSpecifications!: (
    goodsSpecifications: IEditOfferGoodsSpecifications[],
    idField: number) => IEditOfferGoodsSpecifications;

  @Input({required: true}) returnEditRule!: (
    idField: number) => number;

  @Input({required: true}) isComplexLotGrades!: () => boolean;

  @Output() checkRuleFieldId =new EventEmitter<number>();

  @Output() productLocationValueChange = new EventEmitter<any>();
  @Output() adjustablePriceChange = new EventEmitter<boolean>();
  @Output() continueEditProductLocation = new EventEmitter<void>();
  @Output() changedAdjustablePrice = new EventEmitter<boolean>();
  @Output() isDisabledSaveButton =new EventEmitter<boolean>();
  @Output() goodsSpecifications =new EventEmitter<any>();

  public getGoodsSpecifications(goodsSpecifications: IEditOfferGoodsSpecifications[], idField: number): any{
    this.goodsSpecifications.emit({goodsSpecifications, idField});
  }

  public editRuleInIntersections(fieldId: number): any  {
    this.checkRuleFieldId.emit(fieldId)
  }

  onProductLocationChanged(event: any): void {
    this.productLocationValueChange.emit(event.value);
    this.continueEditProductLocation.emit();
  }

  onAdjustablePriceChanged(event: any): void {
    this.adjustablePriceChange.emit(event.value);
    this.changedAdjustablePrice.emit(event);
  }




/*
  @Input({required: true}) isComplexLotGrades!: () => boolean;

  @Input({required: true}) returnGoodsSpecifications!: (
    goodsSpecifications: GoodsSpecifications[],
    idField: number) => GoodsSpecifications;

  @Input({required: true}) goods: Goods[];

  @Input({required: true}) productLocations: [];

  @Input({required: true}) productLocationValue: number;

  @Input({required: true}) isDisabledAdjustablePrice: boolean;

  @Input({required: true}) adjustablePrice: boolean;

  @Output() goodsSpecifications =new EventEmitter<Object>();

  @Output() editProductLocation =new EventEmitter<any>();



  @Output() checkRuleFieldId =new EventEmitter<number>();

  @Output() changedAdjustablePrice =new EventEmitter<Object>();

  public getGoodsSpecifications(goodsSpecifications: GoodsSpecifications[], idField: number): any{
    this.goodsSpecifications.emit({goodsSpecifications, idField});
  }

  public onContinueEditProductLocation(): void {
    this.editProductLocation.emit()
  }

  public editRuleInIntersections(fieldId: number): void {
    this.checkRuleFieldId.emit(fieldId)
  }

  public onChangedAdjustablePrice(event: Object): void {
    this.changedAdjustablePrice.emit(event)
  }*/




  protected readonly editingRules = editingRules;
  protected readonly IdInterfaceField = IdInterfaceField;
}
