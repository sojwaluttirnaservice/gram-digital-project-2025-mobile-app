import {
  HttpClientConfig,
  HttpResponse,
  RequestInit,
  RequestInterceptor,
  ResponseInterceptor,
} from "@/classes/HttpTypes";
import { InterceptorManager } from "@/classes/InterceptorManager";

/**
 * Lightweight HTTP client (fetch wrapper).
 *
 * Features:
 * - Base URL support
 * - Auto headers for JSON/FormData
 * - Request/Response interceptors (add/eject)
 * - Supports unwrapped response mode (via response interceptor)
 */
export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: InterceptorManager<RequestInterceptor>;
  private responseInterceptors: InterceptorManager<ResponseInterceptor>;

  constructor(config: HttpClientConfig = {}) {
    this.baseURL = config.baseURL ?? "";
    this.defaultHeaders = config.headers ?? {
      "Content-Type": "application/json",
    };
    this.requestInterceptors = new InterceptorManager<RequestInterceptor>();
    this.responseInterceptors = new InterceptorManager<ResponseInterceptor>();
  }

  /** Get current baseURL */
  getBaseURL(): string {
    return this.baseURL;
  }

  /** Set/replace baseURL */
  setBaseURL(url: string): void {
    this.baseURL = url || "";
  }

  /** Get a snapshot of default headers */
  getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  /** Set or overwrite a default header */
  setDefaultHeader(name: string, value: string): void {
    this.defaultHeaders[name] = value;
  }

  /** Remove a default header */
  removeDefaultHeader(name: string): void {
    delete this.defaultHeaders[name];
  }

  /** Add a request interceptor; returns id for later eject */
  useRequestInterceptor(interceptor: RequestInterceptor): number {
    return this.requestInterceptors.use(interceptor);
  }

  /** Remove a request interceptor by id */
  ejectRequestInterceptor(id: number): void {
    this.requestInterceptors.eject(id);
  }

  /** Add a response interceptor; returns id for later eject */
  useResponseInterceptor(interceptor: ResponseInterceptor): number {
    return this.responseInterceptors.use(interceptor);
  }

  /** Remove a response interceptor by id */
  ejectResponseInterceptor(id: number): void {
    this.responseInterceptors.eject(id);
  }

  /**
   * Auto-detect headers based on body type
   */
  private computeHeaders(headers: Record<string, string>, body: any) {
    const computed = { ...this.defaultHeaders, ...headers };

    if (body instanceof FormData) {
      // Let fetch set multipart boundary automatically
      delete computed["Content-Type"];
      return computed;
    }

    if (typeof body === "object" && body !== null && !(body instanceof Blob)) {
      // JSON body (object) => ensure application/json
      computed["Content-Type"] = "application/json";
    }

    return computed;
  }

  /**
   * Decide how to parse the response:
   * - If JSON content-type -> json()
   * - Else -> text()
   * - 204 / empty -> null
   */
  private async parseResponseData(response: Response): Promise<any> {
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return null;
    }

    const ctype = response.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }

    try {
      return await response.text();
    } catch {
      return null;
    }
  }

  /**
   * Core request method
   *
   * By default:
   * - Returns `{ status, data, raw }`
   *
   * If a response interceptor returns a non-undefined value:
   * - That value is returned directly (bypassing default HttpResponse wrapper)
   */
  async request<T = any>(
    method: string,
    url: string,
    body: any = null,
    headers: Record<string, string> = {}
  ): Promise<HttpResponse<T> | T> {
    let fullUrl = this.baseURL + url;

    let config: RequestInit = {
      method,
      headers: this.computeHeaders(headers, body),
    };

    if (body !== null && body !== undefined) {
      if (body instanceof FormData) {
        config.body = body;
      } else if (typeof body === "object" && !(body instanceof Blob)) {
        config.body = JSON.stringify(body);
      } else {
        config.body = body;
      }
    }

    // --- Request interceptors
    for (const interceptor of this.requestInterceptors.list()) {
      const modified = await interceptor(fullUrl, config);
      if (modified) {
        fullUrl = modified.url ?? fullUrl;
        config = modified.config ?? config;
      }
    }

    const response = await fetch(fullUrl, config);
    let data: any = await this.parseResponseData(response);

    // --- Response interceptors
    for (const interceptor of this.responseInterceptors.list()) {
      const next = await interceptor(data, response);
      if (typeof next !== "undefined") {
        // Interceptor overrides response completely
        return next as T;
      }
    }

    // --- Default return shape
    return { status: response.status, data: data as T, raw: response };
  }

  /** Shorthand for GET */
  get<T = any>(
    url: string,
    headers: Record<string, string> = {}
  ): Promise<HttpResponse<T> | T> {
    return this.request<T>("GET", url, null, headers);
  }

  /** Shorthand for POST */
  post<T = any>(
    url: string,
    body: any = {},
    headers: Record<string, string> = {}
  ): Promise<HttpResponse<T> | T> {
    return this.request<T>("POST", url, body, headers);
  }

  /** Shorthand for PUT */
  put<T = any>(
    url: string,
    body: any = {},
    headers: Record<string, string> = {}
  ): Promise<HttpResponse<T> | T> {
    return this.request<T>("PUT", url, body, headers);
  }

  /** Shorthand for PATCH */
  patch<T = any>(
    url: string,
    body: any = {},
    headers: Record<string, string> = {}
  ): Promise<HttpResponse<T> | T> {
    return this.request<T>("PATCH", url, body, headers);
  }

  /** Shorthand for DELETE */
  delete<T = any>(
    url: string,
    headers: Record<string, string> = {}
  ): Promise<HttpResponse<T> | T> {
    return this.request<T>("DELETE", url, null, headers);
  }
}
