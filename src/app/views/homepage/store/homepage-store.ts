// store/homepage.store.ts

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { inject } from '@angular/core';
import { AuthService } from '@services';
import { tap, switchMap, first } from 'rxjs/operators';
import { EMPTY, pipe } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { IUserRoleResponse } from '../../../services/auth-service/shared';

type HomePageState = {
  userRole: string | null;
  isLoadingRole: boolean;
  roleError: string | null;
  idAuctionType: number | null;
};

const LOCAL_STORAGE_KEY = 'homePageState';

function loadStateFromLocalStorage(): HomePageState | null {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    const parsedState: HomePageState = JSON.parse(serializedState);
    if (
      typeof parsedState.userRole === 'undefined' ||
      typeof parsedState.isLoadingRole === 'undefined' ||
      typeof parsedState.roleError === 'undefined' ||
      typeof parsedState.idAuctionType === 'undefined'
    ) {
      console.warn(
        'Persisted state in localStorage is incomplete. Using initial state.'
      );
      return null;
    }
    return parsedState;
  } catch (err) {
    console.error('Error loading state from localStorage', err);
    return null;
  }
}

function saveStateToLocalStorage(state: HomePageState): void {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (err) {
    console.error('Error saving state to localStorage', err);
  }
}

const initialState: HomePageState = {
  userRole: null,
  isLoadingRole: false,
  roleError: null,
  idAuctionType: null,
};

const persistedInitialState: HomePageState =
  loadStateFromLocalStorage() || initialState;

export const HomePageStore = signalStore(
  withState(persistedInitialState),
  withDevtools('HomePageStore'),
  withMethods((store) => {
    const authService = inject(AuthService);
    const getCurrentState = (): HomePageState => {
      let currentState: HomePageState;
      patchState(store, (state) => {
        currentState = state;
        return state;
      });
      return currentState!;
    };

    return {
      loadUserRole: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, { isLoadingRole: true, roleError: null })
          ),
          first(),
          switchMap((token) => {
            if (!token) {
              patchState(store, {
                userRole: '',
                isLoadingRole: false,
                roleError: 'No token available',
              });
              saveStateToLocalStorage(getCurrentState());
              return EMPTY;
            }
            return authService.getRole(token).pipe(
              tapResponse({
                next: (role: IUserRoleResponse) => {
                  patchState(store, { userRole: role.role });
                  saveStateToLocalStorage(getCurrentState());
                },
                error: () => {
                  patchState(store, {
                    userRole: '',
                    roleError: 'Failed to load role',
                  });
                  saveStateToLocalStorage(getCurrentState());
                },
                finalize: () => {
                  patchState(store, { isLoadingRole: false });
                },
              })
            );
          })
        )
      ),

      setIdAuctionType(idAuctionType: number): void {
        patchState(store, (state) => ({
          ...state,
          idAuctionType: idAuctionType,
        }));
        saveStateToLocalStorage(getCurrentState());
      },

      saveCurrentState(): void {
        saveStateToLocalStorage(getCurrentState());
      },
      clearPersistedState(): void {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        patchState(store, initialState);
      },
    };
  })
);
