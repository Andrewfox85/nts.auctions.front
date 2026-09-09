import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DescriptionAnalogs } from '@interfaces';
import { GoodValue } from './../../../views/dutch-down-auction/components/submitting-counter-demand/interfaces/index';
import { goodRefId } from '@constants';
import { getTranslateResultByCurrentLang } from '@helpers';

@Pipe({
  name: 'goodAnalogDescription',
  standalone: true
})
export class GoodAnalogDescriptionPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  //составляем строку хар-к товара-аналога. Если listValues пустой - записываем "любые"
  //если isAllowAnalogs - после перечисления хар-к - "аналоги" (15334)
  transform(values: GoodValue[]): DescriptionAnalogs[] {
    if (!values) return [];

    return values
    .filter((item) => item.isAllowAnalogs === false ? item.idReference !== goodRefId : true) //исключаем наименование из описания если не добавлено в наименование аналоги
    .map((item) => {
      let valuesString: string;

      if (item.listValues && item.listValues.length > 0) {
        const names = item.listValues.map((v) => v.valueName);

        if (item.isAllowAnalogs) {
          let otherGoods: string = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'viewOffer.others');
          names.push(otherGoods);
        }

        valuesString = names.join(', ');
      } else {
        let anyGoods: string = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'viewOffer.any');
        valuesString = anyGoods;
      }

      return {
        id: item.idReference,
        label: item.referenceName,
        value: valuesString,
      };
    });
  }
}
