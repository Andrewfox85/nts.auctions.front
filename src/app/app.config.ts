import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppConfigService } from '@services';
import {
  LoaderInterceptor,
  ErrorInterceptor,
  LanguageInterceptor,
  cachingInterceptor,
} from '@interceptors';

import { routes } from './app-routing.module';
import { EnglishUpgradingAuctionStore } from '../app/views/english-upgrading-auction/store/english-upgrading-auction-store';
import { HomePageStore } from '../app/views/homepage/store/homepage-store';
import { ApiStore, GlobalStore, TradingAppInfoStore, TradingShellStore } from '@store';

export function httpTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

function appConfigInit(appConfigService: AppConfigService) {
  return () => appConfigService.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),

    provideHttpClient(
      withInterceptors([
        LoaderInterceptor,
        ErrorInterceptor,
        LanguageInterceptor,
        cachingInterceptor,
      ])
    ),

    importProvidersFrom(
      BrowserModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: httpTranslateLoader,
          deps: [HttpClient],
        },
        defaultLanguage: 'RU',
      })
    ),

    {
      provide: APP_INITIALIZER,
      useFactory: appConfigInit,
      multi: true,
      deps: [AppConfigService],
    },
    AppConfigService,
    EnglishUpgradingAuctionStore,
    HomePageStore,
    ApiStore,
    GlobalStore,
    TradingAppInfoStore,
    TradingShellStore,
  ],
};
