import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class TabActivationService {
  public readonly tabActivated$: Subject<void> = new Subject<void>();

  public notifyTabActivated(): void {
    this.tabActivated$.next();
  }
}
