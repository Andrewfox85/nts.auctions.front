import {
  computed,
  inject,
} from '@angular/core';
import {
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { updateState } from '@angular-architects/ngrx-toolkit';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { catchError, of } from 'rxjs';
import { CommonService } from '@services';
import { IApiDataSection, IApiDataSectionsResponse, User } from '@interfaces';
import { LocalStorageService } from '@shared-services';

interface ApiState {
  sections: IApiDataSection[];
};

const SECTIONS_STORAGE_KEY = 'sections';

const initialState: ApiState = {
  sections: []
};

export const ApiStore = signalStore(
  withState(initialState),
  withDevtools('ApiStore'),

  withMethods((store) => {
    const commonService: CommonService = inject(CommonService);
    const localStorageService: LocalStorageService = inject(LocalStorageService);

    return {
      // sections
      loadSections(): void {
        const user: User = localStorageService.getUser() as User;
        const token: string = user?.token ?? '';

        commonService
          .getAllSections(token)
          .pipe(
            catchError(() => of([]))
          )
          .subscribe((sections: IApiDataSectionsResponse) => {
            this.setSections(sections.refbooks ?? []);
          });
      },
      setSections(sections: IApiDataSection[]): void {
        localStorageService.setItemToLocalStorage(SECTIONS_STORAGE_KEY, sections);
        updateState(store, 'Set Sections', { sections });
      },
      clearSections(): void {
        localStorageService.removeItemFromLocalStorage(SECTIONS_STORAGE_KEY);
        updateState(store, 'Clear Sections', { sections: [] });
      },
    };
  }),

  withHooks((store) => ({
    onInit() {
      store.loadSections();
    },
  })),

  withComputed((store) => ({
    sectionsList: computed(() => store.sections() ?? [])
  }))
);
