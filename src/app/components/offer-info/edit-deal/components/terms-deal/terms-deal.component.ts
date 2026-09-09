import { Component, input, model } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-terms-deal',
  imports: [TranslateModule],
  templateUrl: './terms-deal.component.html',
  styleUrl: './terms-deal.component.scss'
})
export class TermsDealComponent {
  public readonly generalInfo = input.required<any>();
  public readonly totalRowData = input.required<any>();
  public readonly offerGeneralHidden = model(false);


  public changeOfferGenetalState(): void {
    this.offerGeneralHidden.set(!this.offerGeneralHidden())
  }
}
