import { Pipe, PipeTransform } from '@angular/core';
import { upperCaseFirstLetter } from '@helpers';

@Pipe({
  name: 'upperCaseFirstLetter',
  standalone: true,
})
export class UpperCaseFirstLetterPipe implements PipeTransform {
  public transform(value: string): string {
    return upperCaseFirstLetter(value);
  }
}
