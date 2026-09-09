/**
 * Страница вкладки «Торги»: обёртка над legacy-компонентом аукционов с SignalR-привязкой.
 */
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { AuctionsComponent } from '../../../trading/pages/auctions/auctions.component';
import {
  TradingTab,
  TradingTabPageContextService,
  TradingTabPageViewModel,
  TradingTabSignalrSessionService,
} from '@trading-v2';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-trading-tab-page',
  standalone: true,
  imports: [AuctionsComponent, AsyncPipe],
  templateUrl: './trading-tab-page.component.html',
  styleUrl: './trading-tab-page.component.scss',
})
export class TradingTabPageComponent implements OnInit {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly signalrSession: TradingTabSignalrSessionService = inject(TradingTabSignalrSessionService);

  public readonly tabId: TradingTab = TradingTab.TRADING;

  protected readonly viewModel$: Observable<TradingTabPageViewModel> = inject(TradingTabPageContextService).viewModel$;

  /** Регистрирует компонент аукционов в SignalR-сессии вкладки. */
  @ViewChild(AuctionsComponent)
  public set auctionsComponent(component: AuctionsComponent) {
    this.signalrSession.trading = component ?? null;
  }

  /** Очищает ссылку на дочерний компонент при уничтожении вкладки. */
  public ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.signalrSession.trading = null;
    });
  }
}
