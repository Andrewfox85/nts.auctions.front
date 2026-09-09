import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AgreementType } from '@constants';

@Component({
  selector: 'app-buyer-deal-dutch-auction',
  imports: [TranslateModule],
  templateUrl: './buyer-deal-dutch-auction.component.html',
  styleUrl: './buyer-deal-dutch-auction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyerDealDutchAuctionComponent {
  public readonly generalInfo = input.required<any>();
  public readonly buyerInformationHidden = model(false);
  public readonly AGREEMENT_TYPE = AgreementType;

  public changeBuyerInformationHidden(): void {
    this.buyerInformationHidden.set(!this.buyerInformationHidden());
  }
}
