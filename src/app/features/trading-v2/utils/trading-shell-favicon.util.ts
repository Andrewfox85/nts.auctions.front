/**
 * Установка favicon для страниц торгов v2.
 */
import { Renderer2 } from '@angular/core';

/** Создаёт или обновляет `<link rel="icon">` с указанным href. */
export function setTradingShellFavicon(document: Document, renderer: Renderer2, href: string): void {
  let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']");

  if (!link) {
    link = renderer.createElement('link');
    renderer.setAttribute(link, 'rel', 'icon');
    renderer.appendChild(document.head, link);
  }

  renderer.setAttribute(link, 'type', 'image/svg+xml');
  renderer.setAttribute(link, 'href', href);
}
