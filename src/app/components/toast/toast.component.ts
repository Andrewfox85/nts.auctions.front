import { Component, OnInit, inject } from '@angular/core';
import { ToastService } from '@services';
import { TranslateModule } from '@ngx-translate/core';
import { DX_MODULES } from '@constants';
import { DxToastModule } from 'devextreme-angular';

type DevExtremeToastType = 'info' | 'warning' | 'error' | 'success';

@Component({
  selector: 'toast',
  standalone: true,
  imports: [
    TranslateModule,
    DxToastModule
  ],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent implements OnInit {
  private readonly toastService = inject(ToastService);

  public isVisibleToast = false;
  public message: string;
  public type: DevExtremeToastType = 'info';

  public ngOnInit(): void {
    this.toastService.componentToast$.subscribe((res) => {
      this.isVisibleToast = true;
      this.type = res.type;
      this.message = res.message;
    });
  }
}
