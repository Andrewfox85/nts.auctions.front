import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textwrapper',
  standalone: true,
})
export class TextWrapperPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.replace(/\r?\n/g, '\n');
  }
}
