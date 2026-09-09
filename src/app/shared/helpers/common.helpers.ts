import { IEditOfferGood, IEditOfferGoodsSpecifications } from './../interfaces/index';
import { AgreementType, ERROR_MESSAGES, IdWithoutVAT, goodRefId } from '../../shared/constants/api.constants';
import RU from '@ru-translate';
import EN from '@en-translate';
import { convertExcelSerialDateToMs } from "../../views/homepage/helpers";
import { Good } from './../../services/demand-service/shared/interfaces/index';
import { FilterOption } from '@interfaces';
import { GoodValue } from './../../services/demand-service/shared/interfaces/index';
import { ConsoleLogger } from '@microsoft/signalr/dist/esm/Utils';
import { DELIVERY_SCOPE_ITEMS } from "@enums";
import { DeliveryCondition } from "../../services/targeted-service/shared";
import {
  DeliveryConcatedBasis,
  DemandOfferGoodScopes,
  IDemandOfferBasisGood
} from "../../services/edit-demand-offer-service.service";
import { DemandOfferGoodInScope } from "../../components/submitting-counter-offer/interfaces";

export const getNumber = (str: string): number => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof str}`);
  }

  return Number(
    parseFloat(
      str
        .replace(/\s/g, '')
        .replace(/,/g, '.')
        .replace(/[^0-9.]/g, '')
    )
  );
};

/**
 * @description downloads file
 * @param content file content
 * @param name file name
 */
export const downloadFile = (content: string, name: string): void => {
  let type = name.split('.').reverse()[0];
  let url = 'data:application/' + type + ';base64,' + content;

  let a = document.createElement('a');
  document.body.appendChild(a);
  a.setAttribute('style', 'display: none');
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};

export const downloadArchive = (data: Blob): void => {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reestrs.zip';
  link.click();
}

export function padZero(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

// форматировать секунды в строку формата "00:00:00"
export function formatSecondsToTime(
  seconds: number | null | undefined
): string {
  if (seconds == null || isNaN(seconds)) {
    return '';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`;
}

// форматировать строку формата "00:00:00" в секунды
export function formatStr(time: string): number {
  const [hours, minutes, secs] = time.split(':').map(Number);

  return hours * 3600 + minutes * 60 + secs;
}

export function toOADate(date: Date | number): number {
  let utc18991230 = new Date('1899-12-30').getTime();
  let msPerDay = 24 * 60 * 60 * 1000;
  // correct value from negative to positive number
  let offsetTime = new Date().getTimezoneOffset() * -1;

  if (date instanceof Date) {
    date = new Date(date).getTime();
  }

  let res = -utc18991230 + date + offsetTime * 60 * 1000;

  return res / msPerDay;
}

export function upperCaseFirstLetter<T extends string>(str: T): string {
  return !str ? str : str[0].toUpperCase() + str.slice(1);
}

export function round(value: number, p: number): number {
  const precision = Math.pow(10, p);

  return Math.round(value * precision) / precision;
}


export const getErrorMessageByCode = (
  errorCode: number,
  lang: string
): string | null => {
  const messages = ERROR_MESSAGES[errorCode];
  return messages ? messages[lang] || null : null;
};

export function getTranslateResultByCurrentLang(currentLang: string, pathStr: string): string {
  return pathStr.split('.').reduce((key, param) => {
    return key[param];
  }, currentLang === 'RU' ? RU : EN);
}

export function convertDate(date: number): number | null {
  return date ? convertExcelSerialDateToMs(date) : null;
}


export function getEmptyFilterLabel(currentLang: string): string {
  return getTranslateResultByCurrentLang(currentLang, 'filters.empty');
}

export function isEmptyDescriptionValue(value: unknown): boolean {
  return value == null || value === '';
}

export function createArrayFieldHeaderFilterExpression(
  dataField: string,
  filterValue: unknown
): (data: { [key: string]: unknown }) => boolean {
  const isEmptyFilter: boolean = filterValue == null;

  return (data: { [key: string]: unknown }): boolean => {
    const fieldValue: unknown = data[dataField];

    if (isEmptyFilter) {
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((item: unknown) =>
          isEmptyDescriptionValue(item)
        );
      }

      return isEmptyDescriptionValue(fieldValue);
    }

    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(filterValue);
    }

    if (typeof fieldValue === 'string' && filterValue != null) {
      return fieldValue.includes(String(filterValue));
    }

    return fieldValue === filterValue;
  };
}

export function mapDescriptionToFilterOption(description: string, emptyLabel: string): FilterOption {
  const isEmpty: boolean = isEmptyDescriptionValue(description);
  const value: string = isEmpty ? null : (description as string);

  return {
    key: [value],
    value,
    text: isEmpty ? emptyLabel : (description as string),
  };
}

export function mapContractTypeToFilterOption(contractType: number | null, currentLang: string): FilterOption {
  const emptyLabel: string = getEmptyFilterLabel(currentLang);

  if (contractType == null) {
    return {
      key: [null],
      value: null,
      text: emptyLabel,
    };
  }

  if (contractType === AgreementType.Commission) {
    const text: string = getTranslateResultByCurrentLang(currentLang, 'general.commissionAgreement');

    return {
      key: [String(AgreementType.Commission)],
      value: String(AgreementType.Commission),
      text,
    };
  }

  if (contractType === AgreementType.Agency) {
    const text: string = getTranslateResultByCurrentLang(currentLang, 'general.agencyAgreement');

    return {
      key: [String(AgreementType.Agency)],
      value: String(AgreementType.Agency),
      text,
    };
  }

  return {
    key: [null],
    value: null,
    text: emptyLabel,
  };
}

export function isEmptyContractTypeFilterValue(filterValue: unknown): boolean {
  if (filterValue == null || filterValue === '') {
    return true;
  }

  const emptyLabels: string[] = [
    getTranslateResultByCurrentLang('RU', 'filters.empty'),
    getTranslateResultByCurrentLang('EN', 'filters.empty'),
  ];

  return emptyLabels.includes(String(filterValue));
}

export function createContractTypeHeaderFilterExpression(
  dataField: string,
  filterValue: unknown
): (data: Record<string, unknown>) => boolean {
  const isEmptyFilter: boolean = isEmptyContractTypeFilterValue(filterValue);

  return (data: Record<string, unknown>): boolean => {
    const [keyLvl1, keyLvl2]: string[] = dataField.split('.');
    const fieldValue: unknown = data?.[keyLvl1]?.[keyLvl2];

    if (isEmptyFilter) {
      return fieldValue == null;
    }

    const mappedValue: number | null = resolveContractTypeFilterValue(filterValue);

    if (mappedValue == null) {
      return false;
    }

    return Number(fieldValue) === mappedValue;
  };
}

export function createContractTypeCalculateFilterExpression(dataField: string): (
  value: unknown,
  selectedFilterOperation: string | null,
  target: string
) => unknown {
  return (
    value: unknown,
    _selectedFilterOperation: string | null,
    _target: string
  ): unknown => createContractTypeHeaderFilterExpression(dataField, value);
}

export function resolveContractTypeFilterValue(filterValue: unknown): number | null {
  if (filterValue == null || filterValue === '') {
    return null;
  }

  const numericValue: number = Number(filterValue);

  if (
    numericValue === AgreementType.Commission ||
    numericValue === AgreementType.Agency
  ) {
    return numericValue;
  }

  const filterText: string = String(filterValue);
  const commissionLabels: string[] = [
    getTranslateResultByCurrentLang('RU', 'general.commissionAgreement'),
    getTranslateResultByCurrentLang('EN', 'general.commissionAgreement'),
  ];
  const agencyLabels: string[] = [
    getTranslateResultByCurrentLang('RU', 'general.agencyAgreement'),
    getTranslateResultByCurrentLang('EN', 'general.agencyAgreement'),
  ];
  const emptyLabels: string[] = [
    getTranslateResultByCurrentLang('RU', 'filters.empty'),
    getTranslateResultByCurrentLang('EN', 'filters.empty'),
  ];

  if (commissionLabels.includes(filterText)) {
    return AgreementType.Commission;
  }

  if (agencyLabels.includes(filterText)) {
    return AgreementType.Agency;
  }

  if (emptyLabels.includes(filterText)) {
    return null;
  }

  return null;
}

export function matchesHeaderFilterSearch(item: Partial<FilterOption>, searchQuery: string): boolean {
  const query: string = searchQuery.toLowerCase();

  return (
    item.text?.toLowerCase().includes(query) ||
    (item.value != null && String(item.value).toLowerCase().includes(query))
  );
}

export function getGridInfoText(currentLang: string, allCount: number): string {
  const records = getTranslateResultByCurrentLang(
    currentLang,
    'general.records'
  );
  const found = getTranslateResultByCurrentLang(
    currentLang,
    'general.totalFound'
  );

  //{2} - обозначение грида - кол-во записей в гриде
  return `${records} ${allCount}. ${found} {2}`;
}

export const createTotalBasedTextCacheKey = (
  translateKey: string,
  lang: string,
  currency: string,
  precision: number
): string => {
  return `${translateKey}|${lang}|${currency}|${precision}`;
};

export const createRuSummaryFormatter = (
  label: string,
  currency: string,
  precision: number
): ({value}: {value: number}) => string => {
  return ({ value }: { value: number }): string => {
    const safeNumber: number = Number(value) || 0;
    return `${label}: ${safeNumber.toLocaleString('ru-RU', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })} ${currency}`.trim();
  };
};


export function checkSameUnits(goods: (Good | IEditOfferGood)[]): boolean {
  if (!goods || goods.length === 0) return false;

  return goods.every(
    (item) => item.unitId === goods[0]?.unitId
  );
}

export function getVatNumber(
  VatField: IEditOfferGoodsSpecifications,
  returnNull?: boolean
): number {
  const zeroOrNull: number | null = returnNull ? null : 0;
  return VatField.fieldValueNumber !== IdWithoutVAT
    ? Number(VatField.fieldValue.toString().replace(/[^0-9]/g, ''))
    : zeroOrNull;
}

export function groupByConcatedCondition<T extends { concatedCondition: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    acc[item.concatedCondition] = acc[item.concatedCondition] || [];
    acc[item.concatedCondition].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

//в массив характеристик записываем только справочники, которые не подходят под условие НСИ хар-к (выбрано либо одно значение без галочки Аналоги либо несколько значений)
export function getListPropertiesString(goodValues: GoodValue[]): number[] {
  return goodValues
    .filter((item) => {
      const shouldTakeTreeValues: boolean =
        !item.listValues ||
        (item.listValues.length === 1 && item.isAllowAnalogs);

      return !shouldTakeTreeValues && item.idReference !== goodRefId;
    })
    .flatMap((item) => [
      ...item.listValues.map((val) => val.idValue),
      -item.idReference,
    ]);
}

//в массив характеристик записываем только справочники, которые подходят под условие НСИ хар-к (незаполненные значениями либо заполненные с отметкой "А")
export function getListPropertiesAdd(goodValues: GoodValue[]): number[] {
  return goodValues
    .filter((item) => {
      const shouldTakeTreeValues: boolean =
        !item.listValues ||
        (item.listValues.length === 1 && item.isAllowAnalogs);

      return shouldTakeTreeValues && item.idReference !== goodRefId;
    })
    .flatMap((item) => [
      item.idReference,
    ]);
}

export function transformToFlatStructure(
  deliveryConditions: DeliveryConcatedBasis[] | DemandOfferGoodInScope[]
): IDemandOfferBasisGood[] | DemandOfferGoodInScope[] {
  const firstItem: DeliveryConcatedBasis | DemandOfferGoodInScope = deliveryConditions[0];
  if (!(typeof firstItem === 'object' && !Array.isArray(firstItem) && firstItem !== null)) {
    return deliveryConditions.flatMap(item => item[DELIVERY_SCOPE_ITEMS.SCOPE_INFO]);
  } else {
    return deliveryConditions as DemandOfferGoodInScope[];
  }
}

export function getIdGood(good: IEditOfferGood): number {
  return good.idGood || good.goodsSpecifications[0].idDemandOfferGood;
}
