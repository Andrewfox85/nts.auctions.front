import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { goodRefId } from '@constants';
import { GoodValue } from './../../views/dutch-down-auction/components/submitting-counter-demand/interfaces/index';

@Directive({
  selector: '[nsiTree]',
})
export class NsiTreeDirective implements OnChanges {
  @Input() ref: GoodValue;

  private baseLevel: number = 15;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['ref']) {
      this.updatePadding();
    }
  }

  private updatePadding(): void {
    const isChild: boolean =
      this.ref?.parentIdReference && this.ref.parentIdReference !== goodRefId;

    const paddingValue: string = isChild
      ? `${this.ref.level * this.baseLevel}px`
      : '0px';

    this.renderer.setStyle(this.el.nativeElement, 'padding-left', paddingValue);
  }
}
