import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ButtonState = 'default' | 'success' | 'pending';

@Injectable({ providedIn: 'root' })
export class SharedStateManagerService {
  private readonly storageKey = 'shared-button-state';
  private readonly channelName = 'shared-ui';
  private readonly channel = new BroadcastChannel(this.channelName);
  private readonly state$ = new BehaviorSubject<ButtonState>(
    this.getStoredState()
  );

  public readonly buttonState$: Observable<ButtonState> =
    this.state$.asObservable();

  constructor() {
    this.channel.onmessage = (event) => {
      const newState = event.data?.buttonState as ButtonState;
      if (newState && newState !== this.state$.value) {
        this.state$.next(newState);
        localStorage.setItem(this.storageKey, newState);
      }
    };

    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey) {
        const newState = event.newValue as ButtonState;
        if (newState && newState !== this.state$.value) {
          this.state$.next(newState);
        }
      }
    });
  }

  private getStoredState(): ButtonState {
    return (localStorage.getItem(this.storageKey) as ButtonState) || 'default';
  }

  public updateState(state: ButtonState): void {
    localStorage.setItem(this.storageKey, state);
    this.channel.postMessage({ buttonState: state });
    this.state$.next(state);
  }
}
