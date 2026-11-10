/** Privacy-safe missing-request state that does not reveal cross-organization ownership. */

import { ButtonLink, EmptyState, PageHeader, Panel } from "@/components/ui/core";

export default function RequestNotFound() {
  return (
    <>
      <PageHeader
        backHref="/hospital/requests"
        eyebrow="Hospital operations"
        title="Request not found"
      />
      <Panel>
        <EmptyState
          title="This blood request is unavailable"
          description="It may not exist, or it may belong to another hospital workspace."
          action={<ButtonLink href="/hospital/requests">Return to requests</ButtonLink>}
        />
      </Panel>
    </>
  );
}
