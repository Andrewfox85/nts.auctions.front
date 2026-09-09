import { GRID_MENU_TEXT } from '../enums';
import { PositionConfig } from 'devextreme/common/core/animation';

const EDITABLE_PRICE_INTERFACE_ID = 47;

const POPUP_SIDEBAR_TYPE = {
  EDIT_OFFER: 'editOffer',
  SUBMIT_COUNTER_OFFERS: 'submitCounterOffers',
  EDIT_DEAL: 'editDeal',
  ANALOG_LIST: 'analogList',
  COMPARE_OFFER: 'compareOffer',
  VIEW_OFFER_FROM_OFFERS: 'viewOfferFromOffers',
  VIEW_OFFER_FROM_AUCTIONS: 'viewOfferFromAuctions',
  SUBMIT_BID_TO_BUY: 'submitBidToBuy',
  COUNTER_OFFERS: 'counterOffers',
  VIEW_DEAL: 'viewDeal',
  RULES_FOR_EDITING: 'rulesForEditing'
};

export { EDITABLE_PRICE_INTERFACE_ID, POPUP_SIDEBAR_TYPE };

export const EMTY_STEP_PRICE = 0;
export const MINIMUM_STEP_PRICE = 0.01;

export const TARGET_HEADER = 'header';

export const RU_LOCALE = 'ru';

export const GRID_MENU_TRANSLATIONS: Record<string, string> = {
  [GRID_MENU_TEXT.MOVE_TO_THE_LEFT]: 'Переместить влево',
  [GRID_MENU_TEXT.MOVE_TO_THE_RIGHT]: 'Переместить вправо',
  [GRID_MENU_TEXT.UNFIX]: 'Открепить',
  [GRID_MENU_TEXT.SET_FIXED_POSITION]: 'Закрепить столбец',
  [GRID_MENU_TEXT.LEFT]: 'Закрепить слева',
  [GRID_MENU_TEXT.RIGHT]: 'Закрепить справа',
  [GRID_MENU_TEXT.STICKY]: 'Закрепить как липкий',
};

export const EMPTY_STRING = '';

export const OWN_FUNDS = '1';

export const DEFAULT_COLUMN_CHOOSER_POSITION: PositionConfig = {
  my: 'right top',
  at: 'right top',
  offset: '0 0',
  of: '.main_component',
};
