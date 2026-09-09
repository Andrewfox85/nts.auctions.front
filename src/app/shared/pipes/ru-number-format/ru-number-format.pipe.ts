import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ruNumberFormat',
  standalone: true,
})
export class RuNumberFormatPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    minFractionDigits?: number,
    maxFractionDigits?: number
  ): string {
    const numericValue = this.parseToNumber(value);
    if (numericValue === null) return '–';

    const options = this.buildOptions(minFractionDigits, maxFractionDigits);
    return this.formatNumber(numericValue, options);
  }

  private parseToNumber(
    value: number | string | null | undefined
  ): number | null {
    if (value === null || value === undefined) return null;

    const parsed =
      typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    return typeof parsed === 'number' && isFinite(parsed) ? parsed : null;
  }

  private buildOptions(min?: number, max?: number): Intl.NumberFormatOptions {
    const options: Intl.NumberFormatOptions = {};

    if (typeof min === 'number' && !isNaN(min)) {
      options.minimumFractionDigits = min;
    }

    if (typeof max === 'number' && !isNaN(max)) {
      options.maximumFractionDigits = max;
    }

    return options;
  }

  private formatNumber(
    value: number,
    options: Intl.NumberFormatOptions
  ): string {
    try {
      return value.toLocaleString('ru-RU', options);
    } catch {
      return value.toString();
    }
  }
}
