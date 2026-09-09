export enum AUCTION_TYPE {
  ENGLISH_UPGRADING_AUCTION = 1,
  DUTCH_DOWN_AUCTION = 2,
  DOUBLE_COUNTER_AUCTION = 4,
}

export enum STATUS_SESSIONS {
  PREPARATION = 1, // Подготовка
  IN_PROCCESS_FOR_AUCTION = 2, //В процессе переноса в торги
  NOT_NOVED_TO_AUCTIOB = 3, // Не перенесена в торги
  BIDDING = 4, // Торги
  IN_PROCESS_ARCHIVED = 5, // В процессе переноса в архив
  NOT_ARCHIVED = 6, // Не перенесена в архив
  ARCHIVE = 7, // Архив
}

export enum CATEGORY_MESSAGES {
  ALL = 'all',
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export enum WORKER_TAB_NAMES {
  TRADING = 'trading', // торги
  OFFERS = 'offers', // заявки
  REGISTRATION = 'registration', // регистрации
  TRADERS = 'traders', // трейдеры
  DEPOSIT = 'deposit', // задаток
  DEALS = 'deals', // сделки
  MESSAGES = 'messages', // сообщения
  SETTINGS = 'setting', // настройки
}

export enum WORKER_TAB_NAMES_WITHTOUT_TRADING {
  OFFERS = 'offers', // заявки
  REGISTRATION = 'registration', // регистрации
  TRADERS = 'traders', // трейдеры
  DEPOSIT = 'deposit', // задаток
  DEALS = 'deals', // сделки
  MESSAGES = 'messages', // сообщения
  SETTINGS = 'setting', // настройки
}

export enum DIRECT_SESSION_WORKER_TAB_NAMES {
  OFFERS = 'offers', // адресные заявки
  DEPOSIT = 'deposit', // задаток
  MESSAGES = 'messages', // сообщения
  SETTINGS = 'setting', // настройки
}

export enum NOT_WORKER_TAB_NAMES {
  TRADING = 'trading', // торги
  OFFERS = 'offers', // мсои заявки
  REGISTRATION = 'registration', // мои регистрации
  DEPOSIT = 'deposit', // задаток
  DEALS = 'deals', // сделки
  MESSAGES = 'messages', // сообщения
}

export enum NOT_WORKER_TAB_NAMES_FOR_OFFERS {
  TRADING = 'trading', // торги
  OFFERS = 'offers', // мсои заявки
  DEPOSIT = 'deposit', // задаток
  DEALS = 'deals', // сделки
  MESSAGES = 'messages', // сообщения
}

export enum NOT_WORKER_TAB_NAMES_FOR_REGS {
  TRADING = 'trading', // торги
  REGISTRATION = 'registration', // мои регистрации
  DEPOSIT = 'deposit', // задаток
  DEALS = 'deals', // сделки
  MESSAGES = 'messages', // сообщения
}

export enum NOT_WORKER_TAB_NAMES_WITHOUT_TRADING {
  OFFERS = 'offers', // мсои заявки
  REGISTRATION = 'registration', // мои регистрации
  DEPOSIT = 'deposit', // задаток
  DEALS = 'deals', // сделки
  MESSAGES = 'messages', // сообщения
}

export enum NOT_WORKER_TAB_NAMES_WITHOUT_TRADING_FOR_OFFERS {
  OFFERS = 'offers', // мсои заявки
  DEPOSIT = 'deposit', // задаток
  DEALS = 'deals', // сделки
  MESSAGES = 'messages', // сообщения
}

export enum NOT_WORKER_TAB_NAMES_WITHOUT_TRADING_FOR_REGS {
  REGISTRATION = 'registration', // мои регистрации
  DEPOSIT = 'deposit', // задаток
  DEALS = 'deals', // сделки
  MESSAGES = 'messages', // сообщения
}

export enum DIRECT_SESSION_NOT_WORKER_TAB_NAMES {
  OFFERS = 'offers', // адресные заявки
  DEPOSIT = 'deposit', // задаток
  MESSAGES = 'messages', // сообщения
}

export enum LANGUAGE {
  RU = 'RU',
  EN = 'EN',
}

export enum ID_DIRECTION_TRADER_ROLE {
  PURCHASE = 1, //покупка - в числе активных заявок/регистраций у трейдера только заявки/регистрации на покупку;
  SALE = 2, //продажа - только заявки/регистрации на продажу
  PURCHASE_SALE = 3, //покупка/продажа - есть заявки/регистрации в обоих направлениях
  NULL_ROLE = null, //отсутствуют активные заявки/регистрации.
}

export enum GRID_MENU_TEXT {
  MOVE_TO_THE_LEFT = 'Move to the left',
  MOVE_TO_THE_RIGHT = 'Move to the right',
  UNFIX = 'Unfix',
  SET_FIXED_POSITION = 'Set Fixed Position',
  LEFT = 'Left',
  RIGHT = 'Right',
  STICKY = 'Sticky',
}

export enum ID_DELIVERY_TYPE {
  DAY = 1,
  MONTH,
  DATE
}

export enum ID_DELIVERY_MOMENT {
  FROM_THE_DATE_OF_DELIVERY = 2     //с даты начала поставки
}

export enum ID_COMPOSITE_LOT_AVAILABILITY {
  ALL = 1, // все лоты
  SIMPLE_ONLY = 2, // только простые лоты
  COMPOSITE_ONLY = 3, // только сборные лоты
}

export enum ID_START_DELIVERY {
  FROM_REGISTRATION_CONTRACT_DATE = 1,
  FROM_START_DATE_DELIVERY = 2,
  NO_DELIVERY_START = 3,
  PREPAYMENT_DATE = 4
}

export enum DELIVERY_TERMS {
  DELIVERY_START = 'deliveryStart',
  DELIVERY_TYPE = 'deliveryType'
}

export enum PAYMENT_TERMS {
  TERMS_PAYMENT = 'termsPayment',
  VOLUME = 'volume',
  MOMENT_PREPAYMENT = 'momentPrepayment',
  MOMENT_DELAY = 'momentDelay'
}

export enum DELIVERY_SCOPE_ITEMS {
  ID_SCOPE = 0,
  SCOPE_INFO
}

export enum DELIVERY_SCHEDULE {
  SCH_DATE = 0,
  SCH_INFO
}
