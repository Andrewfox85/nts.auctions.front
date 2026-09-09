import {
  HttpEvent,
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorServiceService, INetworkErrorMeta, NetworkErrorService } from '@services';
import { inject } from '@angular/core';
import { IServiceError } from '@interfaces';
import { getErrorMessageByCode } from '@helpers';
import { CookieService } from 'ngx-cookie-service';
import { NO_INTERNET_CONNECTION_CODE } from '../constants/api.constants';

export const ErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const cookieService: CookieService = inject(CookieService);
  const errorServiceService: ErrorServiceService = inject(ErrorServiceService);
  const networkErrorService: NetworkErrorService = inject(NetworkErrorService);

  return next(req).pipe(
    catchError((err) => {
      const lang: string = cookieService.get('UasLang');
      const networkErrorMeta: INetworkErrorMeta = networkErrorService.getMeta(
        err,
        lang
      );
      const fallbackErrorMessage: string = err.error || err.error?.message || err.statusText || err.error?.title;
      const normalizedStatus: number = networkErrorMeta.isNetworkError
        ? NO_INTERNET_CONNECTION_CODE
        : networkErrorMeta.status;

      if (normalizedStatus != null) {
        const error: IServiceError = {
          error: true,
          errorStatus: normalizedStatus,
          messageError:
            networkErrorMeta.networkErrorUserMessage ||
            getErrorMessageByCode(normalizedStatus, lang) ||
            networkErrorMeta.serverMessage ||
            fallbackErrorMessage,
        };

        errorServiceService.callErrorPopup(error);
      }

      return throwError(() => fallbackErrorMessage);
    })
  );
};
