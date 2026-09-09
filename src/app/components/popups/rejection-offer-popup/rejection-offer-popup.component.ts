import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { User } from '@classes';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ToastService,
  DemandService,
  TargetedService,
  DataRefreshService,
  TradingService,
} from '@services';
import { CommonModule } from '@angular/common';
import { DX_MODULES } from '@constants';
import { ResultPopupComponent } from '../result-popup/result-popup.component';
import { getTranslateResultByCurrentLang } from '@helpers';

@Component({
  selector: 'app-rejection-offer-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    ResultPopupComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './rejection-offer-popup.component.html',
  styleUrls: ['./rejection-offer-popup.component.scss'],
})
export class RejectionOfferPopupComponent implements OnInit {
  private readonly demandService = inject(DemandService);
  private readonly targetedService = inject(TargetedService);
  private readonly dataRefreshService = inject(DataRefreshService);
  private readonly toastService = inject(ToastService);
  private readonly formBuilder = inject(FormBuilder);
  public readonly translate = inject(TranslateService);

  @Input() rejectionPopup;
  @Input() choosenOffers;
  @Input() sessionIds;
  @Input() sessionInfo;
  @Input() directSession;
  @Output() close = new EventEmitter<any>();

  user: User;
  sessionsParam: any; //для передачи на форму результата
  rejectReason: string = '';

  rejectForm: any = this.formBuilder.group({
    reason: [null, Validators.required],
  });

  public resultPopup: boolean = false;
  public resultData: any;

  public rejectedOffersSnapshot: any[] = [];

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.sessionsParam = Object.assign(this.sessionInfo, this.sessionIds);
  }

  rejectOffer() {
    if (this.directSession) {
      //для адресных
      let listOffers = this.choosenOffers.map((item) => item.idOffer);
      const body = {
        idSection: this.sessionIds.sectionId,
        idSession: this.sessionIds.sessionId,
        listOffers: listOffers,
        rejectionText: this.rejectReason,
      };
      this.targetedService
        .offersBuceReject(this.user?.token, body)
        .subscribe((res) => {
          if (res) {
            const translations = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.directOffersTab.rejectOffersMess');
            const translateMessage = (
              template: string,
              params: { [key: string]: any }
            ) => {
              return template.replace(
                /{{\s*([^{}\s]*)\s*}}/g,
                (_, key) => params[key] ?? ''
              );
            };
            let message = translateMessage(translations, {
              numberProcessed: res.numberProcessed,
              all: listOffers?.length,
            });
            this.toastService.onShowToast({
              message: message,
              type: 'success',
            });
            //this.dataRefreshService.triggerRefresh();
            this.closePopup();
          }
        });
    } else {
      this.rejectedOffersSnapshot = [...(this.choosenOffers || [])];
      let listOffers: any[] = this.rejectedOffersSnapshot.map((item) => item.idDemandOffer);
      const body = {
        idDirection: this.rejectedOffersSnapshot[0].directionId,
        idSection: this.sessionIds.sectionId,
        idSession: this.sessionIds.sessionId,
        listDemandsOffers: listOffers,
        rejectionText: this.rejectReason,
      };
      this.demandService
        .demandsOffersReject(this.user?.token, body)
        .subscribe((res) => {
          if (res) {
            this.resultData = res;
            this.resultPopup = true;
            this.closePopup();
          }
        });
    }
  }

  closePopup() {
    this.rejectForm.get('reason').patchValue(null);
    this.rejectReason = '';
    this.close.emit(false);
  }

  public closeResultPopup(): void {
    this.resultPopup = false;
    this.rejectedOffersSnapshot = [];
    this.resultData = null;
    this.dataRefreshService.triggerRefresh();
  }
}
