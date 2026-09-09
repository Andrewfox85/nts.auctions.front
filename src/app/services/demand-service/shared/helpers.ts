import { Observable, throwError, TimeoutError } from 'rxjs';
import { ErrorServiceService } from '../../error-service.service';
import { IServiceError } from '@interfaces';

export function handleLongRequestTimeout(
  error: unknown,
  errorServiceService: ErrorServiceService,
  message: string
): Observable<never> {
  if (error instanceof TimeoutError) {
    const timeoutError: IServiceError = {
      error: true,
      errorStatus: 0,
      messageError: message,
    };

    errorServiceService.callErrorPopup(timeoutError);

    return throwError(() => new Error(message));
  }

  return throwError(() => error);
}
