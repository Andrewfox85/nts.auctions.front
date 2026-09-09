import { Component, Input, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-check-box',
  standalone: true,
  templateUrl: './check-box.component.html',
  styleUrls: ['./check-box.component.scss'],
})
export class CheckBoxComponent {
  public text = input<string>('');
  public disabled = input<boolean>(false);

  private _value = signal(false);

  @Input({ required: true })
  set value(val: boolean) {
    this._value.set(val);
  }
  
  get value(): boolean {
    return this._value();
  }

  public valueChange = output<boolean>();

  public onToggle(): void {
    if (this.disabled()) {
      return;
    }

    const newValue = !this._value();
    this._value.set(newValue);
    this.valueChange.emit(newValue);
  }
}
