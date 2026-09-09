import { GoodValue, DisplayRefs, IAddNsiEvent } from './../interfaces';
import { getTranslateResultByCurrentLang } from '@helpers';
import { ID_REFERENCE_NAME } from './../constants';
import { IAnalogGood } from '@services';

export function makeDemandRefs(
  goodValues: GoodValue[],
  currentLang: string
): DisplayRefs[] {
  return goodValues.map((item) => {
    let valuesString: string;

    if (item.listValues && item.listValues.length > 0) {
      const names: string[] = item.listValues.map((v) => v.valueName);

      if (item.isAllowAnalogs) {
        let otherGoods: string = getTranslateResultByCurrentLang(
          currentLang,
          'viewOffer.others'
        );
        names.push(otherGoods);
      }

      valuesString = names.join(', ');
    } else {
      let anyGoods: string = getTranslateResultByCurrentLang(
        currentLang,
        'viewOffer.any'
      );
      valuesString = anyGoods;
    }

    // иконка НЕ показывается только если значение хар-ки одно и аналоги запрещены !!
    let isIconShow: boolean = !(
      item.listValues?.length === 1 && !item.isAllowAnalogs
    );

    return {
      idReference: item.idReference,
      referenceName: item.referenceName,
      value: valuesString,
      isIconShow: isIconShow,
    };
  });
}

export function makeCatalogRefs(
  catalogProperties: IAnalogGood,
  currentLang: string
): DisplayRefs[] {
  //создаем объект для наименования товара
  const nameRow: DisplayRefs = {
    idReference: ID_REFERENCE_NAME,
    referenceName: getTranslateResultByCurrentLang(currentLang, 'general.name'),
    value: catalogProperties.goodName,
    isIconShow: false,
  };

  //маппим хар-ки из массива properties
  const propertiesRows: DisplayRefs[] = catalogProperties.properties.map(
    (prop) => ({
      idReference: prop.idProperty,
      referenceName: prop.propertyName,
      value: prop.propertyValue,
      isIconShow: false,
    })
  );

  return [nameRow, ...propertiesRows];
}

export function makeNsiRefs(nsiProperties: IAddNsiEvent): DisplayRefs[] {
  return nsiProperties.properties.map((prop) => ({
    idReference: prop.idReference,
    referenceName: prop.referenceName,
    value: prop.valueName,
    isIconShow: false,
  }));
}
