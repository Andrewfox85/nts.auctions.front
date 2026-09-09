import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationHistoryService {
  private router = inject(Router);
  private urls: string[] = [];
  private _previousUrl = new BehaviorSubject<string | null>(null);
  private _currentUrl = new BehaviorSubject<string | null>(null);

  public previousUrl$: Observable<string | null> = this._previousUrl.asObservable();
  public currentUrl$: Observable<string | null> = this._currentUrl.asObservable();

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const newCurrentUrl = event.urlAfterRedirects;
        this._previousUrl.next(this._currentUrl.value);
        this._currentUrl.next(newCurrentUrl);

        this.urls.push(newCurrentUrl);
        if (this.urls.length > 20) {
          this.urls.shift();
        }
      });
  }

  getPreviousUrl(): string | null {
    return this.urls.length > 1 ? this.urls[this.urls.length - 2] : this._previousUrl.value;
  }

  getCurrentUrlSynchronous(): string | null {
    return this._currentUrl.value;
  }
}