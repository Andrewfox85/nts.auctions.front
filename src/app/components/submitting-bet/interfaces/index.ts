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
  parentIdReference?: number;
  idLink?: number;
  idLinkParent?: number;
  level?: number;
  isDisabled?: boolean;
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

export interface ListValue {
  idValue: number;
  valueName: string;
  idGoods?: number[];
}

export interface ReferenceValue {
  idReference: number;
  referenceName: string;
  listValues: ListValue[] | null;
  isAllowAnalogs: boolean;
}

export interface AnalogBid {
  idGood: number;
  idGroupNomenclature: number;
  nomenclatureGroup: string;
  idGroupGood: number;
  groupGood: string;
  idNameGood: number;
  nameGood: string;
  isMine: boolean;
  listValuesForm?: Record<number, number>;
  values: RefsValue[];
}

export interface RefsValue {
  idReference: number;
  nameReference: string;
  idValue: number;
  nameValue: string;
}

export interface AnalogListItem {
  idGood: number;
  idGroupNomenclature: number;
  nomenclatureGroup: string;
  idGroupGood: number;
  groupGood: string;
  idNameGood: number;
  nameGood: string;
  isMine: boolean;
  values: RefsValue[];
  listValuesForm?: Record<number, number>;
}

export type AnalogList = AnalogListItem[];

export interface DisplayRefs {
  idReference: number;
  referenceName: string;
  value: string;
  isIconShow: boolean;
}

export interface GoodAnalogLinks {
  idLinkGoodGroup: number;
  idLinkGoodName: number;
}