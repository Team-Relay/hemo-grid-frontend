/** Server-only composition layer for blood-bank pages and dashboards. */

import "server-only";

import type { BackendOrganization } from "@/lib/api/backend-types";
import { listInventory } from "@/lib/api/inventory";
import { mapBloodRequest, mapBloodRequests, mapInventoryItems } from "@/lib/api/mappers";
import { getCurrentOrganization } from "@/lib/api/organizations";
import { getProviderRequest, listProviderRequests } from "@/lib/api/provider-requests";
import { verifySession } from "@/lib/auth/dal";
import type { BloodRequest, InventoryItem } from "@/types/domain";

export interface ProviderDashboardData {
  organization: BackendOrganization;
  requests: BloodRequest[];
  inventory: InventoryItem[];
}

export interface ProviderRequestData {
  request: BloodRequest;
  matchingInventory?: InventoryItem;
}

export interface ProviderInventoryData {
  organization: BackendOrganization;
  inventory: InventoryItem[];
}

/** Fetches independent dashboard resources concurrently to avoid a server waterfall. */
export async function getProviderDashboardData(): Promise<ProviderDashboardData> {
  const { accessToken } = await verifySession();
  const [organization, requestDtos, inventoryDtos] = await Promise.all([
    getCurrentOrganization(accessToken),
    listProviderRequests(accessToken),
    listInventory(accessToken),
  ]);

  return {
    organization,
    requests: mapBloodRequests(requestDtos),
    inventory: mapInventoryItems(inventoryDtos, organization.id),
  };
}

export async function getProviderRequests(): Promise<BloodRequest[]> {
  const { accessToken } = await verifySession();
  return mapBloodRequests(await listProviderRequests(accessToken));
}

export async function getProviderRequestData(requestId: string): Promise<ProviderRequestData> {
  const { accessToken, user } = await verifySession();
  const [requestDto, inventoryDtos] = await Promise.all([
    getProviderRequest(accessToken, requestId),
    listInventory(accessToken),
  ]);
  const request = mapBloodRequest(requestDto);
  const inventory = mapInventoryItems(inventoryDtos, user.organization?.id ?? "");

  return {
    request,
    matchingInventory: inventory.find(
      (item) => item.bloodGroup === request.bloodGroup && item.component === request.component,
    ),
  };
}

export async function getProviderInventoryData(): Promise<ProviderInventoryData> {
  const { accessToken } = await verifySession();
  const [organization, inventoryDtos] = await Promise.all([
    getCurrentOrganization(accessToken),
    listInventory(accessToken),
  ]);

  return {
    organization,
    inventory: mapInventoryItems(inventoryDtos, organization.id),
  };
}
