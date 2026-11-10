/** Serializable expected-result shapes returned by provider Server Actions. */

export interface ProviderActionState {
  message?: string;
  successMessage?: string;
  completedAt?: number;
}

export interface InventoryActionState extends ProviderActionState {
  fieldErrors?: { unitsAvailable?: string[] };
}

export const initialProviderActionState: ProviderActionState = {};
export const initialInventoryActionState: InventoryActionState = {};
