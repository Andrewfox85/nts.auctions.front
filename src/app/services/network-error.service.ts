import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_INTERNET_CONNECTION_CODE } from '@constants';
import { getTranslateResultByCurrentLang } from '@helpers';

export interface INetworkErrorMeta {
  isHttpError: boolean;
  isNetworkError: boolean;
  isOffline: boolean;
  isTimeout: boolean;
  status: number | null;
  serverMessage: string | null;
  networkErrorUserMessage: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class NetworkErrorService {
  private readonly networkErrorCodes: string[] = [
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_CHANGED',
    'ERR_NAME_NOT_RESOLVED',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_TIMED_OUT',
    'net::ERR_TIMED_OUT',
  ];

  public getMeta(error: unknown, lang: string = 'RU'): INetworkErrorMeta {
    // обработка любой не сетевой ошибки
    if (!(error instanceof HttpErrorResponse)) {
      return {
        isHttpError: false,
        isNetworkError: false,
        isOffline: false,
        isTimeout: false,
        status: null,
        serverMessage: null,
        networkErrorUserMessage: null,
      };
    }

    const serverMessage =
      error.error?.Message || error.error?.message || error.error?.title || null;

    const isNamedBrowserNetworkError: boolean = this.hasKnownNetworkErrorCode(
      error.message,
      error.statusText,
      serverMessage
    );

    const isTimeout: boolean =
      this.hasTimeoutWord(error.message) ||
      this.hasTimeoutWord(serverMessage);

    const isStatusZero: boolean = error.status === NO_INTERNET_CONNECTION_CODE;
    const isOffline: boolean = isStatusZero && !this.isOnline();
    const isNetworkError: boolean =
      isStatusZero || isOffline || isTimeout || isNamedBrowserNetworkError;

    return {
      isHttpError: true,
      isNetworkError,
      isOffline,
      isTimeout,
      status: error.status,
      serverMessage,
      networkErrorUserMessage: isNetworkError ? this.getNetworkFailureMessage(lang) : null,
    };
  }

  private isOnline(): boolean {
    return navigator.onLine;
  }

  private hasTimeoutWord(value: unknown): boolean {
    if (typeof value === 'string') {
      return value.toLowerCase().includes('timeout');
    }
    return false;
  }

  private hasKnownNetworkErrorCode(...messages: unknown[]): boolean {
    const normalizedMessages: string[] = messages
      .filter((message): message is string => typeof message === 'string')
      .map((message: string) => message.toUpperCase());

    return this.networkErrorCodes.some((errorCode: string) =>
      normalizedMessages.some((message: string) => message.includes(errorCode))
    );
  }

  private getNetworkFailureMessage(lang: string): string {
    return getTranslateResultByCurrentLang(lang.toUpperCase(), 'errors.networkOperationFailure');
  }
}
