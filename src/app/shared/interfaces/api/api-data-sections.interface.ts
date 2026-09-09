export interface IApiDataSection {
  id: string;
  name: string;
  description: string;
}

export interface IApiDataSectionsResponse {
  refbooks: IApiDataSection[]
}
