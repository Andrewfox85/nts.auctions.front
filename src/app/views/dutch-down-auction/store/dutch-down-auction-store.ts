import { signalStore, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

type DutchDownAuctionState = {
  isLoading: boolean;
};

const initialState: DutchDownAuctionState = {
  isLoading: false,
};

export const DutchDownAuctionStore = signalStore(
  withState(initialState),
  withDevtools('DutchDownAuctionStore')
);
