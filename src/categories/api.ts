import { UpClient } from '../helper/client';
import { EmptyResponseSchema } from '../helper/client';
import { ENDPOINTS } from '../constants';
import { GetCategoryResponseSchema, ListCategoriesResponseSchema } from '../gen/schemas';
import type {
  CategoryInputResourceIdentifier,
  GetCategoryResponse,
  ListCategoriesRequest,
  ListCategoriesResponse,
} from '../types';

type RequestBehavior = {
  cache?: boolean;
};

/**
 * Categories provide spending classification and parent-child category relationships.
 */
export class CategoriesApi {
  /**
   * @param api Shared low-level API client.
   */
  constructor(private readonly api: UpClient) {}

  /**
   * Retrieve a list of all categories and their ancestry.
   *
   * @param params Category list filters.
   * @param options Request behavior options.
   * @returns Category collection.
   */
  public list(
    params: ListCategoriesRequest = {},
    options: RequestBehavior = {},
  ): Promise<ListCategoriesResponse> {
    return this.api.get(ENDPOINTS.CATEGORIES, {
      responseSchema: ListCategoriesResponseSchema,
      cache: options.cache,
      query: {
        'filter[parent]': params.parent,
      },
    });
  }

  /**
   * Retrieve a specific category by unique identifier.
   *
   * @param categoryId Category identifier.
   * @param options Request behavior options.
   * @returns Category resource response.
   */
  public retrieve(categoryId: string, options: RequestBehavior = {}): Promise<GetCategoryResponse> {
    return this.api.get(`${ENDPOINTS.CATEGORIES}/${categoryId}`, {
      responseSchema: GetCategoryResponseSchema,
      cache: options.cache,
    });
  }

  /**
   * Update a transaction's category association. Use null to remove category assignment.
   *
   * @param transactionId Transaction identifier.
   * @param category Category relationship payload or null to clear.
   * @returns A promise that resolves when the update completes.
   */
  public updateTransactionCategory(
    transactionId: string,
    category: CategoryInputResourceIdentifier | null,
  ): Promise<void> {
    return this.api.patch<CategoryInputResourceIdentifier | null, void>(
      `${ENDPOINTS.TRANSACTIONS}/${transactionId}/relationships/category`,
      {
        responseSchema: EmptyResponseSchema,
        payload: category,
      },
    );
  }
}
