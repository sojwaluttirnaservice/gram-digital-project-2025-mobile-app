import { HttpClient } from "@/classes/HttpClient";
import { client } from "@/classes/HttpProvider";
import { useMemo } from "react";
import { useSelector } from "react-redux";

// ---- Redux State Shape ----
interface ConnectionState {
  serverUrl: string | null;
  mainUrl: string | null;
}

interface RootState {
  connection: ConnectionState;
}

// ---- Hook ----

/**
 * React hook that returns `HttpClient` instances bound to the latest
 * `serverUrl` and `mainUrl` from Redux state.
 *
 * ## Behavior
 * - Reads `serverUrl` and `mainUrl` from `state.connection` in Redux.
 * - Creates (or retrieves) two named `HttpClient` instances:
 *   - `"gramDigital"` → bound to `serverUrl`
 *   - `"gSeva"` → bound to `mainUrl`
 * - Each instance is memoized and re-created when its respective URL changes.
 * - Each client automatically attaches a **response interceptor** that
 *   unwraps the raw response and returns only the parsed `data`.
 * - If a URL is missing/empty, its corresponding client is `null`.
 *
 * ## Example
 * ```tsx
 * const { instance, mainInstance } = useApi();
 *
 * async function loadData() {
 *   if (instance) {
 *     const res = await instance.get<{ users: any[] }>("/users");
 *     console.log(res); // Direct response with parsed data
 *   }
 *
 *   if (mainInstance) {
 *     const res = await mainInstance.post<{ token: string }>("/auth/login", {
 *       user: "test",
 *     });
 *     console.log(res); // Direct response with parsed data
 *   }
 * }
 * ```
 *
 * @returns {{
 *   api: HttpClient | null;
 *   instance: HttpClient | null;
 * }}
 * - `api`: HttpClient bound to `serverUrl` (`gramDigital`)
 * - `instance`: HttpClient bound to `mainUrl` (`gSeva`)
 */
export function useApi(): {
  api: HttpClient | null;
  instance: HttpClient | null;
} {
  const { serverUrl, mainUrl } = useSelector(
    (state: RootState) => state.connection
  );

  /**
   * Shared response interceptor
   * - Returns raw `data` as-is, without wrapping in extra structure
   */
  const unwrapInterceptor = (data: any) => {
    return data;
  };

  // Client bound to dynamic serverUrl
  const api = useMemo<HttpClient | null>(() => {
    if (!serverUrl) return null;
    const _client = client.create("gramDigital", { baseURL: serverUrl });

    // Ensure interceptor is added only once
    if (!(_client as any)._hasInterceptor) {
      _client.useResponseInterceptor(unwrapInterceptor);
      (_client as any)._hasInterceptor = true;
    }

    return _client;
  }, [serverUrl]);

  // Client bound to mainUrl
  const instance = useMemo<HttpClient | null>(() => {
    if (!mainUrl) return null;
    const _client = client.create("gSeva", { baseURL: mainUrl });

    if (!(_client as any)._hasInterceptor) {
      _client.useResponseInterceptor(unwrapInterceptor);
      (_client as any)._hasInterceptor = true;
    }

    return _client;
  }, [mainUrl]);

  return { api, instance };
}
