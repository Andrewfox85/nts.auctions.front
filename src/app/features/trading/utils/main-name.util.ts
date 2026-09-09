import { DemandOfferGood } from '@services';
import { GoodDetails } from 'src/app/features/trading/interfaces/index';

interface GoodFields {
  goodName: string;
  goodDescription: string;
  goodGroup: string;
  nomenclatureGroup: string;
}

export function makeMainName<T extends DemandOfferGood | GoodDetails>(
  goods: T[],
  fields: (good: T) => GoodFields,
  sectionName: string
): string {

  if (goods.length === 1) {
    return fields(goods[0]).goodName;
  }  

  const firstFields: GoodFields = fields(goods[0]);

  let sameName: boolean = true;
  let sameDesc: boolean = true;
  let sameGroup: boolean = true;
  let sameNomenclature: boolean = true;

  for (const g of goods) {
    const goodFields: GoodFields = fields(g);
    sameName &&= goodFields.goodName === firstFields.goodName;
    sameDesc &&= goodFields.goodDescription === firstFields.goodDescription;
    sameGroup &&= goodFields.goodGroup === firstFields.goodGroup;
    sameNomenclature &&= goodFields.nomenclatureGroup === firstFields.nomenclatureGroup;
  }

  //разная номенклатурная группа - наименование секции
  if (!sameNomenclature) {
    return sectionName;
  }
  //разная товарная группа - наименование номенклатурной группы
  if (!sameName && !sameGroup) {
    return firstFields.nomenclatureGroup;
  }
  //разное наименование товара и одинаковая ТГ  - наименование товарной группы
  if (!sameName && sameGroup) {
    return firstFields.goodGroup;
  }
  //если наименование одинаковое, но разные характеристики - выводить наименование товара
  if (sameName && !sameDesc) {
    return firstFields.goodName;
  }
  //если все совпало (и имя, и характеристики)
  return firstFields.goodName;
}
