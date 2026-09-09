/**
 * Страница вкладки «Настройки»: обёртка над legacy-компонентом периодов в торговом shell.
 */
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PeriodsComponent } from '../../../trading/pages/periods/periods.component';
import { TradingTab, TradingTabPageContextService, TradingTabPageViewModel } from '@trading-v2';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-setting-tab-page',
  standalone: true,
  imports: [PeriodsComponent, AsyncPipe],
  templateUrl: './setting-tab-page.component.html',
  styleUrl: './setting-tab-page.component.scss',
})
export class SettingTabPageComponent {
  protected readonly viewModel$: Observable<TradingTabPageViewModel> = inject(TradingTabPageContextService).viewModel$;

  public readonly tabId: TradingTab = TradingTab.SETTING;
}
