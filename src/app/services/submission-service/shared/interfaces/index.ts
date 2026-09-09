export interface PlacesTree {
  idLink: number;
  idLinkParent: number;
  idValue: number;
  valueName: string;
  lvl: number;
  disableCountries?: boolean;
}

export interface PlacesTreeResponse {
  trees: PlacesTree[];
}

export interface DeliveryTermConcatedResponse {
  result: string
}

export interface DeterminePaymentCondResponse {
  id: number
}

export interface PaymentTermConcatedResponse{
  result: string
}

export interface PayDelivDeadlinesResponse {
  deadlinePayment: number,
  deadlineDelivery: number
}

export interface PriceLimitQuotationResponse {
  priceWithoutVat: number
}

export interface PriceLimitCorridorResponse {
  leftBound: number,
  rightBound: number
}

export interface ActivePriceLimit {
  isActiveQuotation: boolean;
  isActiveCorridor: boolean;
}

export interface ActivePriceLimitResponse {
  activePriceLimit: ActivePriceLimit;
}

export enum ciNodeDelivPlace {
  ciNodeDelivPlaceSettlement = 1,
  ciNodeDelivPlaceBorderCross,
  ciNodeDelivPlacePort,
  ciNodeDelivPlaceRailStation
}

export const ciNodeDelivPlaceArray = [
  ciNodeDelivPlace.ciNodeDelivPlaceSettlement,
  ciNodeDelivPlace.ciNodeDelivPlaceBorderCross,
  ciNodeDelivPlace.ciNodeDelivPlacePort,
  ciNodeDelivPlace.ciNodeDelivPlaceRailStation
]

export interface DeliveryConditionIntersection {
  minAddBasisPlaces: number;
  contradictoryValueId: number;
  contradictoryBasisName: string;
  isRequiredPlace: boolean;
  isRequiredAddBasis: boolean;
  minAddBasis: number;
  placeName: string;
  placeTypeId: number;
  parentId: number;
  linkId: number;
  valueId: number;
  level: number;
  hasChildren: boolean;
  isIncoterm?: boolean;
  basisId: number;
  basisName: string;
  children?: DeliveryConditionIntersection[];
}
