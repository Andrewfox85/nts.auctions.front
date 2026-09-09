import { Pipe, PipeTransform } from '@angular/core';
import { formatSecondsToTime } from '@helpers';

@Pipe({
  name: 'formatTime',
  standalone: true,
})
export class FormatTimePipe implements PipeTransform {
  public transform(seconds: number | null | undefined): string {
    return formatSecondsToTime(seconds);
  }
}
