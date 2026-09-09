export interface BuceTransferStartMainResponse {
  idSection: number;
  idSession: number;
  // todo check with backend should be number, not boolean
  //   isFinalCall: number;
  isFinalCall: boolean;
}

export interface BuceTransferStartTargetResponse {
  idSection: number;
  idSession: number;
}
