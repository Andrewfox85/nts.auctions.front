import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  input,
  output,
  signal,
} from '@angular/core';
import {
  editingRules,
  IdInterfaceField,
  OWN_FUNDS,
  ADDITIONAL_FIELDS_FOR_PURCHASE,
} from '@constants';
import {
  DxSelectBoxComponent,
  DxTextBoxComponent,
  DxValidatorComponent,
} from 'devextreme-angular';
import { DxiValidationRuleComponent } from 'devextreme-angular/ui/nested';
import { TranslateModule } from '@ngx-translate/core';
import {
  IEditOfferGood,
  IEditOfferGoodsSpecifications,
  IIntersections,
  IFieldArray,
} from '@interfaces';
import { ValueChangedEvent } from 'devextreme/ui/date_box';
@Component({
  selector: 'app-additional-fields-for-purchase',
  imports: [
    DxSelectBoxComponent,
    DxValidatorComponent,
    DxiValidationRuleComponent,
    TranslateModule,
    DxTextBoxComponent,
  ],
  templateUrl: './additional-fields-for-purchase.component.html',
  styleUrls: ['./additional-fields-for-purchase.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class AdditionalFieldsForPurchaseComponent implements OnInit {
  public readonly goods = input.required<IEditOfferGood[]>();
  public readonly currencyIntersections = input.required<IIntersections[]>();
  public readonly VatIntersections = input.required<IIntersections[]>();
  public readonly financeSourceIntersections =
    input.required<IIntersections[]>();
  public readonly getGoodsSpecifications =
    input.required<
      (
        goodsSpecifications: IEditOfferGoodsSpecifications[],
        IdField: number
      ) => IEditOfferGoodsSpecifications | undefined
    >();
  public readonly editRuleInIntersections =
    input.required<(IdField: number) => number>();

  public readonly onChangedValue = output<{
    fieldId: number;
    event: ValueChangedEvent;
  }>();

  public readonly IdInterfaceField = IdInterfaceField;
  public readonly OWN_FUNDS = OWN_FUNDS;
  public readonly ADDITIONAL_FIELDS_FOR_PURCHASE =
    ADDITIONAL_FIELDS_FOR_PURCHASE;

  public readonly fieldsArray = signal<IFieldArray>([]);

  ngOnInit(): void {
    ADDITIONAL_FIELDS_FOR_PURCHASE.forEach((fieldId: number) =>
      this.addField(fieldId)
    );
  }

  public handleChangeValue(fieldId: number, event: ValueChangedEvent): void {
    this.onChangedValue.emit({ fieldId, event });
  }

  private addField(fieldId: number): void {
    const goodsSpecifications = this.goods()[0]?.goodsSpecifications ?? [];
    const field = this.getGoodsSpecifications()(goodsSpecifications, fieldId);

    if (field && fieldId !== IdInterfaceField.okrb007) {
      this.fieldsArray.update((arr) => [
        ...arr,
        {
          ...field,
          idField: fieldId,
          dataSource: this.getDataSource(fieldId),
          value: field.fieldValueNumber?.toString() ?? '',
          disabled:
            this.editRuleInIntersections()(fieldId) ===
            editingRules.editingIsNotAvailable,
        },
      ]);
    } else if (!field && fieldId === IdInterfaceField.okrb007) {
      this.disableFinanceSourceIfOwnFunds();
    }
  }

  private getDataSource(fieldId: number): IIntersections[] {
    switch (fieldId) {
      case IdInterfaceField.currency:
        return this.currencyIntersections();
      case IdInterfaceField.VATrate:
        return this.VatIntersections();
      case IdInterfaceField.financeSource:
        return this.financeSourceIntersections();
      default:
        return [];
    }
  }

  private disableFinanceSourceIfOwnFunds(): void {
    this.fieldsArray.update((arr) => {
      return arr.map((el) =>
        el.idField === IdInterfaceField.financeSource &&
        el.value === this.OWN_FUNDS
          ? { ...el, disabled: true }
          : el
      );
    });
  }
}
