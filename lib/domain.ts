import type {
  BloodComponent,
  BloodGroup,
  BloodRequestStatus,
  InventoryItem,
  RequestUrgency,
  StockHealth,
} from "@/types/domain";

export const bloodGroups: BloodGroup[] = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
];

export const bloodComponents: BloodComponent[] = [
  "WHOLE_BLOOD",
  "RED_CELLS",
  "PLATELETS",
  "PLASMA",
];

const groupLabels: Record<BloodGroup, string> = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A−",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B−",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB−",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O−",
};

const componentLabels: Record<BloodComponent, string> = {
  WHOLE_BLOOD: "Whole Blood",
  RED_CELLS: "Red Cells",
  PLATELETS: "Platelets",
  PLASMA: "Plasma",
};

const statusLabels: Record<BloodRequestStatus, string> = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function formatBloodGroup(value: BloodGroup) {
  return groupLabels[value];
}
export function formatComponent(value: BloodComponent) {
  return componentLabels[value];
}
export function formatStatus(value: BloodRequestStatus) {
  return statusLabels[value];
}
export function formatUrgency(value: RequestUrgency) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
export function getFreeUnits(item: InventoryItem) {
  return Math.max(0, item.availableUnits - item.reservedUnits);
}
export function getStockHealth(free: number): StockHealth {
  if (free <= 2) return "CRITICAL";
  if (free <= 5) return "LOW";
  if (free <= 10) return "MODERATE";
  return "HEALTHY";
}

export const statusOrder: BloodRequestStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "PREPARING",
  "IN_TRANSIT",
  "DELIVERED",
];
