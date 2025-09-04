import { HttpClient } from "@/classes/HttpClient";
import { HttpClientConfig } from "@/classes/HttpTypes";

/**
 * Provider for managing multiple `HttpClient` instances.
 */
export class HttpProvider {
  private instances: Map<string, HttpClient>;

  constructor() {
    this.instances = new Map();
  }

  /**
   * Create (or retrieve) an `HttpClient` instance.
   * If a client with the given name exists, it is returned.
   */
  create(name: string, config: HttpClientConfig = {}): HttpClient {
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }
    const newClient = new HttpClient(config);
    this.instances.set(name, newClient);
    return newClient;
  }

  /** Get a client by name (or undefined if not created yet). */
  get(name: string): HttpClient | undefined {
    return this.instances.get(name);
  }

  /** Remove one client by name. */
  remove(name: string): void {
    this.instances.delete(name);
  }

  /** Clear all clients. */
  clear(): void {
    this.instances.clear();
  }
}

/** Singleton provider */
export const client = new HttpProvider();
