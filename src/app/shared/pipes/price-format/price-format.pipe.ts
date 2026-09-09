import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priceFormat',
  standalone: true,
})
export class PriceFormatPipe implements PipeTransform {
  public transform(value: number | null | undefined): string {
    if (value == null || isNaN(value)) {
      return '';
    }

    return value.toFixed(2).replace('.', ',');
  }
}
