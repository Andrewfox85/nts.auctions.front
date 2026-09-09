import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  DxListModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxDataGridModule,
} from 'devextreme-angular';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import {
  searchIcon,
  numberEntriesPage,
  WORKER_MESSAGES_FILTERS,
  WORKER_SEARCH_FILTERS,
  WORKER_SELECTED_MESSAGES_FILTERS,
} from '@constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import RU from '@ru-translate';
import EN from '@en-translate';
import { Router } from '@angular/router';
import { User } from '@classes';
import { CommonService, MessagesService } from '@services';
import { DatePipe } from '@angular/common';
import { NewMessageComponent } from './new-message/new-message.component';
import { HomePageStore } from '@homepage-store';
import { getAuctionPath } from '@helpers';
import { CATEGORY_MESSAGES } from '@enums';
import { FilterOption } from './shared/interfaces';
import {
  ContextMenuPreparingEvent,
  RowPreparedEvent,
} from 'devextreme/ui/data_grid';
import { SelectionChangedEvent } from 'devextreme/ui/list';
import { SessionIds } from '../deposit/shared';
import { tap } from 'rxjs';
import { ExcelDatePipe, UpperCaseFirstLetterPipe } from '@pipes';
import { DxGridContextMenuLocalizationDirective } from '../../../../shared/directives';
import { LocalStorageService } from '@shared-services';
import { MessageResponse } from '../../../../services/messages-service/shared';
import { ValueChangedEvent } from 'devextreme/ui/text_box';
import { ApiStore } from '@store';
import { IApiDataSection } from '@interfaces';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    DatePipe,
    ExcelDatePipe,
    UpperCaseFirstLetterPipe,
    TranslateModule,
    DxListModule,
    DxTextBoxModule,
    DxTooltipModule,
    DxDataGridModule,
    NewMessageComponent,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit, OnChanges, AfterViewInit {
  private readonly store = inject(HomePageStore);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly messagesService = inject(MessagesService);
  private readonly commonService = inject(CommonService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly apiStore = inject(ApiStore);

  constructor() {
    this.orderHeaderTrader = this.orderHeaderTrader.bind(this); //для фильтрации таблицы
  }

  @ViewChild('showFilter') public showFilter: ElementRef;
  @ViewChild('showFilterList') public showFilterList: ElementRef;
  @ViewChild(DxDataGridComponent) public dataGrid!: DxDataGridComponent;

  @HostListener('document:click', ['$event'])
  public onClick(event: Event): void {
    if (
      !this.showFilter.nativeElement.contains(event.target) &&
      !this.showFilterList?.nativeElement.contains(event.target)
    ) {
      if (this.showFilters) {
        this.showFilters = false;
      }
    }
  }

  public sessionIds = input.required<SessionIds>();
  public tabIndex = input.required<string>();
  public isAdmissionFinished = input.required<boolean>();

  @Output() countInboxUnansweredEvent = new EventEmitter<number>();

  public readonly CATEGORY_MESSAGES = CATEGORY_MESSAGES;
  public categoryMessages = CATEGORY_MESSAGES.ALL;
  public search: string;
  public searchIcon = searchIcon;
  public showFilters = false;
  public messages = [];
  public messagesArray = [];
  public numberEntriesPage = numberEntriesPage;
  public isPopupOpen = false;
  public popupType: string;
  public privileges: boolean = false; //привилегии работника
  public privilegesObserver: boolean = false; //привилегии наблюдателя
  public user: User;
  public countInboxUnanswered = 0; //количество входящих сообщений
  public replyMessage: any; //при ответе на сообщение
  public chooseRow: any;
  public dataSourceForShowFilter: FilterOption[] = []; //фильтры, отображаемые в Показать
  public selectedItemKeysShowFilter: FilterOption[] = []; //выбранные элементы в фильтре @Показать для
  public selectedItemKeysShowFilterAll: FilterOption[] = []; //выбранные элементы в фильтре @Показать первоначальные

  // Исходный вариант фильтров (все возможные фильтры)
  public dataSourceForShowFilterSource: FilterOption[] = [
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.unanswered
          : EN['trading'].messagesTab.unanswered,
      id: 'unanswered',
      filter: '(el.idStatus != 2 && el.isInbox)',
    },
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.answered
          : EN['trading'].messagesTab.answered,
      id: 'answered',
      filter: '(el.idStatus == 2 && el.isInbox)',
    },
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.urgents
          : EN['trading'].messagesTab.urgents,
      id: 'urgents',
      filter: 'el.isImportant',
    },
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.watched
          : EN['trading'].messagesTab.watched,
      id: 'watched',
      filter: 'el.isWatched',
    },
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.system
          : EN['trading'].messagesTab.system,
      id: 'system',
      filter: 'el.isSystem',
    },
  ];

  // фильтр @Входящие
  public dataSourceForShowFilterSourceInbox: FilterOption[] = [
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.unanswered
          : EN['trading'].messagesTab.unanswered,
      id: 'unanswered',
      filter: '(el.idStatus != 2 && el.isInbox)',
    },
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.answered
          : EN['trading'].messagesTab.answered,
      id: 'answered',
      filter: '(el.idStatus == 2 && el.isInbox)',
    },
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.watched
          : EN['trading'].messagesTab.watched,
      id: 'watched',
      filter: 'el.isWatched',
    },
  ];

  // фильтр @Исходящие
  public dataSourceForShowFilterSourceInboxFalse: FilterOption[] = [
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.urgents
          : EN['trading'].messagesTab.urgents,
      id: 'urgents',
      filter: 'el.isImportant',
    },
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.watched
          : EN['trading'].messagesTab.watched,
      id: 'watched',
      filter: 'el.isWatched',
    },
    {
      name:
        this.translate.store.currentLang === 'RU'
          ? RU['trading'].messagesTab.system
          : EN['trading'].messagesTab.system,
      id: 'system',
      filter: 'el.isSystem',
    },
  ];

  // весь набор фильтров, включая все вкладки
  public selectedGlobalFilter = JSON.parse(
    JSON.stringify(
      this.dataSourceForShowFilterSource.map((el) => el).slice(0, -1)
    )
  );

  public selectedGlobalFilterUninbox = JSON.parse(
    JSON.stringify(
      this.dataSourceForShowFilterSourceInboxFalse.map((el) => el).slice(0, -4)
    )
  );

  public ngOnInit(): void {
    this.user = this.localStorageService.getItemFromLocalStorage('user');

    // при наличии Trading + EditItem + секция - маклер, в противном случае - работник в роли наблюдателя.
    const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();

    let sectionDescription: string = sectionsArray.find(
      (el: IApiDataSection): boolean => Number(el.id) === Number(this.sessionIds().sectionId)
    )?.description;

    this.privileges = this.commonService.checkPrivileges(
      'TradingEditItem' + sectionDescription
    ); //маклер

    this.privilegesObserver = this.commonService.checkPrivileges(
      'TradingGetList' + sectionDescription
    ); //наблюдатель

    //если и маклер и наблюдатель, то оставляем только маклера
    if (this.privilegesObserver && this.privileges) {
      this.privilegesObserver = false;
    }

    this.getData();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['tabIndex'] &&
      changes['tabIndex'].currentValue === 'messages'
    ) {
      this.getData();
    }
    if (
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue &&
      this.tabIndex() == 'messages'
    ) {
      this.getData();
    }
  }

  public ngAfterViewInit(): void {
    this.setFiltersFromLocalStorage();
  }

  public toggleShowFilters(): void {
    this.showFilters = !this.showFilters;
  }

  public onClickOnSubMenu(event: MouseEvent): void {
    event.stopPropagation();
  }

  public orderHeaderTrader(data: any): void {
    data.dataSource.postProcess = (results) => {
      results.forEach((r) => {
        if (r.key == null && r.value == null) {
          r.text =
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].messagesTab.allTraders
              : EN['trading'].messagesTab.allTraders;
        }
      });
    };
  }

  // not used in this component but used in another todo refactor
  // получение сведений по одному новому сообщению в качестве наблюдателя
  public getMessageAsWorker(idMessage: number): void {
    this.messagesService
      .getMessageAsWorker(
        this.user?.token,
        this.sessionIds().sectionId,
        this.sessionIds().sessionId,
        idMessage
      )
      .subscribe((res: MessageResponse) => {
        let findMessage = this.messages.findIndex(
          (el) => el.idMessage == res.message.idMessage
        );

        if (findMessage != -1) {
          //Если такое сообщение уже есть в гриде, обновить
          this.messages[findMessage] = res.message;
        } else {
          //Если сообщения нет, тогда добавить
          this.messages.unshift(res.message);
        }

        this.countInboxUnanswered = this.messages.filter(
          (el) => el.idStatus != 2 && el.isInbox
        ).length;

        this.countInboxUnansweredEvent.emit(this.countInboxUnanswered);
      });
  }

  // получение сведений по одному новому сообщению в качестве маклера вызывается по сокету
  public getMessageAsMakler(idMessage: string): void {
    this.messagesService
      .getMessageAsMakler(
        this.user?.token,
        this.sessionIds().sectionId,
        this.sessionIds().sessionId,
        idMessage
      )
      .subscribe((res) => {
        let findMessage = this.messages.findIndex(
          (el) => el.idMessage == res.message.idMessage
        );

        if (findMessage != -1) {
          //Если такое сообщение уже есть в гриде, обновить
          this.messages[findMessage] = res.message;
        } //Если сообщения нет, тогда добавить
        else {
          this.messages.unshift(res.message);
          this.messagesArray.unshift(res.message);
        }

        this.countInboxUnanswered = this.messages.filter(
          (el) => el.idStatus != 2 && el.isInbox
        ).length;

        this.chooseCategoryMessage(this.categoryMessages);

        this.countInboxUnansweredEvent.emit(this.countInboxUnanswered);
      });
  }

  public getSystemMessageWorker(data): void {
    this.messagesService
      .getListAsMaklerPeriod(
        this.user?.token,
        Number(this.sessionIds().sectionId),
        Number(this.sessionIds().sessionId),
        data.idTrader,
        data.periodFrom
      ).subscribe((res) => {
      res.messages.forEach(message => {
        let findMessage = this.messages.findIndex(
          (el) => el.idMessage == message.idMessage
        );

        if (findMessage != -1) {
          //Если такое сообщение уже есть в гриде, обновить
          this.messages[findMessage] = message;
        } //Если сообщения нет, тогда добавить
        else {
          this.messages.unshift(message);
          this.messagesArray.unshift(message);
        }

        this.countInboxUnanswered = this.messages.filter(
          (el) => el.idStatus != 2 && el.isInbox
        ).length;

        this.chooseCategoryMessage(this.categoryMessages);

        this.countInboxUnansweredEvent.emit(this.countInboxUnanswered);
      })

    })
  }

  public getData(): void {
    // получаем сообщения как работник

    if (this.privilegesObserver) {
      // наблюдатель
      this.getListAsWorker();
    } else if (this.privileges) {
      //работник
      this.messagesService
        .getListAsMakler(
          this.user?.token,
          this.sessionIds().sectionId,
          this.sessionIds().sessionId
        )
        .subscribe((res) => {
          this.messagesArray = res.messages;
          this.onPrepareData();
        });
    }
  }

  private getListAsWorker(): void {
    this.messagesService
      .getListAsWorker(
        this.user?.token,
        this.sessionIds().sectionId,
        this.sessionIds().sessionId
      )
      .pipe(
        tap((res) => {
          this.messagesArray = res.messages;
          this.onPrepareData();
        })
      )
      .subscribe();
  }

  private onPrepareData(): void {
    this.messages = JSON.parse(JSON.stringify(this.messagesArray));

    this.countInboxUnanswered = this.messages.filter(
      (el) => el.idStatus != 2 && el.isInbox
    ).length;

    this.countInboxUnansweredEvent.emit(this.countInboxUnanswered);

    this.dataSourceForShowFilter = this.dataSourceForShowFilterSource.map(
      (el) => el
    );

    const workerMessagesFilters =
      this.localStorageService.getItemFromLocalStorage(WORKER_MESSAGES_FILTERS);

    if (workerMessagesFilters) {
      this.selectedGlobalFilter = workerMessagesFilters;
    }

    this.selectedItemKeysShowFilter = this.dataSourceForShowFilterSource
      .map((el) => el)
      .slice(0, -1);

    this.selectedItemKeysShowFilterAll = this.selectedItemKeysShowFilter.map(
      (el) => el
    );

    this.chooseCategoryMessage(this.categoryMessages);
  }

  public onShowFilterChanged(e?: SelectionChangedEvent): void {
    if (e) {
      //если вручную добавили или удалили фильтр
      if (e.removedItems?.length > 0) {
        e.removedItems.forEach((item) => {
          if (this.dataSourceForShowFilter.includes(item)) {
            //так как иногда срабатывает при переключении вкладок (сам массив с фильтрами меняется), добавлена проверка на наличие фильтра в текущем массиве
            let index = this.selectedGlobalFilter.findIndex(
              (el) => el.id == item.id
            );
            this.selectedGlobalFilter.splice(index, 1);
          }
        });
      }

      if (e.addedItems?.length > 0) {
        e.addedItems.forEach((item) => {
          if (!this.selectedGlobalFilter.find((el) => el.id == item.id))
            //чтобы не дублировались значения в массиве
            this.selectedGlobalFilter.push(item);
        });
      }

      this.localStorageService.setItemToLocalStorage(
        WORKER_MESSAGES_FILTERS,
        this.selectedGlobalFilter
      );
    }

    let filterString = '';

    this.selectedItemKeysShowFilter?.forEach((el) => {
      if (this.dataSourceForShowFilter.find((df) => df.id == el.id)) {
        //проверяем есть ли в выпадающем списке Показать
        filterString =
          filterString.length > 0
            ? filterString + ' || ' + el.filter
            : el.filter; // формируем строку фильтров
      }
    });

    //фильтруем исходный массив; eval(filterString) - преобразует строку в переменные; в зависимости this.categoryMessages фильтруем исходный массив
    this.messages = this.messagesArray.filter((el) =>
      this.categoryMessages === CATEGORY_MESSAGES.ALL
        ? eval(filterString) ||
          (!el.isInbox &&
            el.idStatus == null &&
            !el.isSystem &&
            !el.isWatched &&
            !el.isImportant)
        : this.categoryMessages == CATEGORY_MESSAGES.INCOMING
        ? el.isInbox && eval(filterString)
        : filterString !== '' //если хоть один чекбокс стоит - фильтруем по нему
        ? !el.isInbox && eval(filterString)
        : !el.isInbox
    );
  }

  public chooseCategoryMessage(str: CATEGORY_MESSAGES): void {
    // переход на вкладки Все, Входящие, Исходящие
    this.categoryMessages = str;
    this.localStorageService.setItemToLocalStorage(
      WORKER_SELECTED_MESSAGES_FILTERS,
      str
    );

    switch (str) {
      case CATEGORY_MESSAGES.ALL: {
        this.messages = this.messagesArray;

        this.dataSourceForShowFilter = this.dataSourceForShowFilterSource;

        this.selectedItemKeysShowFilter = this.dataSourceForShowFilter.filter(
          (el) => this.selectedGlobalFilter.map((v) => v.id).includes(el.id)
        );

        this.onShowFilterChanged();

        break;
      }

      case CATEGORY_MESSAGES.INCOMING: {
        this.messages = this.messagesArray.filter((el) => el.isInbox);

        this.dataSourceForShowFilter = this.dataSourceForShowFilterSourceInbox;

        this.selectedItemKeysShowFilter = this.dataSourceForShowFilter.filter(
          (el) => this.selectedGlobalFilter.map((v) => v.id).includes(el.id)
        );

        this.onShowFilterChanged();

        break;
      }

      case CATEGORY_MESSAGES.OUTGOING: {
        this.messages = this.messagesArray.filter((el) => !el.isInbox);

        this.dataSourceForShowFilter =
          this.dataSourceForShowFilterSourceInboxFalse;

        this.selectedItemKeysShowFilter = this.dataSourceForShowFilter.filter(
          (el) =>
            this.selectedGlobalFilterUninbox.map((v) => v.id).includes(el.id)
        );

        this.onShowFilterChanged();

        break;
      }
    }
  }

  public onContentReady(e: any): void {
    //проставляем иконки сортировки
    const unsortedHeaders = e.element.getElementsByClassName(
      'dx-column-indicators'
    );
    // we loop thru each column headers
    for (let i = 0; i < unsortedHeaders.length; i++) {
      const element = unsortedHeaders[i];
      const children = element.childNodes;
      //we create an element for the icon
      const sortableIcon = document.createElement('i');
      sortableIcon.classList.add('dx-icon', 'dx-sort-icon');

      let isSortable = false;
      let hasIcon = false;
      let existingSortableIcon = '';

      //since we are going to add a custom icon, we must make sure we only add it once and when column is not sorted
      for (let i = 0; i < children.length; i++) {
        //check if column already has the icon so we don't infinitely add it
        if (
          element.querySelector('.dx-sort').getElementsByTagName('i').length > 0
        ) {
          hasIcon = true;
          existingSortableIcon = children[i];
        }

        // check if column isn't sorted
        if (children[i].classList.contains('dx-sort-none')) isSortable = true;
      }

      //if can add icon
      if (isSortable && !hasIcon) {
        const sortSpan = element.querySelector('.dx-sort');
        element.querySelector('.dx-sort-none').style.display = 'inline-block';
        sortSpan.appendChild(sortableIcon);
        hasIcon = true;
      }

      //if column is sorted and we added an icon earlier, we remove it
      // you can also remove all the icons when one column is sorted, it depends on your preference
      if (!isSortable && hasIcon) element.removeChild(existingSortableIcon);
    }
  }

  public onRowPrepared(event: RowPreparedEvent): void {
    // закрашиваем сереньким строку непрочитанное входящее сообщение
    if (event.rowType === 'data') {
      if (event.key.isInbox && event.key.idStatus != 2)
        event.rowElement.classList.add('backGroundColorGray');
    }
  }

  public onContextMenuPreparing(e: ContextMenuPreparingEvent): void {
    // контекстное меню

    if (e.row.rowType != 'header') {
      if (!e.items) e.items = [];

      this.chooseRow = e.row.data;
      e.items.push(
        {
          icon: './assets/img/icons/goToChat.svg',
          text:
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].messagesTab.goToChatWithTrader
              : EN['trading'].messagesTab.goToChatWithTrader,
          disabled:
            e.row.data.isPublic ||
            (e.row.data.isSystem && !this.chooseRow.idRecipient),
          onItemClick: () => {
            const idAuctionType = this.store.idAuctionType();
            const auctionRootPath = getAuctionPath(idAuctionType);
            const url = this.router.serializeUrl(
              this.router.createUrlTree([
                `auctions/${auctionRootPath}/main-page/chat/${
                  this.sessionIds().sectionId
                }/${this.sessionIds().sessionId}/${
                  this.chooseRow.isInbox
                    ? this.chooseRow.idSender
                    : this.chooseRow.idRecipient
                }`,
              ])
            );
            window.open(url, '_blank');
          },
        },
        {
          icon: './assets/img/icons/replyToMess.svg',
          text:
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].messagesTab.replyToMessage
              : EN['trading'].messagesTab.replyToMessage,
          disabled: !e.row.data.isInbox,
          onItemClick: () => {
            this.openPopup('replyToMessage');
          },
        },
        {
          icon: './assets/img/icons/checkAnswered.svg',
          text:
            this.translate.store.currentLang == 'RU'
              ? RU['trading'].messagesTab.markAsAnswered
              : EN['trading'].messagesTab.markAsAnswered,
          disabled: !e.row.data.isInbox || e.row.data.idStatus == 2,
          onItemClick: () => {
            const body = {
              idSection: Number(this.sessionIds().sectionId),
              idSession: Number(this.sessionIds().sessionId),
              idMessage: this.chooseRow.idMessage,
            };

            this.messagesService
              .replyMark(this.user?.token, body)
              .subscribe(() => {
                this.getData();
              });
          },
        },
        {
          icon: e.row.data.isWatched
            ? './assets/img/icons/isObserved.svg'
            : './assets/img/icons/isObservedBlack.svg',
          text: e.row.data.isWatched
            ? this.translate.store.currentLang == 'RU'
              ? RU['trading'].messagesTab.deleteToWatched
              : EN['trading'].messagesTab.deleteToWatched
            : this.translate.store.currentLang == 'RU'
            ? RU['trading'].messagesTab.addToWatched
            : EN['trading'].messagesTab.addToWatched,
          disabled: null,
          onItemClick: () => {
            const body = {
              idSection: Number(this.sessionIds().sectionId),
              idSession: Number(this.sessionIds().sessionId),
              idMessage: this.chooseRow.idMessage,
            };

            if (e.row.data.isWatched) {
              this.messagesService
                .watchRemove(this.user?.token, body)
                .subscribe(() => {
                  this.getData();
                });
            } else {
              this.messagesService
                .watchAdd(this.user?.token, body)
                .subscribe(() => {
                  this.getData();
                });
            }
          },
        }
      );
    }
  }

  public openPopup(str: string): void {
    this.popupType = str;

    switch (str) {
      case 'createNewMessage': {
        this.isPopupOpen = true;

        break;
      }

      case 'replyToMessage': {
        this.isPopupOpen = true;
        this.replyMessage = {
          trader: this.chooseRow.traderFullName,
          time: this.chooseRow.dateMessage,
          message: this.chooseRow.text,
          idMessage: this.chooseRow.idMessage,
        };

        break;
      }
    }
  }

  public onSearchValueChanged(e: ValueChangedEvent): void {
    const value = e.value;

    this.search = value;

    this.localStorageService.setItemToLocalStorage(
      WORKER_SEARCH_FILTERS,
      value
    );

    this.applyGridFilter(value);
  }

  private setFiltersFromLocalStorage(): void {
    const search = this.localStorageService.getItemFromLocalStorage(
      WORKER_SEARCH_FILTERS
    );

    const selectedMessagesSearch =
      this.localStorageService.getItemFromLocalStorage(
        WORKER_SELECTED_MESSAGES_FILTERS
      ) as CATEGORY_MESSAGES;

    const messagesSearchFilters =
      this.localStorageService.getItemFromLocalStorage(WORKER_MESSAGES_FILTERS);

    if (messagesSearchFilters && typeof messagesSearchFilters === 'string') {
      this.selectedGlobalFilter = messagesSearchFilters;
    }

    if (selectedMessagesSearch && typeof selectedMessagesSearch === 'string') {
      this.chooseCategoryMessage(selectedMessagesSearch);
    }

    if (search && typeof search === 'string') {
      this.search = search;
      this.applyGridFilter(search);
    }
  }

  private applyGridFilter(value: string): void {
    if (!this.dataGrid) {
      return;
    }

    const grid = this.dataGrid.instance;

    if (!value) {
      grid.clearFilter();
      return;
    }

    grid.searchByText(value);
  }
}
