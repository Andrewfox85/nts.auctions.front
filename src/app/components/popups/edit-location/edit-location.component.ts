import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { IdInterfaceField } from '@constants';
import {
  DxDropDownBoxComponent,
  DxListComponent,
  DxPopupComponent,
  DxSelectBoxComponent,
  DxTemplateDirective,
  DxTextBoxComponent,
  DxValidatorComponent,
} from 'devextreme-angular';
import {
  DxiValidationRuleComponent,
  DxoAnimationComponent,
  DxoPagingComponent,
} from 'devextreme-angular/ui/nested';
import { TranslateModule } from '@ngx-translate/core';
import { Field, IEditOfferGood } from '@interfaces';
import { IReferences } from '../../../views/homepage/interfaces';
import { SelectionChangedEvent } from 'devextreme/ui/list';
import { ValueChangedEvent as SelectBoxValueChangedEvent } from 'devextreme/ui/text_box';
import { ValueChangedEvent } from 'devextreme/ui/select_box';

@Component({
  selector: 'app-edit-location',
  imports: [
    DxPopupComponent,
    DxoAnimationComponent,
    DxListComponent,
    DxTextBoxComponent,
    DxValidatorComponent,
    DxiValidationRuleComponent,
    DxSelectBoxComponent,
    TranslateModule,
    DxDropDownBoxComponent,
    DxoPagingComponent,
    DxTemplateDirective,
  ],
  templateUrl: './edit-location.component.html',
  styleUrl: './edit-location.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class EditLocationComponent implements OnChanges {
  public readonly IdInterfaceField = IdInterfaceField;

  @Input({ required: true }) locationField: Field;
  @Input({ required: true }) productLocations: IReferences[] = [];
  @Input({ required: true }) productLocationValue: string | number;
  @Input({ required: true }) goodLocation: IEditOfferGood;
  @Input({ required: true }) isComplexLotGrades: () => boolean;
  @Output() result = new EventEmitter<{ id: number, value: string | number, freeInput: boolean }>();

  selectedItemKeys = [];
  isDropDownOpened = false;
  filterDataSourceDropDown = [];
  isVisible: boolean;

  public productLocationId: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes) return;
    this.isVisible = true;
    this.filterDataSourceDropDown = [...this.productLocations];

    if (this.productLocationValue) {
      const match = this.productLocations.find(
        (el: IReferences) => el.name === this.productLocationValue
      );
      if (match) {
        this.selectedItemKeys = [match.id.toString()];
        this.productLocationId = Number(match.id);
      }
    }
  }

  public onContinueEditProductLocation(): void {
    this.isVisible = false;
    this.result.emit({ id: this.productLocationId, value: this.productLocationValue, freeInput: this.isFreeInput });
  }

  public selectionChangeInUserInputComponent(
    event: SelectionChangedEvent
  ): void {
    this.productLocationId = Number(event.addedItems[0].id);
    this.productLocationValue = event.addedItems[0].name;
    this.isDropDownOpened = false;
  }

  public onSearch(e: SelectBoxValueChangedEvent): void {
    const result = e.value.length >= 3 || e.value.length == 0;
    if (result) {
      this.filterDataSourceDropDown = this.productLocations.filter((item) =>
        item.name.toLowerCase().includes(e.value)
      );
    }
  }

  public isFreeInput: boolean = false;

  public valueFreeInput(e: ValueChangedEvent): void {
    this.isFreeInput = e.event && e.event.type === 'change';//поле изменялось вручную
  }

  public onCancelEditLocation(): void {
    this.isVisible = false;
    this.result.emit();
  }
}
