import { Pipe, PipeTransform } from '@angular/core';
import { ACTUAL_SIZE_READINESS_FIELDS, IdInterfaceField } from "@constants";
import { IGoodsSpecifications } from "@interfaces";

@Pipe({
  name: 'showGoodsFields',
  standalone: true
})
export class ShowGoodsFieldsPipe implements PipeTransform {

  public transform(field: IGoodsSpecifications): string {
    return !(
      [...ACTUAL_SIZE_READINESS_FIELDS,
        IdInterfaceField.quantity,
        IdInterfaceField.unit,
        IdInterfaceField.priceWithoutVAT,
        IdInterfaceField.currency,
        IdInterfaceField.VATrate,
        IdInterfaceField.amendmentType,
        IdInterfaceField.amendment,
        IdInterfaceField.quotation,
        IdInterfaceField.quoteCurrency]
        .includes(field.idInterfaceField)
      || field?.costWithoutVAT
      || field?.amountVAT
      || field.amountVAT == 0
      || field?.costVAT
    )
      ? 'flex'
      : 'none';
  }
}
