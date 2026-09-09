import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

@Pipe({
  name: 'sumVolume',
  standalone: true
})
export class SumVolumePipe implements PipeTransform {
  transform(values: any[], propertyName: string): number {
    if (!values || !Array.isArray(values)) {
      return 0;
    }

    return values.reduce((sum, item) => {
      const value = item && item[propertyName];
      return sum + (Number(value) || 0);
    }, 0);
  }
}
