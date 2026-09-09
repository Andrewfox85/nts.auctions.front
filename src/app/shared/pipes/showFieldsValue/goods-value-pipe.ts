import { inject, Pipe, PipeTransform } from '@angular/core';
import { IEditOfferGoodsSpecifications, IGoodsSpecifications } from "@interfaces";
import { getTranslateResultByCurrentLang } from "@helpers";
import { TranslateService } from "@ngx-translate/core";
import { RuNumberFormatPipe } from "@pipes";

@Pipe({
  name: 'goodsValue',
  standalone: true
})
export class GoodsValuePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private ruNumberFormat = new RuNumberFormatPipe();

  transform(field: IEditOfferGoodsSpecifications | IGoodsSpecifications): unknown {
    switch (field.controlFieldType) {
      case "dxSelectBox":
        return field.fieldValue;
      case "dxCheckBox":
        return field.fieldValue.toString() === "true"
          ? getTranslateResultByCurrentLang(this.translate.store.currentLang, "btns.yes")
          : getTranslateResultByCurrentLang(this.translate.store.currentLang, "btns.no");
      case "dxNumberBox":
        return this.ruNumberFormat.transform(field.fieldValue, field?.fieldPrecision);
      default:
        return field.fieldValue;
    }
  }

}
