export interface HeaderInfo {
  fio?: string;
  nameFirm?: string;
  regNumberTrader?: string;
  traderPhone?: string;
  validTo?: number;
  isResident?: boolean;
}

export interface PrivilegesList {
  privilegesList: string[];
}

export interface RedisExchangeDataForFront {
  privileges: PrivilegesList;
  headerInfo: HeaderInfo;
}
