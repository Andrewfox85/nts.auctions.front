import { AUCTION_TYPE } from '../enums/';

export function getAuctionPath(type: number): string {
  switch (type) {
    case AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION:
      return 'english-upgrading-auction';
    case AUCTION_TYPE.DUTCH_DOWN_AUCTION:
      return 'dutch-down-auction';
    case AUCTION_TYPE.DOUBLE_COUNTER_AUCTION:
      return 'double-counter-auction';
    default:
      console.warn(
        `Unknown auction type ${type}, redirecting to the home page`
      );
      return '';
  }
}

export function getPathDealsEditTranstaction(type: number): string {
  switch (type) {
    case AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION:
      return 'GetBuyersToTransactionEdit';
    case AUCTION_TYPE.DUTCH_DOWN_AUCTION:
      return 'GetSellersToTransactionEdit';
    default:
      console.warn(
        `Unknown auction type ${type}`
      );
      return '';
  }
}

export function getPathDealsEdit(type: number): string {
  switch (type) {
    case AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION:
      return 'BuyerTransactionsEdit';
    case AUCTION_TYPE.DUTCH_DOWN_AUCTION:
      return 'sellerTransactionsEdit';
    default:
      console.warn(
        `Unknown auction type ${type}`
      );
      return '';
  }
}