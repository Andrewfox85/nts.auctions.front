import {Pipe, PipeTransform} from '@angular/core';
import {IEditOfferGoodsSpecifications, IGoodsSpecifications} from "@interfaces";
import {ACTUAL_SIZE_READINESS_FIELDS, SORT_ID_ACTUAL_FIELDS} from "@constants";

@Pipe({
  name: 'sortActualDimensions',
  standalone: true,
})
export class SortActualDimensionsPipe implements PipeTransform {

  transform (fields: IGoodsSpecifications[] | IEditOfferGoodsSpecifications[]): IGoodsSpecifications[] | IEditOfferGoodsSpecifications[] {
    if (!fields || !Array.isArray(fields)) {
      return [];
    }
    const actualFields = fields.reduce<(IGoodsSpecifications | IEditOfferGoodsSpecifications)[]>((actF, field) => {
      if (ACTUAL_SIZE_READINESS_FIELDS.includes(field.idInterfaceField)) {
        actF.push(this.addSortByField(field));
      }
      return actF;
    }, []);

    return actualFields.sort((a, b) => a.sortBy - b.sortBy);
  }

  private addSortByField(field: IGoodsSpecifications | IEditOfferGoodsSpecifications): IGoodsSpecifications | IEditOfferGoodsSpecifications {
    return {
      ...field,
      sortBy: SORT_ID_ACTUAL_FIELDS['FIELD_' + field.idInterfaceField]
    };
  }

}
