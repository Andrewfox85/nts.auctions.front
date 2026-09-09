export interface Registration {
  statusId: number;
  statusName: string;
  directionId: number;
  directionName: string;
  clientContractTypeId: number;
  clientContractTypeName: string;
  clientId: number;
  clientName: string;
  branchId: number;
  branchName: string;
  rejectionDate: number;
  rejectionReason: string;
  idRegistration: string;
  firmId: number;
  firmName: string;
  traderId: number;
  traderName: string;
}

export interface GetListRegistrationsWorkerResponse {
  registrations: Registration[];
}

export interface GetListRegistrationsResponse {
  registrations: Registration[];
}

export interface GetListRegistration {
  statusId: number;
  statusName: string;
  directionId: number;
  directionName: string;
  clientContractTypeId: number;
  clientContractTypeName: string;
  clientId: number;
  clientName: string;
  branchId: number;
  branchName: string;
  rejectionDate: number;
  rejectionReason: string;
}

export interface IRegistrationResult {
  idRegistration: string;
  isSuccessful: boolean;
  warningMessage: string;
}

export interface RegistrationRestoreRequest {
  idSection: number;
  idSession: number;
  registrations: RegistrationRestoreItem[];
}

export interface RegistrationRestoreItem {
  idRegistration: string;
  isControlViolations: boolean;
  isControlDeposit: boolean;
}

export interface RegistrationRestoreResponse {
  registrations: IRegistrationResult[];
}

export interface RegistrationAnnulRequest {
  idSection: number;
  idSession: number;
  registrations: RegistrationAnnulItem[];
}

export interface RegistrationAnnulItem {
  idRegistration: string;
  deleteReason: string;
}

export interface RegistrationAnnulResponse {
  registrations: IRegistrationResult[];
}



