import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxPopupModule,
  DxTooltipModule,
  DxDataGridModule,
} from 'devextreme-angular';
import { map } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@services';
import { ApiStore } from '@store';
import { SECTIONS_TYPES, STATUS_DOUMENTS } from '../../enums';
import { REPORT_TYPE_KEYS } from '../../constants';
import { convertExcelDateToString, processStatusDocument } from '../../helpers';
import { ExportRequest, ExportResponse, IApiDataSection } from '@interfaces';
import { TextWrapperPipe } from '@pipes';

@Component({
  selector: 'ceit-popup-export-request-list',
  imports: [
    TranslateModule,
    CommonModule,
    DxPopupModule,
    DxDataGridModule,
    DxTooltipModule,
    TextWrapperPipe,
  ],
  templateUrl: './popup-export-request-list.component.html',
  styleUrls: ['./popup-export-request-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopupExportRequestListComponent implements AfterViewInit {
  @ViewChild('statusDocumentDownload', { static: false })
  statusDocumentDownload!: TemplateRef<ElementRef>;

  @ViewChild('statusDocumentError', { static: false })
  statusDocumentError!: TemplateRef<ElementRef>;

  @ViewChild('statusDocumentisBeingFormed', { static: false })
  statusDocumentisBeingFormed!: TemplateRef<ElementRef>;

  @ViewChild('sectionMetall', { static: false })
  sectionMetall!: TemplateRef<ElementRef>;

  @ViewChild('sectionTimber', { static: false })
  sectionTimber!: TemplateRef<ElementRef>;

  @ViewChild('sectionAgri', { static: false })
  sectionAgri!: TemplateRef<ElementRef>;

  @ViewChild('sectionPerspective', { static: false })
  sectionPerspective!: TemplateRef<ElementRef>;

  private readonly commonService = inject(CommonService);
  private readonly translate = inject(TranslateService);
  private readonly apiStore = inject(ApiStore);

  public templateStatus: Record<number, TemplateRef<unknown>>;
  public sectionTypes: Record<number, TemplateRef<unknown>>;

  public readonly token =
    JSON.parse(localStorage.getItem('user') || '{}')?.token || '';

  public readonly sectionsList: Signal<Array<IApiDataSection>> = this.apiStore.sectionsList;

  public readonly exportedList$ = this.commonService
    .getExportRequestList(this.token)
    .pipe(
      map((response: ExportResponse) => response.exportRequests),
      map((exportRequests: ExportRequest[]) => {
        return exportRequests.map((request: ExportRequest) => {
          const matchedSection: IApiDataSection = this.sectionsList().find(
            (section: IApiDataSection): boolean => Number(section.id) === Number(request.requestSection),
          );
          return {
            ...request,
            dateCreate: convertExcelDateToString(request.dateCreate),
            sectionName: matchedSection?.name,
            statusDocument: processStatusDocument(request),
            reportTypeKey: this.translate.instant(
              REPORT_TYPE_KEYS[request.idReportType],
            ),
          };
        });
      }),
    );

  public popupVisible = false;

  ngAfterViewInit(): void {
    this.templateStatus = {
      [STATUS_DOUMENTS.DOWNLOAD]: this.statusDocumentDownload,
      [STATUS_DOUMENTS.ERROR]: this.statusDocumentError,
      [STATUS_DOUMENTS.IS_BEING_FORMED]: this.statusDocumentisBeingFormed,
    };

    this.sectionTypes = {
      [SECTIONS_TYPES.METALL]: this.sectionMetall,
      [SECTIONS_TYPES.TIMBER]: this.sectionTimber,
      [SECTIONS_TYPES.AGRI]: this.sectionAgri,
      [SECTIONS_TYPES.PERSPECTIVE]: this.sectionPerspective,
    };
  }

  public showPopup(): void {
    this.popupVisible = true;
  }

  public hidePopup(): void {
    this.popupVisible = false;
  }

  public downloadFile(requestId: number): void {
    this.commonService
      .getExportRequestDocument(this.token, requestId)
      .subscribe((response) => {
        const byteCharacters = atob(response.content);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/octet-stream',
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = response.fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }
}
