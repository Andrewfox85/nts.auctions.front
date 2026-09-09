import { Input, Directive, ElementRef, OnChanges } from '@angular/core';
import { IGoodsSpecifications, IEditOfferGoodsSpecifications } from './../interfaces/index';
import {
  pricingType,
  IdInterfaceField,
  ACTUAL_SIZE_READINESS_FIELDS,
} from '@constants';

@Directive({
  selector: '[display-specs]',
  standalone: true,
})
export class DisplaySpecsDirective implements OnChanges {
  @Input('pricingTypeId') pricingTypeId: number;
  @Input('field') field: IGoodsSpecifications | IEditOfferGoodsSpecifications;

  constructor(private elementRef: ElementRef) {}

  public ngOnChanges(): void {
    this.elementRef.nativeElement.style.display = this.isVisible(
      this.pricingTypeId,
      this.field
    )
      ? 'flex'
      : 'none';
  }

  private isVisible(
    pricingTypeId: number,
    field: IGoodsSpecifications | IEditOfferGoodsSpecifications
  ): boolean {
    if (ACTUAL_SIZE_READINESS_FIELDS.includes(field.idInterfaceField)) {
      return false;
    }

    const hasCostData =
      field?.costWithoutVAT ||
      field?.amountVAT ||
      field.amountVAT === 0 ||
      field?.costVAT;

    if (pricingTypeId === pricingType?.price) {
      return !(
        [
          IdInterfaceField.quantity,
          IdInterfaceField.unit,
          IdInterfaceField.priceWithoutVAT,
          IdInterfaceField.currency,
          IdInterfaceField.VATrate,
        ].includes(field.idInterfaceField) || hasCostData
      );
    }

    if (pricingTypeId === pricingType?.formulaWithQuotation) {
      return !(
        [
          IdInterfaceField.quantity,
          IdInterfaceField.unit,
          IdInterfaceField.priceWithoutVAT,
          IdInterfaceField.currency,
          IdInterfaceField.VATrate,
          IdInterfaceField.amendmentType,
          IdInterfaceField.amendment,
          IdInterfaceField.quoteCurrency,
          IdInterfaceField.quotation
        ].includes(field.idInterfaceField) || hasCostData
      );
    }

    if (pricingTypeId === pricingType?.formulaWithoutQuotation) {
      return ![
        IdInterfaceField.quantity,
        IdInterfaceField.unit,
        IdInterfaceField.currency,
        IdInterfaceField.VATrate,
        IdInterfaceField.amendmentType,
        IdInterfaceField.amendment
      ].includes(field.idInterfaceField);
    }

    return false;
  }
}
