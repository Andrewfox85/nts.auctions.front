import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { DX_MODULES, numberEntriesPage } from '@constants';
import { TargetedService } from '@services';
import { User } from '@classes';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DxGridContextMenuLocalizationDirective } from '../../../shared/directives';

@Component({
  selector: 'app-volume-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './volume-popup.component.html',
  styleUrls: ['./volume-popup.component.scss'],
})
export class VolumePopupComponent implements OnInit {
  @Input() volumePopup;
  @Input() volumeData;
  @Input() dynamicFields;
  @Input() sessionIds;
  @Input() volumeType;
  @Output() close = new EventEmitter<any>();

  user: User;
  numberEntriesPage = numberEntriesPage;
  currentTimeDateOnPopup: Date;

  private readonly targetedService = inject(TargetedService);

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  onShowing(e) {
    this.currentTimeDateOnPopup = new Date();
  }

  getDynValue(dynamicFields, id) {
    return dynamicFields[id];
  }

  getVolume() {
    this.currentTimeDateOnPopup = new Date();
    this.targetedService
      .getAdTimberVolume(this.user?.token, this.sessionIds.sessionId)
      .subscribe((res) => {
        this.volumeType = res.typeVolumeControl;
        if (this.volumeType == 0) {
          this.volumeData = res.commonVolumes.volumes;
          this.volumeData.forEach((v) => {
            v.volumeApprove = v.volumeAvailable - v.volumeRemaining;
          });
        }
        if (this.volumeType == 1) {
          this.volumeData = res.quotePosVolumes.volumes;
          this.dynamicFields = res.quotePosVolumes.fields;
          this.volumeData.forEach((v) => {
            v.volumeApprove = v.volumeAvailable - v.volumeRemaining;
          });
        }
      });
  }

  //фильтрация динамических колонок
  getDataSourceDynFilter(fieldName) {
    const filteredData = this.volumeData
      .map((item) => item.dynamicFields[fieldName])
      .filter((value) => value !== undefined && value !== null);
    return filteredData;
  }

  calculateFilterExpressionDynamic(
    filterValue,
    selectedFilterOperation,
    target
  ) {
    const column = this as any;
    return [
      [column.dataField, 'startswith', filterValue],
      [column.dataField, 'endswith', filterValue],
    ];
  }

  closePopup() {
    this.close.emit(false);
  }
}
