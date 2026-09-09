import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

interface ISaveWithPendingHandlers<T> {
  next: (value: T) => void;
  error?: (error: unknown) => void;
}

// общий метод для управления pending флагом для запроса
export function saveWithPending<T>(
  request$: Observable<T>,
  setPending: (pending: boolean) => void,
  handlers: ISaveWithPendingHandlers<T>
): Subscription {
  setPending(true);

  return request$
    .pipe(finalize(() => setPending(false)))
    .subscribe({
      next: handlers.next,
      error: handlers.error,
    });
}
