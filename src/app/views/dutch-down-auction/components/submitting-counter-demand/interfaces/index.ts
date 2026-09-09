
export interface IFiltering {
  search: string;
  product: number;
}

export interface IAnalogGoodsGroup {
  idGoodGroup: number;
  goodName: string;
}

export interface ValueItem {
  idValue: number;
  valueName: string;
  idLink?: number;
  idLinkParent?: number;
}

export interface GoodValue {
  idReference: number;
  referenceName: string;
  listValues: ValueItem[] | null;
  isAllowAnalogs: boolean;
  valuesFromNsi?: boolean;
  parentIdReference?: number;
  idLink?: number;
  idLinkParent?: number;
  level?: number;
}

export interface GoodSpecification {
  idDemandOfferGood: number;
  idInterfaceField: number;
  fieldValueNumber: number | null;
  fieldValueString: string | null;
  fieldName: string | null;
  fieldPrecision: number;
  controlFieldType: string | null;
  fieldValue: string | null;
  blockId: number;
  isVirtual: boolean;
}
export interface GoodProperty {
  propertyName: string;
  propertyValue: string;
}

export interface GoodAnalog {
  goodValues: GoodValue[];
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGoodName: number;
  idGood: number | null;
  goodName: string;
  goodDescription: string;
  goodsSpecifications: GoodSpecification[];
  properties: GoodProperty[];
  unitId: number;
  unitName: string;
}

export interface OutputRefsResult {
  idReference: number;
  idValue: number;
}

export interface OutputNsiRefsResult {
  idReference: number;
  idValue: number;
  referenceName: string;
  valueName: string;
}
export interface GoodAnalogLinks {
  idLinkGoodGroup: number;
  idLinkGoodName: number;
}

export interface IProperty {
  idProperty: number;
  idValue: number;
  propertyName: string;
  propertyValue: string;
}
export interface ISimilarProduct {
  idCatalogGood: number;
  idGoodName: number;
  goodName: string;
  properties: IProperty[];
}
export interface DisplayRefs {
  idReference: number;
  referenceName: string;
  value: string;
  isIconShow: boolean;
}

export interface ICloseEvent {
  close: boolean;
  type?: string;
}

export interface IAddNsiEvent {
  idCatalogGood: number;
  properties: OutputNsiRefsResult[];
}