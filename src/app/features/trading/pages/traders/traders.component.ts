import { PageCache, User } from '@classes';
import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { CommonService, IDirection } from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import RU from '@ru-translate';
import EN from '@en-translate';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService, TraderService, IParticipant } from '@services';
import { DatePipe } from '@angular/common';
import {
  DxPopupModule,
  DxDataGridModule,
  DxCheckBoxModule,
  DxTextAreaModule,
  DxSelectBoxModule,
} from 'devextreme-angular';
import { IdDirection, numberEntriesPage, TRADERS_SESSION_STORAGE_KEY } from '@constants';
import { CheckActivationModeComponent } from '@components';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { HomePageStore } from '@homepage-store';
import { getAuctionPath, getGridInfoText } from '@helpers';
import {
  ContextMenuPreparingEvent,
  RowPreparedEvent,
} from 'devextreme/ui/data_grid';
import { ExcelDatePipe } from '@pipes';
import { INewTabData } from '../../interfaces';
import { NewTabType, EOfferStatusId, EOfferStatusName } from '../../enums';
import { SessionStorageService, LocalStorageService } from '@shared-services';
import { WORKER_TAB_NAMES } from '@enums';
import { DxGridContextMenuLocalizationDirective } from '@directives';
import { ApiStore } from '@store';
import { IApiDataSection } from '@interfaces';

@Component({
  selector: 'app-traders',
  standalone: true,
  imports: [
    TranslateModule,
    DxPopupModule,
    DxDataGridModule,
    DxCheckBoxModule,
    DxTextAreaModule,
    DxSelectBoxModule,
    CheckActivationModeComponent,
    FormsModule,
    ReactiveFormsModule,
    FiltersComponent,
    ExcelDatePipe,
    DatePipe,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './traders.component.html',
  styleUrls: ['./traders.component.scss'],
})
export class TradersComponent implements OnInit {
  private readonly store = inject(HomePageStore);
  private readonly traderService = inject(TraderService);
  private readonly translate = inject(TranslateService);
  private readonly commonService = inject(CommonService);
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly apiStore = inject(ApiStore);

  @Input() public sessionIds;
  @Input() public sessionInfo;
  @Input() public tabIndex: string;
  @Input() public isAdmissionFinished: boolean;

  @Output() public newTab = new EventEmitter<INewTabData>();

  public IdDirection: { buy: number, sale: number } = IdDirection;
  public NewTabType = NewTabType;

  public user: User;
  public cache = {} as PageCache;
  public currentTimeDate: Date;
  public participants: IParticipant[] = [];
  public filteredParticipants: IParticipant[] = [];
  public numberEntriesPage = numberEntriesPage;
  public privileges = false; //привилегия для замены и исключения трейдера

  public excludePopup = false;
  public excludeData: any;
  public excludeReason = '';
  public traderDirections: IDirection[];

  public excludeForm = this.formBuilder.group({
    directionBuy: [true, Validators.required],
    directionSale: [true, Validators.required],
    reason: [null, Validators.required],
  });

  public replacePopup = false;
  public replaceData: any;
  public traders: any = []; //трейдеры для замены
  public participant: any; //для формы замены
  public trader: any; //для формы замены
  public replaceForm = this.formBuilder.group({
    participant: [null, Validators.required],
    trader: [null, Validators.required],
    newTrader: [null, Validators.required],
  });

  public resultPopup = false;
  public resultPopupType: string; //замена либо исклбчение
  public resultType: string; //красное либо зеленое сообщения
  public resultPopupTitle = '';
  public resultData: any;

  public logFilterSelectedHidden = true;
  public logPreprocessingHidden = true;
  public logExecutionHidden = true;
  public popupIsActivatedTransferToBids = false;

  get infoText(): string {
    return getGridInfoText(this.translate.store.currentLang, this.participants?.length);
  }

  public ngOnInit(): void {
    this.cache = this.sessionStorageService.getItemFromSessionStorage(
      TRADERS_SESSION_STORAGE_KEY
    ) || {} as PageCache;
    this.user = this.localStorageService.getUser() as User;

    this.getData();

    const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();

    let sectionDescription: string = sectionsArray.find(
      (el: IApiDataSection): boolean => Number(el.id) === Number(this.sessionIds.sectionId)
    )?.description;

    sectionDescription = 'TradingEditItem' + sectionDescription;

    this.privileges = this.commonService.checkPrivileges(sectionDescription);
  }

  public ngOnChanges(changes: SimpleChanges) {
    const conditionForTradersTabIndex =
      changes['tabIndex'] &&
      changes['tabIndex'].currentValue === WORKER_TAB_NAMES.TRADERS;

    const conditionForisAdmissionFinished =
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue &&
      this.tabIndex === WORKER_TAB_NAMES.TRADERS;

    if (conditionForTradersTabIndex || conditionForisAdmissionFinished) {
      this.getData();
    }
  }

  public getData(): void {
    this.currentTimeDate = new Date();

    this.traderService
      .getListParticipants(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId
      )
      .subscribe((res) => {
        this.participants = res.participants;
        this.filteredParticipants = res.participants;

        if (this.cache.filters) {
          this.filterParticipants();
        }
      });
  }

  public getFilterData(e: any): void {
    this.cache.filters = e;

    this.sessionStorageService.setItemToSessionStorage(
      TRADERS_SESSION_STORAGE_KEY,
      this.cache
    );

    this.filterParticipants();
  }

  private filterParticipants(): void {
    this.filteredParticipants = this.participants.filter((p) => {
      const isTraderIn =
        this.cache.filters.tradersIn && !this.cache.filters.tradersOut
          ? p.loginDatetime === null
          : true;

      const isTraderOut =
        this.cache.filters.tradersOut && !this.cache.filters.tradersIn
          ? p.loginDatetime !== null
          : true;

      const directionBuy =
        this.cache.filters.directionBuy && !this.cache.filters.directionSale
          ? p.regsBuy.numberActivated > 0 ||
            p.demoffBuy.numberActivated > 0 ||
            p.regsBuy.numberInactive > 0 ||
            p.demoffBuy.numberInactive > 0 ||
            p.regsBuy.numberDeclined > 0 ||
            p.demoffBuy.numberDeclined > 0
          : true;

      const directionSale =
        this.cache.filters.directionSale && !this.cache.filters.directionBuy
          ? p.regsSale.numberActivated > 0 ||
            p.demoffSale.numberActivated > 0 ||
            p.regsSale.numberInactive > 0 ||
            p.demoffSale.numberInactive > 0 ||
            p.regsSale.numberDeclined > 0 ||
            p.demoffSale.numberDeclined > 0
          : true;

      const hasOffers =
        this.cache.filters.offers && !this.cache.filters.registrations
          ? p.demoffSale.numberActivated > 0 ||
            p.demoffBuy.numberActivated > 0 ||
            p.demoffSale.numberInactive > 0 ||
            p.demoffBuy.numberInactive > 0 ||
            p.demoffSale.numberDeclined > 0 ||
            p.demoffBuy.numberDeclined > 0
          : true;

      const hasRegistrations =
        this.cache.filters.registrations && !this.cache.filters.offers
          ? p.regsSale.numberActivated > 0 ||
            p.regsBuy.numberActivated > 0 ||
            p.regsSale.numberInactive > 0 ||
            p.regsBuy.numberInactive > 0 ||
            p.regsSale.numberDeclined > 0 ||
            p.regsBuy.numberDeclined > 0
          : true;

      const noStatusFilter =
        (this.cache.filters.activeStatus &&
          this.cache.filters.unactiveStatus) ||
        (this.cache.filters.activeStatus &&
          this.cache.filters.rejectedStatus) ||
        (this.cache.filters.unactiveStatus &&
          this.cache.filters.rejectedStatus) ||
        (this.cache.filters.activeStatus &&
          this.cache.filters.unactiveStatus &&
          this.cache.filters.rejectedStatus);

      const activeStatus =
        !this.cache.filters.activeStatus || noStatusFilter
          ? true
          : p.regsSale.numberActivated > 0 ||
            p.regsBuy.numberActivated > 0 ||
            p.demoffSale.numberActivated > 0 ||
            p.demoffBuy.numberActivated > 0;

      const unactiveStatus =
        !this.cache.filters.unactiveStatus || noStatusFilter
          ? true
          : p.regsSale.numberInactive > 0 ||
            p.regsBuy.numberInactive > 0 ||
            p.demoffSale.numberInactive > 0 ||
            p.demoffBuy.numberInactive > 0;

      const rejectedStatus =
        !this.cache.filters.rejectedStatus || noStatusFilter
          ? true
          : p.regsSale.numberDeclined > 0 ||
            p.regsBuy.numberDeclined > 0 ||
            p.demoffSale.numberDeclined > 0 ||
            p.demoffBuy.numberDeclined > 0;

      return (
        isTraderIn &&
        isTraderOut &&
        directionBuy &&
        directionSale &&
        hasOffers &&
        hasRegistrations &&
        activeStatus &&
        unactiveStatus &&
        rejectedStatus
      );
    });
  }

  public getUpdateDataSource(data): void {
    this.traderService
      .buceTraderGetNumbers(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        data.idTrader
      )
      .subscribe((res) => {
        let indexParticipants = this.participants.findIndex(
          (p) => p.traderId === data.idTrader
        );

        this.participants[indexParticipants].regsSale =
          res.traderNumbers[0].regsSale;
        this.participants[indexParticipants].regsBuy =
          res.traderNumbers[0].regsBuy;
        this.participants[indexParticipants].demoffSale =
          res.traderNumbers[0].demoffSale;
        this.participants[indexParticipants].demoffBuy =
          res.traderNumbers[0].demoffBuy;

        let indexFilteredParticipants = this.filteredParticipants.findIndex(
          (p) => p.traderId === data.idTrader
        );

        if (indexFilteredParticipants !== -1) {
          this.filteredParticipants[indexParticipants].regsSale =
            res.traderNumbers[0].regsSale;
          this.filteredParticipants[indexParticipants].regsBuy =
            res.traderNumbers[0].regsBuy;
          this.filteredParticipants[indexParticipants].demoffSale =
            res.traderNumbers[0].demoffSale;
          this.filteredParticipants[indexParticipants].demoffBuy =
            res.traderNumbers[0].demoffBuy;
        }

        let message =
          this.translate.store.currentLang === 'RU'
            ? RU['trading'].tradersTable.updatedInfoForTraders +
              ' ' +
              this.participants[indexParticipants].traderFullName
            : EN['trading'].tradersTable.updatedInfoForTraders +
              ' ' +
              this.participants[indexParticipants].traderFullName;

        this.toastService.onShowToast({ message: message, type: 'success' });
      });
  }

  public onRowPrepared(e: RowPreparedEvent): void {
    if (e.rowType !== 'data') {
      return;
    }

    if (
      e.key.regsSale.numberActivated == 0 &&
      e.key.regsBuy.numberActivated == 0 &&
      e.key.demoffSale.numberActivated == 0 &&
      e.key.demoffBuy.numberActivated == 0 &&
      e.key.regsSale.numberInactive == 0 &&
      e.key.regsBuy.numberInactive == 0 &&
      e.key.demoffSale.numberInactive == 0 &&
      e.key.demoffBuy.numberInactive == 0
    ) {
      e.rowElement.classList.add('disabledRow');
    }
  }

  public onContextMenuPreparing(e: ContextMenuPreparingEvent): void {
    if (e.row.rowType !== 'header') {
      if (!e.items) {
        e.items = [];
      }

      e.items.push(
        {
          icon: './assets/img/icons/replaceTrader.svg',
          text:
            this.translate.store.currentLang === 'RU'
              ? RU['trading'].tradersTable.replace
              : EN['trading'].tradersTable.replace,
          disabled: this.sessionInfo.sessionStageId != 7 || !this.privileges,
          onItemClick: () => {
            this.replaceData = e.row.data;
            this.checkActivationMode();
            //this.onOpenReplace(e.row.data)
          },
        },
        {
          icon: './assets/img/icons/excludeTrader.svg',
          text:
            this.translate.store.currentLang === 'RU'
              ? RU['trading'].tradersTable.exclude
              : EN['trading'].tradersTable.exclude,
          disabled: this.sessionInfo.sessionStageId != 7 || !this.privileges,
          onItemClick: () => {
            this.onOpenExclude(e.row.data);
          },
        }
      );
    }
  }

  private onOpenExclude(data): void {
    this.traderService
      .getTraderDirections(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        data.traderId
      )
      .subscribe((res) => {
        this.traderDirections = res.directions;
        this.excludeData = data;

        if (this.traderDirections?.length === 1) {
          this.traderDirections[0].id === 1
            ? this.excludeForm.get('directionBuy').patchValue(true)
            : this.excludeForm.get('directionSale').patchValue(true);

          this.traderDirections[0].id === 1
            ? this.excludeForm.get('directionSale').patchValue(false)
            : this.excludeForm.get('directionBuy').patchValue(false);
        }

        if (this.traderDirections?.length === 0) {
          this.resultPopup = true;
          this.resultPopupType = 'exclude';
          this.resultType = 'error';
          this.resultPopupTitle =
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].tradersTable.excludeTitle
              : EN['trading'].tradersTable.excludeTitle;
        } else {
          this.excludePopup = true;
        }
      });
  }

  public clearExcludeForm(): void {
    this.excludePopup = false;
    this.excludeForm.get('reason').patchValue(null);
    this.excludeReason = '';
  }

  //исключение трейдера
  public excludeTrader(): void {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      idTrader: this.excludeData.traderId,
      reasonText: this.excludeForm.get('reason').value,
      isCastBuyerOut: this.excludeForm.get('directionBuy').value,
      isCastSellerOut: this.excludeForm.get('directionSale').value,
    };

    this.traderService
      .traderCastOut(this.user?.token, body)
      .subscribe((res) => {
        this.clearExcludeForm();

        if (res) {
          this.resultPopup = true;
          this.resultPopupType = 'exclude';
          this.resultType = 'success';

          this.resultPopupTitle =
            this.translate.store.currentLang === 'RU'
              ? RU['trading'].tradersTable.excludeTitle
              : EN['trading'].tradersTable.excludeTitle;

          this.resultData = {
            offers: res.numberDeclinedDemoff,
            regs: res.numberDeclinedRegistr,
            traderFullName: this.excludeData.traderFullName,
            firmName: this.excludeData.firmName,
            activeOffers: res.numberActiveDemoff,
            activeRegs: res.numberActiveRegistr,
          };
        }
      });
  }

  public onOpenReplace(data): void {
    this.traderService
      .getListFirmTraders(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        data.firmId
      )
      .subscribe((res: any) => {
        this.traders = res.traders;
        //  this.replaceData = data;
        this.traders = this.traders.filter((t) => {
          //удаляем трейдера для которого выполняется операция
          return t.id != data.traderId;
        });

        if (this.traders?.length == 0) {
          this.resultPopup = true;
          this.resultPopupType = 'replace';
          this.resultType = 'error';
          this.resultPopupTitle =
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].tradersTable.replace
              : EN['trading'].tradersTable.replace;
        } else {
          this.participant = [
            {
              firmId: this.replaceData.firmId,
              firmName: this.replaceData.firmName,
            },
          ];

          this.trader = [
            {
              traderId: this.replaceData.traderId,
              traderFullName: this.replaceData.traderFullName,
            },
          ];

          this.replaceForm
            .get('participant')
            .patchValue(this.replaceData.firmId);
          this.replaceForm.get('trader').patchValue(this.replaceData.traderId);
          this.replacePopup = true;
        }
      });
  }

  public clearReplaceForm(): void {
    this.replacePopup = false;

    this.replaceForm.get('newTrader').patchValue(null);
  }

  //проверяет текущее состояние режима активации заявок в связке с торговым периодом
  private checkActivationMode(): void {
    if (
      !(
        Number(this.replaceData.demoffSale.numberInactive) === 0 &&
        Number(this.replaceData.demoffBuy.numberInactive) === 0
      )
    ) {
      this.commonService
        .CheckActivationMode(
          this.user?.token,
          this.sessionIds.sectionId,
          this.sessionIds.sessionId,
          Number(this.replaceData.demoffSale.numberInactive),
          Number(this.replaceData.demoffBuy.numberInactive)
        )
        .then((res: any) => {
          if (res.isCanBeActivated) {
            this.popupIsActivatedTransferToBids = true;
          } else {
            this.onOpenReplace(this.replaceData);
          }
        });
    } else {
      this.onOpenReplace(this.replaceData);
    }
  }

  //замена трейдера
  public replaceTrader(): void {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      idTraderFrom: this.replaceForm.get('trader').value,
      idTraderTo: this.replaceForm.get('newTrader').value.id,
    };

    this.traderService
      .traderChangeOwner(this.user?.token, body)
      .subscribe((res) => {
        if (res) {
          this.resultData = {
            totalOffersBuy: res.numberDemoffTotalBuy,
            transfOffersBuy: res.numberDemoffTransfBuy,
            totalOffersSell: res.numberDemoffTotalSell,
            transfOffersSell: res.numberDemoffTransfSell,
            totalRegsBuy: res.numberRegsTotalBuy,
            transfRegsBuy: res.numberRegsTransfBuy,
            totalRegsSell: res.numberRegsTotalSell,
            transfRegsSell: res.numberRegsTransfSell,
            logFilterSelected: res.logFilterSelected,
            logPreprocessing: res.logPreprocessing,
            logExecution: res.logExecution,
            traderFullName: this.replaceData.traderFullName,
            firmName: this.replaceData.firmName,
            newTraderFullName: this.replaceForm.get('newTrader').value.name,
          };

          this.clearReplaceForm();
          this.resultPopup = true;
          this.resultPopupType = 'replace';
          this.resultPopupTitle =
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].tradersTable.replaceTitle
              : EN['trading'].tradersTable.replaceTitle;

          if (
            res.logFilterSelected?.length == 0 &&
            res.logPreprocessing?.length == 0 &&
            res.logExecution?.length == 0
          ) {
            this.resultType = 'success';
          } else {
            this.resultType = 'logs-error';
          }
        }
      });
  }

  public goToTheChat(e): void {
    const idAuctionType = this.store.idAuctionType();
    const auctionRootPath = getAuctionPath(idAuctionType);
    const url = this.router.serializeUrl(
      this.router.createUrlTree([
        `auctions/${auctionRootPath}/main-page/chat/${this.sessionIds.sectionId}/${this.sessionIds.sessionId}/${e.traderId}`,
      ])
    );
    window.open(url, '_blank');
  }

  public print(): void {
    window.print();
  }

  public goToNewTab(data: INewTabData, type: NewTabType, direction?: number): void {
    const payload: INewTabData = { ...data, type };

    if (direction != null) {
      payload.direction = direction;
    }

    switch (type) {
      case NewTabType.REGS_ACTIVE: {
        payload.status = EOfferStatusName.ACTIVE;
        this.newTab.emit(payload);
        break;
      }

      case NewTabType.REGS_INACTIVE: {
        payload.status = EOfferStatusName.INACTIVE;
        this.newTab.emit(payload);
        break;
      }

      case NewTabType.REGS_DECLINED: {
        payload.status = EOfferStatusName.DECLINED;
        this.newTab.emit(payload);
        break;
      }

      case NewTabType.OFFERS_SALE_ACTIVE: {
        payload.direction = IdDirection.sale;
        payload.status = EOfferStatusId.ACTIVE;
        this.newTab.emit(payload);
        break;
      }

      case NewTabType.OFFERS_SALE_INACTIVE: {
        payload.direction = IdDirection.sale;
        payload.status = EOfferStatusId.INACTIVE;
        this.newTab.emit(payload);
        break;
      }

      case NewTabType.OFFERS_SALE_DECLINED: {
        payload.direction = IdDirection.sale;
        payload.status = EOfferStatusId.DECLINED;
        this.newTab.emit(payload);
        break;
      }

      case NewTabType.OFFERS_BUY_ACTIVE: {
        payload.direction = IdDirection.buy;
        payload.status = EOfferStatusId.ACTIVE;
        this.newTab.emit(payload);
        break;
      }

      case NewTabType.OFFERS_BUY_INACTIVE: {
        payload.direction = IdDirection.buy;
        payload.status = EOfferStatusId.INACTIVE;
        this.newTab.emit(payload);
        break;
      }

      case NewTabType.OFFERS_BUY_DECLINED: {
        payload.direction = IdDirection.buy;
        payload.status = EOfferStatusId.DECLINED;
        this.newTab.emit(payload);
        break;
      }
    }
  }
}
