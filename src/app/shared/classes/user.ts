export class User {
  token: string;
  lang: string;
  // role: number;
  IsWorker: boolean;
  userInfo?: {
    firmName?: string;
    traderEmail?: string;
    traderFullName?:string;
    traderPhone?: string;
    firmNameShort?: boolean;
    traderFIO?: string;
    lang?: string;
    publicKeyDateEnd?: string;
    traderRegNum?: string;
    firmId?: number;
    validTo?: number;
    isResident?: boolean;
  };
  userPrivileges?: any = {};
}
