import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  Signal
} from '@angular/core';
import { Subscription, interval, Subject } from 'rxjs';
import {
  LangChangeEvent,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { User } from '@classes';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import {
  AppConfigService,
  BuceService,
  CommonService,
  SharedStateManagerService,
  OrderManagementSignalRService,
} from '@services';
import { loadMessages, locale } from 'devextreme/localization';
import ruMessages from 'devextreme/localization/messages/ru.json';
import enMessages from 'devextreme/localization/messages/en.json';
import * as dxLocalizationCore from 'devextreme/common/core/localization';
import {
  registerLocaleData,
  DatePipe,
  NgTemplateOutlet,
} from '@angular/common';
import localeRu from '@angular/common/locales/ru-BY';
import localeEn from '@angular/common/locales/en-GB';
import { CookieService } from 'ngx-cookie-service';
import { DxDropDownButtonModule } from 'devextreme-angular/ui/drop-down-button';
import { RedisExchangeService, AuthService, GeneralService } from '@services';
import { LocalStorageService, SessionStorageService } from '@shared-services';
import { LANGUAGE } from '@enums';
import { PopupExportRequestListComponent } from './popups';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, takeUntil } from 'rxjs/operators';
import { LANGUAGE_ARRAY, RU_LANG, SECONDS_IN_DAY } from "./constants";
import { ApiStore } from '@store';
import { IApiDataSection } from '@interfaces';
import { ExcelDatePipe } from "@pipes";
import { formatTime} from "./helpers";

export type ButtonState = 'default' | 'success' | 'pending';
type MenuType = 'catalog' | 'sessions' | 'offers' | 'about' | null;
type SubMenuType = 'offersList' | 'archive' | 'sessionsNts' | null;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    DatePipe,
    TranslateModule,
    DxDropDownButtonModule,
    NgTemplateOutlet,
    RouterModule,
    ExcelDatePipe
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  private readonly redisExchangeService = inject(RedisExchangeService);
  private readonly authService = inject(AuthService);
  private readonly generalService = inject(GeneralService);
  private readonly buceService = inject(BuceService);
  private readonly cookieService = inject(CookieService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly config = inject(AppConfigService);
  private readonly commonService = inject(CommonService);
  private readonly socketService = inject(OrderManagementSignalRService);
  private readonly sharedStateExportservice = inject(SharedStateManagerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiStore = inject(ApiStore);
  readonly sections: Signal<Array<IApiDataSection>> = this.apiStore.sectionsList;

  userInfoDropdown = false;
  // условия для Ролей
  authorized: boolean;
  isTrader: boolean;
  user: User;
  language = LANGUAGE_ARRAY;
  selectLang: string;

  @ViewChild('account') account: ElementRef;
  @ViewChild('catalog') catalog: ElementRef;
  @ViewChild('session') session: ElementRef;
  @ViewChild('subsession') subsession: ElementRef;
  @ViewChild('offers') offers: ElementRef;
  @ViewChild('suboffers') suboffers: ElementRef;
  @ViewChild('subArchive') subArchive: ElementRef;
  @ViewChild('popupExportRequestListcontainer', { read: ViewContainerRef })
  container!: ViewContainerRef;
  @ViewChild('deafultIconExport', { static: false })
  deafultIconExport!: TemplateRef<ElementRef>;

  @ViewChild('pendingIconExport', { static: false })
  pendingIconExport!: TemplateRef<ElementRef>;

  @ViewChild('successIconExport', { static: false })
  successIconExport!: TemplateRef<ElementRef>;

  public iconExportStatus: Record<string, TemplateRef<ElementRef>>;
  public currentState: ButtonState = 'default';

  phonesActive: boolean;
  // часы
  time: any;
  locale: string;
  str: string;
  public today: Date = new Date();
  public formattedDate: string;
  public totalSeconds: number;
  public formattedTime: string;

  isVisibleSessions: boolean = false;
  isVisibleCatalog: boolean = false;
  isVisibleOffers: boolean = false;

  isVisibleSubOffers: boolean = false;
  isVisibleSubSessions: boolean = false;
  isVisibleSubArchive: boolean = false;

  public strLandingPage: string;
  public strSessionShedule: string;
  public strUnrealizedVolumes: string;
  public strReportDeals: string;
  public strReportTradingSessionOrders: string;
  public strReportBiddingProcess: string;
  public strSessions: string;
  public strSessionsTemplate: string;
  public strModels: string;
  public strRules: string;
  public strAuctions: string;
  public strCatalogueDemand: string;
  public strCatalogueOffer: string;

  public demandOfferManagementGetPrivilegus = false; // привилегия отображения рапсисания сессий
  public demandOfferManagementEditPrivilegus = false;
  public compositeSesManNewPrivilegus = false; // привилегия отображения Управ.сессиями (нтс)
  public compositeSesManPrivilegus = false; // привилегия отображения Управ.сессиями (старое)
  public demandOfferManagementModelsGetPrivilegus = false; // привилегия отображения конструктора моделей
  public demandOfferManagementModelsEditPrivilegus = false;
  public demandOfferManagementRulesGetPrivilegus = false; // привилегия отображения конструктора правил
  public demandOfferManagementRulesEditPrivilegus = false;
  public compositeAdmissionPrivilegus = false;

  private translateSub: Subscription;

  activeMenu: MenuType = null;
  activeSubMenu: SubMenuType = null;

  private destroy$ = new Subject<void>();

  constructor(
    public translate: TranslateService,
    private router: Router,
  ) {
    const savedLanguage: LANGUAGE = this.localStorageService.getLanguage();
    translate.use(savedLanguage);

    this.locale = savedLanguage;
    this.selectLang = this.language.find(
      (el: any) => el.value == this.locale,
    ).name;

    if (this.localStorageService.getLanguage() === null) {
      this.localStorageService.setLanguage(
        this.translate.defaultLang.toUpperCase() as LANGUAGE,
      );
    }

    this.cookieService.set('UasLang', this.locale.toUpperCase(), 24, '/');
    // don't forget to unsubscribe!
    this.translateSub = this.translate.onLangChange.subscribe(
      (langChangeEvent: LangChangeEvent) => {
        this.locale = langChangeEvent.lang;
        this.cookieService.set('UasLang', this.locale.toUpperCase(), 24, '/');
      },
    );

    //для перевода времени
    registerLocaleData(localeRu);
    registerLocaleData(localeEn);

    this.setServerTime();
    this.setLocaleLanguage(this.locale.toLowerCase());

    const cookieToken = this.cookieService.get('UasToken');

    this.user = this.localStorageService.getUser() as User;

    if (this.user.token !== cookieToken) {
      this.user.token = cookieToken;

      localStorage.setItem('user', JSON.stringify(this.user));
    }

    this.authorized = !!this.user.token;

    if (this.authorized) {
      this.redisExchangeService
        .getDataForFront(this.user.token)
        .subscribe((res) => {
          this.user.userInfo = {
            firmName: res.headerInfo.nameFirm,
            traderFullName: res.headerInfo.fio,
            traderPhone: res.headerInfo.traderPhone,
            traderRegNum: res.headerInfo.regNumberTrader,
            validTo: res.headerInfo.validTo,
            isResident: res.headerInfo.isResident
          };

          localStorage.setItem(
            'privileges',
            JSON.stringify(res.privileges.privilegesList),
          );
        });

      // todo не работает метод
      const UASLang = this.cookieService.get('UasLang');

      if (UASLang && this.locale != UASLang) {
        localStorage.setItem(
          'lang',
          JSON.stringify(UASLang.toString().toUpperCase()),
        );
        translate.use(UASLang.toString().toUpperCase());
        this.locale = UASLang.toString();
        this.selectLang = this.language.find(
          (el) => el.value == this.locale,
        ).name;
        this.setLocaleLanguage(this.locale.toLowerCase());
        parent.document.location.reload();
      }

      this.authService.hasWorkerRole(this.user.token).subscribe((res) => {
        this.user.IsWorker = res;
        this.userSetItem();
      });
    } else {
      this.user.IsWorker = false;
      this.userSetItem();
    }
  }

  public enableRussianMessages(): void {
    loadMessages(ruMessages);
    this.enableRuNumberBehavior();
    locale('ru');
    registerLocaleData(localeRu); //для перевода времени
  }

  public enableEnglishMessages(): void {
    loadMessages(enMessages);
    this.enableRuNumberBehavior();
    locale('en');
    registerLocaleData(localeEn); //для перевода времени
  }

  private enableRuNumberBehavior(): void {
    const numberLocalization = (dxLocalizationCore as any)?.number;

    // resetInjection сбрасывает intl настройки для number
    // переопределяем разделители
    numberLocalization?.resetInjection?.();
    numberLocalization?.inject?.({
      engine(): string {
        return 'base';
      },
      getThousandsSeparator(): string {
        return ' ';
      },
      getDecimalSeparator(): string {
        return ',';
      }
    });
  }

  public setLocaleLanguage(language: string): void {
    if (language === RU_LANG) {
      this.enableRussianMessages();
    } else {
      this.enableEnglishMessages();
    }
  }

  toggleMenu(menu: MenuType) {
    this.activeMenu = this.activeMenu === menu ? null : menu;
    this.activeSubMenu = null;
  }

  toggleSubMenu(menu: SubMenuType) {
    this.activeSubMenu = this.activeSubMenu === menu ? null : menu;
  }

  closeMenus() {
    this.activeMenu = null;
    this.activeSubMenu = null;
  }

  @HostListener('document:click')
  onOutsideClick() {
    this.closeMenus();
  }

  public ngOnInit(): void {
    // Закрывать меню при любой навигации
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Only close if a menu is actually open
        if (this.activeMenu !== null) {
          this.closeMenus();
        }
      });

    this.iconExportStatus = {
      default: this.deafultIconExport,
      pending: this.pendingIconExport,
      success: this.successIconExport,
    };

    this.sharedStateExportservice.buttonState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.currentState = state;
      });

    this.socketService.connect();

    this.socketService.filesExported$.subscribe((data) => {
      if (data) {
        this.sharedStateExportservice.updateState('success');
      }
    });

    this.strLandingPage = `${this.config.domain}/landingpage`;
    this.strSessionShedule = `${this.config.orderMan}/sessions-schedule`;
    this.strUnrealizedVolumes = `${this.config.orderMan}/unrealizedVolumes`;
    this.strReportDeals = `${this.config.orderMan}/report-deals`;
    this.strReportTradingSessionOrders = `${this.config.orderMan}/report-trading-session-orders`;
    this.strReportBiddingProcess = `${this.config.orderMan}/report-bidding-process`;
    this.strSessions = `${this.config.domain}${this.config.nts}/sessions/management#schedule`;
    this.strSessionsTemplate = `${this.config.domain}${this.config.nts}/sessions/management#templates`;
    this.strModels = `${this.config.domain}${this.config.nts}/demands/management#models`;
    this.strRules = `${this.config.domain}${this.config.nts}/demands/management#rules`;
    this.strAuctions = `${this.config.domain}auctions`;
    this.strCatalogueDemand = `${this.config.orderMan}/catalog?direction=1`;
    this.strCatalogueOffer = `${this.config.orderMan}/catalog?direction=2`;

    if (this.user?.IsWorker) {
      let DemandOfferManagementGetDesc = 'DemandOfferManagementGetList';
      this.demandOfferManagementGetPrivilegus =
        this.commonService.checkPrivileges(DemandOfferManagementGetDesc);
      let DemandOfferManagementEditDesc = 'DemandOfferManagementEditItem';
      this.demandOfferManagementEditPrivilegus =
        this.commonService.checkPrivileges(DemandOfferManagementEditDesc);
      let CompositeSesManNewDesc = 'CompositeSessionsManagementNew';

      this.compositeSesManNewPrivilegus = this.commonService.checkPrivileges(
        CompositeSesManNewDesc,
      );

      let CompositeSesManDesc = 'CompositeSessionsManagement';

      this.compositeSesManPrivilegus =
        this.commonService.checkPrivileges(CompositeSesManDesc);

      let DemandOfferManagementModelsGetDesc =
        'DemandOfferManagementModelsGetList';

      this.demandOfferManagementModelsGetPrivilegus =
        this.commonService.checkPrivileges(DemandOfferManagementModelsGetDesc);

      let DemandOfferManagementModelsEditDesc =
        'DemandOfferManagementModelsEditItem';

      this.demandOfferManagementModelsEditPrivilegus =
        this.commonService.checkPrivileges(DemandOfferManagementModelsEditDesc);

      let DemandOfferManagementRulesGetDesc =
        'DemandOfferManagementRulesGetList';

      this.demandOfferManagementRulesGetPrivilegus =
        this.commonService.checkPrivileges(DemandOfferManagementRulesGetDesc);

      let DemandOfferManagementRulesEditDesc =
        'DemandOfferManagementRulesEditItem';

      this.demandOfferManagementRulesEditPrivilegus =
        this.commonService.checkPrivileges(DemandOfferManagementRulesEditDesc);

      let CompositeAdmissionDesc = 'CompositeAdmission';

      this.compositeAdmissionPrivilegus = this.commonService.checkPrivileges(
        CompositeAdmissionDesc,
      );
    }
  }

  ngAfterViewInit(): void {
    this.iconExportStatus = {
      default: this.deafultIconExport,
      pending: this.pendingIconExport,
      success: this.successIconExport,
    };
  }

  public setServerTime(): void {
    this.generalService.getServerDatetime().subscribe((res: number) => {
      this.totalSeconds = Math.floor(res * SECONDS_IN_DAY);
      this.formattedTime = formatTime(this.totalSeconds);
    });

    const datePart: string = this.today.toLocaleDateString(this.locale, {
      timeZone: 'Europe/Minsk',
      day: 'numeric',
      month: 'long'
    });

    const weekdayPart: string = this.today.toLocaleDateString(this.locale, {
      timeZone: 'Europe/Minsk',
      weekday: 'short'
    });

    this.formattedDate = `${datePart}, ${weekdayPart}`;

    interval(1000)
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      if (this.totalSeconds > 0) {
        this.totalSeconds += 1;
        this.formattedTime = formatTime(this.totalSeconds);
      }
    });
  }

  private userSetItem(): void {
    localStorage.setItem('user', JSON.stringify(this.user));
    if (location.search.split('return').length > 1) {
      window.location.href = location.pathname;
      sessionStorage.clear();
    }
  }

  public showExportedList(event: Event): void {
    event.stopPropagation();
    this.container.clear();
    this.container.createComponent(PopupExportRequestListComponent);
    this.sharedStateExportservice.updateState('default');
  }

  public changeLang(e: any): void {
    this.selectLang = e.itemData.name;
    const lang = e.itemData.value;
    this.cookieService.set('UasLang', lang.toUpperCase(), 24, '/');
    this.translate.use(lang.toUpperCase());
    localStorage.setItem('lang', JSON.stringify(lang.toUpperCase()));

    sessionStorage.setItem('BUTBlang', JSON.stringify(lang.toUpperCase()));

    if (this.user?.token) {
      const body = {
        language: lang,
      };

      this.buceService
        .setPreferredLanguage(this.user?.token, body)
        .subscribe(() => {
          this.setLocaleLanguage(lang.toLowerCase());
          parent.document.location.reload();
        });
    } else {
      this.setLocaleLanguage(lang.toLowerCase());
      parent.document.location.reload();
    }
  }

  public goToMain(): void {
    window.location.href = this.strLandingPage;
  }

  getOfferManagementUrl(sectionId: number): string {
    return `${this.config.orderMan}offer-management?idSection=${sectionId}&type=current`;
  }

  get getPersonalPageIndexUrl(): string {
    return (
      this.config.ppRedirectUrl +
      '?jwt=' +
      this.user?.token +
      '&page=index&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  get getPersonalPageAdmissionUrl(): string {
    return (
      this.config.ppRedirectUrl +
      '?jwt=' +
      this.user?.token +
      '&page=admission&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  get personalPageSessionManageUrl(): string {
    return (
      this.config.ppRedirectUrl +
      '?jwt=' +
      this.user?.token +
      '&page=session&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  get personalPageCatalogueUrl(): string {
    return (
      this.config.ppRedirectUrl +
      '?jwt=' +
      this.user?.token +
      '&page=catalogue&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  get getPersonalPageNotifyingUrl(): string {
    return (
      this.config.ppRedirectUrl +
      '?jwt=' +
      this.user?.token +
      '&page=notification&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  public loginUAS(): void {
    if (!this.authorized) {
      const lang = this.cookieService.get('UasLang').toLowerCase();
      const returnurl = document.location.href.replace(/\//g, '%2F');
      const encodedReturnUrl = encodeURIComponent(returnurl);

      const str = `${this.config.uas_front}/ppts/false/${lang}/token;returnUrl=${encodedReturnUrl};errorUrl=null`;
      window.location.href = str;
    } else {
      this.userInfoDropdown = !this.userInfoDropdown;
    }
  }

  public logOut(): void {
    const token = this.user?.token;
    this.authorized = false;
    this.userInfoDropdown = false;

    this.redisExchangeService.logOut(token).subscribe(() => {
      this.cookieService.delete('UasToken', '/');
      this.cookieService.delete('UasMessage', '/');
      this.cookieService.delete('UasLang', '/');
      this.sessionStorageService.clearSessionStorage();
      this.localStorageService.cleanLocalStorageFieldsAfterLogOut();

      this.goToMain();
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.translateSub.unsubscribe();
  }

  protected readonly Number = Number;
}
