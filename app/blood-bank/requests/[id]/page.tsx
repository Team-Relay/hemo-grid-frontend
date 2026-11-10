import { ProviderRequestDetail } from "@/features/requests/provider-request-detail";
import { getRequest } from "@/lib/mock/data";
export default async function ProviderRequestPage({
  params,
}: PageProps<"/blood-bank/requests/[id]">) {
  const { id } = await params;
  return <ProviderRequestDetail initial={getRequest(id)} />;
}
