/**
 * Authentication Server Actions used by the login form and profile menu.
 * Expected credential errors are returned as state; successful authentication
 * writes the HttpOnly session before redirecting to the correct workspace.
 */

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { login } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/errors";
import { workspacePathForRole } from "@/lib/auth/roles";
import { createSession, deleteSession } from "@/lib/auth/session";
import type { LoginActionState } from "@/lib/auth/login-action-state";

const loginSchema = z.object({
  email: z.email("Enter a valid work email address.").trim(),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean(),
});

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  });

  if (!validated.success) {
    const fields = z.flattenError(validated.error).fieldErrors;
    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: {
        email: fields.email,
        password: fields.password,
      },
    };
  }

  let response;
  try {
    response = await login({
      email: validated.data.email,
      password: validated.data.password,
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        message: error.status === 401 ? "The email or password is incorrect." : error.message,
        fieldErrors: fieldErrorsByName(error),
      };
    }
    throw error;
  }

  await createSession(response, validated.data.remember);
  redirect(workspacePathForRole(response.user.role));
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

function fieldErrorsByName(error: ApiClientError): LoginActionState["fieldErrors"] {
  const grouped: NonNullable<LoginActionState["fieldErrors"]> = {};

  for (const fieldError of error.fieldErrors) {
    if (fieldError.field === "email" || fieldError.field === "password") {
      grouped[fieldError.field] = [...(grouped[fieldError.field] ?? []), fieldError.message];
    }
  }

  return grouped;
}
