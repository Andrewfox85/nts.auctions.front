import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AgreementType } from '@constants';

@Component({
  selector: 'app-salesman-deal-english-auction',
  imports: [TranslateModule],
  templateUrl: './salesman-deal-english-auction.component.html',
  styleUrl: './salesman-deal-english-auction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesmanDealEnglishAuctionComponent {
  public readonly generalInfo = input.required<any>();
  public readonly sellerInformationHidden = model(false);

  public readonly AGREEMENT_TYPE = AgreementType;

  public changeSellerInformationHidden(): void {
    this.sellerInformationHidden.set(!this.sellerInformationHidden());
  }
}
