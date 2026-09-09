import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '@classes';
import { MessagesService, SignalrService } from '@services';
import { ScrollToBottomDirective } from '@directives';
import { NgStyle, NgClass, DatePipe } from '@angular/common';
import { NewMessageComponent } from '../trading/pages/messages/new-message/new-message.component';
import { ExcelDatePipe } from '@pipes';
import {
  DxTooltipModule,
  DxDropDownButtonModule,
  DxTextAreaModule,
  DxCheckBoxModule,
  DxLoadPanelModule,
} from 'devextreme-angular';
import { HomePageStore } from '@homepage-store';
import { getAuctionPath } from '@helpers';
import { LocalStorageService } from '@shared-services';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    TranslateModule,
    DxTooltipModule,
    DxDropDownButtonModule,
    DxTextAreaModule,
    DxCheckBoxModule,
    DxLoadPanelModule,
    DatePipe,
    NgStyle,
    NgClass,
    NewMessageComponent,
    ExcelDatePipe,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  private readonly messagesService = inject(MessagesService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly signalrService = inject(SignalrService);
  private readonly store = inject(HomePageStore);
  private readonly localStorageService = inject(LocalStorageService);

  @ViewChild(ScrollToBottomDirective)
  scroll: ScrollToBottomDirective;
  @ViewChild('dropDownButton') dropDownButton: ElementRef;

  public isOpened = false; //открыт ли dx-dropdown-button
  public message: string;
  public urgentMessage = false; //срочное сообщение
  public isPopupOpen = false;
  public popupType: string;
  public replyMessage: {};
  public sectionId: number;
  public sessionId: number;
  public traderId: number;
  public user: User;
  public chatInfo: any;
  public loadingVisible = false;

  public ngOnInit(): void {
    this.user = this.localStorageService.getUser() as User;
    this.translate.use(this.localStorageService.getLanguage());

    this.activatedRoute.params.forEach((param: any) => {
      this.sectionId = param.sectionId;
      this.sessionId = param.sessionId;
      this.traderId = param.traderId;
    });

    this.loadingVisible = true;

    this.getChatAsMaklerPerson();

    if (this.signalrService.connectionIsEstablished === false) {
      //проверка на подключение к сокету
      this.signalrService
        .createConnection(this.sectionId, this.sessionId)
        .then(() => {
          this.signalrMethods();
        });
    } else {
      this.signalrMethods();
    }
  }

  private getChatAsMaklerPerson(): void {
    this.messagesService
      .getChatAsMaklerPerson(
        this.user?.token,
        this.sectionId,
        this.sessionId,
        this.traderId
      )
      .subscribe((res) => {
        this.chatInfo = res;
        this.chatInfo.messages = this.chatInfo?.messages.reverse();
        this.loadingVisible = false;
        document.title = this.chatInfo?.traderFullName;
      });
  }

  private signalrMethods(): void {
    this.signalrService.messagesUpdateStatus.subscribe((data: any) => {
      this.getMessageAsMakler(data.idMessage);
    });

    this.signalrService.messageNewPublic.subscribe((data: any) => {
      this.getMessageAsMakler(data.idMessage);
    });

    this.signalrService.messagesReplyByMaklerForMaklers.subscribe(
      (data: any) => {
        this.getMessageAsMakler(data.idMessageNew);
        this.getMessageAsMakler(data.idMessageSource);
      }
    );

    this.signalrService.messagesReplyByTraderForMaklers.subscribe(
      (data: any) => {
        this.getMessageAsMakler(data.idMessageNew);
        // this.getMessageAsMakler(data.idMessageSource)
      }
    );

    this.signalrService.messagesNewPersonalMakler.subscribe((data: any) => {
      this.getMessageAsMakler(data.idMessage);
    });

    this.signalrService.messagesNewSystemByPeriodMakler.subscribe(
      (data: any) => {
        this.messagesService
          .getListAsMaklerPeriod(
            this.user?.token,
            this.sectionId,
            this.sessionId,
            data.idTrader,
            data.periodFrom
          ).subscribe((res) => {
          res.messages.forEach(message => {
            let findMessage = this.chatInfo.messages.findIndex(
              (el) => el.idMessage == message.idMessage
            );

            if (
              message.idSender == this.traderId ||
              message.idRecipient == this.traderId ||
              message?.isSystem
            ) {
              //работнику приходит или работник отправляет
              if (findMessage != -1) {
                //Если такое сообщение уже есть, обновить
                this.chatInfo.messages[findMessage] = message;
              } //Если сообщения нет, тогда добавить
              else this.chatInfo.messages.push(message);
            }
          })

        })

      }
    );
  }

  public getMessageAsMakler(idMessage: string): void {
    //получение сведений по одному новому сообщению в качестве маклера
    this.messagesService
      .getMessageAsMakler(
        this.user?.token,
        this.sectionId,
        this.sessionId,
        idMessage
      )
      .subscribe((res) => {
        let findMessage = this.chatInfo.messages.findIndex(
          (el) => el.idMessage == res.message.idMessage
        );

        if (
          res.message.idSender == this.traderId ||
          res.message.idRecipient == this.traderId ||
          res.message?.isSystem
        ) {
          //работнику приходит или работник отправляет
          if (findMessage != -1) {
            //Если такое сообщение уже есть, обновить
            this.chatInfo.messages[findMessage] = res.message;
          } //Если сообщения нет, тогда добавить
          else this.chatInfo.messages.push(res.message);
        }
      });
  }

  public goToMessageTab(): void {
    const idAuctionType = this.store.idAuctionType();
    const auctionRootPath = getAuctionPath(idAuctionType);

    this.localStorageService.updateIsFromMessages(true);

    this.router
      .navigate([auctionRootPath, 'main-page'], {
        queryParams: {
          idSection: this.sectionId,
          idSession: this.sessionId,
        },
      })
      .then(() => {
        window.location.reload();
      });
  }

  public onChooseAction(e, chat): void {
    switch (e.itemData.id) {
      case 'replyToMess': {
        this.popupType = 'replyToMessage';
        this.isPopupOpen = true;
        this.replyMessage = {
          trader: this.chatInfo?.traderFullName,
          time: chat.dateMessage,
          message: chat.text,
          idMessage: chat.idMessage,
        };
        break;
      }

      case 'checkAnswered': {
        const body = {
          idSection: this.sectionId,
          idSession: this.sessionId,
          idMessage: chat.idMessage,
        };

        this.messagesService
          .replyMark(this.user?.token, body)
          .subscribe(() => {});

        break;
      }

      case 'addToWatched': {
        const body = {
          idSection: this.sectionId,
          idSession: this.sessionId,
          idMessage: chat.idMessage,
        };

        this.messagesService.watchAdd(this.user?.token, body).subscribe(() => {
          //todo
        });
        break;
      }

      case 'deleteToWatched': {
        const body = {
          idSection: this.sectionId,
          idSession: this.sessionId,
          idMessage: chat.idMessage,
        };

        this.messagesService
          .watchRemove(this.user?.token, body)
          .subscribe(() => {
            //todo
          });
        break;
      }
    }
  }

  public returnParentsMessage(idParent) {
    //получаем сообщение, на которое ответили
    return this.chatInfo?.messages.find((el) => el.idMessage == idParent);
  }

  public onSendMessage(): void {
    const body = {
      idSection: this.sectionId,
      idSession: this.sessionId,
      textMessage: this.message,
      idRecipient: this.traderId,
      isImportant: this.urgentMessage,
    };

    this.messagesService.sendToTrader(this.user?.token, body).subscribe(() => {
      this.message = '';
    });
  }
}
