/**
 * Страница вкладки «Задаток»: обёртка над legacy-компонентом депозита в торговом shell.
 */
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DepositComponent } from '../../../trading/pages/deposit/deposit.component';
import { TradingTab, TradingTabPageContextService, TradingTabPageViewModel } from '@trading-v2';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-deposit-tab-page',
  standalone: true,
  imports: [DepositComponent, AsyncPipe],
  templateUrl: './deposit-tab-page.component.html',
  styleUrl: './deposit-tab-page.component.scss',
})
export class DepositTabPageComponent {
  protected readonly viewModel$: Observable<TradingTabPageViewModel> = inject(TradingTabPageContextService).viewModel$;

  public readonly tabId: TradingTab = TradingTab.DEPOSIT;
}
