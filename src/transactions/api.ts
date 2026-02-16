import { UpClient } from '../helper/client';
import { ENDPOINTS } from '../constants';
import { GetTransactionResponseSchema, ListTransactionsResponseSchema } from '../gen/schemas';
import type {
  GetTransactionResponse,
  ListTransactionRequest,
  ListTransactionsResponse,
} from '../types';

type RequestBehavior = {
  cache?: boolean;
};

/**
 * Transactions represent money movement into and out of accounts.
 */
export class TransactionsApi {
  /**
   * @param api Shared low-level API client.
   */
  constructor(private readonly api: UpClient) {}

  /**
   * Retrieve all transactions for the authenticated customer.
   *
   * @param params Transaction filters and pagination options.
   * @param options Request behavior options.
   * @returns Paginated transaction collection.
   */
  public list(
    params: ListTransactionRequest = {},
    options: RequestBehavior = {},
  ): Promise<ListTransactionsResponse> {
    return this.api.get(ENDPOINTS.TRANSACTIONS, {
      responseSchema: ListTransactionsResponseSchema,
      cache: options.cache,
      query: this.toQueryParams(params),
    });
  }

  /**
   * Retrieve one transaction by unique identifier.
   *
   * @param transactionId Transaction identifier.
   * @param options Request behavior options.
   * @returns Transaction resource response.
   */
  public retrieve(
    transactionId: string,
    options: RequestBehavior = {},
  ): Promise<GetTransactionResponse> {
    return this.api.get(`${ENDPOINTS.TRANSACTIONS}/${transactionId}`, {
      responseSchema: GetTransactionResponseSchema,
      cache: options.cache,
    });
  }

  /**
   * Retrieve transactions for a specific account.
   *
   * @param accountId Account identifier.
   * @param params Transaction filters and pagination options.
   * @param options Request behavior options.
   * @returns Paginated transaction collection.
   */
  public listByAccount(
    accountId: string,
    params: ListTransactionRequest = {},
    options: RequestBehavior = {},
  ): Promise<ListTransactionsResponse> {
    return this.api.get(`${ENDPOINTS.ACCOUNTS}/${accountId}/${ENDPOINTS.TRANSACTIONS}`, {
      responseSchema: ListTransactionsResponseSchema,
      cache: options.cache,
      query: this.toQueryParams(params),
    });
  }

  /**
   * Maps ergonomic transaction filter options to raw query parameters.
   */
  private toQueryParams(
    params: ListTransactionRequest,
  ): Record<string, string | number | undefined> {
    return {
      'page[size]': params.pageSize,
      'filter[status]': params.filterStatus,
      'filter[since]': params.filterSince,
      'filter[until]': params.filterUntil,
      'filter[category]': params.filterCategory,
      'filter[tag]': params.filterTag,
    };
  }
}
