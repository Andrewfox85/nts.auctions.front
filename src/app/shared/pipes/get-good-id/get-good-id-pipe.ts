import { Pipe, PipeTransform } from '@angular/core';
import { getIdGood } from "@helpers";
import { IEditOfferGood } from "@interfaces";

@Pipe({
  name: 'getGoodId',
  standalone: true
})
export class GetGoodIdPipe implements PipeTransform {
  transform(good: IEditOfferGood): number {
    return getIdGood(good);
  }
}
