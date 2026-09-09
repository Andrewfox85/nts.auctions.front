/**
 * Страница вкладки «Заявки»: обёртка над legacy-компонентом предложений с SignalR-привязкой.
 */
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { OffersComponent } from '../../../trading/pages/offers';
import {
  TradingTab,
  TradingTabPageContextService,
  TradingTabPageViewModel,
  TradingTabSignalrSessionService,
} from '@trading-v2';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-offers-tab-page',
  standalone: true,
  imports: [OffersComponent, AsyncPipe],
  templateUrl: './offers-tab-page.component.html',
  styleUrl: './offers-tab-page.component.scss',
})
export class OffersTabPageComponent implements OnInit {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly signalrSession: TradingTabSignalrSessionService = inject(TradingTabSignalrSessionService);

  public readonly tabId: TradingTab = TradingTab.OFFERS;

  protected readonly viewModel$: Observable<TradingTabPageViewModel> = inject(TradingTabPageContextService).viewModel$;

  /** Регистрирует компонент предложений в SignalR-сессии вкладки. */
  @ViewChild(OffersComponent)
  public set offersComponent(component: OffersComponent) {
    this.signalrSession.offers = component ?? null;
  }

  /** Очищает ссылку на дочерний компонент при уничтожении вкладки. */
  public ngOnInit(): void {
    this.destroyRef.onDestroy((): void => {
      this.signalrSession.offers = null;
    });
  }
}
