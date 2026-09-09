import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonService } from '@services';
import { IGoodsSpecifications } from '@interfaces';
import {
  EDITABLE_PRICE_INTERFACE_ID,
  auctionType,
  IdInterfaceField,
} from '@constants';
import { UpperCaseFirstLetterPipe, RuNumberFormatPipe } from '@pipes';

import {
  DxCheckBoxModule,
  DxSelectBoxModule,
  DxTooltipModule,
} from 'devextreme-angular';

@Component({
  selector: 'app-counter-offers-purchase-sale-terms',
  imports: [
    DxTooltipModule,
    DxSelectBoxModule,
    DxCheckBoxModule,
    TranslateModule,
    UpperCaseFirstLetterPipe,
    RuNumberFormatPipe,
  ],
  templateUrl: './counter-offers-purchase-sale-terms.component.html',
  styleUrl: './counter-offers-purchase-sale-terms.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterOffersPurchaseSaleTermsComponent {
  public readonly commonService = inject(CommonService);
  protected readonly auctionType = auctionType;

  @Input({ required: true }) sessionIds: any;
  @Input({ required: true }) fullInfo: any;
  @Input({ required: true }) showDifferences: boolean;
  @Input({ required: true }) selectedRow: any;
  @Input({ required: true }) uniqueDelConditions: any[];
  @Input({ required: true }) basisValue: string;
  @Input({ required: true }) totalRowData: any;
  @Input({ required: true }) onChangeBasis: (e: { value?: string }) => void;
  @Input({ required: true }) getValue: (
    goodsSpecifications: IGoodsSpecifications[],
    idInterfaceField: number
  ) => string;

  public get checkboxValue(): boolean {
    return (
      this.getValue(
        this.fullInfo?.goods?.[0]?.goodsSpecifications,
        EDITABLE_PRICE_INTERFACE_ID
      ) === 'true'
    );
  }

  public get editablePriceInterfaceExists(): boolean {
    return this.hasInterfaceField(EDITABLE_PRICE_INTERFACE_ID);
  }

  public get financeInterfaceExists(): boolean {
    return this.hasInterfaceField(IdInterfaceField.financeSource);
  }

  private hasInterfaceField(fieldId: number): boolean {
    return !!this.fullInfo?.goods?.[0]?.goodsSpecifications.some(
      (it: IGoodsSpecifications) => it.idInterfaceField === fieldId
    );
  }
}
