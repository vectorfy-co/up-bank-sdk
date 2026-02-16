import { z } from 'zod';

const AccountTypeEnum = z.enum(["SAVER","TRANSACTIONAL","HOME_LOAN"]);
export const AccountTypeEnumSchema = AccountTypeEnum;
const OwnershipTypeEnum = z.enum(["INDIVIDUAL","JOINT"]);
export const OwnershipTypeEnumSchema = OwnershipTypeEnum;
const MoneyObject = z
  .object({ currencyCode: z.string(), value: z.string(), valueInBaseUnits: z.number().int() })
  .passthrough();
export const MoneyObjectSchema = MoneyObject;
const AccountResource = z
  .object({
    type: z.string(),
    id: z.string(),
    attributes: z
      .object({
        displayName: z.string(),
        accountType: AccountTypeEnum,
        ownershipType: OwnershipTypeEnum,
        balance: MoneyObject,
        createdAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
    relationships: z
      .object({
        transactions: z
          .object({ links: z.object({ related: z.string() }).passthrough() })
          .partial()
          .passthrough(),
      })
      .passthrough(),
    links: z.object({ self: z.string() }).passthrough().optional(),
  })
  .passthrough();
export const AccountResourceSchema = AccountResource;
const ListAccountsResponse = z
  .object({
    data: z.array(AccountResource),
    links: z.object({ prev: z.string().nullable(), next: z.string().nullable() }).passthrough(),
  })
  .passthrough();
export const ListAccountsResponseSchema = ListAccountsResponse;
const GetAccountResponse = z.object({ data: AccountResource }).passthrough();
export const GetAccountResponseSchema = GetAccountResponse;
const AttachmentResource = z
  .object({
    type: z.string(),
    id: z.string(),
    attributes: z
      .object({
        createdAt: z.string().datetime({ offset: true }).nullable(),
        fileURL: z.string().nullable(),
        fileURLExpiresAt: z.string().datetime({ offset: true }),
        fileExtension: z.string().nullable(),
        fileContentType: z.string().nullable(),
      })
      .passthrough(),
    relationships: z
      .object({
        transaction: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough(),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough(),
      })
      .passthrough(),
    links: z.object({ self: z.string() }).passthrough().optional(),
  })
  .passthrough();
export const AttachmentResourceSchema = AttachmentResource;
const ListAttachmentsResponse = z
  .object({
    data: z.array(AttachmentResource),
    links: z.object({ prev: z.string().nullable(), next: z.string().nullable() }).passthrough(),
  })
  .passthrough();
export const ListAttachmentsResponseSchema = ListAttachmentsResponse;
const GetAttachmentResponse = z.object({ data: AttachmentResource }).passthrough();
export const GetAttachmentResponseSchema = GetAttachmentResponse;
const CategoryResource = z
  .object({
    type: z.string(),
    id: z.string(),
    attributes: z.object({ name: z.string() }).passthrough(),
    relationships: z
      .object({
        parent: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough().nullable(),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough(),
        children: z
          .object({
            data: z.array(z.object({ type: z.string(), id: z.string() }).passthrough()),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough(),
      })
      .passthrough(),
    links: z.object({ self: z.string() }).passthrough().optional(),
  })
  .passthrough();
export const CategoryResourceSchema = CategoryResource;
const ListCategoriesResponse = z.object({ data: z.array(CategoryResource) }).passthrough();
export const ListCategoriesResponseSchema = ListCategoriesResponse;
const GetCategoryResponse = z.object({ data: CategoryResource }).passthrough();
export const GetCategoryResponseSchema = GetCategoryResponse;
const CategoryInputResourceIdentifier = z
  .object({ type: z.string(), id: z.string() })
  .passthrough();
export const CategoryInputResourceIdentifierSchema = CategoryInputResourceIdentifier;
const UpdateTransactionCategoryRequest = z
  .object({ data: CategoryInputResourceIdentifier.nullable() })
  .passthrough();
export const UpdateTransactionCategoryRequestSchema = UpdateTransactionCategoryRequest;
const PingResponse = z
  .object({ meta: z.object({ id: z.string(), statusEmoji: z.string() }).passthrough() })
  .passthrough();
export const PingResponseSchema = PingResponse;
const ErrorObject = z
  .object({
    status: z.string(),
    title: z.string(),
    detail: z.string(),
    source: z
      .object({ parameter: z.string(), pointer: z.string() })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough();
export const ErrorObjectSchema = ErrorObject;
const ErrorResponse = z.object({ errors: z.array(ErrorObject) }).passthrough();
export const ErrorResponseSchema = ErrorResponse;
const TagResource = z
  .object({
    type: z.string(),
    id: z.string(),
    relationships: z
      .object({
        transactions: z
          .object({ links: z.object({ related: z.string() }).passthrough() })
          .partial()
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();
export const TagResourceSchema = TagResource;
const ListTagsResponse = z
  .object({
    data: z.array(TagResource),
    links: z.object({ prev: z.string().nullable(), next: z.string().nullable() }).passthrough(),
  })
  .passthrough();
export const ListTagsResponseSchema = ListTagsResponse;
const TagInputResourceIdentifier = z.object({ type: z.string(), id: z.string() }).passthrough();
export const TagInputResourceIdentifierSchema = TagInputResourceIdentifier;
const UpdateTransactionTagsRequest = z
  .object({ data: z.array(TagInputResourceIdentifier) })
  .passthrough();
export const UpdateTransactionTagsRequestSchema = UpdateTransactionTagsRequest;
const TransactionStatusEnum = z.enum(["HELD","SETTLED"]);
export const TransactionStatusEnumSchema = TransactionStatusEnum;
const HoldInfoObject = z
  .object({ amount: MoneyObject, foreignAmount: MoneyObject.nullable() })
  .passthrough();
export const HoldInfoObjectSchema = HoldInfoObject;
const RoundUpObject = z
  .object({ amount: MoneyObject, boostPortion: MoneyObject.nullable() })
  .passthrough();
export const RoundUpObjectSchema = RoundUpObject;
const CashbackObject = z.object({ description: z.string(), amount: MoneyObject }).passthrough();
export const CashbackObjectSchema = CashbackObject;
const CardPurchaseMethodEnum = z.enum(["BAR_CODE","OCR","CARD_PIN","CARD_DETAILS","CARD_ON_FILE","ECOMMERCE","MAGNETIC_STRIPE","CONTACTLESS"]);
export const CardPurchaseMethodEnumSchema = CardPurchaseMethodEnum;
const CardPurchaseMethodObject = z
  .object({ method: CardPurchaseMethodEnum, cardNumberSuffix: z.string().nullable() })
  .passthrough();
export const CardPurchaseMethodObjectSchema = CardPurchaseMethodObject;
const NoteObject = z.object({ text: z.string() }).passthrough();
export const NoteObjectSchema = NoteObject;
const CustomerObject = z.object({ displayName: z.string() }).passthrough();
export const CustomerObjectSchema = CustomerObject;
const TransactionResource = z
  .object({
    type: z.string(),
    id: z.string(),
    attributes: z
      .object({
        status: TransactionStatusEnum,
        rawText: z.string().nullable(),
        description: z.string(),
        message: z.string().nullable(),
        isCategorizable: z.boolean(),
        holdInfo: HoldInfoObject.nullable(),
        roundUp: RoundUpObject.nullable(),
        cashback: CashbackObject.nullable(),
        amount: MoneyObject,
        foreignAmount: MoneyObject.nullable(),
        cardPurchaseMethod: CardPurchaseMethodObject.nullable(),
        settledAt: z.string().datetime({ offset: true }).nullable(),
        createdAt: z.string().datetime({ offset: true }),
        transactionType: z.string().nullable(),
        note: NoteObject.nullable(),
        performingCustomer: CustomerObject.nullable(),
      })
      .passthrough(),
    relationships: z
      .object({
        account: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough(),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough(),
        transferAccount: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough().nullable(),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough(),
        category: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough().nullable(),
            links: z
              .object({ self: z.string(), related: z.string().optional() })
              .passthrough()
              .optional(),
          })
          .passthrough(),
        parentCategory: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough().nullable(),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough(),
        tags: z
          .object({
            data: z.array(z.object({ type: z.string(), id: z.string() }).passthrough()),
            links: z.object({ self: z.string() }).passthrough().optional(),
          })
          .passthrough(),
        attachment: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough().nullable(),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough(),
      })
      .passthrough(),
    links: z.object({ self: z.string() }).passthrough().optional(),
  })
  .passthrough();
export const TransactionResourceSchema = TransactionResource;
const ListTransactionsResponse = z
  .object({
    data: z.array(TransactionResource),
    links: z.object({ prev: z.string().nullable(), next: z.string().nullable() }).passthrough(),
  })
  .passthrough();
export const ListTransactionsResponseSchema = ListTransactionsResponse;
const GetTransactionResponse = z.object({ data: TransactionResource }).passthrough();
export const GetTransactionResponseSchema = GetTransactionResponse;
const WebhookResource = z
  .object({
    type: z.string(),
    id: z.string(),
    attributes: z
      .object({
        url: z.string(),
        description: z.string().nullable(),
        secretKey: z.string().optional(),
        createdAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
    relationships: z
      .object({
        logs: z
          .object({ links: z.object({ related: z.string() }).passthrough() })
          .partial()
          .passthrough(),
      })
      .passthrough(),
    links: z.object({ self: z.string() }).passthrough().optional(),
  })
  .passthrough();
export const WebhookResourceSchema = WebhookResource;
const ListWebhooksResponse = z
  .object({
    data: z.array(WebhookResource),
    links: z.object({ prev: z.string().nullable(), next: z.string().nullable() }).passthrough(),
  })
  .passthrough();
export const ListWebhooksResponseSchema = ListWebhooksResponse;
const WebhookInputResource = z
  .object({
    attributes: z
      .object({ url: z.string().url(), description: z.string().nullish() })
      .passthrough(),
  })
  .passthrough();
export const WebhookInputResourceSchema = WebhookInputResource;
const CreateWebhookRequest = z.object({ data: WebhookInputResource }).passthrough();
export const CreateWebhookRequestSchema = CreateWebhookRequest;
const CreateWebhookResponse = z.object({ data: WebhookResource }).passthrough();
export const CreateWebhookResponseSchema = CreateWebhookResponse;
const GetWebhookResponse = z.object({ data: WebhookResource }).passthrough();
export const GetWebhookResponseSchema = GetWebhookResponse;
const WebhookEventTypeEnum = z.enum(["TRANSACTION_CREATED","TRANSACTION_SETTLED","TRANSACTION_DELETED","PING"]);
export const WebhookEventTypeEnumSchema = WebhookEventTypeEnum;
const WebhookEventResource = z
  .object({
    type: z.string(),
    id: z.string(),
    attributes: z
      .object({ eventType: WebhookEventTypeEnum, createdAt: z.string().datetime({ offset: true }) })
      .passthrough(),
    relationships: z
      .object({
        webhook: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough(),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough(),
        transaction: z
          .object({
            data: z.object({ type: z.string(), id: z.string() }).passthrough(),
            links: z.object({ related: z.string() }).passthrough().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();
export const WebhookEventResourceSchema = WebhookEventResource;
const WebhookEventCallback = z.object({ data: WebhookEventResource }).passthrough();
export const WebhookEventCallbackSchema = WebhookEventCallback;
const WebhookDeliveryStatusEnum = z.enum(["DELIVERED","UNDELIVERABLE","BAD_RESPONSE_CODE"]);
export const WebhookDeliveryStatusEnumSchema = WebhookDeliveryStatusEnum;
const WebhookDeliveryLogResource = z
  .object({
    type: z.string(),
    id: z.string(),
    attributes: z
      .object({
        request: z.object({ body: z.string() }).passthrough(),
        response: z
          .object({ statusCode: z.number().int(), body: z.string() })
          .passthrough()
          .nullable(),
        deliveryStatus: WebhookDeliveryStatusEnum,
        createdAt: z.string().datetime({ offset: true }),
      })
      .passthrough(),
    relationships: z
      .object({
        webhookEvent: z
          .object({ data: z.object({ type: z.string(), id: z.string() }).passthrough() })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();
export const WebhookDeliveryLogResourceSchema = WebhookDeliveryLogResource;
const ListWebhookDeliveryLogsResponse = z
  .object({
    data: z.array(WebhookDeliveryLogResource),
    links: z.object({ prev: z.string().nullable(), next: z.string().nullable() }).passthrough(),
  })
  .passthrough();
export const ListWebhookDeliveryLogsResponseSchema = ListWebhookDeliveryLogsResponse;

export const schemas = {
  AccountTypeEnum: AccountTypeEnumSchema,
  OwnershipTypeEnum: OwnershipTypeEnumSchema,
  MoneyObject: MoneyObjectSchema,
  AccountResource: AccountResourceSchema,
  ListAccountsResponse: ListAccountsResponseSchema,
  GetAccountResponse: GetAccountResponseSchema,
  AttachmentResource: AttachmentResourceSchema,
  ListAttachmentsResponse: ListAttachmentsResponseSchema,
  GetAttachmentResponse: GetAttachmentResponseSchema,
  CategoryResource: CategoryResourceSchema,
  ListCategoriesResponse: ListCategoriesResponseSchema,
  GetCategoryResponse: GetCategoryResponseSchema,
  CategoryInputResourceIdentifier: CategoryInputResourceIdentifierSchema,
  UpdateTransactionCategoryRequest: UpdateTransactionCategoryRequestSchema,
  PingResponse: PingResponseSchema,
  ErrorObject: ErrorObjectSchema,
  ErrorResponse: ErrorResponseSchema,
  TagResource: TagResourceSchema,
  ListTagsResponse: ListTagsResponseSchema,
  TagInputResourceIdentifier: TagInputResourceIdentifierSchema,
  UpdateTransactionTagsRequest: UpdateTransactionTagsRequestSchema,
  TransactionStatusEnum: TransactionStatusEnumSchema,
  HoldInfoObject: HoldInfoObjectSchema,
  RoundUpObject: RoundUpObjectSchema,
  CashbackObject: CashbackObjectSchema,
  CardPurchaseMethodEnum: CardPurchaseMethodEnumSchema,
  CardPurchaseMethodObject: CardPurchaseMethodObjectSchema,
  NoteObject: NoteObjectSchema,
  CustomerObject: CustomerObjectSchema,
  TransactionResource: TransactionResourceSchema,
  ListTransactionsResponse: ListTransactionsResponseSchema,
  GetTransactionResponse: GetTransactionResponseSchema,
  WebhookResource: WebhookResourceSchema,
  ListWebhooksResponse: ListWebhooksResponseSchema,
  WebhookInputResource: WebhookInputResourceSchema,
  CreateWebhookRequest: CreateWebhookRequestSchema,
  CreateWebhookResponse: CreateWebhookResponseSchema,
  GetWebhookResponse: GetWebhookResponseSchema,
  WebhookEventTypeEnum: WebhookEventTypeEnumSchema,
  WebhookEventResource: WebhookEventResourceSchema,
  WebhookEventCallback: WebhookEventCallbackSchema,
  WebhookDeliveryStatusEnum: WebhookDeliveryStatusEnumSchema,
  WebhookDeliveryLogResource: WebhookDeliveryLogResourceSchema,
  ListWebhookDeliveryLogsResponse: ListWebhookDeliveryLogsResponseSchema,
} as const;
