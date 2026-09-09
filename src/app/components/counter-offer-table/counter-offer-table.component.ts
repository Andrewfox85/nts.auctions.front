import {
  Component,
  Input,
  inject,
  EventEmitter,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TradingService } from '@services';
import { DatePipe } from '@angular/common';
import {
  RowPreparedEvent,
  SelectionChangedEvent,
  CellPreparedEvent,
} from 'devextreme/ui/data_grid';
import { DxCheckBoxModule, DxDataGridModule, DxTooltipModule } from 'devextreme-angular';
import { TNumbersInGridData, ICounterOfferSelectedRow } from '@interfaces';
import { SubtractPipe, DaysToMillisecondsPipe } from '@pipes';
import { DxGridContextMenuLocalizationDirective } from '../../shared/directives';
import { DxCheckBoxTypes } from 'devextreme-angular/ui/check-box';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { TCounterOffer } from './interfaces';
import { GlobalStore } from '@store';
import { ID_DIRECTION_TRADER_ROLE, AUCTION_TYPE } from '@enums';
import { ID_REFERENCE_NAME } from './../submitting-counter-offer/constants/index';

@Component({
  selector: 'app-counter-offer-table',
  imports: [
    DxDataGridModule,
    TranslateModule,
    DxCheckBoxModule,
    DatePipe,
    SubtractPipe,
    DaysToMillisecondsPipe,
    DxGridContextMenuLocalizationDirective,
    DxTooltipModule,
  ],
  templateUrl: './counter-offer-table.component.html',
  styleUrl: './counter-offer-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class CounterOfferTableComponent {
  @ViewChild('dataGridRegister', { static: false })
  dataGrid: DxDataGridComponent;

  @Input({ required: true }) set counters(counters: TCounterOffer[]) {
    if (!counters) return;
    this.initialCounters.set([...counters]);

    if (this.isHiddenRejected || this.isMineCheckbox) {
      this.applyFilters();
    } else {
      this.filteredCounters.set([...counters]);
    }
  }

  @Input({ required: true }) selectedRow: any;
  @Input({ required: true }) isAllowAnalog: boolean;
  @Input() isAnalogListForm: boolean = false;
  @Output() selectedRowChange = new EventEmitter<TCounterOffer>();
  @Output() compareFields = new EventEmitter<void>();
  @Output() myCounterState = new EventEmitter<boolean>();

  private readonly tradingService = inject(TradingService);
  private readonly globalStore = inject(GlobalStore);

  public readonly idDirectionRole = this.globalStore.idDirectionRole();
  public readonly idAuctionType =
    this.globalStore.mainSessionInfo().idAuctionType;
  public readonly ID_DIRECTION_TRADER_ROLE = ID_DIRECTION_TRADER_ROLE;
  public readonly AUCTION_TYPE = AUCTION_TYPE;
  public readonly user = JSON.parse(localStorage.getItem('user') || '{}');

  public initialCounters = signal<TCounterOffer[]>([]);
  public filteredCounters = signal<TCounterOffer[]>([]);

  public isHiddenRejected: boolean = false;
  public isMineCheckbox: boolean = false;

  public get rowKeyField(): string {
    return this.idAuctionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION
      ? 'idDemandCounter'
      : 'idOfferCounter';
  }

  public get showMyCounterOffers(): boolean {
    if (this.user?.IsWorker || this.isAnalogListForm) {
      return false;
    }
    const isEnglishPurchase: boolean =
      this.idAuctionType === AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION &&
      this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.PURCHASE;
    const isDutchSale: boolean =
      this.idAuctionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION &&
      this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.SALE;

    return isEnglishPurchase || isDutchSale;
  }

  public changeMyCounterOffer(event: DxCheckBoxTypes.ValueChangedEvent): void {
    this.myCounterState.emit(event.value);
    this.isMineCheckbox = event.value;
    this.applyFilters();
  }

  public hideRejectedCountersGoods(
    event: DxCheckBoxTypes.ValueChangedEvent
  ): void {
    this.isHiddenRejected = event.value;
    this.applyFilters();
  }

  private applyFilters(): void {
    const filtered: TCounterOffer[] = this.initialCounters().filter(
      (counter) => {
        //eсли чекбокс "мои" включен - встречка должна быть моя
        const matchMine: boolean = !this.isMineCheckbox || counter?.isMine;

        //eсли чекбокс "скрыть" включен - встречка не должна быть с отклоненным товаром
        const isNotRejected: boolean = !counter.goods[0]?.isExistDeclinedGoodInAnlg;
        const matchRejected: boolean = !this.isHiddenRejected || isNotRejected;

        return matchMine && matchRejected;
      }
    );

    this.filteredCounters.set(filtered);
    this.updateSelectedRowAndGrid();
  }

  private updateSelectedRowAndGrid(): void {
    this.selectedRow = this.filteredCounters()?.[0];
    this.processSelectedRow();

    const rowKey = this.selectedRow?.[this.rowKeyField] as number;
    if (this.dataGrid?.instance && rowKey) {
      this.dataGrid.instance.selectRows([rowKey], false);
    }
  }

  public getNumberInGrid(data: TNumbersInGridData): string {
    return Number(data.data.totalAmount).toLocaleString('ru', {
      minimumFractionDigits: data.data.currencyPrecision,
      maximumFractionDigits: data.data.currencyPrecision,
    });
  }

  public onRowPrepared(e: RowPreparedEvent): void {
    if (e.rowType === 'data' && e.key.isMine) {
      e.rowElement.classList.add('myOffer');
    }
  }

  public onSelectionChanged(e: SelectionChangedEvent): void {
    if (e.selectedRowsData?.[0]) {
      this.selectedRow = e.selectedRowsData[0];
      this.processSelectedRow();
    }
  }

  public onCellPrepared(e: CellPreparedEvent): void {
    const rowKey = this.selectedRow?.[this.rowKeyField] as number;
    if (rowKey) {
      e.component.selectRows([rowKey], false);
    }
  }

  private processSelectedRow(): void {
    this.selectedRowChange.emit(this.selectedRow);
    this.compareFields.emit();

    this.tradingService.updateDeletedScopeFromCounter({
      isMine: this.selectedRow?.isMine,
      concatedDeletedScope: this.selectedRow?.concatedDeletedClients,
    });
  }
}
