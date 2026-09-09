import { inject, Injectable } from '@angular/core';
import { LANGUAGE } from '@enums';
import { User, Messages } from '@interfaces';
import { TradingShellStore } from '@store';

export interface SelectedTabState {
  tabName: string;
  tabIndex: number;
  isFromMessages: boolean;
  idSession: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly tradingShellStore = inject(TradingShellStore);

  private readonly userKey = 'user';
  private readonly storageKey = 'selectedTabState';
  private readonly langKey = 'lang';
  private readonly messagesKey = 'messages';

  public setItemToLocalStorage<T = unknown>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);

      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(
        `Ошибка при сохранении данных в localStorage по ключу "${key}":`,
        error
      );
    }
  }

  public getItemFromLocalStorage<T = unknown>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);

      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(
        `Ошибка при получении данных из localStorage по ключу "${key}":`,
        error
      );
      return null;
    }
  }

  public removeItemFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(
        `Ошибка при удалении данных из localStorage по ключу "${key}":`,
        error
      );
    }
  }

  public getUser(): User | {} {
    const userData = localStorage.getItem(this.userKey);

    if (!userData) return {};

    try {
      return JSON.parse(userData);
    } catch {
      return {};
    }
  }

  public getLanguage(): LANGUAGE {
    const lang = localStorage.getItem(this.langKey);

    if (!lang) return LANGUAGE.RU;

    try {
      const parsedLang = JSON.parse(lang);

      if (Object.values(LANGUAGE).includes(parsedLang)) {
        return parsedLang as LANGUAGE;
      }

      return LANGUAGE.RU;
    } catch {
      return LANGUAGE.RU;
    }
  }

  public setLanguage(language: LANGUAGE): void {
    localStorage.setItem(this.langKey, JSON.stringify(language));
  }

  public setSelectedTab(state: SelectedTabState): void {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  public getSelectedTab(): SelectedTabState | null {
    const value = localStorage.getItem(this.storageKey);

    if (!value) return null;

    try {
      const parsed = JSON.parse(value) as SelectedTabState;

      if (!parsed || typeof parsed.tabIndex !== 'number') return null;

      return parsed;
    } catch {
      return null;
    }
  }

  public removeSelectedTab(): void {
    localStorage.removeItem(this.storageKey);
  }

  public getMessages(): Messages | {} {
    const messages = localStorage.getItem(this.messagesKey);

    if (!messages) return null;

    try {
      return JSON.parse(messages);
    } catch {
      return null;
    }
  }

  public updateIsFromMessages(isFromMessages: boolean): void {
    const currentState = this.getSelectedTab();

    if (!currentState) {
      return;
    }

    const updatedState: SelectedTabState = {
      tabName: currentState.tabName,
      tabIndex: currentState.tabIndex,
      isFromMessages: isFromMessages,
      idSession: currentState.idSession
    };

    this.setSelectedTab(updatedState);
  }

  public setMessages(messages: Messages): void {
    localStorage.setItem(this.messagesKey, JSON.stringify(messages));
  }

  public cleanLocalStorageFieldsAfterSessionExit(): void {
    this.removeItemFromLocalStorage('auctions');
    this.removeItemFromLocalStorage('appOffersNts');
    this.removeItemFromLocalStorage('registrations');
    this.removeItemFromLocalStorage('traders');
    this.removeItemFromLocalStorage('deposit');
    this.removeItemFromLocalStorage('deals');
    this.removeItemFromLocalStorage('messages');
    Object.keys(localStorage)
      .filter(key => key.startsWith('offers_status'))
      .forEach(key => this.removeItemFromLocalStorage(key));
  }

  public cleanLocalStorageFieldsAfterLogOut(): void {
    this.removeItemFromLocalStorage('user');
    this.removeItemFromLocalStorage('auth-token');
    this.removeItemFromLocalStorage('auth-user');
    this.removeItemFromLocalStorage('privileges');
    this.removeItemFromLocalStorage('sections');
    this.removeItemFromLocalStorage('autoControlChanges');
    this.removeItemFromLocalStorage('viewOffer');
    this.removeItemFromLocalStorage('returnUrl');
    this.removeItemFromLocalStorage('lang');
    this.removeItemFromLocalStorage('locale');
    this.cleanLocalStorageFieldsAfterSessionExit();

    this.removeSelectedTab();
    this.removeItemFromLocalStorage('tradingAppInfo');
    this.tradingShellStore?.clear();
  }
}
