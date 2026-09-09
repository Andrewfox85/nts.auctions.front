import { Component, Input } from '@angular/core';
import { DX_MODULES, IdDirection } from '@constants';
import { TranslateModule } from '@ngx-translate/core';
import { ICounterOfferSelectedRow } from '@interfaces';

@Component({
  selector: 'app-counter-offers-buyer-info',
  imports: [...DX_MODULES, TranslateModule],
  templateUrl: './counter-offers-buyer-info.component.html',
  styleUrl: './counter-offers-buyer-info.component.scss',
  standalone: true
})
export class CounterOffersBuyerInfoComponent {
  @Input({ required: true }) selectedRow: ICounterOfferSelectedRow;
  @Input({ required: true }) directionId: number;

  public readonly IdDirection = IdDirection;

  buyerInformationHidden = true;
}
