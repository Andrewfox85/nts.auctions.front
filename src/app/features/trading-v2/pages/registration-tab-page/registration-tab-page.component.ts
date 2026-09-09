/**
 * Страница вкладки «Регистрация»: обёртка над legacy-компонентом регистраций в торговом shell.
 */
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RegistrationsComponent } from '../../../trading/pages/registrations/registrations.component';
import { TradingTab, TradingTabPageContextService, TradingTabPageViewModel } from '@trading-v2';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-registration-tab-page',
  standalone: true,
  imports: [RegistrationsComponent, AsyncPipe],
  templateUrl: './registration-tab-page.component.html',
  styleUrl: './registration-tab-page.component.scss',
})
export class RegistrationTabPageComponent {
  protected readonly viewModel$: Observable<TradingTabPageViewModel> = inject(TradingTabPageContextService).viewModel$;

  public readonly tabId: TradingTab = TradingTab.REGISTRATION;
}
