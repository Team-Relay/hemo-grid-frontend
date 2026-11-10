/** Safe not-found state avoids disclosing requests owned by another blood bank. */

import { ButtonLink, EmptyState, PageHeader, Panel } from "@/components/ui/core";

export default function ProviderRequestNotFound() {
  return (
    <>
      <PageHeader
        backHref="/blood-bank/requests"
        eyebrow="Provider operations"
        title="Request not found"
      />
      <Panel>
        <EmptyState
          title="This assigned request is unavailable"
          description="It may not exist, or it may belong to another provider workspace."
          action={<ButtonLink href="/blood-bank/requests">Return to requests</ButtonLink>}
        />
      </Panel>
    </>
  );
}
