import {
  Component,
  input,
  ChangeDetectionStrategy,
  output,
  computed,
  signal,
  inject
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DxPopupModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxTooltipModule
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { RefsValue, AnalogList, AnalogListItem } from './../interfaces';
import { SelectionChangedEvent } from 'devextreme/ui/data_grid';
import { DxCheckBoxTypes } from 'devextreme-angular/ui/check-box';
import { GlobalStore } from '@store';
import { GOOD_REF_ID } from './../constants';

@Component({
  selector: 'app-analog-list-popup',
  imports: [
    TranslateModule,
    DxPopupModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxCheckBoxModule,
    DxTooltipModule
  ],
  templateUrl: './analogs-list-popup.component.html',
  styleUrl: './analogs-list-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class AnalogsListPopupComponent {
  public readonly analogsListPopup = input.required<boolean>();
  public readonly analogsList = input.required<AnalogList>();
  public readonly idGood = input.required<number | null>();
  public addChoosenGood = output<AnalogListItem>();
  public close = output<void>();

  public readonly globalStore = inject(GlobalStore);

  public isMyAnalogs = signal(false);

  public selectedRow: AnalogListItem;

  public analogsForShow = computed(() => {
    const filtered: AnalogList = this.isMyAnalogs()
      ? this.analogsList().filter((a) => a.isMine)
      : this.analogsList();

    return filtered.map((a) => ({
      ...a,
      ...Object.fromEntries(
        (a.values ?? []).map((v) => [v.nameReference, v.nameValue])
      ),
    }));
  });

  public readonly dynamicColumns = computed(() => {
    const allValues: RefsValue[] = this.analogsList().flatMap((a) => a.values);

    const uniqueNames: RefsValue[] = Array.from(
      new Map(allValues.map((v) => [v.nameReference, v])).values()
    );

    return uniqueNames
      .filter((v) => v.idReference !== GOOD_REF_ID)
      .map((v) => ({
        caption: v.nameReference,
        dataField: v.nameReference,
      }));
  });

  public showMyAnalogs(e: DxCheckBoxTypes.ValueChangedEvent): void {
    this.isMyAnalogs.set(e.value);
  }

  public onSelectionChanged(e: SelectionChangedEvent): void {
    this.selectedRow = e.selectedRowsData[0];
  }

  public addAnalogToForm(good: AnalogListItem): void {
    this.addChoosenGood.emit(good);
    this.closePopup();
  }

  public closePopup(): void {
    this.close.emit();
  }
}
