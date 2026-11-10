/** Authenticated provider request detail with live inventory context. */

import { notFound } from "next/navigation";

import { ApiClientError } from "@/lib/api/errors";
import { ProviderRequestDetail } from "@/features/requests/provider-request-detail";
import { ProviderDataPoller } from "@/features/requests/provider-data-poller";
import { getProviderRequestData } from "@/lib/data/provider";
import { requestIdSchema } from "@/lib/validation/blood-request";

export default async function ProviderRequestPage({
  params,
}: PageProps<"/blood-bank/requests/[id]">) {
  const { id } = await params;
  if (!requestIdSchema.safeParse(id).success) notFound();

  let data;
  try {
    data = await getProviderRequestData(id);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }

  const active = !["DELIVERED", "DECLINED", "CANCELLED", "EXPIRED"].includes(data.request.status);

  return (
    <>
      <ProviderDataPoller enabled={active} />
      <ProviderRequestDetail request={data.request} matchingInventory={data.matchingInventory} />
    </>
  );
}
