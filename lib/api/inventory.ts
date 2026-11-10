/** Typed server-only client for authenticated blood-bank inventory operations. */

import "server-only";

import type { BackendInventoryItem } from "@/lib/api/backend-types";
import { apiRequest } from "@/lib/api/client";

export function listInventory(accessToken: string): Promise<BackendInventoryItem[]> {
  return apiRequest<BackendInventoryItem[]>("/inventory", { accessToken });
}

export function updateInventoryUnits(
  accessToken: string,
  inventoryId: string,
  unitsAvailable: number,
): Promise<BackendInventoryItem> {
  return apiRequest<BackendInventoryItem>(`/inventory/${inventoryId}/units`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ unitsAvailable }),
  });
}
