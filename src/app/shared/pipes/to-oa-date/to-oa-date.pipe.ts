import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toOADate',
  standalone: true,
})
export class ToOADatePipe implements PipeTransform {
  public transform(
    value: Date | number,
    fractionDigits: number = 0
  ): string | null {
    if (!value) return null;

    const utc18991230 = new Date('1899-12-30').getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const offsetTime = new Date().getTimezoneOffset() * -1;

    let timeValue: number;
    
    if (value instanceof Date) {
      timeValue = value.getTime();
    } else {
      timeValue = value;
    }

    const res = -utc18991230 + timeValue + offsetTime * 60 * 1000;
    const oaDate = res / msPerDay;

    return oaDate.toFixed(fractionDigits);
  }
}
