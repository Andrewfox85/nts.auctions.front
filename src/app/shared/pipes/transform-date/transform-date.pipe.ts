import { convertExcelSerialDateToMs } from '../../../views/homepage/helpers';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'TransformDate',
  standalone: true,
})
export class TransformDatePipe implements PipeTransform {
  public transform(value: number): Date | null {
    if (value == null || isNaN(value)) {
      return null;
    }

    return new Date(convertExcelSerialDateToMs(value));
  }
}
