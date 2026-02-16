import { UpClient } from '../helper/client';
import { ENDPOINTS } from '../constants';
import { GetAttachmentResponseSchema, ListAttachmentsResponseSchema } from '../gen/schemas';
import type {
  GetAttachmentResponse,
  ListAttachmentsRequest,
  ListAttachmentsResponse,
} from '../types';

type RequestBehavior = {
  cache?: boolean;
};

/**
 * Attachments attached to transactions and enriched ledger items.
 */
export class AttachmentsApi {
  /**
   * @param api Shared low-level API client.
   */
  constructor(private readonly api: UpClient) {}

  /**
   * List attachments for the authenticated account.
   *
   * @param params Pagination options.
   * @param options Request behavior options.
   * @returns Paginated attachment collection.
   */
  public list(
    params: ListAttachmentsRequest = {},
    options: RequestBehavior = {},
  ): Promise<ListAttachmentsResponse> {
    return this.api.get(ENDPOINTS.ATTACHMENTS, {
      responseSchema: ListAttachmentsResponseSchema,
      cache: options.cache,
      query: {
        'page[size]': params.pageSize,
      },
    });
  }

  /**
   * Retrieve an attachment by identifier.
   *
   * @param attachmentId Attachment identifier.
   * @param options Request behavior options.
   * @returns Attachment resource response.
   */
  public get(attachmentId: string, options: RequestBehavior = {}): Promise<GetAttachmentResponse> {
    return this.api.get(`${ENDPOINTS.ATTACHMENTS}/${attachmentId}`, {
      responseSchema: GetAttachmentResponseSchema,
      cache: options.cache,
    });
  }
}
