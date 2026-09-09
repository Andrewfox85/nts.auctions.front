import { Component, HostListener, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService, MessagesService, SidebarService, DemandService } from '@services';
import { User } from '@classes';
import RU from '@ru-translate';
import EN from '@en-translate';
import { CommonModule } from '@angular/common';
import { DX_MODULES } from '@constants';
import { ExcelDatePipe, UpperCaseFirstLetterPipe } from '@pipes';
import { ApiStore } from '@store';
import { IApiDataSection } from '@interfaces';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...DX_MODULES, ExcelDatePipe, UpperCaseFirstLetterPipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  private readonly messagesService = inject(MessagesService);
  private readonly demandService = inject(DemandService);
  private readonly apiStore = inject(ApiStore);

  dataForReq: any = [];
  type: string;
  title: string = null;
  message: string = '';
  user: User;
  privileges: boolean = false;
  tabIndex: number;
  idOffer: number; //для просмотра заявки
  idDirection: number;
  fullInfo: any = [];
  totalBlockData: any;

  isVisibleToast = false;
  messageToast: string = ' ';

  depositPopup: boolean = false;
  depositRowData: any;
  newData: any;
  uniqueDeliveryScopes: any;

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    //закрывается выезжающая панель по кнопке esc
    if (document.getElementById('mySidebar').style.opacity == '1') {
      this.closeSidebar();
    }
  }

  constructor(
    private sidebarService: SidebarService,
    public translate: TranslateService,
    public router: Router,
    public commonService: CommonService,
  ) {
    window.addEventListener('popstate', () => {
      //при нажатии браузерной кнопки назад закрывается sidebar
      this.closeSidebar();
    });
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.newData = this.sidebarService.newData$.subscribe(() => {
      this.dataForReq = this.sidebarService.dataForReq;
      this.type = this.sidebarService.type;

      if (this.type == 'createTemplate' || this.type == 'deleteTemplate') {
        if (this.dataForReq?.idTemplate) {
          this.title = this.dataForReq?.idTemplate.name;
          this.message = this.dataForReq?.idTemplate.text;
        }
      }

      if (
        this.type == 'viewOfferFromOffers' ||
        this.type == 'viewOfferFromAuctions'
      ) {
        this.idOffer = this.sidebarService.idOffer;
        this.idDirection = this.sidebarService.idDirection;
        this.fullInfo = this.sidebarService.fullInfo;

        if (this.user?.IsWorker) {
          //привилегии для работника
          const sectionsArray: IApiDataSection[] = this.apiStore.sectionsList();
          let sectionDescription: string = sectionsArray.find(
            (el: IApiDataSection): boolean => Number(el.id) === Number(this.dataForReq.sectionId)
          )?.description;

          this.privileges = this.commonService.checkPrivileges(
            'TradingEditItem' + sectionDescription
          );
        }

        if (this.fullInfo.deliveryScopes?.length > 0) {
          this.getClientName();
        }
      }
    });
  }

  /*@HostListener('mouseenter') onMouseEnter() {
    this.dataForReq = this.sidebarService.dataForReq;
    this.type = this.sidebarService.type;

    if(this.type == 'createTemplate' || this.type == 'deleteTemplate'){
      if(this.dataForReq?.idTemplate){
        this.title = this.dataForReq?.idTemplate.name;
        this.message = this.dataForReq?.idTemplate.text
      }
    }

    if(this.type == 'viewOfferFromOffers' || this.type == 'viewOfferFromAuctions'){
      this.idOffer = this.sidebarService.idOffer;
      this.idDirection = this.sidebarService.idDirection;
      this.fullInfo = this.sidebarService.fullInfo;

      if (this.user?.IsWorker) {  //привилегии для работника
        const sectionsArray = JSON.parse(localStorage.getItem('sections'))
        let sectionDescription = sectionsArray.find(el => el.id === Number(this.dataForReq.sectionId))?.description;
        this.privileges = this.commonService.checkPrivileges("TradingEditItem" + sectionDescription);
      }

      if(this.fullInfo.deliveryScopes?.length > 0){
        this.getClientName();
      }
    }
  }*/

  onCreateTemplate(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      const body = {
        idSection: this.dataForReq?.sectionId,
        idTemplate: this.dataForReq?.idTemplate.id || null,
        templateName: this.title,
        templateText: this.message,
      };

      this.messagesService
        .setChatMsgTemplates(this.user?.token, body)
        .subscribe(() => {
          this.sidebarService.createEditTemplate();
          this.closeSidebar();
        });
    }
  }

  public onRemoveTemplate(): void {
    const body = {
      idSection: this.dataForReq?.sectionId,
      idTemplate: this.dataForReq.idTemplate.id,
    };

    this.messagesService
      .deleteChatMsgTemplate(this.user?.token, body)
      .subscribe(() => {
        {
          this.sidebarService.createEditTemplate();
          this.closeSidebar();
        }
      });
  }

  //уникальные значения в массиве deliveryScopes
  getClientName() {
    this.uniqueDeliveryScopes = [
      ...new Map(
        this.fullInfo.deliveryScopes.map((item) => [item['idFirmClient'], item])
      ).values(),
    ];
    return this.uniqueDeliveryScopes;
  }

  closeSidebar() {
    document.getElementById('mySidebar').style.right = '-2000px';
    document.getElementById('mySidebar').style.opacity = '0';
    document.getElementById('dark').className = 'dark';
    document.getElementById('mySidebar').style.zIndex = '1500';
    this.sidebarService.dataForReq = []; //очищаем данные после закрытия
    this.sidebarService.type = ''; //очищаем данные после закрытия
    this.sidebarService.fullInfo = [];
    this.type = null;
    this.title = null;
    this.message = null;
    /*  this.fullDataGroup = []
    this.tabName = 0;
    this.dataSourceTabs = [];*/
  }

  getTotalBlockData(e) {
    this.totalBlockData = e;
  }

  onOpenDepositOffer() {
    this.depositRowData = Object.assign(
      this.fullInfo?.generalInfo,
      this.dataForReq
    );
    this.depositPopup = true;
  }

  closeDepositPopup(event) {
    this.depositPopup = event;
  }

  ngOnDestroy() {
    this.newData?.unsubscribe();
  }
}
