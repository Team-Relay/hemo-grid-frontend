/** Renders the current password-recovery placeholder without implying an unavailable API exists. */

import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/requests/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
