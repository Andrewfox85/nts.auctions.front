import RU from '@ru-translate';
import EN from '@en-translate';
import { AppConfigService } from "@services";

export const listOptions = {
  priseStep: 1, //шаг цены
  applicationSubmissionTime: 2, //время подачи заявки
  bidSubmissionTime: 3, //время подачи ставки
  priceDownPoints: 4, //шаг понижения
  timeDownPoints: 5, //время понижения
};

export const sectionID = {
  metalProducts: 1, //метал
  forestProducts: 2, //лес
  agricultural: 3, //сельхоз
};

export const numberEntriesPage = [10, 20, 50, 100];

export const role = {
  unauthorized: 0, //не авторизован
  worker: 1, //работник
  broker: 2, //брокер
  visitor: 3, //посетитель
  brokerVisitor: 4, //брокер и посетитель
};

export const applicationForm = {
  all: 1, //Все
  filingApplication: 2, //Подача заявки
  registrationSession: 3, //Регистрация на сессию
};

export const statusSession = {
  preparation: 1, //Подготовка
  inProcessForAuction: 2, //В процессе переноса в торги
  notMovedToAuction: 3, //Не перенесена в торги
  bidding: 4, //Торги
  inProcessArchived: 5, //В процессе переноса в архив
  notArchived: 6, //Не перенесена в архив
  archive: 7, //Архив
};

export const sessionStage = {
  new: 1, //Новая
  applicationsOpen: 2, //Открыт приём заявок
  purchaseOrdersOpen: 3, //Открыт приём заявок на покупку
  applicationsSaleOpen: 4, //Открыт приём заявок на продажу
  applicationsClosed: 5, //Завершён приём заявок
  completedProcessingApplications: 6, //Завершена обработка заявок
  transferAuctionCompleted: 7, //Для трейдера "Сессия активирована"
  //Для работника "Завершен перенос сессии в торги. Сессия активирована"
  sessionEnded: 8, //Сессия завершена
  completedDataTransferArchive: 9, //Завершён перенос данных в архив
  admissionComleted: 10 //Допуск
};

export const IdDirection = {
  buy: 1, //покупка
  sale: 2, //продажа
};

export const auctionType = {
  simpleSellerAuction: 1, //Простой аукцион продавца
  simpleBuyerAuction: 2, //Простой аукцион покупателя
  reverseWholesaleAuction: 3, //Обратный оптовый аукцион
  doubleCounterAuction: 4, //Двойной встречный аукцион
};

export const searchIcon = {
  icon: 'assets/img/icons/search_grey.svg',
  type: 'default',
};

export const pricingType = {
  price: 1, //по цене
  formulaWithQuotation: 2, //по формуле с котировкой
  formulaWithoutQuotation: 3, //по формуле без котировки
};

export const deliveryAddress = {
  //Место поставки
  destinationPort: 1, //Порт назначения
  shippingPort: 2, //Порт отгрузки
  destination: 3, //Место назначения
  placeShipment: 4, //Место отгрузки
  destinationStation: 5, //Станция назначения
  departureStation: 6, //Станция отправления
  destinationOutsideBorderRB: 7, //Пункт назначения за пределами границы РБ
  placeName: 8, //Название места
  borderCrossing: 9, //Погранпереход
};

export const minDeliveryScheduleDaysCount = 180;

export const termsConditionsPaymentConst = {
  prepayment100: 1, //Предоплата 100%
  partialPrepayment: 2, //Частичная предоплата
  paymentDeferment: 3, //Отсрочка
  paymentThroughExchange: 4, //Оплата через счета Биржи
};

export const timberTicket = 7; //лесорубочный билет

export const maxLengthTextArea = 4000;

export const offerStatus = {
  //статус заявки
  submitted: 1, //Подана
  canceled: 2, //Отменена
  includedInRegister: 3, //Включена в реестр
  notIncludedInRegister: 4, //Не включена в реестр
  excludedFromRegister: 5, //Исключена из реестра
  deleted: 6, //Удалена
  previousEdition: 7, //Предыдущая редакция
};

export const NG_REF_ID = 2; //id справочника НГ

export const TG_REF_ID = 3; //id справочника ТГ

export const goodRefId = 4; //id справочника товаров

export const NUMBER_OF_CASE = 9;

export const statusRegs = {
  rejectedBeforeBid: 1, //отклонена до торгов
  unactive: 2, //неактивная
  active: 3, //активная
  rejectedBySystem: 4, //отклонена системой
  rejectedInBid: 5, //отклонена в торгах
};

export const statusOffersFilters = {
  active: 3, //активные
  unactive: 2, //неактивные
  rejectedBeforeBid: 1,  //отклонена до торгов
  rejectedBySystem: 4,  //отклонена системой
  rejectedInBid: 5,   //отклонена в торгах
};

export const statusDirectOffersFilters = {
  backlogged: 9, //Нерассмотренные
  reviewed: 12, //Pассмотренные
  unapproved: 11, //Неодобренные
  approved: 10, //Одобренные
  rejectedBeforeBid: 1,  //отклонена до торгов
  rejectedBySystem: 4,  //отклонена системой
  rejectedInBid: 5,   //отклонена в торгах
};

export const statusDirectOffersFiltersTr = {
  submitted: 9,//Поданные
  approved: 10, //Одобренные
  rejectedBeforeBid: 1,  //отклонена до торгов
  rejectedBySystem: 4,  //отклонена системой
  rejectedInBid: 5,   //отклонена в торгах
  unapproved: 11, //Неодобренные
  reviewed: 12, //Pассмотренные (в радиобаттоне поданные)
};

export const statusDeals = {
  fixed: 1, //зафиксированные
  denied: 2, //отказано в фиксации
};

export enum CONDITIONS_REFUSE {
  WITH_RETURN = 1, //С возвратом заявки в торги
  WITHOUT_RETURN, //Без возврата заявки в торги
}

export enum PARAMETR_FOR_RETURN {
  CURR_PRICE = 1, //По текущей цене
  BEGINNING_PRICE, //По цене на начало периода торгов
}

export const editingRules = {
  editingIsNotAvailable: 1, // Редактирование не доступно
  settingRemovingFlag: 2, // Установка/снятие признака
  decreaseValue: 3, // Уменьшение значения
  increaseValue: 4, // Увеличение значения
  changingTheValue: 5, // Изменение значения (увеличение/уменьшение)
  selectFromDirectory: 6, // Выбор из справочника (в соответствии с настройками модели заявки)
  changingValueSelectingReferenceBook: 7, // Изменение значения с выбором из справочника (в соответствии с настройками модели заявки)
  addingValueFromReferenceBook: 8, // Добавление значения с выбором из справочника (в соответствии с настройками модели заявки)
  reductionValueInclAdditionalBases: 9, // Уменьшение значения (в т.ч. на дополнительных базисах)
  increaseValueInclAdditionalBases: 10, // Увеличение значения (в т.ч. на дополнительных базисах)
  changeValueInclAdditionalBases: 11, // Изменение значения (увеличение/уменьшение, в т.ч. на дополнительных базисах)
  reschedulingChangingVolume: 12, // Переформирование графика и изменение объема (увеличение/уменьшение в рамках текущего количества товаров)
  changesDeliveryTerms: 13, // Изменение условий поставки
  changingDeliveryConditionsAddingValue: 14, // Изменение условий поставки и добавление значения с выбором из справочника (в соответствии с настройками модели заявки)
};

export enum AgreementType {
  Commission = 20, // договор комиссии
  Agency = 21, // договор поручения
}

export enum IdInterfaceField {
  quantity = 1, //Количество
  unit = 2, //Ед. изм.
  priceWithoutVAT = 3, //Цена без НДС
  currency = 4, //Валюта
  VATrate = 5, //Ставка НДС
  minPrice = 9, //Минимальная цена (без НДС)
  financeSource = 11, //Источник финансирования
  okrb007 = 12, //ОКРБ 007-2012
  productReadiness = 21, //Готовность товара
  productLocation = 22, //Местонахождение товара
  placeOfWork = 29, //Место выполнения работ
  paymentTerms = 36, //Условия оплаты
  deliveryTerms = 37, //Условия поставки
  deliveryTime = 38, //Срок поставки
  actualLength = 40, //Фактическая длина
  adjustedPrice = 47, //Корректируемая цена
  amendmentType = 53, //Тип поправки
  amendment = 54, //Поправка
  quoteCurrency = 55, //Валюта котировки
  quotation = 56, //Котировка
  actualDiameter = 57, //Фактический диаметр
  actualWidth = 58, //Фактическая ширина
  actualThickness = 59, //Фактическая толщина
  destination = 62, //Место назначения
  priceStep = 64, //шаг цены
  expirationDate = 66, //срок годности
  wholesaleMarkup = 67, //оптовая надбавка
  productQuality = 68, // качество товара
  deliveryFeatures = 70, //особенности доставки;
}

export enum IdActivationMode {
  pretradingPeriod = 1, //в предторговом периоде
  anyPeriod = 2, //в любом периоде
}

export const COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES = '104';
export const COMPLEX_LOT_PRODUCT_TYPE_ID: string = '2';

export const ID_LOCATION_GOOD_REF = 11; //ид справочника Местонахождение товара

export enum IdSessionPeriods {
  pretrading = 1, //Предторговый
  trading = 2, //Торги
  offersAdjustment = 3, //Корректировки
  tradingAndResult = 4, //Торги и итоги
  closing = 12, //Период закрытия
  direct = 13, //заключение адресных сделок
}

export const UNAUTHORIZED_ERROR_CODE = 401;
export const FORBIDDEN_ERROR_CODE = 403;
export const SERVER_ERROR_CODE = 500;
export const NO_INTERNET_CONNECTION_CODE = 0;

export const UNAUTHORIZED_AND_FORBIDDEN_CODES = [
  UNAUTHORIZED_ERROR_CODE,
  FORBIDDEN_ERROR_CODE,
];

export const ERROR_MESSAGES = {
  [NO_INTERNET_CONNECTION_CODE]: {
    RU: RU.errors.noInterNetConnection,
    EN: EN.errors.noInterNetConnection,
  },
  [UNAUTHORIZED_ERROR_CODE]: {
    RU: RU.errors.unauthorized,
    EN: EN.errors.unauthorized,
  },
};

export enum CurrentTab {
  offers = 1,
  auctions = 2,
}

export enum INTERSECTION_FIELD {
  INTERSECTION_FIELD_DELIVERY_SCHEDULE = 0,
  INTERSECTION_FIELD_DELIVERY_CONDITIONS,
  INTERSECTION_FIELD_DELIVERY_TERM,
  INTERSECTION_FIELD_TERMS_CONDITIONS_PAYMENT,
  INTERSECTION_FIELD_EDIT_RULES,
  INTERSECTION_FIELD_CURRENCY,
  INTERSECTION_FIELD_VAT,
  INTERSECTION_FIELD_FINANCE_SOURCE,
  INTERSECTION_FIELD_ADJUSTABLE_PRICE,
}

export const EDITING_FIELDS = [
  IdInterfaceField.quantity,
  IdInterfaceField.priceWithoutVAT,
  IdInterfaceField.amendment,
  IdInterfaceField.quotation,
  IdInterfaceField.minPrice,
];

export const VOLUME_PRECISION = 4;
export const CURRENCY_PRECISION = 2;

export const ADDITIONAL_FIELDS_FOR_PURCHASE = [
  IdInterfaceField.currency,
  IdInterfaceField.VATrate,
  IdInterfaceField.financeSource,
  IdInterfaceField.okrb007,
];

export const ACTUAL_SIZE_READINESS_FIELDS = [
  IdInterfaceField.actualLength,
  IdInterfaceField.actualDiameter,
  IdInterfaceField.actualWidth,
  IdInterfaceField.actualThickness,
  IdInterfaceField.productReadiness,
];

export const ACTUAL_SIZE_FIELDS = [
  IdInterfaceField.actualLength,
  IdInterfaceField.actualDiameter,
  IdInterfaceField.actualWidth,
  IdInterfaceField.actualThickness,
];

export enum SORT_ID_ACTUAL_FIELDS {
  FIELD_21 = 1, //productReadiness
  FIELD_57, //DIAMETER
  FIELD_59, //THICKNESS
  FIELD_58, //WIDTH
  FIELD_40, //LENGTH
}

export const SPECIAL_FIELDS_AGRI = [
  IdInterfaceField.expirationDate, //срок годности
  IdInterfaceField.wholesaleMarkup, //оптовая надбавка
];

export enum PRODUCT_LEVELS_IN_BLOCK {
  NOMENCLATURE_GROUP = 1,
  GOOD_GROUP,
  GOOD_NAME,
}

export const FULL_PERCENT = 100;

export enum DeliveryView {
  Week = 1,
  Month,
  Quarter,
}

// ---------- DELIVERY SCHEDULE CONFIG ----------
export const PERIOD_CONFIG = {
  1: {
    // неделя
    unit: 'week',
    startOf: 'isoWeek',
    endOf: 'isoWeek',
    add: { value: 1, unit: 'week' },
    number: (d) => d.isoWeek(),
  },
  2: {
    // месяц
    unit: 'month',
    startOf: 'month',
    endOf: 'month',
    add: { value: 1, unit: 'month' },
    number: (d) => d.month() + 1,
  },
  3: {
    // квартал
    unit: 'quarter',
    startOf: 'quarter',
    endOf: 'quarter',
    add: { value: 1, unit: 'quarter' },
    number: (d) => d.quarter(),
  },
};

export const MAXIMUM_GOODS_LENGTH = 5;

export enum MULTIBASIS_TYPE_ID {
  ALL = 1,
  SINGLE_BASIS,
  MULTIBASIS,
}

export enum FileTypes {
  DEALS = 'Deals',
  BIDDING_PROCESS = 'Bidding-process'
}

export enum ID_STAT_DELIVERY {
  BUYERS_EX_WAREHOUSE = 11,     //ФРАНКО-СКЛАД ПОКУПАТЕЛЯ
  SELLERS_EX_WAREHOUSE = 12,    //ФРАНКО-СКЛАД ПРОДАВЦА
  FREE_CARRIAGE_DESTINATION_STATION = 24,    //ФРАНКО-ВАГОН СТАНЦИЯ НАЗНАЧЕНИЯ
}

export const BELARUS_ID_LINK = 1000;
//на dev и test2 отличаются данные. todo оставить одно значение
export const BELARUS_ID_LINK_DESTINATION_STATION = (
  config: AppConfigService
): number => {
  return config.domain.toString().includes('59') ? 20115 : 20382;
};

export enum PRICE_ADJUSTMENT_TYPE {
  relativeType = 1, //относительный (%)
  absoluteType = 2  //абсолютный (валюта)
}

export enum GOVERNMENT_PURCHASE {
  ownFunds = 0, //собственные средства
  publicProcurement = 1  //гос закупка
}

export const IdWithoutVAT = 1; //ид Без НДС

export const DEFAULT_DEFERMENT_PERIOD_NUMBER = 30; //Момент предоплаты = до выдачи лесорубочного билета по умолчанию период отсрочки

export const DEFAULT_DEFERMENT_PERIOD_NUMBER_2 = 60; //Момент предоплаты = до выдачи лесорубочного билета по умолчанию период отсрочки 2

export const AMOUNT_OF_DEFERMENT_40 = 40; //Размер отсрочки

export const AMOUNT_OF_DEFERMENT_100 = 100; //Размер отсрочки

export enum PARTICIPANT_TYPES {
  BROKER = 'broker',
  VISITOR = 'visitor'
}

export const NO_BASIS: string = 'Без базиса поставки';

export enum DELIVERY_COND_BLOCK {
  CONCATED_CONDITION = 0,
  COND_INFO
}

export enum DIFF_PRICE_TREND {
  DOWNWARD = -1, //отличие в сторону уменьшения ("медвежий тренд")
  UNDEFINED_DIFF = 0, //отличия (неопределенные)
  UPWARD = 1, //отличие в сторону увеличения ("бычий тренд")
}
