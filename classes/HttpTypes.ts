export interface RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}
/**
 * Configuration for HttpClient
 */
export interface HttpClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

/**
 * Shape of the response returned by HttpClient
 */
export interface HttpResponse<T = any> {
  status: number;
  data: T;
  raw: Response;
}

/**
 * Request interceptor type
 * - May return partial overrides for url/config, or nothing.
 * - May be sync or async.
 */
export type RequestInterceptor = (
  url: string,
  config: RequestInit
) =>
  | { url?: string; config?: RequestInit }
  | void
  | Promise<{ url?: string; config?: RequestInit } | void>;

/**
 * Response interceptor type
 * - Receives parsed data (JSON or text) and the Response
 * - Returns a (possibly) transformed data value
 * - May be sync or async
 */
export type ResponseInterceptor = (
  data: any,
  response: Response
) => any | Promise<any>;
