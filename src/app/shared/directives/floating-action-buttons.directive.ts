import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  Renderer2,
  RendererStyleFlags2,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { TabActivationService } from '../services';

@Directive({
  selector: '[floatingActionButtons]',
  standalone: true,
})
export class FloatingActionButtonsDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  private readonly document: Document = inject(DOCUMENT);
  private readonly renderer: Renderer2 = inject(Renderer2);
  private readonly tabActivationService: TabActivationService = inject(TabActivationService);

  private readonly baseBottomOffsetPx: number = 15;
  private readonly leftOffsetPx: number = 18;

  private actionButtonsPlaceholder?: Comment;
  private tabActivationSubscription?: Subscription;
  private asideResizeObserver?: ResizeObserver;
  private cleanupScrollListeners: Array<() => void> = [];
  private updateRafId?: number;
  private asideResizeDebounceTimeoutId?: number;

  public ngAfterViewInit(): void {
    this.observeAsideResize();
    this.bindScrollListeners();

    requestAnimationFrame(() => this.scheduleUpdateActionButtonsBottomOffset());
    this.tabActivationSubscription = this.tabActivationService.tabActivated$.subscribe(() => {
      this.updateActionButtonsBottomOffset();
    });
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  public updateActionButtonsBottomOffset(): void {
    const actionButtonsElement: HTMLElement = this.elementRef.nativeElement;

    if (!actionButtonsElement) {
      return;
    }

    if (!this.isHostVisible()) {
      this.restoreActionButtonsFromBody();
      return;
    }

    this.ensureActionButtonsInBody();
    this.renderer.removeStyle(actionButtonsElement, 'display');

    let bottomOffset: number = this.baseBottomOffsetPx;
    const footerElement: HTMLElement = this.document.querySelector(
      'app-footer footer, footer'
    ) as HTMLElement;

    this.renderer.setStyle(actionButtonsElement, 'position', 'fixed', RendererStyleFlags2.Important);
    this.renderer.setStyle(actionButtonsElement, 'left', `${this.leftOffsetPx}px`, RendererStyleFlags2.Important);
    this.renderer.setStyle(actionButtonsElement, 'transition', 'bottom 180ms ease-out', RendererStyleFlags2.Important);

    if (footerElement) {
      const footerTopInViewport: number = footerElement.getBoundingClientRect().top;
      const footerVisiblePart: number = window.innerHeight - footerTopInViewport;

      if (footerVisiblePart > 0) {
        bottomOffset = this.baseBottomOffsetPx + footerVisiblePart;
      }
    }

    this.renderer.setStyle(actionButtonsElement, 'bottom', `${Math.round(bottomOffset)}px`, RendererStyleFlags2.Important);
  }

  // помещаем кнопки выше в html, чтобы стили из devextreme не влияли на кнопки
  private ensureActionButtonsInBody(): HTMLElement {
    const actionButtonsElement: HTMLElement = this.elementRef.nativeElement;

    if (!actionButtonsElement) {
      return;
    }

    // первая загрузка страницы
    if (!this.actionButtonsPlaceholder && actionButtonsElement.parentNode) {
      this.actionButtonsPlaceholder = this.renderer.createComment('filters-action-buttons-placeholder');
      this.renderer.insertBefore(actionButtonsElement.parentNode, this.actionButtonsPlaceholder, actionButtonsElement);
    }

    // при переходе с табы на табу
    if (actionButtonsElement.parentNode !== this.document.body) {
      this.renderer.appendChild(this.document.body, actionButtonsElement);
    }

    return actionButtonsElement;
  }

  // при переходе со старой табы на новую нужно вернуть кнопки на старой табе в текущую разметку
  private restoreActionButtonsFromBody(): void {
    const actionButtonsElement: HTMLElement = this.elementRef.nativeElement;
    const placeholderParentNode: ParentNode = this.actionButtonsPlaceholder?.parentNode ?? null;

    if (
      !actionButtonsElement ||
      !this.actionButtonsPlaceholder ||
      !placeholderParentNode ||
      actionButtonsElement.parentNode !== this.document.body
    ) {
      return;
    }

    this.renderer.insertBefore(placeholderParentNode, actionButtonsElement, this.actionButtonsPlaceholder);
    this.renderer.setStyle(actionButtonsElement, 'display', 'none', RendererStyleFlags2.Important);
  }

  private getVisibilityAnchor(): HTMLElement {
    return (
      (this.actionButtonsPlaceholder?.parentElement as HTMLElement) ?? this.elementRef.nativeElement
    );
  }

  // метод для обновления положения кнопок при resize
  private observeAsideResize(): void {
    const asideElement: HTMLElement = this.elementRef.nativeElement.closest('aside');

    if (!asideElement) {
      return;
    }

    this.asideResizeObserver?.disconnect();
    this.asideResizeObserver = new ResizeObserver(() => {
      if (this.asideResizeDebounceTimeoutId != null) {
        window.clearTimeout(this.asideResizeDebounceTimeoutId);
      }
      this.asideResizeDebounceTimeoutId = window.setTimeout(() => {
        this.scheduleUpdateActionButtonsBottomOffset();
      }, 70);
    });
    this.asideResizeObserver.observe(asideElement);
  }

  // задание покадровой анимации движения
  private scheduleUpdateActionButtonsBottomOffset(): void {
    if (this.updateRafId != null) {
      cancelAnimationFrame(this.updateRafId);
    }

    this.updateRafId = requestAnimationFrame(() => {
      this.updateRafId = undefined;
      this.updateActionButtonsBottomOffset();
    });
  }

  // перехват и обработка движения кнопки на все скроллы (окно, документ, devextreme)
  private bindScrollListeners(): void {
    this.cleanupScrollListeners.forEach((cleanup: () => void) => cleanup());
    this.cleanupScrollListeners = [];

    const onWindowScroll = (): void => this.scheduleUpdateActionButtonsBottomOffset();
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    this.cleanupScrollListeners.push(() => {
      window.removeEventListener('scroll', onWindowScroll);
    });

    const onDocumentScrollCapture = (): void => this.scheduleUpdateActionButtonsBottomOffset();
    this.document.addEventListener('scroll', onDocumentScrollCapture, true);
    this.cleanupScrollListeners.push(() => {
      this.document.removeEventListener('scroll', onDocumentScrollCapture, true);
    });

    const scrollContainers: NodeListOf<HTMLElement> = this.document.querySelectorAll('.dx-scrollable-container');

    scrollContainers.forEach((container: HTMLElement) => {
      const onContainerScroll = (): void => this.scheduleUpdateActionButtonsBottomOffset();
      container.addEventListener('scroll', onContainerScroll, { passive: true });
      this.cleanupScrollListeners.push(() => {
        container.removeEventListener('scroll', onContainerScroll);
      });
    });
  }

  // проверка есть ли на странице сейчас элемент
  private isHostVisible(): boolean {
    const visibilityAnchor: HTMLElement = this.getVisibilityAnchor();
    const parentTabItem: HTMLElement | null = visibilityAnchor.closest('.dx-multiview-item');

    if (parentTabItem) {
      if (
        !parentTabItem.classList.contains('dx-item-selected') ||
        parentTabItem.classList.contains('dx-multiview-item-hidden') ||
        parentTabItem.classList.contains('dx-state-invisible') ||
        parentTabItem.getAttribute('aria-hidden') === 'true'
      ) {
        return false;
      }
    }

    const hostStyles: CSSStyleDeclaration = window.getComputedStyle(visibilityAnchor);

    return (
      hostStyles.display !== 'none' &&
      hostStyles.visibility !== 'hidden' &&
      visibilityAnchor.getClientRects().length > 0
    );
  }

  public ngOnDestroy(): void {
    this.tabActivationSubscription?.unsubscribe();
    if (this.asideResizeDebounceTimeoutId != null) {
      window.clearTimeout(this.asideResizeDebounceTimeoutId);
    }
    if (this.updateRafId != null) {
      cancelAnimationFrame(this.updateRafId);
    }
    this.asideResizeObserver?.disconnect();
    this.cleanupScrollListeners.forEach((cleanup: () => void) => cleanup());
    this.cleanupScrollListeners = [];

    this.restoreActionButtonsFromBody();

    const placeholderParentNode: ParentNode = this.actionButtonsPlaceholder?.parentNode ?? null;
    if (this.actionButtonsPlaceholder && placeholderParentNode) {
      this.renderer.removeChild(placeholderParentNode, this.actionButtonsPlaceholder);
    }
  }
}
