/**
 * Typed authentication calls to the Spring Boot API.
 */

import "server-only";

import type { BackendLoginResponse, BackendUser } from "@/lib/api/backend-types";
import { apiRequest } from "@/lib/api/client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export function login(credentials: LoginCredentials): Promise<BackendLoginResponse> {
  return apiRequest<BackendLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(accessToken: string): Promise<BackendUser> {
  return apiRequest<BackendUser>("/auth/me", { accessToken });
}
