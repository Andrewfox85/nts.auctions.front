import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

type GlobalState = {
  fullInfo: any;
  sessionIds: any;
  dataForReq: any;
  idDirectionRole: any;
  sectionId: number | null;
  sessionId: number | null;
  idAuctionType: number | null;
  sessionInfo: any;
  analogGood: any | null;
};

const initialState: GlobalState = {
  fullInfo: null,
  sessionIds: null,
  dataForReq: null,
  idDirectionRole: null,
  sessionInfo: null,
  sectionId: null,
  sessionId: null,
  idAuctionType: null,
  analogGood: null,
};

const DB_NAME = 'GlobalStoreDB';
const STORE_NAME = 'MainSessionInfo';

let dbInstance: IDBDatabase | null = null;

const openDB = (): Observable<IDBDatabase> => {
  if (dbInstance) return of(dbInstance);

  return new Observable((observer) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      observer.next(dbInstance);
    };

    request.onerror = () => observer.error(request.error);
  });
};

const saveToDB = <T>(key: string, value: T): Observable<boolean> =>
  openDB().pipe(
    switchMap((db) => {
      return new Observable<boolean>((observer) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(value, key);
          tx.oncomplete = () => observer.next(true);
          tx.onerror = () => observer.error(tx.error);
        } catch (err) {
          observer.error(err);
        }
      });
    })
  );

const getFromDB = <T>(key: string): Observable<T | null> =>
  openDB().pipe(
    switchMap((db) => {
      return new Observable<T | null>((observer) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const request = tx.objectStore(STORE_NAME).get(key);

          request.onsuccess = () => {
            observer.next((request.result as T) ?? null);
            observer.complete();
          };

          request.onerror = () => observer.error(request.error);
        } catch (err) {
          observer.error(err);
        }
      });
    })
  );

export const GlobalStore = signalStore(
  withState(initialState),
  withDevtools('GlobalStore'),

  withMethods((store) => ({
    setMainSessionInfo({
      sectionId,
      sessionId,
      idAuctionType,
    }: {
      sectionId: number;
      sessionId: number;
      idAuctionType: number;
    }): void {
      saveToDB('sectionId', sectionId).subscribe();
      saveToDB('sessionId', sessionId).subscribe();
      saveToDB('idAuctionType', idAuctionType).subscribe();
      patchState(store, (state) => ({
        ...state,
        sectionId,
        sessionId,
        idAuctionType,
      }));
    },

    restoreSessionInfo(): void {
      getFromDB<number>('sectionId')
        .pipe(
          switchMap((sectionId) =>
            getFromDB<number>('sessionId').pipe(
              switchMap((sessionId) =>
                getFromDB<number>('idAuctionType').pipe(
                  tap((idAuctionType) => {
                    patchState(store, (state) => ({
                      ...state,
                      sectionId,
                      sessionId,
                      idAuctionType,
                    }));
                  })
                )
              )
            )
          )
        )
        .subscribe();
    },
    setFullInfo(fullInfo: any): void {
      patchState(store, (state) => ({ ...state, fullInfo }));
    },

    setSessionIds(sessionIds: any): void {
      patchState(store, (state) => ({ ...state, sessionIds }));
    },

    setDataForReq(dataForReq: any): void {
      patchState(store, (state) => ({ ...state, dataForReq }));
    },

    setIdDirectionRole(idDirectionRole: any): void {
      patchState(store, (state) => ({ ...state, idDirectionRole }));
    },

    setSessionInfo(sessionInfo: any): void {
      patchState(store, (state) => ({ ...state, sessionInfo }));
    },

    setAnalogGood(analogGood: any): void {
      patchState(store, (state) => ({ ...state, analogGood }));
    },
  })),

  withComputed((store) => ({
    mainSessionInfo: computed(() => ({
      sectionId: store.sectionId(),
      sessionId: store.sessionId(),
      idAuctionType: store.idAuctionType(),
    })),
  })),

  withComputed((store) => ({
    transactionGeneral: computed(
      () => store.fullInfo()?.['transactionGeneral'] || []
    ),
    idDemand: computed(
      () => store.fullInfo()?.['generalInfo']?.['idDemandOffer']
    ),
    idModel: computed(() => store.fullInfo()?.['generalInfo']?.['idModel']),
    idGoodGroup: computed(
      () => store.fullInfo()?.['goods']?.[0]?.['idGoodGroup']
    ),
    goodName: computed(() => store.fullInfo()?.['goods']?.[0]?.['goodName']),
    nomenclatureGroup: computed(
      () => store.fullInfo()?.['goods']?.[0]?.['nomenclatureGroup']
    ),
    idNomenclatureGroup: computed(
      () => store.fullInfo()?.['goods']?.[0]?.['idNomenclatureGroup']
    ),
    selectedAnalog: computed(() => store.analogGood()),
  })),

  withComputed((store) => ({
    idSection: computed(() => store.dataForReq()?.['sectionId']),
    idSession: computed(() => store.dataForReq()?.['sessionId']),
  })),

  withComputed((store) => ({
    computedSessionInfo: computed(() => store.sessionInfo()),
  }))
);
