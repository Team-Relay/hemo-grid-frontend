/** Serializable action state shared by request Server Actions and client forms. */

export interface RequestFormActionState {
  message: string;
  fieldErrors?: {
    bloodGroup?: string[];
    component?: string[];
    unitsRequired?: string[];
    urgency?: string[];
    clinicalReference?: string[];
    notes?: string[];
  };
}

export interface RequestMutationActionState {
  message: string;
}

export const initialRequestFormState: RequestFormActionState = { message: "" };
export const initialRequestMutationState: RequestMutationActionState = { message: "" };
