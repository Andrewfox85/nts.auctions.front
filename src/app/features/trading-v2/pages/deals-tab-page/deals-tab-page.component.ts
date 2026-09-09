/**
 * Страница вкладки «Сделки»: обёртка над legacy-компонентом сделок в торговом shell.
 */
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DealsComponent } from '../../../trading/pages/deals/deals.component';
import { TradingTab, TradingTabPageContextService, TradingTabPageViewModel } from '@trading-v2';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-deals-tab-page',
  standalone: true,
  imports: [DealsComponent, AsyncPipe],
  templateUrl: './deals-tab-page.component.html',
  styleUrl: './deals-tab-page.component.scss',
})
export class DealsTabPageComponent {
  protected readonly viewModel$: Observable<TradingTabPageViewModel> = inject(TradingTabPageContextService).viewModel$;

  public readonly tabId: TradingTab = TradingTab.DEALS;
}
