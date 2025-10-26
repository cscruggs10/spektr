import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to create a fetch request with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 60000 // 60 seconds default - much more reasonable for inspectors
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please check your internet connection and try again');
    }
    throw error;
  }
}

// Helper to implement retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Upload attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`, error);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Determine if an error is retryable (network errors, timeouts, 5xx errors)
function isRetryableError(error: any): boolean {
  if (error instanceof Error) {
    // Network errors and timeouts are retryable
    if (error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.name === 'AbortError') {
      return true;
    }

    // 5xx server errors are retryable
    const statusMatch = error.message.match(/^(\d{3}):/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      return status >= 500 && status < 600;
    }
  }

  return false;
}

export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: ApiRequestOptions,
): Promise<Response> {
  const { timeout = 60000, retries = 1, retryDelay = 1000 } = options || {};

  return retryWithBackoff(
    async () => {
      let headers = {};
      let body;

      if (data instanceof FormData) {
        // Let the browser set the Content-Type for FormData (includes boundary)
        body = data;
      } else if (data) {
        headers = { "Content-Type": "application/json" };
        body = JSON.stringify(data);
      }

      const res = await fetchWithTimeout(url, {
        method,
        headers,
        body,
        credentials: "include",
      }, timeout);

      await throwIfResNotOk(res);
      return res;
    },
    retries,
    retryDelay,
    isRetryableError
  );
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
