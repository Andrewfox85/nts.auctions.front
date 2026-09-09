import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[scroll-to-bottom]',
  standalone: true,
})
export class ScrollToBottomDirective {
  private readonly _el = inject(ElementRef);

  public scrollToBottom(): void {
    const el: HTMLDivElement = this._el.nativeElement;

    el.scrollTop = Math.max(0, el.scrollHeight - el.offsetHeight);
  }
}
