import {
  Component,
  OnInit,
  SimpleChanges,
  WritableSignal,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  DxDataGridModule,
  DxSwitchModule,
  DxTooltipModule,
  DxToastModule,
} from 'devextreme-angular';
import { User } from '@classes';
import { numberEntriesPage } from '@constants';
import { DepositService, TargetedService } from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SessionInfo,
  SessionIds,
  Deposit,
  DevExtremeToastType,
} from './shared';
import { STATUS_SESSIONS } from '@enums';
import { map } from 'rxjs/operators';
import { tap } from 'rxjs';
import { ValueChangedEvent } from 'devextreme/ui/switch';
import { RuNumberFormatPipe } from '@pipes';
import { LocalStorageService } from '@shared-services';
import { DxGridContextMenuLocalizationDirective } from '../../../../shared/directives';
import { getGridInfoText, getTranslateResultByCurrentLang } from '@helpers';

@Component({
  selector: 'app-deposit',
  standalone: true,
  imports: [
    DxDataGridModule,
    DxSwitchModule,
    DxTooltipModule,
    DxToastModule,
    RuNumberFormatPipe,
    TranslateModule,
    DxGridContextMenuLocalizationDirective,
  ],
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss'],
})
export class DepositComponent implements OnInit {
  public sessionInfo = input.required<SessionInfo>();
  public sessionIds = input.required<SessionIds>();
  public tabIndex = input.required<string>();
  public isAdmissionFinished = input.required<boolean>();

  public isAddressSession = computed(() => {
    return (
      this.sessionInfo().isAllowedTargetedTransact &&
      this.sessionInfo().sessionStageId === STATUS_SESSIONS.ARCHIVE &&
      this.sessionInfo().sessionStatusId === STATUS_SESSIONS.BIDDING &&
      this.sessionInfo().datetimeEnd !== null
    );
  });

  public numberEntriesPage = numberEntriesPage;
  public isVisibleToast = false;

  public deposit: WritableSignal<any[]> = signal([]);
  public user: WritableSignal<User> = signal({
    token: '',
    lang: '',
    IsWorker: false,
  });
  public type: WritableSignal<DevExtremeToastType> = signal('info');
  public message: WritableSignal<string> = signal(' ');

  private readonly depositService = inject(DepositService);
  private readonly translate = inject(TranslateService);
  private readonly targetedService = inject(TargetedService);
  private readonly localStorageService = inject(LocalStorageService);

  get infoText(): string {
    return getGridInfoText(this.translate.store.currentLang, this.deposit()?.length);
  }

  public ngOnInit(): void {
    this.setUser();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.setUser();

    const conditionForDeposit =
      changes['tabIndex'] && changes['tabIndex'].currentValue === 'deposit';

    const conditionForIsAdmin =
      changes['isAdmissionFinished'] &&
      changes['isAdmissionFinished'].currentValue &&
      this.tabIndex() == 'deposit';

    if (conditionForDeposit || conditionForIsAdmin) {
      this.getData();
    }
  }

  private setUser(): void {
    this.user.set(this.localStorageService.getItemFromLocalStorage('user'))
  }

  private getData(): void {
    if (this.isAddressSession()) {
      if (this.user()?.IsWorker) {
        this.getDirectListDepositWorker();
      } else {
        this.getDirectListDeposit();
      }
    } else {
      if (this.user()?.IsWorker) {
        this.getListDepositWorker();
      } else {
        this.getListDeposit();
      }
    }
  }

  public changeControlDep(
    e: ValueChangedEvent,
    idFirm: number,
    idFirmClient: number,
    directionId?: number
  ): void {
    if (this.isAddressSession()) {
      // для адресных
      const body = this.generateBody(e, idFirm, idFirmClient, directionId);

      this.changeCtrlDirect(body);
    } else {
      const body = this.generateBody(e, idFirm, idFirmClient);

      this.changeCtrl(body);
    }
  }

  private generateBody(
    e: ValueChangedEvent,
    idFirm: number,
    idFirmClient: number,
    directionId?: number
  ): any {
    const body: any = {
      idSection: Number(this.sessionIds().sectionId),
      idSession: Number(this.sessionIds().sessionId),
      idFirm: idFirm,
      idFirmClient: idFirmClient,
      isControlDeposit: e.value,
    };

    if (directionId) {
      body.directionId = directionId;
    }

    return body;
  }

  private getDirectListDepositWorker(): void {
    this.targetedService
      .getDirectListDepositWorker(
        this.user()?.token,
        this.sessionIds().sectionId,
        this.sessionIds().sessionId
      )
      .pipe(
        map((res) => res.deposits),
        tap((deposits: Deposit[]) => {
          this.deposit.set(deposits);
        })
      )
      .subscribe();
  }

  private getDirectListDeposit(): void {
    this.targetedService
      .getDirectListDeposit(
        this.user()?.token,
        this.sessionIds().sectionId,
        this.sessionIds().sessionId
      )
      .pipe(
        map((res) => res.deposits),
        tap((deposits: Deposit[]) => {
          this.deposit.set(deposits);
        })
      )
      .subscribe();
  }

  private getListDepositWorker(): void {
    this.depositService
      .getListDepositWorker(
        this.user()?.token,
        this.sessionIds().sectionId,
        this.sessionIds().sessionId
      )
      .pipe(
        map((res) => res.deposits),
        tap((deposits) => {
          this.deposit.set(deposits);
        })
      )
      .subscribe();
  }

  private getListDeposit(): void {
    this.depositService
      .getListDeposit(
        this.user()?.token,
        this.sessionIds().sectionId,
        this.sessionIds().sessionId
      )
      .pipe(
        map((res) => res.deposits),
        tap((deposits) => {
          this.deposit.set(deposits);
        })
      )
      .subscribe();
  }

  private changeCtrlDirect(body: any): void {
    this.targetedService
      .changeCtrlDirect(this.user()?.token, body)
      .pipe(
        tap((res: Response) => {
          if (!res) {
            this.setDataAfterChangeCtrl();
          }
        })
      )
      .subscribe();
  }

  private changeCtrl(body: any): void {
    this.depositService
      .changeCtrl(this.user()?.token, body)
      .pipe(
        tap((res: Response) => {
          if (!res) {
            this.setDataAfterChangeCtrl();
          }
        })
      )
      .subscribe();
  }

  private setDataAfterChangeCtrl(): void {
    this.isVisibleToast = true;

    this.type.set('info');

    this.message.set(getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.depositTable.changeRes'));
  }
}
