import { HttpError } from "./HttpError";

/**
 * @typedef {Object} ApiResponse
 * @property {any} data
 * @property {boolean} success
 * @property {string} [usrMsg]
 * @property {string} [errMsg]
 * @property {number} [statusCode]
 */

/**
 * @typedef {Object} HttpClientConfig
 * @property {string} [baseURL] - Base URL for all requests
 * @property {Record<string, string>} [headers] - Default headers
 */
class HttpClient {
  /**
   * @param {HttpClientConfig} config
   */
  constructor(config = {}) {
    this.baseURL = config.baseURL || "";
    this.defaultHeaders = config.headers || {
      "Content-Type": "application/json",
    };

    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  useRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  useResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Auto-detects headers based on body type
   */
  _getHeaders(headers, body) {
    let computed = { ...this.defaultHeaders, ...headers };

    if (body instanceof FormData) {
      // Let fetch set boundary automatically
      delete computed["Content-Type"];
    } else if (
      typeof body === "object" &&
      body !== null &&
      !(body instanceof Blob)
    ) {
      computed["Content-Type"] = "application/json";
    }

    return computed;
  }

  async request(method, url, body = null, headers = {}) {
    let fullUrl = this.baseURL + url;
    let config = { method, headers: this._getHeaders(headers, body) };

    if (body) {
      if (body instanceof FormData) {
        config.body = body;
      } else if (typeof body === "object" && !(body instanceof Blob)) {
        config.body = JSON.stringify(body);
      } else {
        config.body = body;
      }
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      const modified = await interceptor(fullUrl, config);
      if (modified) {
        fullUrl = modified.url || fullUrl;
        config = modified.config || config;
      }
    }

    try {
      const response = await fetch(fullUrl, config);
      let resData = null;

      try {
        resData = await response.json();
      } catch (_) {
        // ignore non-JSON responses (plain text, empty body, etc.)
      }

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        resData = (await interceptor(resData, response)) || resData;
      }

      // Always trust real HTTP status
      const statusCode = response.status;

      return resData;

      /*
      if (!response.ok || statusCode >= 400) {
        throw new HttpError(
          resData?.usrMsg || response.statusText || "Something went wrong",
          statusCode,
          resData?.usrMsg,
          resData?.errMsg,
          resData?.data || null
        );
      }
    */

      /*
      return {
        success: true,
        data: resData?.data ?? resData,
        errMsg: resData?.errMsg,
        statusCode,
        usrMsg: resData?.usrMsg || null,
      };
      */
    } catch (err) {
      if (err instanceof HttpError) throw err;

      throw new HttpError(
        "Please check your internet connection",
        0,
        "Please check your internet connection",
        err.message || "Unknown error"
      );
    }
  }

  get(url, headers = {}) {
    return this.request("GET", url, null, headers);
  }

  post(url, body = {}, headers = {}) {
    return this.request("POST", url, body, headers);
  }

  put(url, body = {}, headers = {}) {
    return this.request("PUT", url, body, headers);
  }

  patch(url, body = {}, headers = {}) {
    return this.request("PATCH", url, body, headers);
  }

  delete(url, headers = {}) {
    return this.request("DELETE", url, null, headers);
  }
}

export { HttpClient };

