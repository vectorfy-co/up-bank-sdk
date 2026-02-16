import { UpClient } from '../helper/client';
import { ENDPOINTS } from '../constants';
import { GetAccountResponseSchema, ListAccountsResponseSchema } from '../gen/schemas';
import type { GetAccountResponse, ListAccountsRequest, ListAccountsResponse } from '../types';

type RequestBehavior = {
  cache?: boolean;
};

/**
 * Accounts represent the underlying store used to track balances and the transactions
 * that have occurred to modify those balances over time.
 */
export class AccountsApi {
  /**
   * @param api Shared low-level API client.
   */
  constructor(private readonly api: UpClient) {}

  /**
   * Retrieve a paginated list of all accounts for the authenticated user.
   *
   * @param params Account listing filters and pagination options.
   * @param options Request behavior options.
   * @returns A paginated account collection.
   */
  public list(
    params: ListAccountsRequest = {},
    options: RequestBehavior = {},
  ): Promise<ListAccountsResponse> {
    return this.api.get(ENDPOINTS.ACCOUNTS, {
      responseSchema: ListAccountsResponseSchema,
      cache: options.cache,
      query: {
        'page[size]': params.pageSize,
        'filter[accountType]': params.filterAccountType,
        'filter[ownershipType]': params.filterOwnershipType,
      },
    });
  }

  /**
   * Retrieve a specific account by unique identifier.
   *
   * @param accountId Account identifier.
   * @param options Request behavior options.
   * @returns Account resource response.
   */
  public retrieve(accountId: string, options: RequestBehavior = {}): Promise<GetAccountResponse> {
    return this.api.get(`${ENDPOINTS.ACCOUNTS}/${accountId}`, {
      responseSchema: GetAccountResponseSchema,
      cache: options.cache,
    });
  }
}
