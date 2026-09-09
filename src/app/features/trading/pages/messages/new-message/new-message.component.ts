import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import RU from '@ru-translate';
import EN from '@en-translate';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService, MessagesService, SidebarService, TradingService, TraderService } from '@services';
import { User } from '@classes';
import { DatePipe } from '@angular/common';
import { ExcelDatePipe, UpperCaseFirstLetterPipe } from '@pipes';
import { DX_MODULES } from '@constants';

@Component({
  selector: 'new-message',
  standalone: true,
  imports: [
    DatePipe,
    ExcelDatePipe,
    UpperCaseFirstLetterPipe,
    TranslateModule,
    ...DX_MODULES
  ],
  templateUrl: './new-message.component.html',
  styleUrls: ['./new-message.component.scss'],
})
export class NewMessageComponent implements OnInit {
  private readonly messagesService = inject(MessagesService);
  private readonly traderService = inject(TraderService);
  
  @Input() popupType;
  @Input() replyMessage;
  @Input() sectionInfo;
  @Output() componentData = new EventEmitter<boolean>();

  user: User;
  urgentMessage = false; //срочное сообщения
  public writeToAllTraders = false; // Написать всем трейдерам
  chooseTempl = {}; //выбранный шаблон
  isOpenSidebar = false;
  public myTemplate = 0;
  message: string;
  templates = [];
  templatesFull = [];
  participants = [];
  trader: any;

  createTemplateSideBar: any;

  constructor(
    private sidebarService: SidebarService,
    public translate: TranslateService,
    public commonService: CommonService,
    public tradingService: TradingService
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.onGetTemplates();

    this.traderService
      .getListParticipants(
        this.user?.token,
        this.sectionInfo.sectionId,
        this.sectionInfo.sessionId
      )
      .subscribe((res) => {
        this.participants = res.participants;
        //  this.filteredParticipants = this.participants
      });

    this.createTemplateSideBar = this.sidebarService.template$.subscribe(() => {
      this.onGetTemplates();
      // this.isVisibleToast = true;
    });

    this.popupType;

  }

  public setUrgentMessage(): void {
    this.urgentMessage = false;
    this.componentData.emit(false)
  }

  private onGetTemplates(): void {
    this.messagesService
      .getChatMsgTemplates(this.user?.token, this.sectionInfo.sectionId)
      .subscribe((res) => {
        this.templatesFull = res.templates.sort((a, b) =>
          a.id > b.id ? 1 : -1
        );
        this.getTemplates();
      });
  }

  getTemplates() {
    this.chooseTempl = {};
    this.message = '';
    if (this.myTemplate === 0)
      //мои шаблоны
      this.templates = this.templatesFull.filter((el) => el.isPersonal == true);
    //шаблоны секции
    else
      this.templates = this.templatesFull.filter(
        (el) => el.isPersonal == false
      );
  }

  public condEditButton(): boolean {
    //Отображение кнопки редактировать и удалить в выпадающем списке
    return Object.keys(this.chooseTempl).length !== 0 && this.myTemplate === 0;
  }

  onEditTemplate(str) {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    if (str == 'create') {
      this.sidebarService.dataForReq = {
        name:
          this.translate.store.currentLang == 'RU'
            ? RU['trading'].messagesTab.addingTemplate
            : EN['trading'].messagesTab.addingTemplate,
        sectionId: this.sectionInfo.sectionId,
        idTemplate: { name: '', text: '' },
      };
    } else {
      this.sidebarService.dataForReq = {
        sectionId: this.sectionInfo.sectionId,
        idTemplate: this.chooseTempl,
        name:
          this.translate.store.currentLang == 'RU'
            ? RU['trading'].messagesTab.editingTemplate
            : EN['trading'].messagesTab.editingTemplate,
      };
    }
    this.sidebarService.type = 'createTemplate';
    this.sidebarService.getData();
  }

  onDeleteTemplate() {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    this.sidebarService.dataForReq = {
      sectionId: this.sectionInfo.sectionId,
      idTemplate: this.chooseTempl,
      name:
        this.translate.store.currentLang == 'RU'
          ? RU['trading'].messagesTab.deletingTemplate
          : EN['trading'].messagesTab.deletingTemplate,
    };
    this.sidebarService.type = 'deleteTemplate';
    this.sidebarService.getData();
  }

  onSendMessage() {
    if (this.popupType == 'createNewMessage') {
      //новое сообщение

      if (this.writeToAllTraders) {
        //отправляем всем трейдерам
        const body = {
          idSection: this.sectionInfo.sectionId,
          idSession: this.sectionInfo.sessionId,
          textMessage: this.message,
          isImportant: this.urgentMessage,
        };

        this.messagesService
          .sendPublic(this.user?.token, body)
          .subscribe(() => {
            this.urgentMessage = false;
            this.writeToAllTraders = false;
            this.componentData.emit(false);
          });
      } else {
        //отправляем лично трейдеру
        const body = {
          idSection: this.sectionInfo.sectionId,
          idSession: this.sectionInfo.sessionId,
          textMessage: this.message,
          idRecipient: this.trader.traderId,
          isImportant: this.urgentMessage,
        };

        this.messagesService
          .sendToTrader(this.user?.token, body)
          .subscribe(() => {
            this.urgentMessage = false;
            this.componentData.emit(false);
          });
      }
    } else {
      //ответ на сообщение
      const body = {
        idSection: this.sectionInfo.sectionId,
        idSession: this.sectionInfo.sessionId,
        idMessage: this.replyMessage.idMessage,
        textMessage: this.message,
        isImportant: this.urgentMessage,
      };

      this.messagesService
        .brokerReply(this.user?.token, body)
        .subscribe(() => {
          this.urgentMessage = false;
          this.componentData.emit(false);
        });
    }
  }

  /*openSidebar() {
    document.getElementById("mySidebar").style.right = "0";
    document.getElementById("mySidebar").style.opacity = "1";
    document.getElementById("dark").className = "dark_opened";
    this.sidebarService.dataForReq = {name: 'Марго '};
    this.sidebarService.type = 'good';
  }*/

  public ngOnDestroy(): void {
    this.createTemplateSideBar.unsubscribe();
  }
}
