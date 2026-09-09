import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { User } from '@classes';
import { TargetedService } from '@services';
import { ToastService } from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DX_MODULES } from '@constants';
import { getTranslateResultByCurrentLang } from '@helpers';

@Component({
    selector: 'app-delete-offer-popup',
    standalone: true,
    imports: [CommonModule, TranslateModule, ...DX_MODULES],
    templateUrl: './delete-offer-popup.component.html',
    styleUrls: ['./delete-offer-popup.component.scss']
})
export class DeleteOfferPopupComponent implements OnInit {
  @Input() deletePopup;
  @Input() choosenOffer;
  @Input() sessionIds;
  @Output() close = new EventEmitter<any>();

  user: User;

  private readonly targetedService = inject(TargetedService);

  constructor(
    public toastService: ToastService,
    public translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  onShowing(e){
    
  }

  public deleteOffer(): void {
    const body = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      idOffer: this.choosenOffer[0]?.idOffer
   }

    this.targetedService.offersDelete(this.user?.token, body).subscribe((res) => {
      let message = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.directOffersTab.deleteOfferMess');
      this.toastService.onShowToast({message: message, type: 'success'});
      this.closePopup()
    })
  }

  closePopup(){
    this.close.emit(false)
  }
}
