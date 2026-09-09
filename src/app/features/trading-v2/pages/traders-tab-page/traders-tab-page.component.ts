/**
 * Страница вкладки «Трейдеры»: обёртка с SignalR-привязкой и навигацией на связанные вкладки.
 */
import { AsyncPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TradersComponent } from '../../../trading/pages/traders/traders.component';
import { INewTabData } from '../../../trading/interfaces';
import {
  isTradersRegistrationFilterType,
  TradingTab,
  TradingTabPageContextService,
  TradingTradersNavigationService,
  TradingTabSignalrSessionService,
  TradingTabPageViewModel,
  TradingTradersNavigationTargetTab,
} from '@trading-v2';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-traders-tab-page',
  standalone: true,
  imports: [TradersComponent, AsyncPipe],
  templateUrl: './traders-tab-page.component.html',
  styleUrl: './traders-tab-page.component.scss',
})
export class TradersTabPageComponent implements OnInit {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly tradersNavigation: TradingTradersNavigationService = inject(TradingTradersNavigationService);
  private readonly signalrSession: TradingTabSignalrSessionService = inject(TradingTabSignalrSessionService);

  public readonly tabId: TradingTab = TradingTab.TRADERS;

  protected readonly viewModel$: Observable<TradingTabPageViewModel> = inject(TradingTabPageContextService).viewModel$;

  /** Регистрирует компонент трейдеров в SignalR-сессии вкладки. */
  @ViewChild(TradersComponent)
  public set tradersComponent(component: TradersComponent) {
    this.signalrSession.traders = component ?? null;
  }

  /** Очищает ссылку на дочерний компонент при уничтожении вкладки. */
  public ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.signalrSession.traders = null;
    });
  }

  /** Переходит на вкладку регистрации или заявок. */
  public onNewTab(data: INewTabData): void {
    const shellRoute: ActivatedRoute = this.route.parent;
    if (!shellRoute) {
      return;
    }

    const isRegistration: boolean = isTradersRegistrationFilterType(data.type);
    const targetTab: TradingTradersNavigationTargetTab = isRegistration
      ? TradingTab.REGISTRATION
      : TradingTab.OFFERS;

    this.tradersNavigation.navigateFromTraders(shellRoute, targetTab, data);
  }
}
