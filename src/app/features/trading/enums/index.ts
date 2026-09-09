export enum EOfferStatusId {
  ACTIVE = 3,
  INACTIVE = 2,
  DECLINED = 1,
}

export enum EOfferStatusName {
  ACTIVE = 'Активная',
  INACTIVE = 'Неактивная',
  DECLINED = 'Отклонена',
}

export enum NewTabType {
  REGS_ACTIVE = 'regsActive',
  REGS_INACTIVE = 'regsInactive',
  REGS_DECLINED = 'regsDeclined',
  OFFERS_SALE_ACTIVE = 'offersSaleActive',
  OFFERS_SALE_INACTIVE = 'offersSaleInactive',
  OFFERS_SALE_DECLINED = 'offersSaleDeclined',
  OFFERS_BUY_ACTIVE = 'offersBuyActive',
  OFFERS_BUY_INACTIVE = 'offersBuyInactive',
  OFFERS_BUY_DECLINED = 'offersBuyDeclined',
}

export const REGISTRATION_NEW_TAB_TYPES: NewTabType[] = [
  NewTabType.REGS_ACTIVE,
  NewTabType.REGS_INACTIVE,
  NewTabType.REGS_DECLINED,
];

export function isRegistrationNewTabType(type: string): boolean {
  return (REGISTRATION_NEW_TAB_TYPES as string[]).includes(type);
}

export enum MARKET_TYPES {
  DOMESTIC = 'DOMESTIC',
  IMPORT = 'IMPORT',
  FOREIGN = 'FOREIGN',
  EXPORT = 'EXPORT'
}
