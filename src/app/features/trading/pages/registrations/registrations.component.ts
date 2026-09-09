import { Component, OnInit, Input, SimpleChanges, inject } from '@angular/core';
import { User } from '@classes';
import {
  numberEntriesPage,
  statusRegs,
  searchIcon,
  DEFAULT_COLUMN_CHOOSER_POSITION,
} from '@constants';
import {
  DxTextBoxModule,
  DxDataGridModule,
  DxPopupModule,
  DxTextAreaModule,
  DxSwitchModule,
} from 'devextreme-angular';
import {
  CommonService,
  RegistrationService,
  AccessService,
  AdmissionOption,
  Registration,
  IRegistrationResult,
  GetListRegistrationsWorkerResponse,
  GetListRegistrationsResponse,
} from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import RU from '@ru-translate';
import EN from '@en-translate';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HomePageStore } from '@homepage-store';
import { getAuctionPath, getGridInfoText } from '@helpers';
import { ContextMenuPreparingEvent } from 'devextreme/ui/data_grid';
import { DatePipe, NgClass } from '@angular/common';
import { ExcelDatePipe } from '@pipes';
import { INewTabData } from '../../interfaces';
import {
  buildRegistrationsTraderGridFilter,
  DxGridFilterExpression,
  resolveDirectionName
} from '../../utils/registrations-trader-grid-filter.util';
import { applyFilterValueToGridState } from '../../utils/apply-filter-value-to-grid-state.util';
import { LocalStorageService } from '@shared-services';
import { WORKER_TAB_NAMES } from '@enums';
import { DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { DxGridContextMenuLocalizationDirective } from '../../../../shared/directives';
import { ApiStore } from '@store';
import { DxGridState, IApiDataSection } from '@interfaces';
import { PositionConfig } from 'devextreme/common/core/animation';

@Component({
  selector: 'app-registrations',
  standalone: true,
  imports: [
    TranslateModule,
    DxTextBoxModule,
    DxDataGridModule,
    DxPopupModule,
    DxTextAreaModule,
    DxSwitchModule,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    DatePipe,
    ExcelDatePipe,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './registrations.component.html',
  styleUrls: ['./registrations.component.scss'],
})
export class RegistrationsComponent implements OnInit {
  private readonly registrationService = inject(RegistrationService);
  private readonly accessService = inject(AccessService);
  private readonly store = inject(HomePageStore);
  private readonly translate = inject(TranslateService);
  private readonly commonService = inject(CommonService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly apiStore = inject(ApiStore);

  @Input() sessionIds;
  @Input() sessionInfo;
  @Input() tabIndex: string;
  @Input() isFromTraders: boolean;
  @Input() dataForFilter: INewTabData | null;
  @Input() isAdmissionFinished: boolean;

  public readonly columnChooserPosition: PositionConfig = DEFAULT_COLUMN_CHOOSER_POSITION;

  public user: User;
  public numberEntriesPage = numberEntriesPage;
  public searchIcon: any = searchIcon;
  public search: string;
  public statusRegs = statusRegs;
  public privileges = false;
  public registrations: Registration[] = [];
  public registrationsWorker: Registration[] = [];
  public registrationsTrader: Registration[] = [];
  public chooseRegs: any = [];
  public selectedRows: any = [];
  public admissionOptions: AdmissionOption;

  public rejectPopup = false;
  public rejectReason = '';

  public rejectForm = this.formBuilder.group({
    reason: [null, Validators.required],
  });

  public resultPopup = false;
  public resultPopupType: string;
  public resultPopupTitle = '';

  public restorePopup = false;
  public restoreForm = this.formBuilder.group({
    violationsControl: [false],
    depositControl: [false],
  });
  public resultData: IRegistrationResult[];
  public succeedRes: any = [];
  public unsucceedRes: any = [];

  public filterTraderName; // фильтруем по трейдеру если пришли из вкладки Трейдеры
  public filterStatus;
  public filterDirection: number;
  public filterDirectionName: string;

  public filterValue: DxGridFilterExpression | DxGridFilterExpression[] | null = null;
  public dataLoaded = false;

  public gridStateStorageKey: string = 'registrations';

  public loadGridState = (): DxGridState | null => {
    const state: DxGridState = this.localStorageService.getItemFromLocalStorage<DxGridState>(
      this.gridStateStorageKey
    );

    return applyFilterValueToGridState(state, this.filterValue as string[]);
  };

  public saveGridState = (state: DxGridState): void => {
    this.localStorageService.setItemToLocalStorage(this.gridStateStorageKey, state);
  };

  get infoText(): string {
    return getGridInfoText(this.translate.store.currentLang, this.registrations?.length);
  }

  public ngOnInit(): void {
    this.user = this.localStorageService.getUser() as User;
    const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();

    let sectionDescription: string = sectionsArray.find(
      (el: IApiDataSection): boolean => Number(el.id) === Number(this.sessionIds.sectionId)
    )?.description;

    sectionDescription = 'TradingEditItem' + sectionDescription;

    this.privileges = this.commonService.checkPrivileges(sectionDescription);

    this.getData();

    if (this.user?.IsWorker && this.dataForFilter) {
      this.prepareTraderFilter();
    } else {
      this.filterValue = null;
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const conditionForRegistrationsTabIndex =
      changes['tabIndex'] &&
      changes['tabIndex'].currentValue === WORKER_TAB_NAMES.REGISTRATION;

    const conditionForisAdmissionFinished =
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue &&
      this.tabIndex === WORKER_TAB_NAMES.REGISTRATION;

    if (conditionForRegistrationsTabIndex || conditionForisAdmissionFinished) {
      this.getData();
    }

    if (this.user?.IsWorker && changes['dataForFilter']?.currentValue) {
      this.prepareTraderFilter();
    }
  }

  public get boundGridFilterValue(): DxGridFilterExpression[] | DxGridFilterExpression {
    return this.user?.IsWorker && this.filterValue?.length
      ? this.filterValue
      : null;
  }

  public onGridOptionChanged(event: DxDataGridTypes.OptionChangedEvent): void {
    if (event.name !== 'filterValue') {
      return;
    }

    this.filterValue =
      event.value == null ||
      (Array.isArray(event.value) && event.value.length === 0)
        ? null
        : event.value;
  }

  private prepareTraderFilter(): void {
    this.filterTraderName = this.dataForFilter?.traderFullName || '';
    this.filterStatus = this.dataForFilter?.status || '';
    this.filterDirection = this.dataForFilter?.direction || null;
    this.filterDirectionName = resolveDirectionName(this.filterDirection, this.translate);
    this.filterValue = buildRegistrationsTraderGridFilter({
      traderName: this.filterTraderName,
      statusName: this.filterStatus,
      directionName: this.filterDirectionName,
    });
  }

  private applyTraderGridFilterFromResponse(): void {
    if (!this.filterDirection || !this.filterValue) {
      return;
    }

    this.filterDirectionName = resolveDirectionName(this.filterDirection, this.translate);
    this.filterValue = buildRegistrationsTraderGridFilter({
      traderName: this.filterTraderName,
      statusName: this.filterStatus,
      directionName: this.filterDirectionName,
    });
  }

  public getData(): void {
    if (this.user?.IsWorker) {
      this.registrationService
        .getListRegistrationsWorker(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          this.search ? this.search : ''
        )
        .subscribe((res: GetListRegistrationsWorkerResponse): void => {
          this.registrations = res.registrations;
          this.registrationsWorker = res.registrations;
          this.dataLoaded = true;
          this.applyTraderGridFilterFromResponse();
        });
    } else {
      this.registrationService
        .getListRegistrations(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId
        )
        .subscribe((res: GetListRegistrationsResponse): void => {
          this.registrations = res.registrations;
          this.registrationsTrader = res.registrations;
          this.dataLoaded = true;
        });
    }
  }

  public onSelectionChanged(data: any): void {
    this.selectedRows = data.selectedRowsData;
  }

  public onContextMenuPreparing(e: ContextMenuPreparingEvent): void {
    if (e.row.rowType != 'header') {
      this.chooseRegs = [];
      if (!e.items) e.items = [];

      if (this.selectedRows.length > 0) {
        this.chooseRegs = this.selectedRows;
      } else {
        this.chooseRegs.push(e.row.data);
      }

      if (this.user.IsWorker) {
        e.items.push(
          {
            icon: './assets/img/icons/reject.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['trading'].regsTable.reject
                : EN['trading'].regsTable.reject,
            disabled:
              this.sessionInfo.sessionStageId != 7 ||
              !this.privileges ||
              this.disabledReject(),
            onItemClick: () => {
              this.onOpenReject();
            },
          },
          {
            icon: './assets/img/icons/restore.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['trading'].regsTable.restore
                : EN['trading'].regsTable.restore,
            disabled:
              this.sessionInfo.sessionStageId != 7 ||
              !this.privileges ||
              this.disabledRestore(),
            onItemClick: () => {
              this.checkAdmissionProcessed();
            },
          }
        );
      }
    }
  }

  private disabledReject(): boolean {
    let disabled = false;

    disabled = this.chooseRegs.some(
      (item) =>
        item.statusId === statusRegs.rejectedBeforeBid ||
        item.statusId === statusRegs.rejectedInBid ||
        item.statusId === statusRegs.rejectedBySystem
    );

    return disabled;
  }

  private disabledRestore(): boolean {
    let disabled = false;

    disabled = this.chooseRegs.some(
      (item) =>
        item.statusId === statusRegs.unactive ||
        item.statusId === statusRegs.active
    );

    return disabled;
  }

  public onOpenReject(): void {
    this.rejectPopup = true;
  }

  public clearRejectForm(): void {
    this.rejectForm.get('reason').patchValue(null);
    this.rejectReason = '';
  }

  public rejectTrader(): void {
    const registrationsArr = [];

    if (this.chooseRegs.length > 0) {
      this.chooseRegs.forEach((item) => {
        registrationsArr.push({
          idRegistration: item.idRegistration,
          deleteReason: this.rejectForm.get('reason')?.value,
        });
      });
    }

    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      registrations: registrationsArr,
    };

    this.registrationService
      .registrationAnnul(this.user?.token, body)
      .subscribe((res) => {
        this.rejectPopup = false;

        if (res) {
          this.resultPopup = true;
          this.resultPopupType = 'reject';
          this.resultPopupTitle =
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].regsTable.rejectTitle
              : EN['trading'].regsTable.rejectTitle;

          this.resultData = res.registrations;

          if (this.resultData?.length > 1) {
            this.resultData.forEach((el) => {
              if (el.isSuccessful == true) {
                this.succeedRes.push({ idRegistration: el.idRegistration });
              } else {
                this.unsucceedRes.push({
                  idRegistration: el.idRegistration,
                  message: el.warningMessage,
                });
              }
            });
          }
        }
      });
  }

  // выполнялась ли процедура допуска и получение его параметров если выполнялась
  public checkAdmissionProcessed(): void {
    this.accessService
      .isAdmissionProcessed(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId
      )
      .subscribe((res) => {
        if (res === true) {
          this.restorePopup = true;
          this.accessService
            .buceGetAdmissionOptions(
              this.user?.token,
              this.sessionIds.sectionId,
              this.sessionIds.sessionId
            )
            .subscribe((res) => {
              this.admissionOptions = res.admissionOptions[0];

              this.restoreForm
                .get('violationsControl')
                ?.patchValue(this.admissionOptions.isAdmissionControlViols);

              this.restoreForm
                .get('depositControl')
                ?.patchValue(this.admissionOptions.isAdmissionControlDeposit);
            });
        } else {
          this.restoreReg();
        }
      });
  }

  public restoreReg(): void {
    const registrationsArr = [];

    if (this.chooseRegs.length > 0) {
      this.chooseRegs.forEach((item) => {
        registrationsArr.push({
          idRegistration: item.idRegistration,
          isControlViolations: this.restoreForm.get('violationsControl')?.value,
          isControlDeposit: this.restoreForm.get('depositControl')?.value,
        });
      });
    }

    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      registrations: registrationsArr,
    };

    this.registrationService
      .registrationRestore(this.user?.token, body)
      .subscribe((res) => {
        this.restorePopup = false;

        if (res) {
          this.resultPopup = true;
          this.resultPopupType = 'restore';
          this.resultPopupTitle =
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].regsTable.restoreTitle
              : EN['trading'].regsTable.restoreTitle;

          this.resultData = res.registrations;

          if (this.resultData?.length > 1) {
            this.resultData.forEach((el) => {
              if (el.isSuccessful == true) {
                this.succeedRes.push({ idRegistration: el.idRegistration });
              } else {
                this.unsucceedRes.push({
                  idRegistration: el.idRegistration,
                  message: el.warningMessage,
                });
              }
            });
          }
        }
      });
  }

  public clearArr(): void {
    this.succeedRes = [];
    this.unsucceedRes = [];
  }

  public onViewDetail(type: string): void {
    const outputArray = [];

    if (type === 'reject') {
      this.chooseRegs.forEach((reg) => {
        this.unsucceedRes.forEach((fail) => {
          if (fail.idRegistration == reg.idRegistration) {
            outputArray.push(
              Object.assign(
                {
                  firmName: reg.firmName,
                  clientContractTypeName: reg.clientContractTypeName,
                  clientName: reg.clientName,
                  branchName: reg.branchName,
                  traderName: reg.traderName,
                  description: fail.message,
                },
                {}
              )
            );
          }
        });
      });
    }

    if (type === 'restore') {
      this.chooseRegs.forEach((reg) => {
        this.unsucceedRes.forEach((fail) => {
          if (fail.idRegistration == reg.idRegistration) {
            outputArray.push(
              Object.assign(
                {
                  firmName: reg.firmName,
                  clientContractTypeName: reg.clientContractTypeName,
                  clientName: reg.clientName,
                  branchName: reg.branchName,
                  traderName: reg.traderName,
                  description: fail.message,
                },
                {}
              )
            );
          }
        });
      });
    }

    let sessionsParam = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
    };

    sessionsParam = Object.assign(this.sessionInfo, sessionsParam);

    let title =
      type === 'restore'
        ? 'Результат восстановления регистраций'
        : 'Результат отклонения регистраций';

    const idAuctionType = this.store.idAuctionType();
    const auctionRootPath = getAuctionPath(idAuctionType);

    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        [`auctions/${auctionRootPath}/main-page/detailInfo`],
        {
          queryParams: {
            json: JSON.stringify(outputArray),
            session: JSON.stringify(sessionsParam),
            title: title,
          },
        }
      )
    );

    window.open(url, '_blank');
  }
}
