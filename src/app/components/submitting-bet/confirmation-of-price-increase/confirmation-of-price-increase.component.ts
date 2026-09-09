import { Component, EventEmitter, Output, Input } from '@angular/core';
import {
  DxButtonComponent,
  DxPopupComponent,
  DxTemplateDirective,
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DxoAnimationComponent } from 'devextreme-angular/ui/nested';
import { auctionType } from '@constants';

@Component({
  selector: 'app-confirmation-of-price-increase',
  templateUrl: './confirmation-of-price-increase.component.html',
  styleUrl: './confirmation-of-price-increase.component.scss',
  imports: [
    DxPopupComponent,
    TranslateModule,
    DxoAnimationComponent,
    DxButtonComponent,
    DxPopupComponent,
    DxTemplateDirective,
  ],
  standalone: true,
})
export class ConfirmationOfPriceIncreaseComponent {
  @Input() auctionType: number;
  @Output() selfCompetitionPopup = new EventEmitter<boolean>();
  @Output() makeBid = new EventEmitter<any>();

  public readonly idAuctionType = auctionType;
}
