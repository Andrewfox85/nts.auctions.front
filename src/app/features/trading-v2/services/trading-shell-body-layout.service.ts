/**
 * Глобальные стили и CSS-класс body для отображения v1-контента внутри trading-v2 shell.
 */
import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import {
  TRADING_V2_BODY_LAYOUT_CSS,
  TRADING_V2_BODY_LAYOUT_STYLE_ID,
} from '../styles/trading-v2-body-layout';

const TRADING_V2_BODY_CLASS: string = 'trading-v2-active';

@Injectable({ providedIn: 'root' })
export class TradingShellBodyLayoutService {
  private readonly document: Document = inject(DOCUMENT);

  private bodyLayoutStyleEl?: HTMLStyleElement;

  /** Включает layout trading-v2: класс на body и инжект глобальных стилей. */
  public enable(): void {
    this.document.body.classList.add(TRADING_V2_BODY_CLASS);

    if (!this.bodyLayoutStyleEl) {
      const style = this.document.createElement('style');
      style.id = TRADING_V2_BODY_LAYOUT_STYLE_ID;
      style.textContent = TRADING_V2_BODY_LAYOUT_CSS;
      this.document.head.appendChild(style);
      this.bodyLayoutStyleEl = style;
    }
  }

  /** Отключает layout trading-v2: снимает класс и удаляет инжектированные стили. */
  public disable(): void {
    this.document.body.classList.remove(TRADING_V2_BODY_CLASS);
    this.bodyLayoutStyleEl?.remove();
    this.bodyLayoutStyleEl = undefined;
  }
}
