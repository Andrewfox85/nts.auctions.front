/**
 * NgRx Signal Store активной вкладки торгов и привязки к сессии (section/session).
 * Дублирует ключевые данные в localStorage для восстановления после перезагрузки (v1 + v2).
 */
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { isTradingV2TabPath, TradingTab } from '../features/trading-v2/shared';
import { LocalStorageService } from '@shared-services';

const TRADING_APP_INFO_STORAGE_KEY: string = 'tradingAppInfo';

/** Сохранённое состояние: активная вкладка и идентификаторы сессии. */
export type TradingAppInfo = {
  activeTab: TradingTab;
  idSection: number;
  idSession: number;
};

/** Ссылка на сессию из URL или API (id могут приходить как string). */
export type TradingAppInfoSessionRef = {
  idSection: number | string;
  idSession: number | string;
};

const initialState: TradingAppInfo = {
  activeTab: null,
  idSection: null,
  idSession: null,
};

/** Нормализует idSection/idSession к числам для сравнения и записи в store. */
function toSessionNumbers(session: TradingAppInfoSessionRef): { idSection: number; idSession: number } {
  return {
    idSection: Number(session.idSection),
    idSession: Number(session.idSession),
  };
}

/** Проверяет, что две ссылки указывают на одну и ту же торговую сессию. */
function isSameSession(a: { idSection: number; idSession: number }, b: TradingAppInfoSessionRef): boolean {
  const other: { idSection: number; idSession: number } = toSessionNumbers(b);
  return a.idSection === other.idSection && a.idSession === other.idSession;
}

/** Парсит и валидирует объект из localStorage; отбрасывает неизвестные вкладки. */
function parsePersisted(value: unknown): TradingAppInfo | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data: TradingAppInfo = value as TradingAppInfo;
  const idSection: number = Number(data.idSection);
  const idSession: number = Number(data.idSession);

  const activeTab: TradingTab | null =
    data.activeTab == null
      ? null
      : isTradingV2TabPath(data.activeTab)
        ? data.activeTab
        : null;

  return { activeTab, idSection, idSession };
}

export const TradingAppInfoStore = signalStore(
  withState(initialState),
  withDevtools('TradingAppInfo'),
  withMethods((store) => {
    const localStorageService: LocalStorageService = inject(LocalStorageService);
    /** Возвращает idSection/idSession из store или null, если сессия ещё не привязана. */
    const getBoundSession = (): {
      idSection: number;
      idSession: number;
    } => {
      const idSection: number = store.idSection();
      const idSession: number = store.idSession();

      if (idSection == null || idSession == null) {
        return null;
      }

      return { idSection, idSession };
    };

    /** Записывает activeTab и id сессии в localStorage. */
    const persist = (idSection: number, idSession: number): void => {
      const payload: TradingAppInfo = {
        activeTab: store.activeTab(),
        idSection,
        idSession,
      };

      localStorageService.setItemToLocalStorage(
        TRADING_APP_INFO_STORAGE_KEY,
        payload
      );
    };

    return {
      /** Привязывает store к section/session без смены активной вкладки. */
      bindSession(idSection: number | string, idSession: number | string): void {
        const { idSection: section, idSession: session }: {
          idSection: number;
          idSession: number;
        } = toSessionNumbers({ idSection, idSession });
        patchState(store, (prev) => ({
          ...prev,
          idSection: section,
          idSession: session,
        }));
      },
      /** Устанавливает активную вкладку для сессии и при необходимости сохраняет в localStorage. */
      setActiveTab(tab: TradingTab, session: TradingAppInfoSessionRef): void {
        const { idSection, idSession }: { idSection: number; idSession: number } = toSessionNumbers(session);
        patchState(store, (prev) => ({
          ...prev,
          activeTab: tab,
          idSection,
          idSession,
        }));

        if (tab != null) {
          persist(idSection, idSession);
        }
      },
      /** Возвращает активную вкладку, если store привязан к той же сессии; иначе null. */
      getActiveTab(session: TradingAppInfoSessionRef): TradingTab | null {
        const bound: { idSection: number; idSession: number } = getBoundSession();

        if (!bound || !isSameSession(bound, session)) {
          return null;
        }

        return store.activeTab();
      },
      /** true, если указанная вкладка активна для данной сессии. */
      isActive(tab: TradingTab, session: TradingAppInfoSessionRef): boolean {
        return this.getActiveTab(session) === tab;
      },
      /** true, если активная вкладка входит в переданный список. */
      isAnyActive(session: TradingAppInfoSessionRef, ...tabs: TradingTab[]): boolean {
        const current = this.getActiveTab(session);
        return current != null && tabs.includes(current);
      },
      /** Восстанавливает activeTab из localStorage при совпадении сессии или сбрасывает вкладку. */
      restoreFromStorage(idSection: number | string, idSession: number | string): void {
        const session: { idSection: number | string, idSession: number | string } = { idSection, idSession };
        const saved: TradingAppInfo = parsePersisted(
          localStorageService.getItemFromLocalStorage<TradingAppInfo>(
            TRADING_APP_INFO_STORAGE_KEY
          )
        );

        if (!saved || !isSameSession(saved, session)) {
          const { idSection, idSession } = toSessionNumbers(session);
          patchState(store, () => ({
            activeTab: null,
            idSection,
            idSession,
          }));

          return;
        }
        patchState(store, () => saved);
      },
      /** Сохраняет текущее состояние в localStorage, если store привязан к этой сессии. */
      persistToStorage(idSection: number | string, idSession: number | string): void {
        const session: { idSection: number | string, idSession: number | string } = { idSection, idSession };
        const bound: { idSection: number, idSession: number } = getBoundSession();

        if (!bound || !isSameSession(bound, session)) {
          return;
        }

        persist(bound.idSection, bound.idSession);
      },
      /** Удаляет запись tradingAppInfo из localStorage без сброса store. */
      clearStorage(): void {
        localStorageService.removeItemFromLocalStorage(
          TRADING_APP_INFO_STORAGE_KEY
        );
      },
      /** Сбрасывает store к initialState и очищает localStorage. */
      reset(): void {
        patchState(store, () => ({ ...initialState }));
        localStorageService.removeItemFromLocalStorage(
          TRADING_APP_INFO_STORAGE_KEY
        );
      },
    };
  })
);


