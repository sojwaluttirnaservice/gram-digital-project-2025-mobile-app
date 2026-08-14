import { HttpClient } from "@/classes/HttpClient";
import { client } from "@/classes/HttpProvider";
import { useMemo } from "react";
import { Alert } from "react-native";
import { useSelector } from "react-redux";

// ---- Timeout (easy to modify) ----
const REQUEST_TIMEOUT = 30000; // 30 seconds

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
    const { serverUrl, mainUrl } = useSelector((state: RootState) => state.connection);

    // ---- Interceptors ----

    // Unwrap response data
    const unwrapInterceptor = (data: any) => data;

    // Adds timeout to request
    const timeoutRequestInterceptor = async (url: string, config: any) => {
        const controller = new AbortController();

        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        config.signal = controller.signal;
        config._timeoutCleanup = () => clearTimeout(timer);

        return { url, config };
    };

    // Clears timeout timer
    const timeoutCleanupInterceptor = (data: any, response: any) => {
        if (response?.config?._timeoutCleanup) {
            response.config._timeoutCleanup();
        }
    };

    // Handle timeout error
    const timeoutErrorInterceptor = (data: any, response: any) => {
        if (response?.name === "AbortError") {
            Alert.alert("Timeout Error", "The request took too long. Please try again.");
        }
    };

    // ---- Create API Clients ----

    const setupClient = (key: string, url: string | null) => {
        if (!url) return null;

        const _client = client.create(key, { baseURL: url });

        if (!(_client as any)._hasInterceptor) {
            // Add interceptors exactly once
            _client.useRequestInterceptor(timeoutRequestInterceptor);
            _client.useResponseInterceptor(timeoutCleanupInterceptor);
            _client.useResponseInterceptor(timeoutErrorInterceptor);
            _client.useResponseInterceptor(unwrapInterceptor);

            (_client as any)._hasInterceptor = true;
        }

        return _client;
    };

    const api = useMemo(() => setupClient("gramDigital", serverUrl), [serverUrl]);
    const instance = useMemo(() => setupClient("gSeva", mainUrl), [mainUrl]);

    return { api, instance };
}
