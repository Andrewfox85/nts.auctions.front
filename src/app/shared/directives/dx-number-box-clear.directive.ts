import { Directive, HostListener, inject } from '@angular/core';
import { DxNumberBoxComponent } from 'devextreme-angular';
import type { ValueChangedEvent } from 'devextreme/ui/number_box';

@Directive({
  selector: 'dx-number-box[dxNumberBoxClear]',
  standalone: true,
})
export class DxNumberBoxClearDirective {
  private readonly numberBox = inject(DxNumberBoxComponent);

  @HostListener('onValueChanged', ['$event'])
  public onValueChanged(e: ValueChangedEvent): void {
    // при очистке значения поле сбрасывается на пустоту
    if (e.event?.type === 'clear' || e.value === '') {
      this.numberBox.value = null;
      this.numberBox.instance.option('value', null);
    }
  }
}
