import { Component, Injectable, Input } from '@angular/core';
import { IdDirection } from "@constants";
import { TranslateModule } from "@ngx-translate/core";
import { DeliveryScope, EditRule, GoodsOriginal } from "../../../services/edit-demand-offer-service.service";
import { ICounterOfferSelectedRow } from "@interfaces";
import { DemandCounter } from "../../analogs-list/interfaces";
import {
  DxTabPanelModule
} from 'devextreme-angular';
import {
  BasisInfoComponent,
  CounterOffersComponent,
  DeliveryScheduleInfoComponent,
  DeliveryScopeComponent
} from "@components";
import { DeliveryConditionIntersection } from "../../../services/submission-service/shared";

@Component({
  selector: 'app-view-counter-offer',
  imports: [
    TranslateModule,
    DxTabPanelModule,
    BasisInfoComponent,
    DeliveryScheduleInfoComponent,
    DeliveryScopeComponent,
    CounterOffersComponent,
  ],
  templateUrl: './view-counter-offer.html',
  styleUrl: './view-counter-offer.scss',
  standalone: true
})

@Injectable({ providedIn: 'root' })

export class ViewCounterOffer {
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
  @Input({ required: true }) deletedScope?: {
    isMine: boolean;
    concatedDeletedScope: string;
  };
  public conterInfo: DemandCounter | ICounterOfferSelectedRow;
  public readonly IdDirection = IdDirection;
}
