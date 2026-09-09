import { Pipe, PipeTransform } from '@angular/core';
import { statusOffersFilters } from './../../constants/api.constants';

@Pipe({
  name: 'isRejectedOffer',
  standalone: true,
})
export class IsRejectedOfferPipe implements PipeTransform {
  transform(statusId: number, isWorker: boolean): boolean {
    
    const rejectedStatuses = [
      statusOffersFilters.rejectedBeforeBid,
      statusOffersFilters.rejectedBySystem,
      statusOffersFilters.rejectedInBid
    ];

    return !isWorker && rejectedStatuses.includes(statusId);
  }
}
