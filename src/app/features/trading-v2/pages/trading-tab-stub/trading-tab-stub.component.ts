/**
 * Заглушка для некорректного URL вкладки: отображает сообщение об ошибке маршрута.
 */
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TradingTab } from '@trading-v2';

@Component({
  selector: 'app-trading-tab-stub',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './trading-tab-stub.component.html',
  styleUrl: './trading-tab-stub.component.scss',
})
export class TradingTabStubComponent {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private snapshotDataKey: string = 'tradingTab';

  public readonly tab: TradingTab = this.route.snapshot.data[
    this.snapshotDataKey
  ] as TradingTab;
}
