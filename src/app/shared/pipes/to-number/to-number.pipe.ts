import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toNumber',
  standalone: true,
})
export class ToNumberPipe implements PipeTransform {
  public transform(value: unknown): number {
    if (typeof value === 'string') {
      value = value.replace(',', '.');
    }

    return Number(value);
  }
  
}
