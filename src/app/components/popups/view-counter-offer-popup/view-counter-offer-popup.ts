import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxoAnimationComponent } from "devextreme-angular/ui/nested";
import { ViewCounterOffer } from "../../popup-content/view-counter-offer/view-counter-offer";
import { DeliveryScope, EditRule, GoodsOriginal } from "../../../services/edit-demand-offer-service.service";
import { DeliveryConditionIntersection } from "../../../services/submission-service/shared";
import { TranslateModule } from "@ngx-translate/core";
import { DxPopupModule } from "devextreme-angular";

@Component({
  selector: 'app-view-counter-offer-popup',
  imports: [
    DxoAnimationComponent,
    ViewCounterOffer,
    TranslateModule,
    DxPopupModule
  ],
  templateUrl: './view-counter-offer-popup.html',
  styleUrl: './view-counter-offer-popup.scss',
  standalone: true
})
export class ViewCounterOfferPopup {
  @Input({ required: true }) fullInfo: any;
  @Input({ required: true }) isMine: boolean;
  @Input({ required: true }) tabIndex: number;
  @Input({ required: true }) idOffer: number;
  @Input({ required: true }) deliveryConditions: DeliveryConditionIntersection[];
  @Input({ required: true }) goodsOriginal: GoodsOriginal[];
  @Input({ required: true }) editRulesIntersections: EditRule[];
  @Input({ required: true }) uniqueDeliveryScopes: DeliveryScope[];
  @Input({ required: true }) idDemandOffer: number;
  @Input({ required: true }) isAllowAnalog: boolean;
  @Input({ required: true }) dataForReq: any;
  public deletedScope = {
    concatedDeletedScope: null,
    isMine: null
  };

  @Output() viewInSingleCurrencyPopup: EventEmitter<boolean> = new EventEmitter<boolean>();
}
