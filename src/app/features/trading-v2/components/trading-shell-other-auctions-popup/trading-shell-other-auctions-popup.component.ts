/**
 * Попап выбора другой секции и сессии для перехода в аукцион.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { DX_MODULES } from '@constants';

@Component({
  selector: 'app-trading-shell-other-auctions-popup',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, ...DX_MODULES],
  templateUrl: './trading-shell-other-auctions-popup.component.html',
  styleUrl: './trading-shell-other-auctions-popup.component.scss',
})
export class TradingShellOtherAuctionsPopupComponent {
  @Input() visible: boolean = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() sections: Array<{ id: number; name: string }> = [];
  @Input() sessionsForDisplay: Array<{
    sessionId: number;
    sessionName: string;
  }> = [];

  @Output() closed: EventEmitter<void> = new EventEmitter<void>();
  @Output() sectionChanged: EventEmitter<ValueChangedEvent> = new EventEmitter<ValueChangedEvent>();
  @Output() navigate: EventEmitter<{ sectionId: number; sessionId: number; }> = new EventEmitter<{
    sectionId: number;
    sessionId: number;
  }>();

  /** Форматирует отображение сессии в выпадающем списке. */
  public formatSessionSelectBox(data: { sessionId?: number; sessionName?: string; } | null): string {
    return data ? `№${data.sessionId} ${data.sessionName}` : '';
  }

  /** Закрывает попап без перехода. */
  public onClose(): void {
    this.closed.emit();
  }

  /** Переходит к выбранной секции и сессии, если оба значения заданы. */
  public onNavigate(): void {
    const sectionId = this.form.get('section')?.value;
    const sessionId = this.form.get('session')?.value;

    if (sectionId == null || sessionId == null) {
      return;
    }

    this.navigate.emit({ sectionId, sessionId });
  }
}
