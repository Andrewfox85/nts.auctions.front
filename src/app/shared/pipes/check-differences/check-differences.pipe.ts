import { Pipe, PipeTransform } from '@angular/core';
import { IdInterfaceField } from '@constants';

@Pipe({
  name: 'checkDifferences',
  standalone: true,
})
export class CheckDifferencesPipe implements PipeTransform {
  transform(
    idInterfaceField: number,
    goodId: number,
    getCompareValue: (id: number, key: string) => boolean
  ): boolean {
    const checks: Record<number, string> = {
      [IdInterfaceField.productLocation]: 'placeMatch',
      [IdInterfaceField.minPrice]: 'minPriceMatch',
      [IdInterfaceField.placeOfWork]: 'placeOfWorkMatch',
      [IdInterfaceField.financeSource]: 'financeSourceMatch',
      [IdInterfaceField.expirationDate]: 'expirationDateMatch',
      [IdInterfaceField.wholesaleMarkup]: 'wholesaleMarkupMatch',
    };

    const matchKey: string = checks[idInterfaceField];

    if (matchKey) {
      return !getCompareValue(goodId, matchKey);
    }

    return false;
  }
}
