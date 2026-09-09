import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DxPopupModule } from 'devextreme-angular';
import { User } from '@classes';
import { DepositService } from '@services';
import { RuNumberFormatPipe } from '@pipes';

@Component({
  selector: 'app-deposit-popup',
  standalone: true,
  imports: [TranslateModule, DxPopupModule, RuNumberFormatPipe],
  templateUrl: './deposit-popup.component.html',
  styleUrls: ['./deposit-popup.component.scss'],
})
export class DepositPopupComponent implements OnInit {
  private readonly depositService = inject(DepositService);

  @Input() depositRowData;
  @Input() depositPopup;
  @Input() isAdmissionFinished;
  @Output() close = new EventEmitter<any>();

  public user: User;
  public detailsDepositOffer: any;

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  public onShowing(): void {
    if (this.depositRowData) {
      this.getDetailDepositOffer(this.depositRowData);
    }
  }

  public closePopup(): void {
    this.close.emit(false);
  }

  private getDetailDepositOffer(data: any): void {
    if (this.user?.IsWorker) {
      this.depositService
        .depositDetailsWorker(
          this.user?.token,
          data?.sectionId,
          data.sessionId,
          data.directionId,
          data.idDemandOffer
        )
        .subscribe((res) => {
          this.detailsDepositOffer = res.demoffDetails[0];
        });
    } else {
      this.depositService
        .depositDetails(
          this.user?.token,
          data.sectionId,
          data.sessionId,
          data.directionId,
          data.idDemandOffer
        )
        .subscribe((res) => {
          this.detailsDepositOffer = res.demoffDetails[0];
        });
    }
  }
}
