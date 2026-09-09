export interface SessionWorkerBuceAdmissionStartResponse {
  idSection: number;
  idSession: number;
  isControlViolations?: boolean;
  isControlDeposit?: boolean;
  isShortCycle?: boolean;
  isControlBySpecialRules?: boolean;
}

export interface AdmissionOption {
  isAdmissionControlViols: boolean;
  isAdmissionControlDeposit: boolean;
  isAdmissionBySpecialRules: boolean;
}

export interface GetAdmissionOptionsResponse {
  admissionOptions: AdmissionOption[];
}
