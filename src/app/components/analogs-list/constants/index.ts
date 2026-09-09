import { FILTER_ITEM_ID, FILTER_ITEM_NAME } from '../enums';

export enum Status {
  Empty = 0,
  Default,
  Approved,
  Rejected,
}

export const ID_REFERENCE_NAME = 4;

export const FILTER_ITEMS = [
  { id: FILTER_ITEM_ID.All, name: FILTER_ITEM_NAME.All },
  { id: FILTER_ITEM_ID.Approved, name: FILTER_ITEM_NAME.Approved },
  { id: FILTER_ITEM_ID.Rejected, name: FILTER_ITEM_NAME.Rejected },
  { id: FILTER_ITEM_ID.NotReviewed, name: FILTER_ITEM_NAME.NotReviewed },
];
