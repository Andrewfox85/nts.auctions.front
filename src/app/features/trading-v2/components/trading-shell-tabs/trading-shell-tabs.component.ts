/**
 * Вкладки торговой оболочки с учётом роли пользователя и состояния сессии.
 */
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
  ActivatedRoute,
  IsActiveMatchOptions,
  Params,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '@classes';
import { TradingTab } from '../../shared';
import { TradingShellState } from '../../models/trading-shell-state.model';
import { TradingTabVisibilityService } from '../../services';
import { getTradingSessionQueryParams } from '../../utils/trading-route-query-params';

export interface TradingShellTabItem {
  path: TradingTab;
  labelKey: string;
  labelParams?: Record<string, string>;
  showUnreadBadge?: boolean;
}

@Component({
  selector: 'app-trading-shell-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './trading-shell-tabs.component.html',
  styleUrl: './trading-shell-tabs.component.scss',
})
export class TradingShellTabsComponent {
  protected readonly route: ActivatedRoute = inject(ActivatedRoute);

  protected readonly tabLinkActiveOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };

  @Input({ required: true }) shellState!: TradingShellState;
  @Input() user!: User;
  @Input() disableTabs: boolean = false;
  @Input() countInboxUnanswered: number = 0;
  @Output() tabLinkClick: EventEmitter<TradingTab> = new EventEmitter<TradingTab>();

  constructor(private readonly tabVisibility: TradingTabVisibilityService) {}

  /** Query-параметры текущей торговой сессии для ссылок вкладок. */
  public get sessionQueryParams(): Params {
    return getTradingSessionQueryParams(this.route);
  }

  /** Список видимых вкладок с учётом роли пользователя и флагов сессии. */
  public get tabs(): TradingShellTabItem[] {
    const state: TradingShellState = this.shellState;
    const items: TradingShellTabItem[] = [];

    if (this.tabVisibility.isTabVisible(TradingTab.TRADING, state)) {
      items.push({ path: TradingTab.TRADING, labelKey: 'trading.trading' });
    }

    if (this.tabVisibility.isTabVisible(TradingTab.OFFERS, state)) {
      items.push({
        path: TradingTab.OFFERS,
        labelKey: state.directTabs
          ? 'trading.directOffersTab.directOffers'
          : state.user?.IsWorker
            ? 'btns.offers'
            : 'trading.myOffers',
      });
    }

    if (this.tabVisibility.isTabVisible(TradingTab.REGISTRATION, state)) {
      items.push({
        path: TradingTab.REGISTRATION,
        labelKey: state.user?.IsWorker
          ? 'trading.registration'
          : 'trading.myRegs',
      });
    }

    if (this.tabVisibility.isTabVisible(TradingTab.TRADERS, state)) {
      items.push({ path: TradingTab.TRADERS, labelKey: 'trading.traders' });
    }

    if (this.tabVisibility.isTabVisible(TradingTab.DEPOSIT, state)) {
      items.push({ path: TradingTab.DEPOSIT, labelKey: 'trading.deposit' });
    }

    if (this.tabVisibility.isTabVisible(TradingTab.DEALS, state)) {
      items.push({ path: TradingTab.DEALS, labelKey: 'trading.deals' });
    }

    if (this.tabVisibility.isTabVisible(TradingTab.MESSAGES, state)) {
      items.push({
        path: TradingTab.MESSAGES,
        labelKey: 'trading.messages',
        showUnreadBadge: true,
      });
    }

    if (this.tabVisibility.isTabVisible(TradingTab.SETTING, state)) {
      items.push({ path: TradingTab.SETTING, labelKey: 'trading.setting' });
    }

    return items;
  }

  /** Определяет, показывать ли бейдж непрочитанных сообщений на вкладке. */
  public showMessagesBadge(tab: TradingShellTabItem): boolean {
    if (!tab.showUnreadBadge || this.countInboxUnanswered <= 0) {
      return false;
    }

    return (
      !!this.user?.IsWorker ||
      (!this.user?.IsWorker && tab.path === TradingTab.MESSAGES)
    );
  }

  /** Обрабатывает клик по вкладке и блокирует переход при отключённой навигации. */
  public onTabClick(tab: TradingTab, event: MouseEvent): void {
    this.tabLinkClick.emit(tab);
    if (this.disableTabs) {
      event.preventDefault();
    }
  }

  /** Возвращает признак блокировки навигации по вкладкам. */
  public isTabDisabled(): boolean {
    return this.disableTabs;
  }
}
