export interface Message {
  idMessage: number;
  text: string;
  dateMessage: number;
  isSystem: boolean;
  isPublic: boolean;
  isImportant: boolean;
}

export interface MessageAsMakler {
  idMessage: number;
  text: string;
  dateMessage: number;
  isSystem: boolean;
  isPublic: boolean;
  isImportant: boolean;
  idParent: number;
  dateReply: number;
  isInbox: boolean;
  isWatched: boolean;
  idStatus: number;
  nameStatus: string;
  idSender: number;
  idRecipient: number;
  concatedFirmName: string;
  traderFullName: string;
  telephoneForSms: string;
}

export interface ChatMessage {
  idMessage: number;
  text: string;
  dateMessage: number;
  isSystem: boolean;
  isPublic: boolean;
  isImportant: boolean;
  idParent: number;
  dateReply: number;
  isInbox: boolean;
  isWatched: boolean;
  idStatus: number;
  nameStatus: string;
}

export interface Template {
  id: number;
  name: string;
  text: string;
  isPersonal: boolean;
}

export interface TraderChatMessage {
  idMessage: number;
  text: string;
  dateMessage: number;
  isSystem: boolean;
  isPublic: boolean;
  isImportant: boolean;
  idParent: number;
  dateReply: number;
  isInbox: boolean;
}

export interface MessagesResponse {
  messages: Message[];
}

export interface MessageResponse {
  message: Message;
}

export interface MessageAsMaklerResponse {
  message: MessageAsMakler;
}

export interface MessagesAsMaklerResponse {
  messages: MessageAsMakler[];
}

export interface MaklerChatMsgTemplatesResponse {
  templates: Template[];
}

export interface ChatAsMaklerPersonResponse {
  messages: ChatMessage[];
  concatedFirmName: string;
  traderFullName: string;
  telephoneForSms: string;
}

export interface ChatAsTraderPersonResponse {
  messages: TraderChatMessage[];
}

export interface SendToMaklerMessagePayload {
  idSection: number;
  idSession: number;
  textMessage: string;
}

export interface SendToMaklerMessageResponse {
  idMessage: number;
}

export interface TraderMessageReplyPayload {
  idSection: number;
  idSession: number;
  idMessage: number;
  textMessage: string;
  isImportant: boolean;
}

export interface MaklerSetChatMsgTemplatePayload {
  idSection: number;
  templateName: string;
  templateText: string;
  idTemplate: number;
}

export interface MaklerSetChatMsgTemplateResponse {
  idTemplate: number;
}

export interface MaklerDeleteChatMsgTemplatePayload {
  idSection: number;
  idTemplate: number;
}

export interface MaklerSendToTraderPayload {
  idSection: number;
  idSession: number;
  textMessage: string;
  idRecipient: number;
  isImportant: boolean;
}

export interface MaklerReplyPayload {
  idSection: number;
  idSession: number;
  idMessage: number;
  textMessage: string;
  isImportant: boolean;
}

export interface MaklerSendPublicMessagePayload {
  idSection: number;
  idSession: number;
  textMessage: string;
  isImportant: boolean;
}

export interface MaklerReplyMarkPayload {
  idSection: number;
  idSession: number;
  idMessage: number;
}

export interface MaklerWatchAddPayload {
  idSection: number;
  idSession: number;
  idMessage: number;
}


