export interface IInfoForEdit {
  concatedNameFirmClient: string;
  idBranch: number;
  idFirmClient: number;
  nameBranch: string;
}
export interface IListClientBranch
  extends Pick<IInfoForEdit, 'idBranch' | 'nameBranch'> {}
