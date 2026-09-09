import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRefreshService {
  private readonly refreshTrigger = new Subject<void>();
  public readonly refresh$ = this.refreshTrigger.asObservable();

  triggerRefresh(): void {
    this.refreshTrigger.next();
  }
}