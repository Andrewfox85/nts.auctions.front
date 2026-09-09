import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'daysToMilliseconds',
  standalone: true,
})
export class DaysToMillisecondsPipe implements PipeTransform {
  public transform<T extends number>(days: T): number {
    return days * 24 * 60 * 60 * 1000;
  }
}
