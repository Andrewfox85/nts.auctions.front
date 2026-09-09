import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { TradingService, TransactionService} from '@services';
import { User } from '@classes';
import { TranslateModule, TranslateService,  } from '@ngx-translate/core';

import { CommonModule } from '@angular/common';
import { DX_MODULES } from '@constants';

@Component({
  selector: 'app-restore-deal-popup',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...DX_MODULES],
  templateUrl: './restore-deal-popup.component.html',
  styleUrls: ['./restore-deal-popup.component.scss'],
})
export class RestoreDealPopupComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);

  @Input() restorePopup;
  @Input() choosenDeals;
  @Input() sessionIds;
  @Output() close = new EventEmitter<any>();
  @Output() dealRestored = new EventEmitter<any>();

  user: User;
  isVisibleToast = false;
  offerNumber: any;


  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  restoreDeal() {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      idTransaction: this.choosenDeals[0]?.idTransaction,
    };

    this.transactionService
      .transactionRestore(this.user?.token, body)
      .subscribe((res) => {
        let lotNumber = this.choosenDeals[0]?.demandOfferInfo
          ? this.choosenDeals[0]?.demandOfferInfo.lotNumber
          : this.choosenDeals[0]?.goodInfo.lotNumber;
        this.offerNumber = {
          offerNumber: lotNumber,
        };
        this.isVisibleToast = true;

        this.dealRestored.emit({ transactionId: body.idTransaction });
        this.closePopup();
      });
  }

  closePopup() {
    this.close.emit(false);
  }
}
