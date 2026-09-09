import { Component, Input } from '@angular/core';
import { DX_MODULES, IdDirection } from '@constants';
import { TranslateModule } from '@ngx-translate/core';
import { NgClass, NgFor } from '@angular/common';
@Component({
  selector: 'app-counter-offers-seller-info',
  standalone: true,
  imports: [...DX_MODULES, TranslateModule, NgClass, NgFor],
  templateUrl: './counter-offers-seller-info.component.html',
  styleUrl: './counter-offers-seller-info.component.scss',
})
export class CounterOffersSellerInfoComponent {
  @Input({ required: true }) fullInfo: any;
  @Input({ required: true }) uniqueDeliveryScopes: any;

  public readonly IdDirection = IdDirection;

  sellerInformationHidden: boolean = true;
}
