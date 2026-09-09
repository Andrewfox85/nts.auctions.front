import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  Renderer2,
} from '@angular/core';
import { DatePipe, CommonModule, DOCUMENT } from '@angular/common';
import { DxTabsModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { User } from '@classes';
import { AppConfigService, CommonService, TradingService } from '@services';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { combineLatest, of, Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap, startWith, catchError } from 'rxjs/operators';
import {
  ALL_SECTIONS_ID,
  EMPTY_STRING,
  HH_MM_FORMAT,
  INITIAL_FILTER_DATA,
  UTC_TIMEZONE_OFFSET,
} from './constants';
import {
  ISession,
  ISessions,
  Section,
  FilteredData,
  TabItemClickEvent,
  IDisplaySession,
  ISessionState,
  ISessionLogin,
} from './interfaces';
import {
  addAllSectionsOption,
  filterSessionsForDisplay,
  mapSessionToSection,
  uniqueSections,
  convertExcelSerialDateToMs,
} from './helpers';
import { getAuctionPath, getTranslateResultByCurrentLang } from '@helpers';
import { HomePageStore } from './store';
import { USER_ROLES } from './enums';
import { GlobalStore } from '@store';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  imports: [CommonModule, DxTabsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class HomepageComponent {
  private filterTabSubject = new BehaviorSubject<number>(0);

  private readonly cookieService = inject(CookieService);
  private readonly router = inject(Router);
  private readonly commonService = inject(CommonService);
  private readonly tradingService = inject(TradingService);
  private readonly datePipe = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(HomePageStore);
  private readonly globalStore = inject(GlobalStore);
  private readonly appConfigService = inject(AppConfigService);
  private readonly title = inject(Title);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);

  public readonly userRole = this.store.userRole;
  public readonly USER_ROLES = USER_ROLES;
  public user: User | null = null;
  public isExistsViolations: boolean = false;
  public idDirection: number | null = null;
  public filterTab$: Observable<number> = this.filterTabSubject.asObservable();

  public openPopup = false;

  public readonly userToken$: Observable<string> = of(
    localStorage.getItem('user') || '{}'
  ).pipe(
    map((userStr: string) => {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        return {};
      }
    }),
    tap((user: User) => {
      this.user = user;
      this.store.loadUserRole(user.token);
    }),
    map((user: User) => user.token ?? this.cookieService.get('UasToken')),
    catchError((err) => {
      console.error('Error getting user token:', err);
      return of('');
    })
  );

  public readonly allSessions$: Observable<ISession[]> = this.userToken$.pipe(
    switchMap((token) => {
      if (!token) {
        console.warn('No token available, skipping GetListSessions call.');
        return of([]);
      }
      return this.commonService.GetListSessions(token).pipe(
        map((result: ISessions) => result.sessions),
        catchError((error) => {
          console.error('Error fetching sessions:', error);
          return of([]);
        })
      );
    })
  );

  public readonly sections$: Observable<Section[]> = this.allSessions$.pipe(
    map((sessions) => sessions.map(mapSessionToSection)),
    map((sections) => uniqueSections(sections)),
    map((sections) => addAllSectionsOption(sections)),
    startWith([])
  );

  public readonly displayData$: Observable<FilteredData> = combineLatest([
    this.allSessions$,
    this.sections$,
    this.filterTab$,
  ]).pipe(
    map(([allSessions, sections, currentFilterTabIndex]) => {
      const selectedSectionId =
        sections[currentFilterTabIndex]?.id ?? ALL_SECTIONS_ID;

      const formatedSessions: IDisplaySession[] = allSessions.map(
        this.mapSessionToDisplay
      );

      const sessionsForDisplay = filterSessionsForDisplay(
        formatedSessions,
        selectedSectionId,
        ALL_SECTIONS_ID
      );

      return {
        sessionsForDisplay,
        sections,
        filterTab: currentFilterTabIndex,
      };
    }),
    startWith(INITIAL_FILTER_DATA)
  );

  constructor() {
    effect(() => {
      if (this.userRole() === USER_ROLES.NotAccredited) {
        const str = `${this.appConfigService.orderMan}/sessions-schedule`;
        window.location.href = str;
      }
    });
    this.title.setTitle(getTranslateResultByCurrentLang(this.translate.store.currentLang, 'filters.bidding'));

    const faviconUrl = 'assets/img/icons/auctions.svg';

    let link: HTMLLinkElement = this.document.querySelector("link[rel='icon']");
    if (!link) {
      link = this.renderer.createElement('link');
      this.renderer.setAttribute(link, 'rel', 'icon');
      this.renderer.appendChild(this.document.head, link);
    }

    this.renderer.setAttribute(link, 'type', 'image/svg+xml');
    this.renderer.setAttribute(link, 'href', faviconUrl);
  }

  public onChangeTab(e: TabItemClickEvent): void {
    this.filterTabSubject.next(e.itemIndex);
  }

  public sessionLogin(
    sessionKey: string,
    sectionId: number,
    sessionId: number
  ): void {
    this.commonService
      .SessionLogin(this.user?.token, sectionId, sessionId)
      .pipe(
        tap((res: ISessionLogin) => {
          this.tradingService.isExistsViolations = res.isExistsViolations;
          this.tradingService.idDirection = res.idDirection;
        }),
        switchMap(() =>
          this.commonService.GetSessionState(sessionKey, sectionId, sessionId)
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
          this.router.navigate([auctionRootPath, 'main-page'], {
            queryParams: {
              isExistsViolations: this.tradingService.isExistsViolations,
              idDirection: this.tradingService.idDirection,
              idSection: sectionId,
              idSession: sessionId,
            },
          });
        },
        error: (error) => console.error('Error to get error state', error),
      });
  }

  private mapSessionToDisplay = (session: ISession): IDisplaySession => {
    const timeInMs = convertExcelSerialDateToMs(session.sessionDatetime);
    const formattedTime =
      this.datePipe.transform(timeInMs, HH_MM_FORMAT, UTC_TIMEZONE_OFFSET) ||
      EMPTY_STRING;
    return { ...session, formattedTime };
  };
}
