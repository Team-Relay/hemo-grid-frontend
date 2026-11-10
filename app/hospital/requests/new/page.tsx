/** Entry route for the validated hospital blood-request workflow. */

import type { Metadata } from "next";
import { RequestForm } from "@/features/requests/request-form";
export const metadata: Metadata = { title: "Create blood request" };
export default function NewRequestPage() {
  return <RequestForm />;
}
