import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'subtract',
  pure: true,
})
export class SubtractPipe implements PipeTransform {
  public transform(value: number, subtrahend: number): number {
    return value - subtrahend;
  }
}
