import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'excelDate',
  standalone: true,
})
export class ExcelDatePipe implements PipeTransform {
  public transform(value: number, skipOffset: boolean = false): Date | null {
    if (typeof value !== 'number' || isNaN(value)) {
      return null;
    }

    const excelEpoch = 25569;
    const millisecondsPerDay = 86400000;

    const offset = (value - excelEpoch) * millisecondsPerDay + (skipOffset ? 0 : 1);

    return new Date(offset);
  }
}
