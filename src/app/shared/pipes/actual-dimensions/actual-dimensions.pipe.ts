import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'actualDimensions',
  standalone: true,
})
export class ActualDimensionsPipe implements PipeTransform {
  public transform(
    value: string | number | null | undefined,
    part: number = 0
  ): string | null {
    if (value === null || value === undefined) return null;

    const strValue = value.toString();
    // отображение фактических размеров без типа данных
    const parts = strValue.split('#');

    return parts[part] ?? null;
  }
}
