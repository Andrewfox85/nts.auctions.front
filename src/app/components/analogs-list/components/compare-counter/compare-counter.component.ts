import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonService } from '@services';
import { IGoodsSpecifications } from '@interfaces';
import { auctionType } from '@constants';
import { UpperCaseFirstLetterPipe, RuNumberFormatPipe } from '@pipes';
import { DxSelectBoxModule, DxTooltipModule } from 'devextreme-angular';
import { GoodValue } from './../../interfaces/index';

@Component({
  selector: 'app-compare-counter',
  imports: [
    DxTooltipModule,
    DxSelectBoxModule,
    TranslateModule,
    UpperCaseFirstLetterPipe,
    RuNumberFormatPipe,
  ],
  templateUrl: './compare-counter.component.html',
  styleUrl: './compare-counter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareCounterComponent {
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

  public get valuesList() {
    return this.selectedRow?.goods?.[0]?.values ?? [];
  }

  public currentCvName(good: GoodValue): string {
    return this.valuesList.find((cv) => cv.idReference === good.idReference)?.nameValue;
  }

  public currentCvValueMatch(good: GoodValue): boolean {
    return this.valuesList.find((cv) => cv.idReference === good.idReference)?.valueMatch;
  }
}
