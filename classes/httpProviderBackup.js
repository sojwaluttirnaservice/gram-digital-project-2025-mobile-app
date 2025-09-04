import { HttpClient } from "./HttpClient";

/**
 * Provider for managing multiple HttpClient instances.
 */
class HttpProvider {
  constructor() {
    /** @type {Map<string, HttpClient>} */
    this.instances = new Map();
  }

  /**
   * Create or retrieve an HttpClient instance
   * @param {string} name - Unique identifier for the client
   * @param {import("./HttpClient").HttpClientConfig} config
   * @returns {HttpClient}
   */
  create(name, config = {}) {
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }
    const client = new HttpClient(config);
    this.instances.set(name, client);
    return client;
  }

  /**
   * Get an existing HttpClient instance
   * @param {string} name
   * @returns {HttpClient | undefined}
   */
  get(name) {
    return this.instances.get(name);
  }

  /**
   * Remove an instance (useful for logout, cleanup, etc.)
   * @param {string} name
   */
  remove(name) {
    this.instances.delete(name);
  }

  /**
   * Clear all instances
   */
  clear() {
    this.instances.clear();
  }
}

const client = new HttpProvider();
export { client };
