import { DxGridFilterExpression } from '../../features/trading/utils/registrations-trader-grid-filter.util';

interface IBuyerInfo {
  idFirm: null;
  concatedFirmName: null;
  idClientContractType: null;
  concatedClientName: null;
  branchName: null;
}

export interface IGeneralInfo {
  bidDateFinish: string | number | null;
  bidId: number | null;
  bidIsMyLeading: boolean;
  bidNumber: number;
  branchId: number | null;
  branchName: number | null;
  buyerInfo: IBuyerInfo;
  clientId: number;
  clientName: string | null;
  concatedDeliveryPeriod: string;
  concatedMarketTypes: string;
  concatedPaymentConditions: string;
  dateCreate: number;
  detailsExportForeign: string | null;
  detailsImportDomestic: string | null;
  directionId: number;
  directionName: string;
  firmName: string;
  idClientContractType: null;
  idDeliveryScheduleType: number;
  idDemandOffer: number;
  idDemandOfferParent: number;
  idModel: number;
  isAllowedFilesPrivate: boolean;
  isAllowedFilesPublic: boolean;
  isCanCalculateDeposit: boolean;
  isCanReject: boolean;
  isCanRestoreRejected: boolean;
  isCombinedMarketTypes: boolean;
  isExistCounterOffer: boolean;
  isInactiveByPriceCorridor: boolean;
  isInactiveByPriceQuotate: boolean;
  isInactiveByUnreliable: boolean;
  isIndividualPriceStepUsed: boolean;
  isMinPriceMainBasis: boolean;
  isWatched: boolean;
  lotNumber: number;
  pricingTypeId: number;
  purchasePurpose: null;
  rejectionReason: null;
  statusId: number;
  statusName: string;
  traderEmail: string;
  traderFullName: string;
  traderTelephone: string;
}

export interface IEditOfferGoodsSpecifications {
  blockId?: number;
  controlFieldType?: string;
  fieldName: string;
  fieldPrecision?: number;
  fieldValue: string | number;
  fieldValueArray?: number[];
  fieldValueNumber?: number;
  fieldValueString?: string | null;
  idDemandOfferGood?: number;
  idInterfaceField?: number;
  isVirtual?: boolean;
  costWithoutVAT?: number;
  amountVAT?: number;
  costVAT?: number;
  field?: any[];
  sortBy?: number;
  isEdit?: boolean;
  idEditRule?: number;
  dataSource?: IIntersections[];
}

interface IGoodProperty {
  propertyName: string;
  propertyValue: string;
  isAllowAnalogs: boolean;
}

interface IPriceAdjustment {
  id: number;
}

export interface IEditOfferGood {
  currency: string;
  goodDescription: string;
  goodGroup: string;
  goodName: string;
  goodValues: any | null;
  goodsSpecifications: IEditOfferGoodsSpecifications[];
  idGood: number;
  idGoodGroup: number;
  idGoodName: number;
  idNomenclatureGroup: number;
  isOpened: boolean;
  nomenclatureGroup: string;
  properties: IGoodProperty[];
  unitId: number;
  unitName: string;
  quoteCurrency: number;
  priceAdjustment: IPriceAdjustment;
  minPrice?: number;
  maxPrice?: number;
  range?: boolean;
  error?: boolean;
  fieldId?: number;
}

export interface IIntersections {
  id: string;
  name: string;
}

export type IFieldArrayItem = Omit<
  IEditOfferGoodsSpecifications,
  'idInterfaceField'
> & {
  idField: number;
  dataSource: IIntersections[];
  value: string;
  disabled: boolean;
};

export type IFieldArray = IFieldArrayItem[];

export interface IDeliveryTerm {
  dayValues: number[];
  deliveryStartId: string;
  deliveryStartName: string;
  deliveryTermName: string;
  deliveryTermId: string;
  endDeliveryDateValue: string;
  startDeliveryDateValue: string;
  endDeliveryDate: null;
  monthValues: number[];
  startDeliveryDate: null;
}

export interface ITermsConditionsPayment {
  dayTypeId: number | null;
  delayMomentId: number | null;
  paymentConditionId: string;
  paymentVolumeId: string;
  prepayMomentId: string;
}

export interface IPaymentCondition {
  firstPaymentMomentId: number;
  firstPercent: number;
  firstPeriodValueDate: number | null;
  firstPeriodValueNumber: number;
  idDayType: string;
  idDemandOffer: number;
  idPaymentType: number;
  idShipmentVolume: number;
  secondPaymentMomentId: number;
  secondPercent: number;
  secondPeriodValueNumber: number;
  thirdPeriodValueNumber: number | null;
}

export interface IDeliveryPeriod {
  dateBegin: number;
  dateEnd: number;
  idDeliveryMoment: string | number;
  idDeliveryType: number | null;
  idDemandOffer: number;
  periodTypeValue: number | null;
}

export interface Options {
  date: boolean | null;
  dayOfMonth: boolean | null;
  applicableDayCount: boolean | null;
}

export interface DelayMoment {
  id: string;
  name: string;
  termHint: string | null;
  options: Options;
}

export interface PrepayMoment {
  delayMoments: DelayMoment[] | null;
  id: string;
  name: string;
  termHint: string | null;
  options: Options;
}

export interface Volume {
  id: string;
  name: string;
  delayValue: string | null;
  prepayValue: string | null;
  delayMoments: DelayMoment[] | null;
  prepayMoments: PrepayMoment[] | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  volumes: Volume[];
}

export interface PaymentMethodsData {
  paymentMethods: PaymentMethod[];
}

export interface IGoodsSpecifications {
  idDemandOfferGood: number;
  idInterfaceField: number;
  fieldValueNumber: number;
  fieldValueString: string | null;
  fieldName: string;
  fieldPrecision: number;
  controlFieldType: string;
  fieldValue: string;
  blockId: number;
  isVirtual: boolean;
  sortBy?: number;
  costWithoutVAT?: number;
  amountVAT?: number;
  costVAT?: number;
}
export interface IDutchDownSubmiting {
  idCurrency: string | null;
  vatPercent: string | null;
}
export interface ICounterOfferGood {
  idOfferCounter?: number;
  idOfferGood?: number;
  idDemandCounter?: number;
  idDemandGood?: number;
  volume: number;
  priceWithoutVat: number;
  priceAdjustment: number;
  totalAmount: number;
  volumeMatch?: boolean; // This is an assumed type
  priceAdjustmentMatch?: boolean; // This is an assumed type
  priceWithoutVatMatch?: boolean; // This is an assumed type
  costVatMatch?: boolean; // This is an assumed type
  expirationName?: string;
  expirationDateId?: number;
  tradeDiscountName?: string;
  tradeDiscountId?: number;
  goodsSpecifications?: IEditOfferGoodsSpecifications[];
  values?: IValuesGoodAnalog[];
}

export interface ICounterOfferSelectedRow {
  idOfferCounter?: number;
  idDemandCounter?: number;
  currencyName: string;
  currencyPrecision: number;
  totalAmount: number;
  goodUnitName: string;
  totalVolume: number;
  dateCreate: number;
  isPriceAdjusted: boolean;
  concatedDeliveryPeriod: string;
  concatedPaymentConditions: string;
  concatedDeliveryCondition: string;
  buyerConcatedFirmName?: string;
  buyerIdClientContractType?: number;
  buyerConcatedClientName?: string;
  buyerBranchName?: string;
  buyerTraderName?: string;
  sellerConcatedFirmName?: string;
  sellerIdClientContractType?: number;
  sellerConcatedClientName?: string;
  sellerBranchName?: string;
  sellerTraderName?: string;
  concatedDeletedClients: null;
  counterNumber: number;
  paymentConditionsMatch: boolean;
  deliveryPeriodMatch: boolean;
  totalAmountMatch: boolean;
  totalVolumeMatch: boolean;
  priceAdjustedMatch: boolean;
  deliveryConditionMatch: boolean;
  currencyMatch?: boolean;
  financeMatch?: boolean;
  vatMatch?: boolean;
  isMine?: boolean;
  vatPercent?: number;
  goods: ICounterOfferGood[];
}

export interface IValuesGoodAnalog {
  idReference: number;
  idValue: number;
  nameReference: string;
  nameValue: string;
}

export type TNumbersInGridData = {
  data: { totalAmount: number; currencyPrecision: number };
};

export interface IServiceError {
  error: boolean;
  errorStatus: number;
  messageError: string;
}

export interface ActivateInactiveResponse {
  idDirection: number;
  idSection: number;
  idSession: number;
  demandOfferIds: number[];
  isControlViolations: boolean;
  isControlDeposit: boolean;
  isLockDeposit: boolean;
}

export interface ActivationResult {
  demandOfferId: number;
  isSuccess: boolean;
  errorMessage: string;
}

export interface ActivateInactiveResponsePayload {
  activationResults: ActivationResult[];
}

interface UserPrivileges {
  privilegesList: string[];
}

export interface User {
  token: string;
  lang: string;
  // role: number;
  IsWorker: boolean;
  userInfo?: {
    firmName?: string;
    traderEmail?: string;
    traderFullName?: string;
    traderPhone?: string;
    firmNameShort?: boolean;
    traderFIO?: string;
    lang?: string;
    publicKeyDateEnd?: string;
    traderRegNum?: string;
    firmId?: number;
  };
  privileges?: UserPrivileges;
}

export interface Messages {
  messNumber: number;
  sessionId: number;
}

export interface ContextMenuItem {
  text?: string;
  value?: string;
  disabled?: boolean;
  icon?: string;
  beginGroup?: boolean;
  name?: string;
  items?: ContextMenuItem[];
}

export interface InterfaceField {
  blockId: number;
  fieldId: number;
  fieldName: string;
  referenceAlias: string | null;
  referenceId: number;
  fieldDataType: string;
  fieldSize: number;
  fieldPrecision: number | null;
  isAccessibleForWorker: boolean;
  isAvailableDataLimitation: boolean;
  isAvailableUserInput: boolean;
  allowedValues: any[] | null;
  controlFieldType: string;
  isAvailableMultiSelection: boolean;
  isAvailableFreeInput: boolean;
}

export interface Field {
  interfaceField: InterfaceField;
  isRequired: boolean;
  selectedValues: any[] | null;
}

export interface DxGridColumnState {
  visibleIndex: number;
  dataField?: string;
  name?: string;
  dataType?: 'string' | 'number' | 'boolean' | 'date';
  width?: string | number;
  visible: boolean;
  showInColumnChooser?: boolean;
  fixed?: boolean;
}

export interface DxGridFilterPanelState {
  filterEnabled: boolean;
}

export interface DxGridState {
  columns: DxGridColumnState[];
  allowedPageSizes: number[];
  filterPanel: DxGridFilterPanelState;
  filterValue: DxGridFilterExpression | DxGridFilterExpression[];
  searchText: string;
  pageIndex: number;
  pageSize: number;
  focusedRowKey?: number | string;
  selectedRowKeys: Array<number | string>;
}

export interface DxGridColumnState {
  visibleIndex: number;
  dataField?: string;
  name?: string;
  dataType?: 'string' | 'number' | 'boolean' | 'date';
  width?: string | number;
  visible: boolean;
  showInColumnChooser?: boolean;
  fixed?: boolean;
}

export interface DxGridFilterPanelState {
  filterEnabled: boolean;
}

export interface DxGridState {
  columns: DxGridColumnState[];
  allowedPageSizes: number[];
  filterPanel: DxGridFilterPanelState;
  filterValue: DxGridFilterExpression | DxGridFilterExpression[];
  searchText: string;
  pageIndex: number;
  pageSize: number;
  focusedRowKey?: number | string;
  selectedRowKeys: Array<number | string>;
}

export interface ExportRequest {
  requestId: number;
  requestSection: number;
  idReportType: number;
  dateCreate: number;
  dateFailure: number;
  dateExport: number;
}

export interface ExportResponse {
  exportRequests: ExportRequest[];
}

export interface DownloadResponse {
  content: string;
  fileName: string;
}

export interface FilterOption {
  key: string[];
  value: string;
  text: string;
}

export interface DescriptionAnalogs {
  id: number;
  label: string;
  value: string;
}

export interface TotalRowData {
  amountVAT: string;
  costVat: string;
  costWithoutVat: string;
  quantity: string;
}

export interface DataSourceDeliveryTerm{
  id: number;
  value: string;
}

export interface NsiGoodValue {
  idReference: number;
  listValues: number[];
  isAllowAnalogs: boolean;
}

export * from './api';
