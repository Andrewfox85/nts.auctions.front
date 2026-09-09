/**
 * Шапка торговой сессии: информация о сессии, таймеры и меню действий воркера.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ItemClickEvent } from 'devextreme/ui/drop_down_button';
import { User } from '@classes';
import {
  auctionType,
  DX_MODULES,
  IdSessionPeriods,
  sessionStage,
} from '@constants';
import {
  ExcelDatePipe,
  FormatTimePipe,
  PriceFormatPipe,
  SubstringFromPipe,
} from '@pipes';
import { ID_DIRECTION_TRADER_ROLE } from '@enums';

@Component({
  selector: 'app-trading-shell-header',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    PriceFormatPipe,
    ExcelDatePipe,
    FormatTimePipe,
    SubstringFromPipe,
  ],
  templateUrl: './trading-shell-header.component.html',
  styleUrl: './trading-shell-header.component.scss',
})
export class TradingShellHeaderComponent {
  @Input({ required: true }) sessionInfo: any;
  @Input({ required: true }) sessionId: string;
  @Input({ required: true }) user: User;
  @Input() workerPrivileges: boolean = false;
  @Input() directTabs: boolean = false;
  @Input() idDirectionRole: number = null;

  @Output() openOtherAuctions: EventEmitter<void> = new EventEmitter<void>();
  @Output() workerMenuAction: EventEmitter<ItemClickEvent> = new EventEmitter<ItemClickEvent>();

  public readonly idDirectionTraderRole: typeof ID_DIRECTION_TRADER_ROLE = ID_DIRECTION_TRADER_ROLE;
  public readonly IdSessionPeriods: typeof IdSessionPeriods= IdSessionPeriods;
  public readonly sessionStage: typeof sessionStage = sessionStage;
  public readonly auctionType: typeof auctionType = auctionType;

  /** Открывает попап выбора другого аукциона по клику на информацию о сессии. */
  public onSessionInfoClick(): void {
    this.openOtherAuctions.emit();
  }

  /** Пробрасывает выбор пункта меню воркера родительскому компоненту. */
  public onWorkerMenuClick(event: ItemClickEvent): void {
    this.workerMenuAction.emit(event);
  }
}
