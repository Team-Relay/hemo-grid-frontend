/**
 * Server-only HTTP boundary for the Spring Boot API.
 *
 * Keeping bearer-token attachment and response parsing here prevents secrets
 * and transport details from leaking into React components.
 */

import "server-only";

import { ApiClientError, toApiClientError } from "@/lib/api/errors";

const LOCAL_API_URL = "http://localhost:8080/api/v1";
const DEFAULT_TIMEOUT_MS = 10_000;

function getApiBaseUrl(): string {
  const configuredUrl = process.env.HEMOGRID_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_API_URL;
  }

  throw new Error("HEMOGRID_API_URL must be configured in production.");
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  accessToken?: string;
  headers?: HeadersInit;
  timeoutMs?: number;
}

/**
 * Performs a typed request and throws ApiClientError for all expected HTTP and
 * network failures. Operational reads default to no-store so status and stock
 * are never served from a stale Next.js cache.
 */
export async function apiRequest<T>(
  path: string,
  {
    accessToken,
    headers: suppliedHeaders,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = "no-store",
    ...init
  }: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(suppliedHeaders);
  headers.set("Accept", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      cache,
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ApiClientError({
        code: "NETWORK_TIMEOUT",
        message: "The server took too long to respond. Please try again.",
        cause: error,
      });
    }

    throw new ApiClientError({
      code: "NETWORK_ERROR",
      message: "HemoGrid could not reach the server. Check your connection and try again.",
      cause: error,
    });
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw toApiClientError(
      payload,
      response.status,
      `The request failed with status ${response.status}.`,
    );
  }

  return payload as T;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ApiClientError({
      status: response.status,
      code: "NETWORK_ERROR",
      message: "The server returned an unreadable response.",
      cause: error,
    });
  }
}
