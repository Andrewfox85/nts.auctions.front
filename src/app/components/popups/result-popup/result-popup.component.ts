import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {AgreementType, DX_MODULES} from '@constants';
import { HomePageStore } from '@homepage-store';
import { getAuctionPath } from '@helpers';
import { getTranslateResultByCurrentLang } from '@helpers';

@Component({
  selector: 'app-result-popup',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...DX_MODULES],
  templateUrl: './result-popup.component.html',
  styleUrls: ['./result-popup.component.scss'],
})
export class ResultPopupComponent implements OnInit {
  @Input() resultPopup;
  @Input() resultPopupType;
  @Input() resultData;
  @Input() choosenOffers;
  @Input() sessionsParam;

  @Output() close = new EventEmitter<any>();

  private readonly store = inject(HomePageStore);
  private readonly translate = inject(TranslateService);

  constructor(private router: Router) {}

  ngOnInit(): void {}

  closePopup() {
    this.close.emit(false);
  }

  onViewDetail() {
    let outputArray = [];
    if (this.resultPopupType === 'reject') {
      this.choosenOffers.forEach((off) => {
        this.resultData.listFailures.forEach((fail) => {
          if (fail.id == off.idDemandOffer) {
            outputArray.push(
              Object.assign(
                {
                  firmName: off.demoffOwner.concatedFirmName,
                  clientContractTypeName:
                    off.demoffOwner.clientContractTypeName,
                  clientName: off.demoffOwner.concatedclientName,
                  branchName: off.demoffOwner.branchName,
                  traderName: off.demoffOwner.traderName,
                  description: fail.reason,
                },
                {}
              )
            );
          }
        });
      });
    } else {
      this.choosenOffers.forEach((off) => {
        this.resultData.forEach((fail) => {
          if (fail.demandOfferId == off.idDemandOffer) {
            const commissionText = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.commissionAgreement');

            const agencyText = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'general.agencyAgreement');

            outputArray.push(
              Object.assign(
                {
                  firmName: off.demoffOwner.concatedFirmName,
                  clientContractTypeName:
                    off.demoffOwner.clientContractType == AgreementType.Commission
                      ? commissionText
                      : off.demoffOwner.clientContractType == AgreementType.Agency
                        ? agencyText
                        : "",
                  clientName: off.demoffOwner.concatedClientName,
                  branchName: off.demoffOwner.branchName,
                  traderName: off.demoffOwner.traderName,
                  description: fail.errorMessage,
                },
                {}
              )
            );
          }
        });
      });
    }

    let title =
      this.resultPopupType === 'reject'
        ? 'Результат отклонения заявок'
        : 'Результат активации заявок';

    const idAuctionType = this.store.idAuctionType();
    const auctionRootPath = getAuctionPath(idAuctionType);
    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        [`auctions/${auctionRootPath}/main-page/detailInfo`],
        {
          queryParams: {
            json: JSON.stringify(outputArray),
            session: JSON.stringify(this.sessionsParam),
            title: title,
          },
        }
      )
    );
    window.open(url, '_blank');
  }
}
