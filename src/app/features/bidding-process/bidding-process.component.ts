import { Component, OnInit, inject, Renderer2 } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '@classes';
import { DemandService, CommonService } from '@services';
import {
  auctionType,
  numberEntriesPage,
  searchIcon,
  DEFAULT_COLUMN_CHOOSER_POSITION,
  DIFF_PRICE_TREND
} from '@constants';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageCache } from '@classes';
import { DatePipe, NgClass, DOCUMENT } from '@angular/common';
import {
  TransformDatePipe,
  ExcelDatePipe,
  ToNumberPipe,
  RuNumberFormatPipe,
} from '@pipes';
import { Title } from '@angular/platform-browser';
import { DxDataGridModule, DxTooltipModule } from 'devextreme-angular';
import { DxGridContextMenuLocalizationDirective } from '../../shared/directives';
import { VOLUME_PRECISION, CURRENCY_PRECISION, FileTypes } from '@constants';
import { ExportingEvent } from 'devextreme/ui/data_grid';
import { ExportService } from './../../services/export-service.service';
import { convertExcelSerialDateToMs } from '../../views/homepage/helpers';
import { ApiStore } from '@store';
import { IApiDataSection } from '@interfaces';
import { getTranslateResultByCurrentLang } from '@helpers';
import { PositionConfig } from 'devextreme/common/core/animation';

@Component({
  selector: 'app-bidding-process',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    TranslateModule,
    DxDataGridModule,
    DxTooltipModule,
    TransformDatePipe,
    ExcelDatePipe,
    ToNumberPipe,
    RuNumberFormatPipe,
    RuNumberFormatPipe,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './bidding-process.component.html',
  styleUrls: ['./bidding-process.component.scss'],
})
export class BiddingProcessComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly commonService = inject(CommonService);
  private readonly demandService = inject(DemandService);
  private readonly title = inject(Title);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly exportService = inject(ExportService);
  private readonly apiStore = inject(ApiStore);
  private readonly translate = inject(TranslateService);

  public readonly auctionType = auctionType;

  public sessionID: number;
  public sectionID: number;
  public sectionName: string;
  public demandOfferID: number;
  public lotNumber: number;
  public sessionDate;
  public sessionName: string;
  public auctionTypeId: number;

  public privileges: boolean = false;
  public currentTimeDate: Date;
  public offerBiddingProcess: any = [];
  public searchIcon: any = searchIcon;
  public numberEntriesPage = numberEntriesPage;
  public user: User;
  public cache = {} as PageCache;

  public readonly volumePrecision = VOLUME_PRECISION;
  public readonly currencyPrecision = CURRENCY_PRECISION;
  public readonly DIFF_PRICE_TREND = DIFF_PRICE_TREND;

  public readonly columnChooserPosition: PositionConfig = DEFAULT_COLUMN_CHOOSER_POSITION;

  constructor() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.route.queryParams.subscribe((params) => {
      this.sessionID = params['idSession'];
      this.sectionID = params['idSection'];
      this.lotNumber = params['lotNumber'];
      this.demandOfferID = params['idOffer'];
      this.sessionDate = convertExcelSerialDateToMs(params['sessionDate']);
      this.sessionName = params['sessionName'];
      this.auctionTypeId = params['auctionType'];
      const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();
      let sectionDescription: string = sectionsArray.find(
        (el: IApiDataSection): boolean => Number(el.id) === Number(this.sectionID)
      )?.description;
      this.sectionName = sectionsArray.find(
        (el: IApiDataSection): boolean => Number(el.id) === Number(this.sectionID)
      )?.name;

      sectionDescription = 'TradingEditItem' + sectionDescription;
      this.privileges = this.commonService.checkPrivileges(sectionDescription);
      this.title.setTitle(`${this.sessionID}: Ход торгов`);

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

      if (!this.privileges) {
        this.router.navigate([`/*`]);
      }
    });
    this.orderHeaderFilterUnits = this.orderHeaderFilterUnits.bind(this);
    this.orderHeaderFilterName = this.orderHeaderFilterName.bind(this);
  }

  public ngOnInit(): void {
    this.getData();
    sessionStorage.setItem('offerBidProc', JSON.stringify(this.cache));
  }

  public ngOnChanges(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.cache = JSON.parse(sessionStorage.getItem('offerBidProc')) || {};
  }

  public get currentNameDataField(): string {
    return Number(this.auctionTypeId) === auctionType.simpleSellerAuction
      ? 'nameOffer'
      : 'nameDemand';
  }

  public getData(): void {
    this.currentTimeDate = new Date();

    if (Number(this.auctionTypeId) === auctionType.simpleSellerAuction) {
      this.demandService
        .getOfferBiddingProcess(
          this.user?.token,
          this.sectionID,
          this.sessionID,
          this.demandOfferID
        )
        .subscribe((res) => {
          this.offerBiddingProcess = res.offerBiddingProcess;
        });
    }

    if (Number(this.auctionTypeId) === auctionType.simpleBuyerAuction) {
      this.demandService
        .getDemandBiddingProcess(
          this.user?.token,
          this.sectionID,
          this.sessionID,
          this.demandOfferID
        )
        .subscribe((res) => {
          this.offerBiddingProcess = res.demandBiddingProcess;
        });
    }
  }

  public calculateFilterExpression(value, selectedFilterOperations, target) {
    const column = this as any;
    if (
      target === 'headerFilter' ||
      target === 'filterBuilder' ||
      target === 'search'
    ) {
      return [column.dataField, 'contains', value];
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  public orderHeaderFilterUnits(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0;
      this.offerBiddingProcess.forEach((el) => {
        results.push({
          key: [el.nameUnit],
          value: el.nameUnit,
          text: el.nameUnit,
        });
      });
      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  public orderHeaderFilterName(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0;
      this.offerBiddingProcess.forEach((el) => {
        results.push({
          key: [el.nameOffer],
          value: el.nameOffer,
          text: el.nameOffer,
        });
      });
      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];

      return uniqueResult;
    };
  }

  public onExporting(e: ExportingEvent): void {
    const biddingProcess: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'offerBiddingProcess.biddingProcess'
    );

    const lot: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'trading.offersTable.lot'
    );

    const fileName: string = `${biddingProcess}, ${this.sectionName}, № ${this.sessionID}, ${lot} № ${this.lotNumber}`;

    this.exportService.onExporting(e, fileName, FileTypes.BIDDING_PROCESS);
  }
}
