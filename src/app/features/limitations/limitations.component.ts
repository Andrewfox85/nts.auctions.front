import { Component, OnInit, inject, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, PageCache } from '@classes';
import { TradingService } from '@services';
import { numberEntriesPage, searchIcon } from '@constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePipe, DOCUMENT} from '@angular/common';
import { ExcelDatePipe } from '@pipes';
import { DxDataGridModule, DxTooltipModule } from 'devextreme-angular';
import { DxGridContextMenuLocalizationDirective } from '../../shared/directives';
import { Title } from "@angular/platform-browser";
import RU from "@ru-translate";
import EN from "@en-translate";

@Component({
  selector: 'app-limitations',
  standalone: true,
  imports: [
    TranslateModule,
    DxDataGridModule,
    DxTooltipModule,
    DatePipe,
    ExcelDatePipe,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './limitations.component.html',
  styleUrls: ['./limitations.component.scss'],
})
export class LimitationsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tradingService = inject(TradingService);
  private readonly translate = inject(TranslateService);

  public sessionID: number;
  public sectionID: number;
  public sectionName: string;
  public sessionDate: any;
  public sessionName: string;
  public listOfLimitations: any;
  public listLimits: [];
  public limitsParticipants = [];
  public currentTimeDate: Date;
  public searchIcon = searchIcon;
  public numberEntriesPage = numberEntriesPage;
  public user: User;
  public cache = {} as PageCache;

  private readonly title = inject(Title);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.route.queryParams.subscribe((params) => {
      this.sessionID = params['idSession'];
      this.sectionID = params['idSection'];
      this.sessionDate = params['sessionDate'];
      this.sessionName = params['sessionName'];
      this.sectionName = params['sectionName'];

      this.title.setTitle(`${
        this.translate.store.currentLang == 'RU'
          ? RU['trading'].periods.purchaseLimitation
          : EN['trading'].periods.purchaseLimitation}`);

      const faviconUrl = 'assets/img/icons/progressOfTrading.svg';

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
    this.orderHeaderFilterFirms = this.orderHeaderFilterFirms.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterClients = this.orderHeaderFilterClients.bind(this); //для фильтрации таблицы
  }

  public ngOnInit(): void {
    this.getData();
    sessionStorage.setItem('limitations', JSON.stringify(this.cache));
  }

  public ngOnChanges(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.cache = JSON.parse(sessionStorage.getItem('limitations')) || {};
  }

  public getData(): void {
    this.currentTimeDate = new Date();

    if (this.user.IsWorker) {
      this.tradingService
        .getLimitations(this.user?.token, this.sectionID, this.sessionID)
        .subscribe((res: any) => {
          this.listOfLimitations = res.limitations;
          this.listLimits = this.listOfLimitations.map((item) => item.id); //создаем массив id для передачи в метод получения участников
          this.getParticipants(this.listLimits);
        });
    }
  }

  private getParticipants(listLimits?, type?: string): void {
    this.tradingService
      .getLimitParticipants(
        this.user?.token,
        this.sectionID,
        this.sessionID,
        listLimits
      )
      .subscribe((res: any) => {
        this.limitsParticipants = res.limitsParticipants;

        if (listLimits && !type) {
          //получаем участников для таблицы

          if (this.listOfLimitations?.length == 1) {
            this.listOfLimitations = this.listOfLimitations.map((l) => {
              l.firms = this.limitsParticipants.filter(
                (part) => part.idLimitation == l.id && part.isChecked === true
              );
              return l;
            });
          }

          if (this.listOfLimitations?.length > 1) {
            this.listOfLimitations = this.listOfLimitations.map((l) => {
              l.firms = this.limitsParticipants.filter(
                (part) => part.idLimitation == l.id
              );
              return l;
            });
          }

          this.listOfLimitations.forEach((el) => {
            let firmsNames = el.firms.map((x) => x.firmName); //создаю массив имен и добавляю в объект для фильтрации
            el['firmsNames'] = firmsNames;
            let clientsNames = el.firms.map((x) => x.clientName); //создаю массив имен и добавляю в объект для фильтрации
            el['clientsNames'] = clientsNames;
          });
        }
      });
  }

  public orderHeaderFilterFirms(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0;
      this.listOfLimitations.forEach((item) => {
        item.firms.forEach((el) => {
          results.push({
            key: [el.firmName],
            value: el.firmName,
            text: el.firmName,
          });
        });
      });
      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  public orderHeaderFilterClients(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0;

      this.listOfLimitations.forEach((item) => {
        item.firms.forEach((el) => {
          results.push({
            key: [el.clientName],
            value: el.clientName,
            text: el.clientName,
          });
        });
      });
      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];

      return uniqueResult;
    };
  }

  public calculateFilterExpression(value, selectedFilterOperations, target) {
    const column = this as any;

    if (target === 'headerFilter') {
      return [column.dataField, 'contains', value];
    }

    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }
}
