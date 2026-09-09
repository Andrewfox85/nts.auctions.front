import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

type EnglishUpgradingAuctionState = {
  isLoading: boolean;
  idAuctionType: number;

};

const initialState: EnglishUpgradingAuctionState = {
  isLoading: false,
  idAuctionType: null,
};

export const EnglishUpgradingAuctionStore = signalStore(
  withState(initialState),
  withDevtools('EnglishUpgradingAuctionStore'),
  withMethods((store) => ({
    loadingTrue(loading: boolean): void {
      patchState(store, (state) => ({ ...state, isLoading: loading }));
    },
    setIdAuctionType(idAuctionType: number): void {
      patchState(store, (state) => ({ ...state, idAuctionType: idAuctionType }));
    }
  })),
);
