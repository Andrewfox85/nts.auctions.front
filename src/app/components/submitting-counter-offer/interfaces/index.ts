
export interface IFiltering {
  search: string;
  product: number;
}

export interface IAnalogGoodsGroup {
  idGoodGroup: number;
  goodName: string;
}

export interface INomenclatureGoods {
  nomenclatureGroup: string;
  idNomenclatureGroup: number;
}

export interface IAnalogGood {
  goodName: string;
  idGoodName: number;
}

export interface ValueItem {
  idValue: number;
  valueName: string;
}

export interface GoodValue {
  idReference: number;
  referenceName: string;
  listValues: ValueItem[] | null;
  isAllowAnalogs: boolean;
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
export interface GoodAnalogLinks {
  idLinkGoodGroup: number;
  idLinkGoodName: number;
}

export interface IProperty {
  propertyName: string;
  propertyValue: string;
}
export interface ISimilarProduct {
  idCatalogGood: number;
  idGoodName: number;
  goodName: string;
  properties: IProperty[];
}

export interface IMainBasis {
    idDemandOffer: number;
    idDemandOfferGood: number;
    isMain: boolean;
    idBasisLink: number;
    idBasisValue: number;
    idPlaceLink: number;
    idPlaceValue: number;
    placeName: string;
    placeDetails: unknown;
    priceWithoutVat: number;
    priceAdjustment: number;
    concatedCondition: string;
    priceCorridorLeftBound: number;
    priceCorridorRightBound: number;
    priceStartWithoutVat: number;
    priceStartAdjustment: number;
    minPriceWithoutVat: number;
}


export interface DemandOfferGoodInScope {
  idDemandOffer: number;
  idFirmClient: number;
  volume: number;
  firmClientName: string;
  idGood: number;
  idDemandOfferGood: number;
  goodName: string;
  properties: string;
  unitName: string;
  isDeletedScope: boolean;
}

export type DeliveryScope = [string, DemandOfferGoodInScope[]];