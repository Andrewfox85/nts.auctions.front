import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  DxSelectBoxModule,
  DxTextBoxModule,
  DxDateBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ValueChangedEvent } from 'devextreme/ui/date_box';

@Component({
  selector: 'app-delivery-term-form',
  templateUrl: './delivery-term-form.component.html',
  styleUrls: ['./delivery-term-form.component.scss'],
  standalone: true,
  imports: [
    DxSelectBoxModule,
    DxDateBoxModule,
    DxValidatorModule,
    DxTextBoxModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class DeliveryTermFormComponent {
  @Input({ required: true }) deliveryTermForm: FormGroup;

  @Input({ required: true }) uniqueDeliveryTerm: any[] = [];

  @Input({ required: true }) deliveryTermType: any[] = [];

  @Input({ required: true }) deliveryTermValue: any[] = [];

  @Input({ required: true }) DateSessionPlusDay: Date;

  @Input({ required: true }) isDate!: () => {
    startDeliveryDateValue: boolean;
    endDeliveryDateValue: boolean;
  };

  @Input({ required: true }) validateEndDate!: () => Date;

  @Input({ required: true }) isClearSchedule!: (
    field: string,
    event?: ValueChangedEvent
  ) => void;

  @Input({ required: true }) isEditedDeliveryTerm: boolean = false;

  @Output() isEditedDeliveryTermChange = new EventEmitter<boolean>();

  @Output() clearSchedule = new EventEmitter<{
    field: string;
    event?: ValueChangedEvent;
  }>();

  public onValueChangedDate(
    dateString: string,
    event: ValueChangedEvent
  ): void {
    this.isEditedDeliveryTermChange.emit(true);
    this.handleIsClearSchedule(dateString, event);
  }

  public handleIsClearSchedule(field: string, event?: ValueChangedEvent): void {
    this.clearSchedule.emit({ field, event });
  }
}
