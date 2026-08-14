/**
 * Lightweight manager for adding/ejecting interceptors (similar to axios).
 */
export class InterceptorManager<T extends Function> {
  private nextId = 0;
  private handlers = new Map<number, T>();

  /**
   * Add an interceptor; returns an id you can use to eject it later.
   */
  use(handler: T): number {
    const id = ++this.nextId;
    this.handlers.set(id, handler);
    return id;
  }

  /**
   * Remove an interceptor by id.
   */
  eject(id: number): void {
    this.handlers.delete(id);
  }

  /**
   * Iterate current handlers in insertion order.
   */
  forEach(fn: (handler: T) => void): void {
    for (const h of this.handlers.values()) fn(h);
  }

  /**
   * Return a snapshot array of handlers (useful for async loops).
   */
  list(): T[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Remove all interceptors.
   */
  clear(): void {
    this.handlers.clear();
  }
}
