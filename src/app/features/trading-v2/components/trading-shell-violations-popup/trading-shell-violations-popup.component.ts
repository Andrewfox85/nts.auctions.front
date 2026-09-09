/**
 * Попап предупреждения о нарушениях при входе в торговую сессию.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DX_MODULES } from '@constants';

@Component({
  selector: 'app-trading-shell-violations-popup',
  standalone: true,
  imports: [TranslateModule, ...DX_MODULES],
  templateUrl: './trading-shell-violations-popup.component.html',
})
export class TradingShellViolationsPopupComponent {
  @Input() visible: boolean = false;
  @Input() warningMessage?: string;
  @Input() isExistsViolations: boolean | string | null = null;
  @Input() transferingMessage: boolean = false;
  @Input() currentDateForDisplay?: { currentDate: string };

  @Output() closed: EventEmitter<void> = new EventEmitter<void>();
  @Output() goToPersonalPage: EventEmitter<void> = new EventEmitter<void>();

  /** Закрывает попап нарушений. */
  public onClose(): void {
    this.closed.emit();
  }
}
