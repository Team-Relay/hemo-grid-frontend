# Hospital request and matching flow

## End-to-end sequence

```text
Request form
  -> createBloodRequestAction
  -> POST /blood-requests
  -> redirect to /hospital/requests/{id}/matches
  -> GET request + candidates in parallel
  -> selectProviderAction
  -> POST /blood-requests/{id}/select-provider
  -> redirect to /hospital/requests/{id}
  -> refresh active status every five seconds
```

Cancellation follows the same server-only path through
`cancelRequestAction` and `POST /blood-requests/{id}/cancel`.

## File responsibilities

- `lib/validation/blood-request.ts` mirrors backend request constraints.
- `app/actions/blood-requests.ts` validates mutations, checks the session,
  handles expected errors, revalidates affected routes, and redirects.
- `lib/api/blood-requests.ts` contains typed Spring Boot request calls.
- `lib/api/mappers.ts` converts backend candidates into frontend view models.
- `lib/data/hospital.ts` composes authenticated request and candidate reads.
- `features/requests/request-form.tsx` owns form interaction and field feedback.
- `features/requests/provider-selection.tsx` owns pending selection feedback.
- `features/requests/hospital-request-actions.tsx` owns the cancellation dialog.
- `features/requests/request-detail-poller.tsx` refreshes non-terminal details.

## Error and concurrency rules

- Validation errors are returned to the form without throwing.
- Authentication expiry clears the session cookie and redirects to login.
- Conflict responses are shown beside the action that caused them.
- Pending controls are disabled to prevent duplicate browser submissions.
- Partial candidates are informational and cannot be selected.
- The backend rechecks live free inventory during provider selection.
- Provider acceptance rechecks and locks inventory before reserving units.
