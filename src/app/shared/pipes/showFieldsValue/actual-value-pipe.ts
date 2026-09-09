import { Pipe, PipeTransform } from '@angular/core';
import { ACTUAL_SIZE_FIELDS } from "@constants";
import { IEditOfferGoodsSpecifications, IGoodsSpecifications } from "@interfaces";
import { ActualDimensionsPipe } from "@pipes";

@Pipe({
  name: 'actualValue',
  standalone: true
})
export class ActualValuePipe implements PipeTransform {
  private actualDimensionsPipe = new ActualDimensionsPipe();

  transform(field: IEditOfferGoodsSpecifications | IGoodsSpecifications): unknown {
    if (field.controlFieldType === "dxSelectBox") {
      return field.fieldValue;
    }
    return ACTUAL_SIZE_FIELDS.includes(field.idInterfaceField)
      ? this.actualDimensionsPipe.transform(field.fieldValue)
      : field.fieldValue;
  }
}
