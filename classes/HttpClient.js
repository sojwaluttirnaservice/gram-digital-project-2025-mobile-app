/**
 * @typedef {Object} ApiResponse
 * @property {any} data
 * @property {boolean} success
 * @property {string} [usrMsg]
 * @property {string} [errMsg]
 * @property {number} [statusCode]
 */

/**
 * Custom error class for HTTP errors.
 */
class HttpError extends Error {
  constructor(message, statusCode = 0, usrMsg = "", errMsg = "", data = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.usrMsg = usrMsg;
    this.errMsg = errMsg;
    this.data = data;
  }
}

/**
 * A lightweight HTTP client similar to Axios, tailored for React Native (Expo).
 */
class HttpClient {
  constructor(config = {}) {
    /**
     * @type {string}
     */
    this.baseURL = config.baseURL || "";

    /**
     * @type {Record<string, string>}
     */
    this.defaultHeaders = config.headers || {
      "Content-Type": "application/json",
    };

    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Add a request interceptor.
   * @param {(url: string, config: RequestInit) => Promise<{url?: string, config?: RequestInit}>} interceptor
   */
  useRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor.
   * @param {(data: any, response: Response) => Promise<any>} interceptor
   */
  useResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Makes an HTTP request with optional request/response interceptors.
   *
   * @param {string} method - HTTP method ('GET', 'POST', etc.)
   * @param {string} url - Request URL (relative to baseURL)
   * @param {Object|null} body - Request body (if applicable)
   * @param {Object} headers - Additional request headers
   * @returns {Promise<ApiResponse>} - Standardized response object
   * @throws {HttpError} - If response fails or is not ok
   */
  async request(method, url, body = null, headers = {}) {
    let fullUrl = this.baseURL + url;

    let config = {
      method,
      headers: { ...this.defaultHeaders, ...headers },
    };

    if (body) {
      config.body = JSON.stringify(body);
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
      } catch (err) {
        // ignore JSON parsing errors
      }

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        resData = (await interceptor(resData, response)) || resData;
      }

      const statusCode = resData?.statusCode || response.status;

      if (!response.ok || statusCode >= 400) {
        throw new HttpError(
          resData?.usrMsg || "Something went wrong",
          statusCode,
          resData?.usrMsg,
          resData?.errMsg,
          resData?.data || null
        );
      }

      return {
        success: true,
        data: resData.data,
        errMsg: resData.errMsg,
        statusCode: resData.statusCode,
        usrMsg: resData?.usrMsg || null,
      };
    } catch (err) {
      if (err instanceof HttpError) {
        throw err;
      }

      throw new HttpError(
        "Please check your internet connection",
        0,
        "Please check your internet connection",
        err.message || "Unknown error"
      );
    }
  }

  /** @param {string} url @param {object} headers   @returns {Promise<ApiResponse>} */
  get(url, headers = {}) {
    return this.request("GET", url, null, headers);
  }

  /** @param {string} url @param {object} body @param {object} headers   @returns {Promise<ApiResponse>}*/
  post(url, body = {}, headers = {}) {
    return this.request("POST", url, body, headers);
  }

  /** @param {string} url @param {object} body @param {object} headers   @returns {Promise<ApiResponse>}*/
  put(url, body = {}, headers = {}) {
    return this.request("PUT", url, body, headers);
  }

  /** @param {string} url @param {object} body @param {object} headers  @returns {Promise<ApiResponse>} */
  patch(url, body = {}, headers = {}) {
    return this.request("PATCH", url, body, headers);
  }

  /** @param {string} url @param {object} headers   @returns {Promise<ApiResponse>}*/
  delete(url, headers = {}) {
    return this.request("DELETE", url, null, headers);
  }
}

export { HttpClient, HttpError };

