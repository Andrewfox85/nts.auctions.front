import { signalStore, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

type DoubleCounterAuctionState = {
  isLoading: boolean;
};

const initialState: DoubleCounterAuctionState = {
  isLoading: false,
};

export const DoubleCounterAuctionStore = signalStore(
  withState(initialState),
  withDevtools('DoubleCounterAuctionStore')
);
