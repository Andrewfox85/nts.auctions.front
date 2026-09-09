import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'substringFrom',
  standalone: true,
})
export class SubstringFromPipe implements PipeTransform {
  public transform(
    value: string | null | undefined,
    startIndex: number = 0
  ): string {
    if (!value) {
      return '';
    }

    return value.substring(startIndex);
  }
}
