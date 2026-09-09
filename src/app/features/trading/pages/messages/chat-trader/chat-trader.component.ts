import {
  Component,
  Input,
  IterableDiffers,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { User } from '@classes';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessagesService, GeneralService } from '@services';
import { CommonModule } from '@angular/common';
import { ExcelDatePipe } from '@pipes';
import { DX_MODULES } from '@constants';
import { LocalStorageService } from '@shared-services';

@Component({
  selector: 'app-chat-trader',
  standalone: true,
  imports: [CommonModule, ExcelDatePipe, TranslateModule, ...DX_MODULES],
  templateUrl: './chat-trader.component.html',
  styleUrls: ['./chat-trader.component.scss'],
})
export class ChatTraderComponent implements OnInit {
  private readonly messagesService = inject(MessagesService);
  private readonly translate = inject(TranslateService);
  private readonly generalService = inject(GeneralService);
  private readonly localStorageService = inject(LocalStorageService);

  constructor(private readonly iterableDiffers: IterableDiffers) {
    this.iterableDiffer = iterableDiffers.find([]).create(null);
  }

  @Input() isAdmissionFinished: boolean;
  @Input() tabIndex;
  @Input() sessionIds;

  public loadingVisible = false;
  public messages: any = [];
  public user: User;
  public message: string = '';
  public messageReply: string = '';
  public replyMessageInfo: any;
  public popupReply = false;
  public iterableDiffer: any;

  public ngOnInit(): void {
    this.user = this.localStorageService.getUser() as User;
    this.translate.use(this.localStorageService.getLanguage());
    this.getData();
    /*    if (this.signalrService.connectionIsEstablished === false) {    //проверка на подключение к сокету
          this.signalrService.createConnection(this.sessionIds.sectionId, this.sessionIds.sessionId).then(() => {
            this.signalrMethods()
          })
        } else {
          this.signalrMethods()
        }*/
  }

  // ngDoCheck() {
  /*  let changes = this.iterableDiffer.diff(this.messages);

    if (changes) {
      this.scrollView?.instance.scrollTo( {top: this.scrollView.instance.scrollHeight() +82});
    }*/
  //перематывает переписку вниз
  // }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['tabIndex'] && changes['tabIndex'].currentValue === 5) {
      this.getData();
    }
    if (
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue &&
      this.tabIndex == 5
    ) {
      this.getData();
    }
  }

  private getData(): void {
    this.loadingVisible = true;
    this.getChatAsTraderPerson();
  }

  private getChatAsTraderPerson(): void {
    this.messagesService
      .getChatAsTraderPerson(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId
      )
      .subscribe((res) => {
        this.messages = res.messages.reverse();

        const messagesFromStorage = this.localStorageService.getMessages();

        if (
          messagesFromStorage === null ||
          messagesFromStorage['messNumber'] !== this.messages?.length ||
          messagesFromStorage['sessionId'] !== this.sessionIds.sessionId
        ) {
          this.localStorageService.setMessages({
            messNumber: Number(this.messages?.length),
            sessionId: Number(this.sessionIds.sessionId),
          });
        }

        this.loadingVisible = false;
      });
  }

  public onUpdateMessages(data): void {
    this.messages.push(Object.assign(data, { isInbox: true }));
  }

  public returnParentsMessage(idParent) {
    //получаем сообщение, на которое ответили
    return this.messages.find((el) => el.idMessage == idParent);
  }

  // todo avoid subscribe inside subscribe
  public onSendMessage(): void {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      textMessage: this.message,
    };

    this.messagesService
      .sendToMakler(this.user?.token, body)
      .subscribe((res) => {
        this.generalService.getServerDatetime().subscribe((time) => {
          this.messages.push({
            dateMessage: time,
            dateReply: null,
            idParent: null,
            idMessage: res.idMessage,
            isImportant: false,
            isInbox: false,
            isPublic: false,
            isSystem: false,
            text: this.message,
          });
          this.message = '';
          let objDiv = document.getElementById('divMessages');
          objDiv.scrollTop = objDiv.scrollHeight;
        });
      });
  }

  // todo avoid subscribe inside subscribe
  public onReply(idMessage): void {
    const body = {
      idSection: Number(this.sessionIds.sectionId),
      idSession: Number(this.sessionIds.sessionId),
      idMessage: idMessage,
      textMessage: this.messageReply,
      isImportant: false,
    };

    this.messagesService.reply(this.user?.token, body).subscribe((res) => {
      this.generalService.getServerDatetime().subscribe((time) => {
        this.messages.push({
          dateMessage: time,
          dateReply: null,
          idParent: idMessage,
          idMessage: res.idMessage,
          isImportant: false,
          isInbox: false,
          isPublic: false,
          isSystem: false,
          text: this.messageReply,
        });
        this.popupReply = false;
        this.messageReply = '';
        this.replyMessageInfo = null;
      });
    });
  }
}
