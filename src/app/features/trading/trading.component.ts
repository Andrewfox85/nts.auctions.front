import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  Renderer2,
  HostListener,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { User } from '@classes';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  SignalrService,
  TradingService,
  CommonService,
  AppConfigService,
  PopupSidebarService,
  ToastService,
  MessagesService,
  ArchieveService,
  AccessService,
  TransactionService,
  NavigationHistoryService,
  DataRefreshService,
} from '@services';
import { interval, Subscription } from 'rxjs';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  auctionType,
  DX_MODULES,
  IdSessionPeriods,
  sessionStage,
  statusSession
} from '@constants';
import { EnglishUpgradingAuctionStore } from '../../views/english-upgrading-auction/store/english-upgrading-auction-store';
import { map, switchMap, tap } from 'rxjs/operators';
import { ISessionLogin, ISessionState } from '../../views/homepage/interfaces';
import { getAuctionPath, getTranslateResultByCurrentLang } from '@helpers';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DepositComponent } from './pages/deposit/deposit.component';
import { PeriodsComponent } from './pages/periods/periods.component';
import { MessagesComponent } from './pages/messages/messages.component';
import { ChatTraderComponent } from './pages/messages/chat-trader/chat-trader.component';
import { OffersComponent } from './pages/offers/offers.component';
import { RegistrationsComponent } from './pages/registrations/registrations.component';
import { TradersComponent } from './pages/traders/traders.component';
import { AuctionsComponent } from './pages/auctions/auctions.component';
import { DealsComponent } from './pages/deals/deals.component';
import {
  FormatTimePipe,
  PriceFormatPipe,
  ExcelDatePipe,
  SubstringFromPipe,
} from '@pipes';
import { ItemClickEvent } from 'devextreme/ui/drop_down_button';
import { SelectionChangedEvent } from 'devextreme/ui/tab_panel';
import { INewTabData } from './interfaces';
import { isRegistrationNewTabType } from './enums';
import {
  LocalStorageService,
  SessionStorageService,
  TabActivationService,
} from '@shared-services';
import {
  WORKER_TAB_NAMES,
  NOT_WORKER_TAB_NAMES,
  DIRECT_SESSION_WORKER_TAB_NAMES,
  DIRECT_SESSION_NOT_WORKER_TAB_NAMES,
  ID_DIRECTION_TRADER_ROLE,
  WORKER_TAB_NAMES_WITHTOUT_TRADING,
  NOT_WORKER_TAB_NAMES_WITHOUT_TRADING,
  NOT_WORKER_TAB_NAMES_WITHOUT_TRADING_FOR_OFFERS,
  NOT_WORKER_TAB_NAMES_WITHOUT_TRADING_FOR_REGS,
  NOT_WORKER_TAB_NAMES_FOR_OFFERS,
  NOT_WORKER_TAB_NAMES_FOR_REGS
} from '@enums';
import { ApiStore, GlobalStore } from '@store';
import { IApiDataSection } from '@interfaces';

@Component({
  selector: 'app-trading',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
    PeriodsComponent,
    ChatTraderComponent,
    MessagesComponent,
    DealsComponent,
    DepositComponent,
    TradersComponent,
    RegistrationsComponent,
    OffersComponent,
    AuctionsComponent,
    RouterModule,
    PriceFormatPipe,
    ExcelDatePipe,
    FormatTimePipe,
    SubstringFromPipe,
  ],
  providers: [TabActivationService],
  templateUrl: './trading.component.html',
  styleUrls: ['./trading.component.scss'],
})
export class TradingComponent implements OnInit, OnDestroy {
  @ViewChild(MessagesComponent) messagesComponent: MessagesComponent;
  @ViewChild(ChatTraderComponent) chatTraderComponent: ChatTraderComponent;
  @ViewChild(OffersComponent) offersComponent: OffersComponent;
  @ViewChild(TradersComponent) tradersComponent: TradersComponent;
  @ViewChild(AuctionsComponent) auctionsComponent: AuctionsComponent;

  private readonly store = inject(EnglishUpgradingAuctionStore);
  private readonly messagesService = inject(MessagesService);
  private readonly router = inject(Router);
  private readonly tradingService = inject(TradingService);
  private readonly commonService = inject(CommonService);
  private readonly signalrService = inject(SignalrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cDRef = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);
  private readonly popupSidebarService = inject(PopupSidebarService);
  private readonly config = inject(AppConfigService);
  private readonly archieveService = inject(ArchieveService);
  private readonly accessService = inject(AccessService);
  private readonly translate = inject(TranslateService);
  private readonly transactionService = inject(TransactionService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly tabActivationService: TabActivationService = inject(TabActivationService);
  private readonly navigationHistoryService = inject(NavigationHistoryService);
  private readonly dataRefreshService = inject(DataRefreshService);
  private readonly globalStore = inject(GlobalStore);
  private readonly apiStore = inject(ApiStore);
  private readonly title = inject(Title);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  public readonly idDirectionTraderRole = ID_DIRECTION_TRADER_ROLE;

  private timerSubscription!: Subscription;

  public transferingMessage = false; //при переносе в архив для сообщения предупреждение
  public user: User;
  public sectionId;
  public sessionId: string;
  public isExistsViolations: boolean;
  public idDirectionRole: number | null = null;
  public sessionInfo;
  public warningMessage: string;
  public violationsPopup = false;
  public tabIndex: number;
  public workerPrivileges = false;
  public privilegesObserver = false;
  public messagesArray: any;
  public auctionType = auctionType;

  public otherAuctionsPopup = false;
  public sections: any;
  public sessions: any;
  public sessionsForDisplay: any;
  public isIntermediateTransfer = false;

  public form = this.formBuilder.group({
    section: [null, Validators.required],
    session: [null, Validators.required],
  });
  public countInboxUnanswered: number;

  public currentDateForDisplay: any;

  public isFromTradersRegs = false; //отправить в компоненту Регистрация если переход из вкладки Трейдеры
  public isFromTradersOffers = false; //отправить в компоненту Заявок если переход из вкладки Трейдеры
  public dataForFilterRegs: INewTabData; //отправить в компоненту для фильтрации трейдера
  public dataForFilterOffers: INewTabData; //отправить в компоненту для фильтрации трейдера

  public popupDropDown = false; //попап пр нажатии на кнопочку
  public popupDropDownTitle: string;

  public admissionForm = this.formBuilder.group({
    isAdmissionControlViols: [true],
    isAdmissionControlDeposit: [true],
    specialAdmissionProcedure: [false],
    radioButton: ['forAllApplicationsRegistrations'],
  });

  public isAdmissionFinished = false;
  public isCalcFeeFinished = false;
  public changeSessionState: Subscription;
  public messageNewPublic: Subscription;
  public messagesUpdateStatus: Subscription;
  public messagesNewPersonalMakler: Subscription;
  public messagesNewSystemByPeriodMakler: Subscription;
  public messagesNewPersonal: Subscription;
  public getMessagePublic: Subscription;
  public messagesNewSystemByPeriod: Subscription;
  public messagesReplyByMaklerForMaklers: Subscription;
  public messagesReplyByMaklerForTrader: Subscription;
  public messagesReplyByTraderForMaklers: Subscription;
  public demandsOffersUpdateStatus: Subscription;
  public demandsOffersTradingUpdateStatus: Subscription;
  public demandsOffersTradingExclude: Subscription;
  public changedTraderRole: Subscription;
  public demandsOffersTradingReinstate: Subscription;
  public demandsOffersEdit: Subscription;
  public demandsOffersBUCETraderLogin: Subscription;
  public editOffer: Subscription;
  public editDemand: Subscription;
  public targetedUpdateStatus: Subscription;
  public targetedExclude: Subscription;
  public selectedId: string;
  public publicselectedId: string;
  public submissionPopup = false;
  public submissionType: string;
  public disableTabs = false;
  public directTabs = false; // для отображения адресных вкладок
  public disableTransferBtn = false;
  public isTrading = false;
  public currentUrlFromService: string | null = null;
  public previousUrlFromService: string | null = null;
  public directSession = false;
  public isFromMessages = false;

  public readonly IdSessionPeriods = IdSessionPeriods;
  public readonly sessionStage = sessionStage;
  public readonly statusSession = statusSession;

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: Event) {
    this.cleanupBeforeClose();
  }

  get isTradingTabVisible(): boolean {
    if (this.directTabs) return false;

    const info = this.sessionInfo;

    if (!info || info.sessionStageId === sessionStage.applicationsSaleOpen)
      return false;

    if (info.idSessionPeriod !== IdSessionPeriods.pretrading) return true;

    if (
      (info.isPaused && info.datetimeRemaind != null) ||
      info.isActive ||
      info.isFinished
    ) {
      return true;
    }

    return false;
  }

  get isOffersTabVisible(): boolean {
    if (this.user?.IsWorker) {
      return true;
    } else {
      const isNullRole =
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.NULL_ROLE;
      const isSaleInSellerAuction =
        this.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.SALE;
      const isPurchaseInBuyerAuction =
        this.sessionInfo?.idAuctionType === auctionType.simpleBuyerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.PURCHASE;
      const isPurchaseSaleRole =
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.PURCHASE_SALE;

      return (
        isNullRole ||
        isSaleInSellerAuction ||
        isPurchaseInBuyerAuction ||
        isPurchaseSaleRole
      );
    }
  }

  get isRegsTabVisible(): boolean {
    if (this.user?.IsWorker) {
      return !this.directTabs;
    } else {
      const isNullRole =
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.NULL_ROLE;
      const isPurchaseInSellerAuction =
        this.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.PURCHASE;
      const isSaleInBuyerAuction =
        this.sessionInfo?.idAuctionType === auctionType.simpleBuyerAuction &&
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.SALE;
      const isPurchaseSaleRole =
        this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.PURCHASE_SALE;

      const isAllowedRoleForDirectTabs =
        isPurchaseInSellerAuction || isSaleInBuyerAuction || isPurchaseSaleRole;
      return isNullRole || (!this.directTabs && isAllowedRoleForDirectTabs);
    }
  }

  get isDealsTabVisible(): boolean {
    const isTraderNullRole =
      !this.user?.IsWorker &&
      this.idDirectionRole === ID_DIRECTION_TRADER_ROLE.NULL_ROLE;

    return !isTraderNullRole && !this.directTabs;
  }

  public ngOnInit(): void {
    window.addEventListener('pageshow', function (event) {
      // Проверяем, что страница загружена из кэша
      if (event.persisted) {
        window.location.reload();
      }
    });
    this.globalStore.restoreSessionInfo();
    this.navigationHistoryService.currentUrl$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((url) => {
        this.currentUrlFromService = url;
      });

    this.navigationHistoryService.previousUrl$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((url) => {
        this.previousUrlFromService = url;
      });

    this.popStateListener = () => {
      this.handleBrowserBack();
    };
    window.addEventListener('popstate', this.popStateListener);

    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.route.queryParams.subscribe((i) => {
      this.isExistsViolations = i['isExistsViolations'];
      this.idDirectionRole = Number(i['idDirection']) || null;
      this.globalStore.setIdDirectionRole(this.idDirectionRole);
      this.sessionId = i['idSession'];
      this.sectionId = i['idSection'];
      this.title.setTitle(`${this.sessionId}: ${getTranslateResultByCurrentLang(this.translate.store.currentLang, 'filters.bidding')}`);

      const faviconUrl = 'assets/img/icons/auctions.svg';

      let link: HTMLLinkElement =
        this.document.querySelector("link[rel='icon']");
      if (!link) {
        link = this.renderer.createElement('link');
        this.renderer.setAttribute(link, 'rel', 'icon');
        this.renderer.appendChild(this.document.head, link);
      }

      this.renderer.setAttribute(link, 'type', 'image/svg+xml');
      this.renderer.setAttribute(link, 'href', faviconUrl);
    });

    if (this.user?.IsWorker) {
      // привилегии для работника
      const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();

      let sectionDescription: string = sectionsArray.find(
        (el: IApiDataSection): boolean => Number(el.id) === Number(this.sectionId)
      )?.description;

      this.workerPrivileges = this.commonService.checkPrivileges(
        'TradingEditItem' + sectionDescription
      );

      this.privilegesObserver = this.commonService.checkPrivileges(
        'TradingGetList' + sectionDescription
      );

      //если и маклер и наблюдатель, то оставляем только маклера
      if (this.privilegesObserver && this.workerPrivileges) {
        this.privilegesObserver = false;
      }
    }

    this.getSessionState();

    if (this.isExistsViolations != null) {
      // isExistsViolations=true - orange,  isExistsViolations=false - blue
      let currentDate = new Date();
      let formatDate = currentDate.toLocaleString();

      this.currentDateForDisplay = {
        currentDate: formatDate,
      };
      this.violationsPopup = true;
    }

    this.setSelectedTab();

    this.cDRef.detectChanges();
  }

  private setSelectedTab(): void {
    const savedState = this.localStorageService.getSelectedTab();

    if (savedState && savedState?.idSession === Number(this.sessionId)) {
      this.tabIndex = savedState.tabIndex;
      this.selectedId = savedState.tabName;
      this.isFromMessages = savedState.isFromMessages;
    }
    else{
      this.localStorageService.removeSelectedTab()
    }
  }

  private signalrMethods(): void {
    /*------------------- Общие сокеты для работников (наблюдатель/ работник) и трейдеров ----------------- */
    // изменение состояния сессии
    this.changeSessionState = this.signalrService.changeSessionState.subscribe(
      (data: any) => {
        //слушаем данные из метода ChangeSessionState
        if (data.idSession == this.sessionId) {
          if (
            this.user?.IsWorker &&
            this.sessionInfo.sessionStageId == sessionStage.admissionComleted &&
            data.sessionState[0].sessionStageId == sessionStage.transferAuctionCompleted
          ) {
            //закончили выполнять допуск
            if (data.IsAdmissionFailed) {
              this.toastService.onShowToast({
                message: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.AdmissionNotSuccess'),
                type: 'error',
              });
            } else {
              this.toastService.onShowToast({
                message: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.AdmissionSuccess'),
                type: 'success',
              });
            }
          }
          if (data.isDataReloadNeeded) {
            // todo check to refactor with signals
            this.isAdmissionFinished = false;
            this.cdRef.detectChanges(); // принудительное обновление
            this.isAdmissionFinished = true;
            this.cdRef.detectChanges(); // еще раз после изменения
          }

          // если трейдер, то вызвать CheckWhetherLogged
          if (!this.user?.IsWorker) {
            const body = {
              idSection: this.sectionId,
              idSession: this.sessionId,
            };
            this.tradingService
              .checkWhetherLogged(this.user?.token, body)
              .subscribe((res) => {
                if (res.warningMessage != null) {
                  this.violationsPopup = true;
                  this.warningMessage = res.warningMessage;
                }
                if (!res.isLogged) {
                  this.warningMessage = res.warningMessage;
                  this.violationsPopup = true;
                  //this.router.navigate([`/`]);
                }
              });
          }

          // Если не поменялось состояние и период сессии, то не отправляем инфу на вкладку Настройки
          // todo this.sessionInfo.periodId == data.sessionState[0].periodId &&
          if (
            !(
              this.sessionInfo.isActive == data.sessionState[0].isActive &&
              this.sessionInfo.isFinished == data.sessionState[0].isFinished &&
              this.sessionInfo.isPaused == data.sessionState[0].isPaused
            )
          )
            this.tradingService.getDataFromSocket(data.sessionState[0]);
          //состояние не изменилось, но что-то поменялось (при подаче ставки, автоматически увеличился период)
          else this.tradingService.getDataFromSocket({ str: 'noChange' });

          this.sessionInfo = data.sessionState[0];

          //если язык пользователя английский - заменяем русские наименования английскими
          if(this.translate.store.currentLang === 'EN') {
            this.sessionInfo.sectionName = data.sessionState[0].sectionNameEn;
            this.sessionInfo.sessionName = data.sessionState[0].sessionNameEn;
            this.sessionInfo.sessionPeriod = data.sessionState[0].sessionPeriodEn;
            this.sessionInfo.sessionStageName = data.sessionState[0].sessionStageNameEn;
          }

          // ----реакция на промежуточный перенос в архив
          if (data.sessionState[0].sessionStageId == sessionStage.sessionEnded) {
            this.transferingMessage = true;
            this.violationsPopup = true;
          }
          if (
            data.sessionState[0].sessionStageId == sessionStage.transferAuctionCompleted &&
            data.sessionState[0].sessionStatusId == statusSession.inProcessArchived
          ) {
            // блокируем вкладки
            this.disableTabs = true;
          }
          if (
            data.sessionState[0].sessionStageId == sessionStage.transferAuctionCompleted &&
            data.sessionState[0].sessionStatusId == statusSession.bidding &&
            this.sessionInfo.datetimeEnd != null
          ) {
            //началась работа с адресной частью
            this.directTabs = true;
            this.disableTabs = false;
            if (this.offersComponent) {
              this.offersComponent.getDirectData();
            }
          }

          //таймер времени до завершения
          if (
            this.sessionInfo?.datetimeRemaind &&
            this.sessionInfo?.datetimeRemaind > 0
          ) {
            //если период запущен, то время до завершения тикает
            if (this.sessionInfo?.isActive) {
              let datetimeRemaind =
                new Date().getTime() / 1000 + this.sessionInfo.datetimeRemaind; //дата и время в секундах прибавляем до завершения в секундах (время в секундах в которое должен завершиться период)
              this.timerSubscription?.unsubscribe();
              this.timerSubscription = interval(1000).subscribe(() => {
                if (this.sessionInfo.datetimeRemaind != 0)
                  this.sessionInfo.datetimeRemaind = (
                    datetimeRemaind -
                    new Date().getTime() / 1000
                  ).toFixed(0);
                //предварительное время завершения отнимаем текущее время (все в секундах)
                else {
                  this.timerSubscription?.unsubscribe();
                  this.sessionInfo.isFinished = true;
                  this.sessionInfo.isActive = false;
                }
              });
            } else this.timerSubscription?.unsubscribe();
          } else this.timerSubscription?.unsubscribe();
        }
      }
    );

    /*------------------- Заявки ---------------*/
    this.demandsOffersUpdateStatus =
      this.signalrService.demandsOffersUpdateStatus.subscribe((data: any) => {
        if (this.offersComponent) {
          this.offersComponent.getUpdateDataSource(data);
        }
        if (this.tradersComponent && this.selectedId == 'traders') {
          this.tradersComponent.getUpdateDataSource(data);
        }
        /*  if(this.auctionsComponent && this.selectedId == 'trading'){
          this.auctionsComponent.getUpdateDataSource(data)
        }*/
      });

    //при подаче ставки на покупку/снятии лидирующей ставки
    this.demandsOffersTradingUpdateStatus =
      this.signalrService.demandsOffersTradingUpdateStatus.subscribe(
        (data: any) => {
          if (this.offersComponent) {
            this.offersComponent.getDemandsOffersTradingUpdateStatus(data);
          }
          if (this.auctionsComponent) {
            this.auctionsComponent.getDemandsOffersTradingUpdateStatus(data);
          }
        }
      );

    // Редактирование заявки на продажу вкладка заявки
    this.editOffer = this.signalrService.editOffer.subscribe((data: any) => {
      if (this.offersComponent) {
        this.offersComponent.getUpdateOffer(data);
      }
    });

    // Редактирование заявки на покупку вкладка заявки
    this.editDemand = this.signalrService.editDemand.subscribe((data: any) => {
      if (this.offersComponent) {
        this.offersComponent.getUpdateDemands(data);
      }
    });

    //отказ в фиксации, доперенос лотов
    this.demandsOffersEdit = this.signalrService.demandsOffersEdit.subscribe(
      (data: any) => {
        if (this.offersComponent) {
          this.offersComponent.getAddLots(data);
        }
      }
    );

    //Обновление статусов заявок при входе трейдеров в торги для работников
    if(this.user?.IsWorker) {
      this.demandsOffersBUCETraderLogin = this.signalrService.demandsOffersBUCETraderLogin.subscribe(
        (data: any) => {
          if (this.offersComponent) {
            this.offersComponent.updateOfferStatus(data);
          }
        }
      );
    }


    /*------------------- Адресные заявки ---------------*/
    this.targetedUpdateStatus =
      this.signalrService.targetedUpdateStatus.subscribe((data: any) => {
        if (this.offersComponent) {
          this.offersComponent.getUpdateDataSourceDirect(data);
        }
      });

    this.targetedExclude = this.signalrService.targetedExclude.subscribe(
      (data: any) => {
        if (this.offersComponent) {
          this.offersComponent.getOffersTargetedExclude(data);
        }
      }
    );

    /*------------------- Торги ---------------*/
    this.demandsOffersTradingReinstate =
      this.signalrService.demandsOffersTradingReinstate.subscribe(
        (data: any) => {
          if (this.auctionsComponent) {
            this.auctionsComponent.getDemandsOffersTradingReinstate(data);
          }
        }
      );

    this.demandsOffersTradingExclude =
      this.signalrService.demandsOffersTradingExclude.subscribe((data: any) => {
        if (this.auctionsComponent) {
          this.auctionsComponent.getDemandsOffersTradingExclude(data);
        }
      });

    this.changedTraderRole = this.signalrService.changedTraderRole
      .pipe(
        tap((data: any) => {
          if (this.idDirectionRole !== data.idDirection) {
            this.idDirectionRole = data.idDirection;
          }

          this.globalStore.setIdDirectionRole(this.idDirectionRole);

          if (!this.isTrading) {
            this.setUserTabForTraderWithoutTrading();
          }
        })
      )
      .subscribe();

    /*------------------- Сообщения ---------------*/
    if (this.user?.IsWorker) {
      this.messageSocketsWorker();
    } else this.messageSocketsTrader();
  }

  private messageSocketsWorker(): void {
    //получение сообщений для отображения индикатора нового соообщения
    if (this.privilegesObserver) {
      //наблюдатель
      this.messagesService
        .getListAsWorker(this.user?.token, this.sectionId, this.sessionId)
        .subscribe((res) => {
          this.messagesArray = res.messages;
          this.countInboxUnanswered = this.messagesArray.filter(
            (el) => el.idStatus != 2 && el.isInbox
          ).length;
        });
    } else if (this.workerPrivileges) {
      //работник
      this.messagesService
        .getListAsMakler(this.user?.token, this.sectionId, this.sessionId)
        .subscribe((res) => {
          this.messagesArray = res.messages;

          this.countInboxUnanswered = this.messagesArray.filter(
            (el) => el.idStatus != 2 && el.isInbox
          ).length;
        });
    }

    //подключение сокетов
    /*------------------- Cообщения ---------------*/
    this.messageNewPublic = this.signalrService.messageNewPublic.subscribe(
      (data: any) => {
        if (this.privilegesObserver) {
          //если наблюдатель
          if (this.messagesComponent) {
            //если уже был отрисован компонент сообщений, то отправляем в сообщения
            this.messagesComponent.getMessageAsWorker(data.idMessage);
          } else this.countInboxUnanswered = 1; //если не был отрисован компонент сообщений, то индикатор нового сообщения
        }
        if (this.workerPrivileges) {
          //если маклер
          if (this.messagesComponent) {
            //если уже был отрисован компонент сообщений, то отправляем в сообщения
            this.messagesComponent.getMessageAsMakler(data.idMessage);
          } else this.countInboxUnanswered = 1;
        }
      }
    );

    if (this.workerPrivileges) {
      // маклер
      this.messagesUpdateStatus =
        this.signalrService.messagesUpdateStatus.subscribe((data: any) => {
          if (this.messagesComponent) {
            this.messagesComponent.getMessageAsMakler(data.idMessage);
          } else this.countInboxUnanswered = 1;
        });
      this.messagesNewPersonalMakler =
        this.signalrService.messagesNewPersonalMakler.subscribe((data: any) => {
          if (this.messagesComponent) {
            this.messagesComponent.getMessageAsMakler(data.idMessage);
          } else this.countInboxUnanswered = 1;
        });
      this.messagesReplyByMaklerForMaklers =
        this.signalrService.messagesReplyByMaklerForMaklers.subscribe(
          (data: any) => {
            if (this.messagesComponent) {
              this.messagesComponent.getMessageAsMakler(data.idMessageNew);
            } else this.countInboxUnanswered = 1;
          }
        );
      this.messagesReplyByTraderForMaklers =
        this.signalrService.messagesReplyByTraderForMaklers.subscribe(
          (data: any) => {
            if (this.messagesComponent) {
              this.messagesComponent.getMessageAsMakler(data.idMessageNew);
            } else this.countInboxUnanswered = 1;
          }
        );
      this.messagesNewSystemByPeriodMakler =
        this.signalrService.messagesNewSystemByPeriodMakler.subscribe(
          (data: any) => {
            if (this.messagesComponent) {
              this.messagesComponent.getSystemMessageWorker(data);
            } else this.countInboxUnanswered = 1;
          }
        );
    }
  }

  private messageSocketsTrader(): void {
    if (!this.chatTraderComponent) {
      this.messagesService
        .getChatAsTraderPerson(this.user?.token, this.sectionId, this.sessionId)
        .subscribe((res) => {
          this.messagesArray = res.messages.reverse();

          const inboxMess = this.messagesArray.filter(
            (el) => el.isInbox
          ).length;

          const messageFromLocal = this.localStorageService.getMessages()
          const tempMessages = Number(messageFromLocal?.['sessionId']) === Number(this.sessionId) ?
          messageFromLocal?.['messNumber'] : 0;

          this.countInboxUnanswered = inboxMess - tempMessages;
        });
    }

    this.messagesNewPersonal =
      this.signalrService.messagesNewPersonal.subscribe((data: any) => {
        if (this.chatTraderComponent) {
          this.chatTraderComponent.onUpdateMessages(data.message);
        }
        this.countInboxUnanswered =
          this.selectedId === WORKER_TAB_NAMES.MESSAGES ? 0 : 1;
      });

    this.getMessagePublic = this.signalrService.getMessagePublic.subscribe(
      (data: any) => {
        if (this.chatTraderComponent) {
          this.chatTraderComponent.onUpdateMessages(data);
        }
        this.countInboxUnanswered =
          this.selectedId === WORKER_TAB_NAMES.MESSAGES ? 0 : 1;
      }
    );

    this.messagesReplyByMaklerForTrader =
      this.signalrService.messagesReplyByMaklerForTrader.subscribe(
        (data: any) => {
          if (this.chatTraderComponent) {
            this.chatTraderComponent.onUpdateMessages(
              Object.assign(data.message, { idParent: data.idMessageSource })
            );
          }
          this.countInboxUnanswered =
            this.selectedId === WORKER_TAB_NAMES.MESSAGES ? 0 : 1;
        }
      );

    this.messagesNewSystemByPeriod =
      this.signalrService.messagesNewSystemByPeriod.subscribe((data: any) => {
        if (this.chatTraderComponent) {
          data.messages.forEach((message: any) => {
            this.chatTraderComponent.onUpdateMessages(
              Object.assign(
                {
                  idSection: data.idSection,
                  idSession: data.idSession,
                  idTrader: data.idTrader,
                },
                message
              )
            );
          });
        }
        this.countInboxUnanswered =
          this.selectedId === WORKER_TAB_NAMES.MESSAGES ? 0 : 1;
      });
  }

  private getSessionState(): void {
    this.commonService
      .GetSessionState(this.user?.token, this.sectionId, this.sessionId)
      .subscribe((res: any) => {
        this.store.setIdAuctionType(res.sessionStates[0].idAuctionType);
        if (res.sessionStates != null && res.warningMessage == null) {
          this.sessionInfo = { ...this.sessionInfo, ...res.sessionStates[0] };

          /*     if (this.sessionInfo?.datetimeRemaind) {        //если период запущен, то время до завершения тикает
          if(this.sessionInfo?.isActive) {
            this.timerSubscription = interval(1000).subscribe(() => {
              if (this.sessionInfo.datetimeRemaind > 0)
                this.sessionInfo.datetimeRemaind--;
              else {
                this.timerSubscription?.unsubscribe()
                this.sessionInfo.isFinished = true
                this.sessionInfo.isActive = false
              }
            });
          }
          else this.timerSubscription?.unsubscribe()
        }*/

          //таймер времени до завершения
          if (
            this.sessionInfo?.datetimeRemaind &&
            this.sessionInfo?.datetimeRemaind > 0
          ) {
            //если период запущен, то время до завершения тикает
            if (this.sessionInfo?.isActive) {
              let datetimeRemaind =
                new Date().getTime() / 1000 + this.sessionInfo.datetimeRemaind; //дата и время в секундах прибавляем до завершения в секундах (время в секундах в которое должен завершиться период)
              this.timerSubscription?.unsubscribe();
              this.timerSubscription = interval(1000).subscribe(() => {
                if (this.sessionInfo.datetimeRemaind != 0)
                  this.sessionInfo.datetimeRemaind = (
                    datetimeRemaind -
                    new Date().getTime() / 1000
                  ).toFixed(0);
                //предварительное время завершения отнимаем текущее время (все в секундах)
                else {
                  this.timerSubscription?.unsubscribe();
                  this.sessionInfo.isFinished = true;
                  this.sessionInfo.isActive = false;
                }
              });
            } else this.timerSubscription?.unsubscribe();
          } else this.timerSubscription?.unsubscribe();
        }
        if (res.sessionStates == null && res.warningMessage == null) {
          this.router.navigate([`/`]);
        }
        if (res.sessionStates == null && res.warningMessage != null) {
          this.violationsPopup = true;
          this.warningMessage = res.warningMessage;
        }

        if (res.sessionStates != null) {
          if (this.signalrService.connectionIsEstablished === false) {
            //проверка на подключение к сокету
            this.signalrService
              .createConnection(this.sectionId, this.sessionId)
              .then(() => {
                //подключение к сокету
                // this.signalrService.hubConnection.on("ChangeSessionState", (data: any) => {       //подписка на метод
                this.signalrMethods();
              });
          } else this.signalrMethods();

          // контроль при входе на адресную сессию
          if (this.sessionInfo.sessionStageId == sessionStage.transferAuctionCompleted) {
            if (this.sessionInfo.sessionStatusId == statusSession.bidding) {
              //не пустая дата завершения сессии, работа с адресной частью
              this.directTabs =
                this.sessionInfo.datetimeEnd != null;
            }
            if (this.sessionInfo.sessionStatusId == statusSession.inProcessArchived) {
              //блокировка вкладок и кнопок переноса
              this.disableTabs = true;
              this.disableTransferBtn = true;
            }
            if (this.sessionInfo.sessionStatusId == statusSession.notArchived) {
              //блокировка вкладок
              this.disableTabs = true;
            }
          }

          this.checkForIsTrading();
          this.checkForDirectSession();
          this.setDefaultUserTab();
        }
      });
  }

  private setDefaultUserTab(): void {
    const isSettingActiveTabAvailable =
      !this.localStorageService.getSelectedTab() ||
      this.localStorageService.getSelectedTab()?.isFromMessages;

    if (isSettingActiveTabAvailable) {
      const isWorker = this.user.IsWorker;

      if (this.directSession) {
        if (isWorker) {
          if (this.isFromMessages) {
            this.tabIndex = this.getDirectSessionWorkerTabIndex(
              DIRECT_SESSION_WORKER_TAB_NAMES.MESSAGES
            );
            this.selectedId = DIRECT_SESSION_WORKER_TAB_NAMES.MESSAGES;
          } else {
            this.tabIndex = this.getDirectSessionWorkerTabIndex(
              DIRECT_SESSION_WORKER_TAB_NAMES.SETTINGS
            );
            this.selectedId = DIRECT_SESSION_WORKER_TAB_NAMES.SETTINGS;
          }
        } else {
          this.tabIndex = this.getDirectSessionNotWorkerTabIndex(
            DIRECT_SESSION_NOT_WORKER_TAB_NAMES.OFFERS
          );
          this.selectedId = DIRECT_SESSION_NOT_WORKER_TAB_NAMES.OFFERS;
        }
      } else {
        if (isWorker) {
          if (this.isTrading && this.isFromMessages) {
            this.selectedId = WORKER_TAB_NAMES.MESSAGES;
            this.tabIndex = this.getWorkerTabIndex(WORKER_TAB_NAMES.MESSAGES);
          } else if (this.isTrading && !this.isFromMessages) {
            this.selectedId = WORKER_TAB_NAMES.SETTINGS;
            this.tabIndex = this.getWorkerTabIndex(WORKER_TAB_NAMES.SETTINGS);
          } else if (!this.isTrading && this.isFromMessages) {
            this.selectedId = WORKER_TAB_NAMES.MESSAGES;
            this.tabIndex = this.getWorkerWithoutTradingTabIndex(
              WORKER_TAB_NAMES_WITHTOUT_TRADING.MESSAGES
            );
          } else {
            this.selectedId = WORKER_TAB_NAMES.SETTINGS;
            this.tabIndex = this.getWorkerWithoutTradingTabIndex(
              WORKER_TAB_NAMES_WITHTOUT_TRADING.SETTINGS
            );
          }
        } else {
          if (this.isTrading) {
            this.selectedId = NOT_WORKER_TAB_NAMES.TRADING;
            this.tabIndex = this.getNotWorkerTabIndex(
              NOT_WORKER_TAB_NAMES.TRADING
            );
          } else {
              this.setUserTabForTraderWithoutTrading();
          }
        }
      }
    }
  }

  private setUserTabForTraderWithoutTrading(): void {
    const roleToTab = {
      //для аукциона продавца: продавец приходит на заявки, покупатель - регистрации
      //для аукциона покупателя: продавец приходит на регистрации, покупатель - заявки
      [ID_DIRECTION_TRADER_ROLE.SALE]:
        this.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction
          ? NOT_WORKER_TAB_NAMES_WITHOUT_TRADING.OFFERS
          : NOT_WORKER_TAB_NAMES_WITHOUT_TRADING.REGISTRATION,

      [ID_DIRECTION_TRADER_ROLE.PURCHASE]:
        this.sessionInfo?.idAuctionType === auctionType.simpleSellerAuction
          ? NOT_WORKER_TAB_NAMES_WITHOUT_TRADING.REGISTRATION
          : NOT_WORKER_TAB_NAMES_WITHOUT_TRADING.OFFERS,

      [ID_DIRECTION_TRADER_ROLE.PURCHASE_SALE]:
        NOT_WORKER_TAB_NAMES_WITHOUT_TRADING.OFFERS,
      [ID_DIRECTION_TRADER_ROLE.NULL_ROLE]:
        NOT_WORKER_TAB_NAMES_WITHOUT_TRADING.OFFERS,
  };

    const tabName = roleToTab[this.idDirectionRole];

    if (tabName) {
      this.selectedId = tabName;
      this.tabIndex = this.getNotWorkerWithoutTradingTabIndex(tabName);
    }
  }

  private checkForIsTrading(): void {
    this.isTrading =
      this.sessionInfo?.sessionStageId != sessionStage.applicationsSaleOpen &&
      (this.sessionInfo.idSessionPeriod !== IdSessionPeriods.pretrading ||
        (this.sessionInfo?.idSessionPeriod === IdSessionPeriods.pretrading &&
          this.sessionInfo?.isPaused &&
          this.sessionInfo?.datetimeRemaind != null) ||
        (this.sessionInfo?.idSessionPeriod === IdSessionPeriods.pretrading &&
          (this.sessionInfo?.isActive || this.sessionInfo?.isFinished)));
  }

  private checkForDirectSession(): void {
    this.directSession =
      this.sessionInfo.isAllowedTargetedTransact &&
      this.sessionInfo.sessionStageId === sessionStage.transferAuctionCompleted &&
      this.sessionInfo.sessionStatusId === statusSession.bidding &&
      this.sessionInfo.datetimeEnd !== null;
  }

  public violationsPopupClose(): void {
    this.violationsPopup = false;

    if (this.warningMessage || this.transferingMessage) {
      this.router.navigate([`/`]);
    }
  }

  public getListSessions(): void {
    this.commonService
      .GetListSessions(this.user?.token)
      .subscribe((res: any) => {
        this.sessions = res.sessions;
        //формируем перечень секций анализируя сессии
        this.sections = this.sessions.map((s) => ({
          name: s.sectionName,
          id: s.sectionId,
        }));

        //удаляем повторы
        this.sections = [
          ...new Map(this.sections.map((item) => [item['id'], item])).values(),
        ];

        if (this.sections?.length == 1) {
          this.form.get('section').patchValue(this.sections[0].id);
        }
      });
  }

  public openOtherAuctions(): void {
    this.getListSessions();
    this.otherAuctionsPopup = true;
  }

  public goToOtherAuctions(sectionId: number, sessionId: number): void {
    this.commonService
      .SessionLogin(this.user?.token, sectionId, sessionId)
      .pipe(
        tap((res: ISessionLogin) => {
          this.tradingService.isExistsViolations = res.isExistsViolations;
          this.tradingService.idDirection = res.idDirection;
        }),
        switchMap(() =>
          this.commonService.GetSessionState(
            this.user?.token,
            sectionId,
            sessionId
          )
        ),
        map(
          (stateRes: ISessionState) => stateRes.sessionStates[0].idAuctionType
        ),
        tap((idAuctionType: number) => {
          this.globalStore.setMainSessionInfo({
            sectionId,
            sessionId,
            idAuctionType,
          });
          this.store.setIdAuctionType(idAuctionType);
        }),
        map((idAuctionType: number) => getAuctionPath(idAuctionType)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (auctionRootPath: string) => {
          const url = this.router.serializeUrl(
            this.router.createUrlTree(
              ['/auctions/', auctionRootPath, 'main-page'],
              {
                queryParams: {
                  isExistsViolations: this.tradingService.isExistsViolations,
                  idDirection: this.tradingService.idDirection,
                  idSection: sectionId,
                  idSession: sessionId,
                },
              }
            )
          );
          window.open(url, '_blank');
        },
        error: (error) => console.error('Error to get error state', error),
      });
  }

  public onChangeSection(e: any): void {
    this.sessionsForDisplay = this.sessions.filter((item) => {
      return item.sectionId == e.value && item.sessionId != this.sessionId;
    });
  }

  public sessionTemplateSelectBox(data): string {
    return data && '№' + data?.sessionId + ' ' + data?.sessionName;
  }

  public newTab(data: INewTabData): void {
    if (data) {
      const isTrading =
        this.sessionInfo?.sessionStageId != sessionStage.applicationsSaleOpen &&
        (this.sessionInfo.idSessionPeriod !== IdSessionPeriods.pretrading ||
          (this.sessionInfo?.idSessionPeriod === IdSessionPeriods.pretrading &&
            this.sessionInfo?.isPaused &&
            this.sessionInfo?.datetimeRemaind != null) ||
          (this.sessionInfo?.idSessionPeriod === IdSessionPeriods.pretrading &&
            (this.sessionInfo?.isActive || this.sessionInfo?.isFinished)));

      const isRegistartion: boolean = isRegistrationNewTabType(data.type);
      if(isRegistartion){
        this.isFromTradersRegs = true;
        this.dataForFilterRegs = data;
      }
      else {
        this.isFromTradersOffers = true;
        this.dataForFilterOffers = data;
      }

      if (isTrading) {
        this.tabIndex = isRegistartion
          ? 2
          : 1;
      } else {
        this.tabIndex = isRegistartion
          ? 1
          : 0;
      }
    }
  }

  public onSelectionChangedTab(e: SelectionChangedEvent): void {
    const selectedTabName = e.addedItems[0].id as
      | WORKER_TAB_NAMES
      | NOT_WORKER_TAB_NAMES;

    const selectedTabIndex = this.getTabIndexByName(selectedTabName);

    this.selectedId = selectedTabName;

    this.localStorageService.setSelectedTab({
      tabName: selectedTabName,
      tabIndex: selectedTabIndex,
      isFromMessages: false,
      idSession: Number(this.sessionId)
    });

    this.popupSidebarService.onClosePopupSideBar();

    if (!this.user?.IsWorker && this.selectedId === WORKER_TAB_NAMES.MESSAGES) {
      this.countInboxUnanswered = 0;
    }

    this.tabActivationService.notifyTabActivated();
  }

  private getTabIndexByName(
    tabName:
      | WORKER_TAB_NAMES
      | NOT_WORKER_TAB_NAMES
      | DIRECT_SESSION_WORKER_TAB_NAMES
      | DIRECT_SESSION_NOT_WORKER_TAB_NAMES
      | WORKER_TAB_NAMES_WITHTOUT_TRADING
      | NOT_WORKER_TAB_NAMES_WITHOUT_TRADING
  ): number {
    const user = this.localStorageService.getUser();
    const isWorker = 'IsWorker' in user && user?.IsWorker;

    if (this.directSession) {
      if (isWorker) {
        return this.getDirectSessionWorkerTabIndex(
          tabName as DIRECT_SESSION_WORKER_TAB_NAMES.SETTINGS
        );
      } else {
        return this.getDirectSessionNotWorkerTabIndex(
          tabName as DIRECT_SESSION_NOT_WORKER_TAB_NAMES.OFFERS
        );
      }
    } else {
      if (isWorker) {
        if (this.isTrading) {
          return this.getWorkerTabIndex(tabName as WORKER_TAB_NAMES.MESSAGES);
        } else {
          return this.getWorkerWithoutTradingTabIndex(
            tabName as WORKER_TAB_NAMES_WITHTOUT_TRADING.SETTINGS
          );
        }
      } else {
        if (this.isTrading) {
          return this.getNotWorkerTabIndex(
            tabName as NOT_WORKER_TAB_NAMES.TRADING
          );
        } else {
          return this.getNotWorkerWithoutTradingTabIndex(
            tabName as NOT_WORKER_TAB_NAMES_WITHOUT_TRADING.OFFERS
          );
        }
      }
    }
  }

  private getDirectSessionWorkerTabIndex(
    tabName: DIRECT_SESSION_WORKER_TAB_NAMES
  ): number {
    const tabValues = Object.values(DIRECT_SESSION_WORKER_TAB_NAMES);

    return tabValues.indexOf(tabName);
  }

  private getDirectSessionNotWorkerTabIndex(
    tabName: DIRECT_SESSION_NOT_WORKER_TAB_NAMES
  ): number {
    const tabValues = Object.values(DIRECT_SESSION_NOT_WORKER_TAB_NAMES);

    return tabValues.indexOf(tabName);
  }

  private getWorkerTabIndex(tabName: WORKER_TAB_NAMES): number {
    const tabValues = Object.values(WORKER_TAB_NAMES);

    return tabValues.indexOf(tabName);
  }

  private getWorkerWithoutTradingTabIndex(
    tabName: WORKER_TAB_NAMES_WITHTOUT_TRADING
  ): number {
    const tabValues = Object.values(WORKER_TAB_NAMES_WITHTOUT_TRADING);

    return tabValues.indexOf(tabName);
  }

  private getNotWorkerTabIndex(tabName: NOT_WORKER_TAB_NAMES): number {
    let tabValues: string[];

    if (this.isOffersTabVisible && !this.isRegsTabVisible) {
      tabValues = Object.values(NOT_WORKER_TAB_NAMES_FOR_OFFERS);
    }

    if (this.isRegsTabVisible && !this.isOffersTabVisible) {
      tabValues = Object.values(NOT_WORKER_TAB_NAMES_FOR_REGS);
    }

    if (this.isRegsTabVisible && this.isOffersTabVisible) {
      tabValues = Object.values(NOT_WORKER_TAB_NAMES);
    }

    return tabValues.indexOf(tabName);
  }

  private getNotWorkerWithoutTradingTabIndex(
    tabName: NOT_WORKER_TAB_NAMES_WITHOUT_TRADING
  ): number {

    let tabValues: string[];

    if (this.isOffersTabVisible && !this.isRegsTabVisible) {
      tabValues = Object.values(NOT_WORKER_TAB_NAMES_WITHOUT_TRADING_FOR_OFFERS);
    }

    if (this.isRegsTabVisible && !this.isOffersTabVisible) {
      tabValues = Object.values(NOT_WORKER_TAB_NAMES_WITHOUT_TRADING_FOR_REGS);
    }

    if (this.isRegsTabVisible && this.isOffersTabVisible) {
      tabValues = Object.values(NOT_WORKER_TAB_NAMES_WITHOUT_TRADING);
    }

    return tabValues.indexOf(tabName);
  }

  public onSubmissionPopup(): void {
    this.submissionPopup = false;
    this.submissionType = ' ';
  }

  public onChangeDropDown(e: ItemClickEvent): void {
    switch (e.itemData.id) {
      case 'admission': {
        //допуск
        //  this.toastService.onShowToast({message:'Процедура допуска не выполнена', type:'success'});

        if (this.sessionInfo.isAdmissionFinished) {
          this.accessService
            .buceGetAdmissionOptions(
              this.user?.token,
              this.sectionId,
              this.sessionId
            )
            .subscribe((res) => {
              this.admissionForm.controls.isAdmissionControlViols.patchValue(
                res.admissionOptions[0].isAdmissionControlViols
              );
              this.admissionForm.controls.isAdmissionControlDeposit.patchValue(
                res.admissionOptions[0].isAdmissionControlDeposit
              );
              this.admissionForm.controls.specialAdmissionProcedure.patchValue(
                res.admissionOptions[0].isAdmissionBySpecialRules
              );
            });
        }
        this.popupDropDown = true;
        this.popupDropDownTitle = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.admissionToExchangeTrading');
        break;
      }
      case 'calculator': {
        //пересчитать биржевой сбор
        const body = {
          idSection: Number(this.sectionId),
          idSession: Number(this.sessionId),
        };
        this.transactionService
          .tradingUpdateExchFee(this.user?.token, body)
          .subscribe(() => {
            this.toastService.onShowToast({
              message: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.calcExchangeFeeMess'),
              type: 'success',
            });
            this.isCalcFeeFinished = true;
          });
        break;
      }
      case 'endSession': {
        //завершить сессию/основные торги
        this.submissionPopup = true;
        this.submissionType = 'endSession';
        break;
      }
      case 'intermediatetransferToArchive': {
        //промежуточный перенос в архив
        this.submissionPopup = true;
        this.submissionType = 'intermediatetransfer';
        break;
      }
    }
  }

  public endSession(): void {
    const body = {
      //TRUE для "Завершить сессию" FALSE для "Завершить основные торги".
      idSection: Number(this.sectionId),
      idSession: Number(this.sessionId),
      isFinalCall:
        this.sessionInfo.idSessionPeriod !== IdSessionPeriods.direct &&
        this.sessionInfo.isAllowedTargetedTransact
          ? false
          : true,
    };

    this.archieveService
      .buceTransferStartMain(this.user?.token, body)
      .subscribe(() => {
        this.toastService.onShowToast({
          message: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.transferToArchiveResult'),
          type: 'success',
        });
        this.submissionPopup = false;
        if (body.isFinalCall == true) {
          this.router.navigate([`/`]);
        }
      });
  }

  public intermediateTransfer(): void {
    const body = {
      idSection: Number(this.sectionId),
      idSession: Number(this.sessionId),
    };

    this.archieveService
      .buceTransferStartTarget(this.user?.token, body)
      .subscribe(() => {
        this.toastService.onShowToast({
          message: getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.transferEndMess'),
          type: 'success',
        });
        this.submissionPopup = false;
        this.isIntermediateTransfer = false;
      });
  }

  public onStartAdmission(): void {
    this.popupDropDown = false;

    const body = {
      idSection: Number(this.sectionId),
      idSession: Number(this.sessionId),
      isControlViolations:
        this.admissionForm.controls.isAdmissionControlViols.value,
      isControlDeposit:
        this.admissionForm.controls.isAdmissionControlDeposit.value,
      isControlBySpecialRules:
        this.admissionForm.controls.specialAdmissionProcedure.value,
      isShortCycle: this.sessionInfo.isAdmissionFinished
        ? this.admissionForm.controls.radioButton.value ==
          'onRejectedApplicationsRegistrations'
        : null, //проверки только отклоненных заявок (при повторном запуске);
    };

    this.accessService
      .buceAdmissionStart(this.user?.token, body)
      .subscribe(() => {
        this.dataRefreshService.triggerRefresh();
      });
  }

  public goToPersonalPageIndex(): void {
    const str =
      `${this.config.ppRedirectUrl}` +
      '?jwt=' +
      this.user?.token +
      '&page=index&lang=' +
      this.translate.store.currentLang;

    window.location.href = str;
  }

  private popStateListener: () => void;

  private handleBrowserBack(): void {
    const previousUrl = this.navigationHistoryService.getPreviousUrl();
    const urlsToCheck = ['createDirectOffer', 'createAgriDirectOffer', 'createOffer']
    if (urlsToCheck.some(url => previousUrl?.includes(url))) {
      this.router.navigateByUrl('/ordermanagement/sessions-schedule');
    } else {
      this.router.navigateByUrl('/');
    }
  }

  public cleanupBeforeClose(): void {
    this.signalrService.offHubConnection();

    this.changeSessionState?.unsubscribe();
    this.messageNewPublic?.unsubscribe();
    this.getMessagePublic?.unsubscribe();
    this.messagesUpdateStatus?.unsubscribe();
    this.messagesReplyByTraderForMaklers?.unsubscribe();
    this.messagesNewPersonalMakler?.unsubscribe();
    this.messagesNewPersonal?.unsubscribe();
    this.messagesNewSystemByPeriodMakler?.unsubscribe();
    this.messagesNewSystemByPeriod?.unsubscribe();
    this.demandsOffersUpdateStatus?.unsubscribe();
    this.demandsOffersTradingUpdateStatus?.unsubscribe();
    this.demandsOffersTradingExclude?.unsubscribe();
    this.demandsOffersTradingReinstate?.unsubscribe();
    this.demandsOffersEdit?.unsubscribe();
    this.demandsOffersBUCETraderLogin?.unsubscribe();
    this.editOffer?.unsubscribe();
    this.editDemand?.unsubscribe();
    this.signalrService?.OnDisconnected();
    this.timerSubscription?.unsubscribe();
    this.targetedUpdateStatus?.unsubscribe();
    this.targetedExclude?.unsubscribe();
    this.changedTraderRole?.unsubscribe();
  }

  public cleanupSessionStorage(): void {
    this.sessionStorageService.clearSessionStorage();
  }

  public ngOnDestroy(): void {
    this.cleanupBeforeClose();
    this.cleanupSessionStorage();
    this.localStorageService.cleanLocalStorageFieldsAfterSessionExit();
  }
}
