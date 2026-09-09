import {
  Component,
  OnInit,
  ViewChild,
  SimpleChanges,
  inject,
  input,
  computed,
} from '@angular/core';
import {
  DxTooltipModule,
  DxRadioGroupModule,
  DxSwitchModule,
  DxDataGridModule,
  DxPopupModule,
  DxNumberBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { User, PageCache } from '@classes';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, catchError, concatMap, interval, of } from 'rxjs';
import { tap } from 'rxjs';
import { auctionType, listOptions } from '@constants';
import { DxToastComponent, DxTextBoxComponent } from 'devextreme-angular';
import { Router } from '@angular/router';
import {
  CommonService,
  TradingService,
  ToastService,
  PeriodsService,
  DemandService,
} from '@services';
import { DatePipe, NgStyle } from '@angular/common';
import { HomePageStore } from '@homepage-store';
import {
  getAuctionPath,
  padZero,
  formatSecondsToTime,
  formatStr,
  getTranslateResultByCurrentLang
} from '@helpers';
import { SessionInfo, SessionIds } from '../deposit/shared';
import { BuceGetListOptions } from './shared';
import { RowPreparedEvent } from 'devextreme/ui/data_grid';
import { ValueChangedEvent } from 'devextreme/ui/switch';
import { STATUS_SESSIONS } from '@enums';
import { PriceFormatPipe, FormatTimePipe, SubstringFromPipe } from '@pipes';
import { ExcelDatePipe } from '@pipes';
import {
  PeriodsAddPayload,
  PeriodsDeletePayoload,
  PeriodsStartPayoload,
  PeriodsEditPayload,
  PeriodsFinishPayload,
  PeriodsEditoAutoStartPayoload,
  PeriodsEditOptionPayload,
  PeriodsPausePayload,
  PeriodsExtendFinishedPayload,
  Permissions
} from '../../../../services/periods-service/shared';
import { IdSessionPeriods } from '@constants';
import { DxGridContextMenuLocalizationDirective } from '../../../../shared/directives';
import { DisableNumberBoxWheel } from "../../../../shared/directives/disable-number-box-wheel";

@Component({
  selector: 'app-periods',
  standalone: true,
  imports: [
    NgStyle,
    DatePipe,
    PriceFormatPipe,
    FormatTimePipe,
    ExcelDatePipe,
    SubstringFromPipe,
    DxTooltipModule,
    DxRadioGroupModule,
    DxSwitchModule,
    DxDataGridModule,
    DxPopupModule,
    DxNumberBoxModule,
    DxTextBoxModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DxGridContextMenuLocalizationDirective,
    DisableNumberBoxWheel
  ],
  templateUrl: './periods.component.html',
  styleUrls: ['./periods.component.scss'],
})
export class PeriodsComponent implements OnInit {
  private readonly store = inject(HomePageStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly tradingService = inject(TradingService);
  private readonly translate = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly commonService = inject(CommonService);
  private readonly periodsService = inject(PeriodsService);
  private readonly demandService = inject(DemandService);
  public readonly IdSessionPeriods = IdSessionPeriods;

  public sessionIds = input.required<SessionIds>();
  public sessionInfo = input.required<SessionInfo>();
  public tabIndex = input.required<string>();
  public isAdmissionFinished = input.required<boolean>();

  public isAddressSession = computed(() => {
    return (
      this.sessionInfo().isAllowedTargetedTransact &&
      this.sessionInfo().sessionStageId === STATUS_SESSIONS.ARCHIVE &&
      this.sessionInfo().sessionStatusId === STATUS_SESSIONS.BIDDING &&
      this.sessionInfo().datetimeEnd !== null
    );
  });

  @ViewChild('bidSubmission') textBoxBidTime: DxTextBoxComponent;
  //@ViewChild(DxScrollViewComponent, { static: false }) scrollView: DxScrollViewComponent;
  @ViewChild('toast') toast: DxToastComponent;

  public user: User;
  public cache = {} as PageCache;
  public periods: any; //все периоды;
  public availablePeriods; // периоды доступные для добавления
  public availableOptions: any; //настройки при добавлении периода
  public popup: boolean = false;
  public popupTitle: string;
  public popupType: string;
  public popupSubmission: boolean = false;
  public popupSubmissionTitle: string;
  public popupSubmissionMess: string;
  public popupSubmissionType: string;
  public periodNameForDisplay: any;
  public type = 'info';
  public message: string = ' ';
  public previousPeriodName: string = '';
  public valuePopup: any;
  public isTradingWithBuyersPurpose: boolean = false;
  public isTradingWithBuyersLimits: boolean = false;
  public isAnaloguesBySpecialRules: boolean = false; //особый порядок проведения первого периода торгов (сессия с аналогами)
  public newData: any;
  public timerSubscription: Subscription;
  public duration: number = 1;
  public priceStep: number;
  public time: string;
  public auctionType = auctionType;
  public finishRadioTransaction = 'withTransaction'; // значение радио кнопки при завершении периода
  public directSession: boolean;
  public idDemoffActivationMode; //в каком периоде можно активировать заявки
  public demoffactivationmode = [];
  public permissions: Permissions;

  public addingForm: FormGroup = this.formBuilder.group({
    periodId: [null, Validators.required],
    periodName: [null],
    duration: [null],
    priceStep: [0],
    priceDownPoints: [0],
    SubmissionTime: [null],
    timeDowngrade: [null],
    autostartPeriod: [false],
  });

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.getPeriodsSchedule();
    this.getAvailablePeriods();
    this.getByName();
    this.getPermissions();

    if (this.isAddressSession()) {
      this.directSession = true;
    } else {
      this.directSession = false;
      this.getBuceGetListOptions();
    }

    this.handleTriggerSubscription();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const conditionForSettings =
      changes['tabIndex'] && changes['tabIndex'].currentValue === 'setting';

    const conditionForIsAdmin =
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue &&
      this.tabIndex() == 'deposit';

    if (conditionForSettings || conditionForIsAdmin) {
      this.timerSubscription?.unsubscribe();
      this.getPeriodsSchedule();
      this.getAvailablePeriods();
    }
  }

  private handleTriggerSubscription(): void {
    this.newData = this.tradingService.trigger$.subscribe((res: any) => {
      //по сокету получили обновление и обновляем таблицу
      this.timerSubscription?.unsubscribe();

      if (!res.str) {
        let periodName: string = res.sessionPeriod;

        let tradingStarted: string = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.started'
        );
        let tradingCompleted: string = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.completed'
        );
        let tradingSuspended: string = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.suspended'
        );

        if (this.translate.store.currentLang === 'EN') {
          periodName = res.sessionPeriodEn;
        }

        if (res.isActive && this.previousPeriodName?.length === 0) {
          //период запущен
          this.message = `<b>${periodName}</b> ${tradingStarted}`;
        }

        if (res.isPaused) {
          //период на паузе
          this.message = `<b>${periodName}</b> ${tradingSuspended}`;
        }

        if (res.isFinished) {
          if (this.previousPeriodName?.length === 0)
            this.message = `<b>${periodName}</b> ${tradingCompleted}`;
        }

        if (this.previousPeriodName?.length > 0 && res.isActive) {
          this.message = `<b>${this.previousPeriodName}</b> ${tradingCompleted}. <b>${periodName}</b> ${tradingStarted}`;
          this.previousPeriodName = '';
        }

        this.onShowToast(this.message);
      }

      this.getBuceGetListOptions();
      this.getPeriodsSchedule();
      this.getAvailablePeriods();
    });
  }

  private getBuceGetListOptions(): void {
    this.tradingService
      .buceGetListOptions(
        this.user?.token,
        this.sessionIds().sectionId,
        this.sessionIds().sessionId
      )
      .pipe(
        tap((res: BuceGetListOptions) => {
          this.isTradingWithBuyersPurpose = res.isTradingWithBuyersPurpose;
          this.isTradingWithBuyersLimits = res.isTradingWithBuyersLimits;
          this.idDemoffActivationMode = res.idDemoffActivationMode.toString();
          this.isAnaloguesBySpecialRules = res.isAnaloguesBySpecialRules;
        })
      )
      .subscribe();
  }

  public onChangedActiveMode(): void {
    if (this.sessionInfo().idSessionPeriod === 1) {
      const body = {
        idSection: Number(this.sessionIds().sectionId),
        idSession: Number(this.sessionIds().sessionId),
        activeMode: this.idDemoffActivationMode,
      };

      this.demandService.buceOptSetActiveMode(this.user?.token, body);
    }
  }

  private getPeriodsSchedule(): void {
    const token = this.user?.token;

    if (token) {
      this.periodsService
        .getPeriodsSchedule(
          token,
          Number(this.sessionIds().sectionId),
          Number(this.sessionIds().sessionId)
        )
        .pipe(
          tap((res) => {
            this.periods = res.periodsSchedules;

            this.calculatePeriods();
          })
        )
        .subscribe();
    }
  }

  private calculatePeriods(): void {
    for (let i = 0; i < this.periods.length; i++) {
      //дизэблим свичер автостарта
      this.periods[i]?.periodId == 1 || this.periods[i - 1]?.isFinished
        ? (this.periods[i].disableAutoStart = true)
        : (this.periods[i].disableAutoStart = false);

      //дизэблим старт периода  todo доделать в металле
      (!this.periods[i]?.isTechnicalPeriod ||
        (this.periods[i]?.isTechnicalPeriod &&
          this.periods[i]?.periodId == 13)) &&
      (this.periods[i - 1]?.isFinished || this.periods[i]?.isPaused) &&
      !this.periods[i]?.isActive
        ? (this.periods[i].disableStart = false)
        : (this.periods[i].disableStart = true);

      //дизэблим приостановку периода
      (!this.periods[i]?.isTechnicalPeriod ||
        (this.periods[i]?.isTechnicalPeriod &&
          this.periods[i]?.periodId == 13)) &&
      this.periods[i]?.isActive
        ? (this.periods[i].disablePause = false)
        : (this.periods[i].disablePause = true);

      //дизэблим остановку периода
      /*this.periods[i]?.periodId == 1 &&*/ !this.periods[i]
        ?.isTechnicalPeriod &&
      (this.periods[i]?.isActive || this.periods[i]?.isPaused) &&
      this.periods[i]?.datetimeStart
        ? (this.periods[i].disableFinish = false)
        : (this.periods[i].disableFinish = true);

      //дизэблим переключение на след период
      !this.periods[i]?.isTechnicalPeriod &&
      this.periods[i]?.datetimeStart &&
      this.periods[i + 1] &&
      !this.periods[i + 1]?.isTechnicalPeriod
        ? (this.periods[i].disableNext = false)
        : (this.periods[i].disableNext = true);

      //добавляем имя след периода(для отображения при уведомлении) если доступна синяя кнопка
      if (this.periods[i].disableNext == false) {
        this.periods[i].nextPeriodName = this.periods[i + 1]?.periodName;
      }

      //отображение карандаша на продление периода (если текущий завершен а следующий не начат)
      !this.periods[i + 1]?.isActive &&
      !this.periods[i + 1]?.isPaused &&
      !this.periods[i + 1]?.isFinished &&
      this.periods[i]?.isFinished
        ? (this.periods[i].canExtendFinished = true)
        : (this.periods[i].canExtendFinished = false);

      if (
        this.periods[i]?.datetimeRemaind &&
        this.periods[i]?.datetimeRemaind > 0
      ) {
        //если преиод запущен, то время до завершения тикает
        if (this.periods[i]?.isActive) {
          let datetimeRemaind =
            new Date().getTime() / 1000 + this.periods[i].datetimeRemaind; //дата и время в секундах прибавляем до завершения в секундах (время в секундах в которое должен завершиться период)
          this.timerSubscription = interval(1000).subscribe(() => {
            if (this.periods[i].datetimeRemaind != 0)
              this.periods[i].datetimeRemaind = (
                datetimeRemaind -
                new Date().getTime() / 1000
              ).toFixed(0);
            //предварительное время завершения отнимаем текущее время (все в секундах)
            else {
              this.timerSubscription?.unsubscribe();
              this.getPeriodsSchedule();
            }
          });
        } else this.timerSubscription?.unsubscribe();
      }
    }
  }

  public onBuceOptSetBuyersLimits(): void {
    //включение/отключение контроля ограничений на покупку
    const body = {
      idSection: this.sessionIds().sectionId,
      idSession: this.sessionIds().sessionId,
      isActive: this.isTradingWithBuyersLimits,
    };

    this.tradingService
      .buceOptSetBuyersLimits(this.user?.token, body)
      .pipe(
        catchError((error: Error) => {
          console.error(error);

          this.isTradingWithBuyersLimits = !this.isTradingWithBuyersLimits;

          return of(null);
        })
      )
      .subscribe();
  }

  public onBuceOptSetBuyersPurps(): void {
    //включение/отключение режима "цель ограничения"
    const body = {
      idSection: this.sessionIds().sectionId,
      idSession: this.sessionIds().sessionId,
      isActive: this.isTradingWithBuyersPurpose,
    };

    this.tradingService
      .buceOptSetBuyersPurps(this.user?.token, body)
      .pipe(
        catchError((error: Error) => {
          this.isTradingWithBuyersPurpose = !this.isTradingWithBuyersPurpose;

          console.error(error);

          return of(null);
        })
      )
      .subscribe();
  }

  public onBuceOptSetAnalogRules(): void {
    //включение/отключение особого порядка проведения первого периода торгов
    const body = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      isActive: this.isAnaloguesBySpecialRules,
    };

    this.demandService
      .buceOptSetAnalogRules(this.user?.token, body)
      .pipe(
        catchError((error: Error) => {
          this.isAnaloguesBySpecialRules = !this.isAnaloguesBySpecialRules;

          console.error(error);

          return of(null);
        })
      )
      .subscribe();
  }

  public onRowPrepared(e: RowPreparedEvent): void {
    // дизэблим строку
    if (e.rowType === 'data') {
      if (e.key.isFinished) {
        e.rowElement.classList.add('disabledRow');
      }
    }
  }

  public startPeriod(periodName: string, data): void {
    //дизейблим кнопки, чтобы нельзя было нажать
    data.disableStart = true;
    data.disablePause = true;
    data.disableFinish = true;
    data.disableNext = true;

    const body: PeriodsStartPayoload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
    };

    this.periodStart(body);
  }

  private periodStart(body: PeriodsStartPayoload): void {
    this.periodsService
      .periodsStart(this.user?.token, body)
      .pipe(
        tap((res: any) => {
          if (!res) {
            /*
      this.isVisibleToast = true;
      this.type = 'info';
      this.message = `<b>${periodName}</b> ${
        this.translate.store.currentLang == 'RU'
          ? RU["trading"].started
          : EN["trading"].started
      }`;
      */
          }
        }),
        catchError((err) => {
          this.timerSubscription?.unsubscribe();
          this.getPeriodsSchedule();
          console.error(err);
          return of(null); // чтобы поток не прерывался
        })
      )
      .subscribe();
  }

  private pausePeriod(data: any): void {
    //дизейблим кнопки, чтобы нельзя было нажать
    data.disableStart = true;
    data.disablePause = true;
    data.disableFinish = true;
    data.disableNext = true;

    const body: PeriodsPausePayload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
    };

    this.periodsPause(body);
  }

  private periodsPause(body: PeriodsPausePayload): void {
    this.periodsService
      .periodsPause(this.user?.token, body)
      .pipe(
        tap((res) => {
          if (!res) {
            /*
          this.isVisibleToast = true;
          this.type = 'info';
          this.message = `<b>${data.periodName}</b> ${
            this.translate.store.currentLang == 'RU'
              ? RU["trading"].suspended
              : EN["trading"].suspended
          }`;
          */
            /*
          this.timerSubscription?.unsubscribe();
          this.getPeriodsSchedule();
          */
          }
        }),
        catchError((err: Error) => {
          this.timerSubscription?.unsubscribe();

          this.getPeriodsSchedule();

          console.error(err);

          return of(null);
        })
      )
      .subscribe();
  }

  private finishPeriod(data: any): void {
    //дизейблим кнопки, чтобы нельзя было нажать
    data.disableStart = true;
    data.disablePause = true;
    data.disableFinish = true;
    data.disableNext = true;

    const body: PeriodsFinishPayload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      isFixTransactions: [2, 4].includes(data.periodId)
        ? this.finishRadioTransaction == 'withTransaction'
        : null, //todo name
    };

    this.finishRadioTransaction = 'withTransaction';

    this.periodsService
      .periodsFinish(this.user?.token, body)
      .pipe(
        tap((res: any) => {
          if (!res) {
            /*
          this.isVisibleToast = true;
          this.type = 'info';
          this.message = `<b>${data.periodName}</b> ${
            this.translate.store.currentLang == 'RU'
              ? RU["trading"].completed
              : EN["trading"].completed
          }`;
          */
            /*
          this.timerSubscription?.unsubscribe();
          this.getPeriodsSchedule();
          */
          }
        }),
        catchError((err: Error) => {
          this.timerSubscription?.unsubscribe();

          this.getPeriodsSchedule();

          console.error(err);

          return of(null); // чтобы поток не прерывался
        })
      )
      .subscribe();
  }

  public nextPeriod(data: any): void {
    // дизейблим кнопки, чтобы нельзя было нажать
    data.disableStart = true;
    data.disablePause = true;
    data.disableFinish = true;
    data.disableNext = true;

    const bodyFinish: PeriodsFinishPayload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      isFixTransactions: [2, 4].includes(data.periodId)
        ? this.finishRadioTransaction === 'withTransaction'
        : null,
    };

    const bodyStart: PeriodsStartPayoload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
    };

    this.previousPeriodName = data.periodName;

    this.periodsService
      .periodsFinish(this.user?.token, bodyFinish)
      .pipe(
        concatMap((resFinish: any) => {
          if (!resFinish) {
            return this.periodsService.periodsStart(
              this.user?.token,
              bodyStart
            );
          } else {
            return of(null);
          }
        }),
        tap((resStart: any) => {
          if (resStart === null) {
            // periodsStart не запускался
            return;
          }

          if (!resStart) {
            /* this.isVisibleToast = true;
          this.type = 'info';
          this.message = `<b>${data.periodName}</b> ${
            this.translate.store.currentLang === 'RU'
              ? RU["trading"].completed
              : EN["trading"].completed
          }. <b>${data.nextPeriodName}</b> ${
            this.translate.store.currentLang === 'RU'
              ? RU["trading"].started
              : EN["trading"].started
          }`; */
            /* this.timerSubscription?.unsubscribe();
          this.getPeriodsSchedule(); */
          }
        }),
        catchError((err: Error) => {
          this.timerSubscription?.unsubscribe();

          this.getPeriodsSchedule();

          console.error(err);

          return of(null);
        })
      )
      .subscribe();
  }

  private deletePeriod(periodName: string): void {
    const body: PeriodsDeletePayoload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
    };

    this.periodsService
      .periodsDelete(this.user?.token, body)
      .pipe(
        catchError((error: Error) => {
          console.error(error);

          return of(null);
        })
      )
      .subscribe((res: any) => {
        if (!res) {
          this.type = 'info';

          this.message = `<b>${periodName}</b> ${getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.removed'
          )}`;

          this.onShowToast(this.message);
          this.timerSubscription?.unsubscribe();
          this.getPeriodsSchedule();
          this.getAvailablePeriods();
        }
      });
  }

  public submissionPopup(type: string, data): void {
    switch (type) {
      case 'pause': {
        this.submissionForPause(data);
        break;
      }
      case 'finish': {
        this.submissionForFinish(data);
        break;
      }
      case 'next': {
        this.submissionForNext(data);
        break;
      }
      case 'delete': {
        this.submissionForDelete(data);
        break;
      }
    }
  }

  private openSubmissionPopup(
    data: any,
    type: string,
    titleKey: string,
    messageKey: string
  ): void {
    this.popupSubmission = true;
    this.popupSubmissionTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      titleKey
    );
    this.popupSubmissionMess = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      messageKey
    );
    this.periodNameForDisplay = data;
    this.popupSubmissionType = type;
  }

  private submissionForPause(data: any): void {
    this.openSubmissionPopup(data, 'pause', 'trading.suspensionPeriod', 'trading.areYouSurePause');
  }

  private submissionForFinish(data: any): void {
    this.openSubmissionPopup(data, 'finish', 'trading.endPeriod', 'trading.areYouSureComplete');
  }

  private submissionForNext(data: any): void {
    this.openSubmissionPopup(data, 'next', 'trading.endPeriod', 'trading.areYouSureComplete');
  }

  private submissionForDelete(data: any): void {
    this.openSubmissionPopup(data, 'delete', 'trading.removingPeriod', 'trading.areYouSureDelete');
  }

  public onPopupSubmit(type: string, data: any): void {
    this.popupSubmission = false;

    switch (type) {
      case 'pause': {
        this.pausePeriod(data);
        break;
      }
      case 'finish': {
        this.finishPeriod(data);
        break;
      }
      case 'next': {
        this.nextPeriod(data);
        break;
      }
      case 'delete': {
        this.deletePeriod(data);
        break;
      }
    }
  }

  public onPopupRadioTransaction(): void {
    this.popupSubmission = false;
    this.finishRadioTransaction = 'withTransaction';
  }

  public openPopup(type: string, data?: any): void {
    switch (type) {
      case 'setting': {
        this.doSettingsLogic(data);

        break;
      }
      case 'adding': {
        this.doAddingLogic(data);

        break;
      }

      case 'duration': {
        this.doDurationLogic(data);

        break;
      }

      case 'extendFinished': {
        this.doExtendFinishedLogic(data);

        break;
      }

      case 'priceStep': {
        this.doPriceStepLogic(data);

        break;
      }

      case 'priceDownPoints': {
        this.doPriceDownPointsLogic(data);

        break;
      }

      case 'bidSubmissionTime': {
        this.doBidSubmissionTimeLogic(data);

        break;
      }

      case 'timeDowngrade': {
        this.doTimeDowngradeLogic(data);

        break;
      }
    }
  }

  private doSettingsLogic(data: any): void {
    this.availablePeriods = [data];
    this.addingForm.get('periodId')?.patchValue(data?.periodId);
    this.addingForm.get('periodName')?.patchValue(data?.periodName);
    this.addingForm
      .get('duration')
      ?.patchValue(formatSecondsToTime(data?.periodDuration));
    this.addingForm.get('priceStep')?.patchValue(data?.options.priceUpPoints); //шаг цены
    this.addingForm
      .get('priceDownPoints')
      ?.patchValue(data?.options.priceDownPoints); //шаг понижения
    data?.options.timeBid
      ? this.addingForm
          .get('SubmissionTime')
          ?.patchValue(formatSecondsToTime(data?.options.timeBid).substring(3))
      : null; //берем время подачи ставки/заявки в виде mm:ss
    data?.options.timeDemoff
      ? this.addingForm
          .get('SubmissionTime')
          ?.patchValue(
            formatSecondsToTime(data?.options.timeDemoff).substring(3)
          )
      : null; //берем время подачи заявки в виде mm:ss
    data?.options.timeDowngrade
      ? this.addingForm
          .get('timeDowngrade')
          ?.patchValue(
            formatSecondsToTime(data?.options.timeDowngrade).substring(3)
          )
      : null; //берем время понижения в виде mm:ss
    this.addingForm.get('autostartPeriod')?.patchValue(data?.isAutomaticStart);
    this.popupType = 'setting';
    this.popupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'trading.periods.periodSettings'
    );
    this.popup = true;
  }

  private doAddingLogic(data: any): void {
    this.periodsService
      .getAvailableOptions(
        this.user?.token,
        Number(this.sessionIds().sectionId),
        Number(this.sessionIds().sessionId),
        data
      )
      .subscribe((res) => {
        this.availableOptions = res.availableOptions;
        let period = this.availablePeriods.find((el) => el.periodId == data); //период, выбранный в радиобаттоне
        this.addingForm.get('periodId')?.patchValue(period.periodId);
        this.addingForm.get('periodName')?.patchValue(period?.periodName);
        this.addingForm
          .get('duration')
          ?.patchValue(formatSecondsToTime(period?.duration));
        let priceStep = this.availableOptions.find((el) => el.id == 1); //шаг цены
        let priceDownPoints = this.availableOptions.find((el) => el.id == 4); //шаг понижения
        this.addingForm
          .get('priceStep')
          ?.patchValue(priceStep ? priceStep.defaultValue : null);
        this.addingForm
          .get('priceDownPoints')
          ?.patchValue(priceDownPoints ? priceDownPoints.defaultValue : null);
        let SubmissionTime = this.availableOptions.find(
          (el) => el.id == 3 || el.id == 2
        ); //время подачи ставки или время подачи заявки
        this.addingForm
          .get('SubmissionTime')
          ?.patchValue(
            SubmissionTime
              ? formatSecondsToTime(SubmissionTime.defaultValue).substring(3)
              : null
          );
        let timeDowngrade = this.availableOptions.find((el) => el.id == 5); //время понижения
        this.addingForm
          .get('timeDowngrade')
          ?.patchValue(
            timeDowngrade
              ? formatSecondsToTime(timeDowngrade.defaultValue).substring(3)
              : null
          );
        this.addingForm.get('autostartPeriod')?.patchValue(false);
        this.popupType = 'adding';
        this.popupTitle = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.addingPriod'
        );
        this.popup = true;
      });
  }

  private doDurationLogic(data: any): void {
    this.duration = 1;
    this.valuePopup = data;
    this.popupType = 'duration';
    this.popupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'trading.changingDurationPeriod'
    );
    this.popup = true;
  }

  private doExtendFinishedLogic(data: any): void {
    this.duration = 1;
    this.valuePopup = data;
    this.popupType = 'extendFinished';
    this.popupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'trading.extendFinished'
    );
    this.popup = true;
  }

  private doPriceStepLogic(data: any): void {
    this.priceStep = data?.options?.priceUpPoints;
    this.popupType = 'priceStep';
    this.popupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'trading.changingPriceStep'
    );
    this.popup = true;
  }

  private doPriceDownPointsLogic(data: any): void {
    this.priceStep = data?.options?.priceDownPoints;
    this.popupType = 'priceDownPoints';
    this.popupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'trading.changingPriceDownStep'
    );
    this.popup = true;
  }

  private doBidSubmissionTimeLogic(data: any): void {
    this.time =
      this.sessionInfo().idAuctionType != auctionType.simpleBuyerAuction
        ? data?.options?.timeBid
          ? formatSecondsToTime(data?.options?.timeBid).substring(3)
          : null
        : data?.options?.timeDemoff
        ? formatSecondsToTime(data?.options?.timeDemoff).substring(3)
        : null;
    this.valuePopup = data;
    this.popupType = 'bidSubmissionTime';
    this.popupTitle =
      this.sessionInfo().idAuctionType != auctionType.simpleBuyerAuction
        ? getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.changingBidSubmissionTime'
          )
        : getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.changeApplicationSubmissionTime'
          );
    this.popup = true;
  }

  private doTimeDowngradeLogic(data: any): void {
    this.time = formatSecondsToTime(data?.options?.timeDowngrade).substring(3);
    this.valuePopup = data;
    this.popupType = 'timeDowngrade';
    this.popupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'trading.сhangeTimeLowering'
    );
    this.popup = true;
  }

  public isTechnicalPeriod(id: number): boolean {
    return this.availablePeriods.find((el) => el.periodId == id)
      .isTechnicalPeriod;
  }

  public getAvailablePeriods(str?: string): void {
    const token = this.user?.token;

    if (token) {
      this.periodsService
        .getAvailablePeriods(
          token,
          Number(this.sessionIds().sectionId),
          Number(this.sessionIds().sessionId)
        )
        .pipe(
          tap((res) => {
            this.availablePeriods = res.availablePeriods;

            if (str)
              //при добавлении периода, чтобы открывался попап
              this.openPopup('adding', this.availablePeriods[0].periodId);
          })
        )
        .subscribe();
    }
  }

  private getByName(): void {
    this.commonService
      .getByName(
        this.user?.token,
        'demoffactivationmode',
        this.sessionIds().sectionId
      )
      .pipe(
        tap((res: any) => {
          this.demoffactivationmode = res.refbooks.sort((a, b) => a.id - b.id);
        })
      )
      .subscribe();
  }

  public changeDuration(str?: string): void {
    //шаг изменения - 1мин
    let replace = this.addingForm.get('duration')?.value.replaceAll(':', '');
    let hours = replace.substring(0, 2) || '00';
    let minutes = replace.substring(2, 4) || '00';
    let seconds = replace.substring(4, 6) || '00';

    switch (str) {
      case 'decrease': {
        if (minutes == 1) {
          minutes = hours == 0 ? 1 : 59;
          hours = hours != 0 ? Number(hours) - 1 : 0;
        } else minutes = Number(minutes) - 1;
        break;
      }
      case 'increase': {
        if (minutes == 59) {
          minutes = 0;
          hours = Number(hours) + 1;
        } else minutes = Number(minutes) + 1;
        break;
      }
      default: {
        minutes =
          Number(minutes) > 59 || (Number(minutes) == 0 && Number(hours) == 0)
            ? 1
            : minutes; //минута мин значение 1 и если ввели больше 59 минут то, тоже 1
        seconds = Number(seconds) > 59 ? 0 : seconds;
      }
    }

    this.addingForm
      .get('duration')
      ?.patchValue(
        (hours.toString().length == 1 ? padZero(hours) : hours) +
          ':' +
          (minutes.toString().length == 1 ? padZero(minutes) : minutes) +
          ':' +
          (seconds.toString().length == 1 ? padZero(seconds) : seconds)
      );
  }

  public onKeyDown(e: any, formControlName: string, value?: any): void {
    if (
      e.event?.originalEvent.code === 'Delete' ||
      e.event?.originalEvent.code === 'Backspace'
    ) {
      this.addingForm.controls[formControlName]?.patchValue(
        e.value.replace(' ', 0)
      );
    }
    if (e.event) {
      if (formControlName == 'duration') {
        this.changeDuration();
      } else {
        this.changeBidSubmissionTime(value);
        if (formControlName == 'SubmissionTime') {
          this.textBoxBidTime?.instance.option('value', this.time);
        }
        //меньше либо равно значению параметра «Продолжительность периода»
        let duration =
            typeof value == 'object'
              ? formatStr(this.addingForm.get('duration').value)
              : this.valuePopup.periodDuration,
          bidTime =
            typeof value == 'object'
              ? formatStr('00:' + this.addingForm.get(formControlName).value)
              : formatStr('00:' + value);
        if (duration < bidTime) {
          // this.addingForm.get('bidSubmissionTime')?.patchValue(this.addingForm.get("duration").value.substring(3))
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          const secs = duration % 60;

          //return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`

          typeof value == 'object'
            ? value?.patchValue(
                `${padZero(
                  hours * 60 + minutes >= 100 ? 99 : hours * 60 + minutes
                )}:${padZero(secs)}`
              )
            : (this.time = `${padZero(
                hours * 60 + minutes >= 100 ? 99 : hours * 60 + minutes
              )}:${padZero(secs)}`);

          return;
        }
      }
    }
  }

  public changeBidSubmissionTime(value: any, str?: string): void {
    //шаг изменения - 30с
    //typeof value == 'object' означает, что мы нажали редактирование в строке, иначе вызвали просто редактирование время подачи ставки
    let replace =
      typeof value == 'object'
        ? value?.value.replaceAll(':', '')
        : value.replaceAll(':', '');
    let minutes = replace.substring(0, 2) || '00';
    let seconds = replace.substring(2, 4) || '00';

    switch (str) {
      case 'decrease': {
        if (seconds < 30) {
          seconds = minutes != 0 ? 30 + Number(seconds) : 30;
          minutes = minutes != 0 ? Number(minutes) - 1 : 0;
        } else seconds = Number(seconds) - 30;

        if (Number(minutes) == 0 && Number(seconds) < 30) seconds = 30;
        break;
      }
      case 'increase': {
        if (seconds >= 30) {
          seconds = minutes == 59 ? 59 : Number(seconds) - 30;
          minutes = minutes == 59 ? 59 : Number(minutes) + 1;
        } else seconds = Number(seconds) + 30;

        //меньше либо равно значению параметра «Продолжительность периода»
        let duration =
          typeof value == 'object'
            ? formatStr(this.addingForm.get('duration').value)
            : this.valuePopup.periodDuration;

        if (
          duration <
          formatStr(
            '00:' +
              (minutes.toString().length == 1 ? padZero(minutes) : minutes) +
              ':' +
              (seconds.toString().length == 1 ? padZero(seconds) : seconds)
          )
        ) {
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          const secs = duration % 60;

          typeof value == 'object'
            ? value?.patchValue(
                `${padZero(
                  hours * 60 + minutes >= 100 ? 99 : hours * 60 + minutes
                )}:${padZero(secs)}`
              )
            : (this.time = `${padZero(
                hours * 60 + minutes >= 100 ? 99 : hours * 60 + minutes
              )}:${padZero(secs)}`);
          return;
        }
        break;
      }
      default: {
        minutes = Number(minutes) > 59 ? 59 : minutes;
        seconds = Number(seconds) > 59 ? 0 : seconds;
        seconds = Number(minutes) == 0 && Number(seconds) < 30 ? 30 : seconds;

        //меньше либо равно значению параметра «Продолжительность периода»
        let duration =
          typeof value == 'object'
            ? formatStr(this.addingForm.get('duration').value)
            : this.valuePopup.periodDuration;

        if (
          duration <
          formatStr(
            '00:' +
              (minutes.toString().length == 1 ? padZero(minutes) : minutes) +
              ':' +
              (seconds.toString().length == 1 ? padZero(seconds) : seconds)
          )
        ) {
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          const secs = duration % 60;

          typeof value == 'object'
            ? value?.patchValue(
                `${padZero(
                  hours * 60 + minutes >= 100 ? 99 : hours * 60 + minutes
                )}:${padZero(secs)}`
              )
            : (this.time = `${padZero(
                hours * 60 + minutes >= 100 ? 99 : hours * 60 + minutes
              )}:${padZero(secs)}`);
          return;
        }
        break;
      }
    }
    let string =
      (minutes.toString().length == 1 ? padZero(minutes) : minutes) +
      ':' +
      (seconds.toString().length == 1 ? padZero(seconds) : seconds);
    typeof value == 'object' ? value?.patchValue(string) : (this.time = string);
  }

  public addPeriod(): void {
    let listTradingOptions = [];
    let listOptionValues = [];

    listTradingOptions = this.availableOptions.map((el) => el.id);
    listTradingOptions.forEach((el) => {
      el == listOptions.priseStep
        ? listOptionValues.push(
            Number(this.addingForm.get('priceStep')?.value.toFixed(2))
          )
        : null; //шаг цены
      el == listOptions.bidSubmissionTime ||
      el == listOptions.applicationSubmissionTime
        ? listOptionValues.push(
            formatStr('00:' + this.addingForm.get('SubmissionTime').value)
          )
        : null; //  время подачи ставки/заявки
      el == listOptions.priceDownPoints
        ? listOptionValues.push(
            Number(this.addingForm.get('priceDownPoints')?.value.toFixed(2))
          )
        : null; //  шаг понижения
      el == listOptions.timeDownPoints
        ? listOptionValues.push(
            formatStr('00:' + this.addingForm.get('timeDowngrade').value)
          )
        : null; //  время понижения
    });

    const body: PeriodsAddPayload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      idSessionPeriod: this.addingForm.get('periodId').value,
      isAutomaticStart: this.addingForm.get('autostartPeriod').value,
      periodDuration: formatStr(this.addingForm.get('duration').value),
      listTradingOptions:
        listTradingOptions.length > 0 ? listTradingOptions : null,
      listOptionValues: listOptionValues.length > 0 ? listOptionValues : null,
    };

    let periodName = this.availablePeriods.find(
      (el) => el.periodId == this.addingForm.get('periodId').value
    ).periodName;

    this.periodsAdd(body, periodName);
  }

  private periodsAdd(body: PeriodsAddPayload, periodName: string) {
    this.periodsService.periodsAdd(this.user?.token, body).subscribe(() => {
      this.popup = false;
      // this.isVisibleToast = true;
      this.type = 'success';
      this.message = `<b>${periodName}</b> ${getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'trading.added'
      )}`;
      this.onShowToast(this.message);
      this.timerSubscription?.unsubscribe();
      this.getPeriodsSchedule();
      this.getAvailablePeriods(); //посмотреть, есть ли еще доступные периоды
    });
  }

  public onPeriodsEdit(): void {
    let listTradingOptions = [];
    let listOptionValues = [];

    // listTradingOptions = this.availableOptions?.map(el => el.id)

    if (this.availablePeriods[0].options?.priceUpPoints) {
      listTradingOptions.push(listOptions.priseStep);
      listOptionValues.push(
        Number(this.addingForm.get('priceStep')?.value.toFixed(2))
      );
    }

    if (this.availablePeriods[0].options?.timeBid) {
      listTradingOptions.push(listOptions.bidSubmissionTime);
      listOptionValues.push(
        formatStr('00:' + this.addingForm.get('SubmissionTime').value)
      );
    }

    if (this.availablePeriods[0].options?.timeDemoff) {
      listTradingOptions.push(listOptions.applicationSubmissionTime);
      listOptionValues.push(
        formatStr('00:' + this.addingForm.get('SubmissionTime').value)
      );
    }

    if (this.availablePeriods[0].options?.priceDownPoints) {
      listTradingOptions.push(listOptions.priceDownPoints);
      listOptionValues.push(
        Number(this.addingForm.get('priceDownPoints')?.value.toFixed(2))
      );
    }

    if (this.availablePeriods[0].options?.timeDowngrade) {
      listTradingOptions.push(listOptions.timeDownPoints);
      listOptionValues.push(
        Number(formatStr('00:' + this.addingForm.get('timeDowngrade').value))
      );
    }

    /*  listTradingOptions?.forEach(el => {
      el == listOptions.priseStep ? listOptionValues.push(Number(this.addingForm.get('priceStep')?.value.toFixed(2))) : null; //шаг цены
      el == listOptions.bidSubmissionTime ? listOptionValues.push(formatStr('00:' + this.addingForm.get("bidSubmissionTime").value)) : null; //время подачи ставки
    })*/

    const body: PeriodsEditPayload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      idPeriodSchedule: this.availablePeriods[0].idPeriodSchedule,
      isAutomaticStart: this.addingForm.get('autostartPeriod')?.value,
      periodDuration: formatStr(this.addingForm.get('duration')?.value),
      listTradingOptions:
        listTradingOptions.length > 0 ? listTradingOptions : null,
      listOptionValues: listOptionValues.length > 0 ? listOptionValues : null,
    };

    this.periodsService
      .periodsEdit(this.user?.token, body)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      )
      .subscribe((res) => {
        if (!res) {
          this.popup = false;
          this.type = 'success';
          this.message = `<b>${
            this.availablePeriods[0].periodName
          }</b> ${getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'trading.changed'
          )}`;
          this.onShowToast(this.message, this.type);
          this.timerSubscription?.unsubscribe();
          // this.getPeriodsSchedule();
        }
      });
  }

  public onEditDuraction(): void {
    const body = {
      idSection: this.sessionIds().sectionId,
      idSession: this.sessionIds().sessionId,
      extraDuration: Number(this.duration) * 60, //время в секундах
    };

    this.periodsExtend(body);
  }

  private periodsExtend(body: any): void {
    this.periodsService
      .periodsExtend(this.user?.token, body)
      .pipe(
        tap((res: any) => {
          if (!res) {
            const periodExtendsStr: string = getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.periodsExtend'
            );
            const unit: string = getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.periodsUnit'
            );

            this.popup = false;
            this.type = 'success';
            this.message = `<div class="l-h16"><b>${this.valuePopup.periodName}</b>: </br>${periodExtendsStr} ${this.duration} ${unit}</div>`;

            this.onShowToast(this.message, this.type);
            this.timerSubscription?.unsubscribe();
          }
        }),
        catchError((error: Error) => {
          console.error(error);

          return of(null);
        })
      )
      .subscribe();
  }

  // todo сделать карандаш ярким
  public onExtendFinished(): void {
    const body: PeriodsExtendFinishedPayload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      extraDuration: Number(this.duration) * 60, // время в секундах
    };

    this.periodsExtendFinished(body);
  }

  private periodsExtendFinished(body: PeriodsExtendFinishedPayload) {
    this.periodsService
      .periodsExtendFinished(this.user?.token, body)
      .subscribe((res) => {
        if (!res) {
          this.popup = false;
          this.type = 'success';
          //  this.message = `<div class="l-h16"><b>${this.valuePopup.periodName}</b>: </br>${this.translate.store.currentLang == 'RU' ? (RU["trading"].periodsExtend + ' ' + this.duration + ' мин.') : EN["trading"].periodsExtend + ' ' + this.duration + ' min.'}</div>`
          //  this.toastService.onShowToast({message: this.message, type: this.type});
          this.timerSubscription?.unsubscribe();
        }
      });
  }

  public periodsEditOption(str: string): void {
    let idTradingOption, optionValue, toastMess;

    switch (str) {
      case 'priceStep': {
        idTradingOption = listOptions.priseStep;
        optionValue = this.priceStep;
        toastMess = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.priceStepChanged'
        );
        break;
      }

      case 'priceDownPoints': {
        idTradingOption = listOptions.priceDownPoints;
        optionValue = this.priceStep;
        toastMess = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.priceDownStepChanged'
        );
        break;
      }

      case 'bidSubmissionTime': {
        idTradingOption =
          this.sessionInfo().idAuctionType != auctionType.simpleBuyerAuction
            ? listOptions.bidSubmissionTime
            : listOptions.applicationSubmissionTime;
        optionValue = formatStr('00:' + this.time);

        toastMess =
          this.sessionInfo().idAuctionType != auctionType.simpleBuyerAuction
            ? getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.bidSubmissionTimeChanged'
              )
            : getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'trading.applicationSubmissionTimeChanged'
              );
        break;
      }

      case 'timeDowngrade': {
        idTradingOption = listOptions.timeDownPoints;
        optionValue = formatStr('00:' + this.time);
        toastMess = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'trading.сhangeTimeLowering'
        );
        break;
      }
    }

    const body: PeriodsEditOptionPayload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      idTradingOption: idTradingOption,
      optionValue: optionValue,
    };

    this.periodsEditOptionFromApi(body, toastMess);
  }

  private periodsEditOptionFromApi(
    body: PeriodsEditOptionPayload,
    toastMess: string
  ): void {
    this.periodsService
      .periodsEditOption(this.user?.token, body)
      .pipe(
        tap((res: any) => {
          if (!res) {
            this.popup = false;
            // this.isVisibleToast = true;
            this.type = 'success';
            this.message = toastMess;
            this.onShowToast(this.message, this.type);
            this.timerSubscription?.unsubscribe();
            // this.getPeriodsSchedule();
          }
        }),
        catchError((error: Error) => {
          console.error(error);

          return of(null);
        })
      )
      .subscribe();
  }

  public editAutoStart(e: ValueChangedEvent, data): void {
    data.disableAutoStart = true;

    const body: PeriodsEditoAutoStartPayoload = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      idPeriodSchedule: data.idPeriodSchedule,
      isAutomaticStart: e.value,
    };

    this.periodsEditAutoStart(e, body, data);
  }

  private periodsEditAutoStart(
    e: ValueChangedEvent,
    body: PeriodsEditoAutoStartPayoload,
    data: any
  ): void {
    this.periodsService
      .periodsEditAutoStart(this.user?.token, body)
      .pipe(
        tap((res: any) => {
          if (!res) {
            this.type = 'info';
            this.message = `${getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'trading.periods.autoStart'
            )}
            <b>${data.periodName}</b> ${
              e.value
                ? getTranslateResultByCurrentLang(
                    this.translate.store.currentLang,
                    'trading.periods.turnedOn'
                  )
                : getTranslateResultByCurrentLang(
                    this.translate.store.currentLang,
                    'trading.periods.turnedOff'
                  )
            }.`;

            this.onShowToast(this.message, this.type);
            this.timerSubscription?.unsubscribe();
            // this.getPeriodsSchedule();
          }
        }),
        catchError((error: Error) => {
          console.error(error);
          return of(null);
        })
      )
      .subscribe();
  }

  public clearPopup(): void {
    this.popup = false;
    this.popupType = '';
    this.addingForm.get('periodId').reset();
    this.addingForm.get('periodName').reset();
    this.addingForm.get('duration').reset();
    this.addingForm.get('priceStep').reset();
    this.addingForm.get('priceDownPoints').reset();
    this.addingForm.get('SubmissionTime').reset();
    this.addingForm.get('timeDowngrade').reset();
    this.addingForm.get('autostartPeriod').reset();
    this.valuePopup = null;
    this.duration = null;
    this.priceStep = null;
    this.time = null;
  }

  public openLimitations(): void {
    const idAuctionType = this.store.idAuctionType();
    const auctionRootPath = getAuctionPath(idAuctionType);
    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        [`auctions/${auctionRootPath}/main-page/limitations`],
        {
          queryParams: {
            idSection: this.sessionIds().sectionId,
            idSession: this.sessionIds().sessionId,
            sessionDate: this.sessionInfo()?.datetimeBegin,
            sessionName: this.sessionInfo()?.sessionName,
            sectionName: this.sessionInfo()?.sectionName,
          },
        }
      )
    );

    const fullUrl = `${window.location.origin}${url}`;

    window.open(fullUrl, '_blank');
  }

  public getPermissions(): void {
    const token = this.user?.token;
    if (token) {
      this.periodsService
        .getManageDetails(
          token,
          Number(this.sessionIds().sectionId),
          Number(this.sessionIds().sessionId)
        )
        .pipe(
          tap((res) => {
            this.permissions = res.permissions[0];
          })
        )
        .subscribe();
    }
  }

  public openPermissions(): void {
    this.cache = JSON.parse(sessionStorage.getItem('OFFER_MANAGEMENT')) || null;

    if (this.cache) {
      this.cache.filters.session = Number(this.sessionIds().sessionId);
      sessionStorage.setItem('OFFER_MANAGEMENT', JSON.stringify(this.cache));
    } else {
      sessionStorage.setItem(
        'permissions_sessionIds',
        JSON.stringify({
          sessionId: Number(this.sessionIds().sessionId),
          sectionId: Number(this.sessionIds().sectionId),
        })
      );
    }

    const url = this.router.serializeUrl(
      this.router.createUrlTree([`ordermanagement/open-access`])
    );
    window.open(url, '_blank');
  }

  public ngOnDestroy(): void {
    if (this.newData) {
      this.newData.unsubscribe();
    }
  }

  private onShowToast(message: string, type = 'success'): void {
    this.toastService.onShowToast({
      message: message,
      type: type,
    });
  }
}
