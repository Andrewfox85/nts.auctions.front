import {
  Component,
  Input,
  inject,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonService } from '@services';
import { CommonModule } from '@angular/common';
import {
  SelectionChangedEvent,
  CellPreparedEvent,
  OptionChangedEvent
} from 'devextreme/ui/data_grid';
import {
  DxDataGridModule,
  DxCheckBoxModule,
  DxTooltipModule,
} from 'devextreme-angular';
import { DynamicColumns } from './../../interfaces/index';
import { Status } from './../../constants';

@Component({
  selector: 'app-analogs-table',
  imports: [
    DxDataGridModule,
    CommonModule,
    TranslateModule,
    DxCheckBoxModule,
    DxTooltipModule,
  ],
  templateUrl: './analogs-table.component.html',
  styleUrl: './analogs-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalogsTableComponent {
  public readonly commonService = inject(CommonService);

  @Input({ required: true }) analogs: any[];
  @Input({ required: true }) dynamicColumns: DynamicColumns[];
  @Input({ required: true }) selectedRow: any;
  @Input({ required: true }) roleToAction: boolean;
  @Input({ required: true }) isInvalidPeriod: boolean;

  @Output() selectedRowChange = new EventEmitter<void>();
  @Output() compareFields = new EventEmitter<void>();
  @Output() admissionChange = new EventEmitter<{ item: any; value: boolean }>();

  Status = Status;

  public onSelectionChanged(e: SelectionChangedEvent): void {
    this.selectedRow = e.selectedRowsData[0];
    this.selectedRowChange.emit(this.selectedRow);
  }

  public onCellPrepared(e: CellPreparedEvent): void {
    e.component.selectRows(this.analogs[0], false);
  }

  onAdmissionChange(data: any, e: any): void {
    this.admissionChange.emit({ item: data, value: e.value });
  }

  //при фильтрации грида - сбрасываем установленные значения чекбокса и убираем иконку изменения
  public onOptionChanged(e: OptionChangedEvent): void {
    if (e.name === 'columns') {
      this.analogs.forEach((item) => {
        item.changed = false;
        item.needToSave = false;
      });
    }
  }
}
