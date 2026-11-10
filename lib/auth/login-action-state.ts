/**
 * Serializable state shared by the login Server Action and Client Component.
 * It lives outside the `use server` module because those modules may export
 * only async functions at runtime.
 */

export interface LoginActionState {
  message: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
}

export const initialLoginState: LoginActionState = {
  message: "",
};
