import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxPopupModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '@classes';
import { CookieService } from 'ngx-cookie-service';
import { AppConfigService, ErrorServiceService } from '@services';
import {
  SessionStorageService,
  LocalStorageService
} from '@shared-services';
import { UNAUTHORIZED_ERROR_CODE } from "@constants";

@Component({
  selector: 'error-popup',
  standalone: true,
  imports: [CommonModule, DxPopupModule, TranslateModule],
  templateUrl: './error-popup.component.html',
  styleUrls: ['./error-popup.component.scss'],
})
export class ErrorPopupComponent implements OnInit {
  private readonly config = inject(AppConfigService);
  private readonly errorServiceService = inject(ErrorServiceService);
  private readonly cookieService = inject(CookieService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly localStorageService = inject(LocalStorageService);

  public error: boolean = false;
  public messageError: string;
  public status: number;
  public user: User;

  public ngOnInit(): void {
    this.errorServiceService.componentMethodCalled$.subscribe((res) => {
      this.error = res.error;
      this.status = res.errorStatus;
      this.messageError = res.messageError.replace(/\n\r?/g, '<br />');
    });
  }

  public goToMain(): void {
    const str = `${this.config.domain}/landingpage`;

    window.location.href = str; // + "?jwt=" + this.user?.token;
  }

  public logOut(): void {
    if ([UNAUTHORIZED_ERROR_CODE].includes(this.status)) {
      this.cookieService.delete('UasToken', '/');
      this.cookieService.delete('UasMessage', '/');
      this.cookieService.delete('UasLang', '/');
      this.sessionStorageService.clearSessionStorage();
      this.localStorageService.cleanLocalStorageFieldsAfterLogOut();

      this.goToMain();
    }
  }
}
