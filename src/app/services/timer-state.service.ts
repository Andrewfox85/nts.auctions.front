import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerStateService {
  public readonly isPaused: WritableSignal<boolean> = signal(false);

  setPauseState(paused: boolean): void {
    this.isPaused.set(paused);
  }

  togglePauseState(): void {
    this.isPaused.update(currentValue => !currentValue);
  }

  getCurrentPauseState(): boolean {
    return this.isPaused();
  }
}