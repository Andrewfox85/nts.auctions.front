import { Injectable, inject } from '@angular/core';
import { UrlTree } from '@angular/router';
import { AppConfigService } from '@services';
import { LocalStorageService } from '@shared-services';
import { Observable } from 'rxjs';
import { User } from '@interfaces';

type ReturnTypeCanActivate =
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree;

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private readonly config = inject(AppConfigService);
  private readonly localStorageService = inject(LocalStorageService);

  public canActivate(): ReturnTypeCanActivate {
    const user = this.localStorageService.getUser() as User;

    if (user?.token) {
      return true;
    }

    window.location.href = `${this.config.domain}/landingpage`;

    return false;
  }
}
