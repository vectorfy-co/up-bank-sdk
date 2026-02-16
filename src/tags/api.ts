import { UpClient } from '../helper/client';
import { EmptyResponseSchema } from '../helper/client';
import { ENDPOINTS } from '../constants';
import { ListTagsResponseSchema } from '../gen/schemas';
import type { ListTagsRequest, ListTagsResponse, TagInputResourceIdentifier } from '../types';

type RequestBehavior = {
  cache?: boolean;
};

/**
 * Tags are user-defined labels that can be associated with transactions.
 */
export class TagsApi {
  /**
   * @param api Shared low-level API client.
   */
  constructor(private readonly api: UpClient) {}

  /**
   * Retrieve a paginated list of tags currently in use.
   *
   * @param params Tag list pagination options.
   * @param options Request behavior options.
   * @returns Paginated tag collection.
   */
  public list(
    params: ListTagsRequest = {},
    options: RequestBehavior = {},
  ): Promise<ListTagsResponse> {
    return this.api.get(ENDPOINTS.TAGS, {
      responseSchema: ListTagsResponseSchema,
      cache: options.cache,
      query: {
        'page[size]': params.pageSize,
      },
    });
  }

  /**
   * Associate one or more tags with a transaction.
   *
   * @param transactionId Transaction identifier.
   * @param tags Tag identifiers to attach.
   * @returns A promise that resolves when tags are applied.
   */
  public addTagsToTransaction(
    transactionId: string,
    tags: TagInputResourceIdentifier[],
  ): Promise<void> {
    return this.api.post<TagInputResourceIdentifier[], void>(
      TagsApi.buildTransactionTagsPath(transactionId),
      {
        payload: tags,
        responseSchema: EmptyResponseSchema,
      },
    );
  }

  /**
   * Remove one or more tags from a transaction.
   *
   * @param transactionId Transaction identifier.
   * @param tags Tag identifiers to remove.
   * @returns A promise that resolves when tags are removed.
   */
  public removeTagsFromTransaction(
    transactionId: string,
    tags: TagInputResourceIdentifier[],
  ): Promise<void> {
    return this.api.delete<TagInputResourceIdentifier[], void>(
      TagsApi.buildTransactionTagsPath(transactionId),
      {
        payload: tags,
        responseSchema: EmptyResponseSchema,
      },
    );
  }

  /**
   * Builds the relationship endpoint for transaction tag mutations.
   */
  private static buildTransactionTagsPath(transactionId: string): string {
    return `${ENDPOINTS.TRANSACTIONS}/${transactionId}/relationships/tags`;
  }
}
