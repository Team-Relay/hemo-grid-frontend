/** Authenticated PLATFORM_ADMIN joint dispatch planning screen. */

import { DispatchPlannerView } from "@/features/admin/dispatch-planner-view";
import { getAdminDispatchPlannerRequests } from "@/lib/data/admin";

export default async function AdminDispatchPlannerPage() {
  const initialRequests = await getAdminDispatchPlannerRequests();

  return <DispatchPlannerView initialRequests={initialRequests} />;
}
