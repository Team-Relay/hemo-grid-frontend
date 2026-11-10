# Provider and inventory flow

The provider in HemoGrid is the blood bank selected by the requesting hospital.
Spring Boot scopes every provider read and mutation to the organization in the
authenticated JWT; a request UUID alone never grants access.

## Request lifecycle

```text
Hospital selects provider
  -> provider queue receives REQUESTED request
  -> provider accepts (inventory row and request are locked)
  -> ACCEPTED -> PREPARING -> IN_TRANSIT -> DELIVERED
```

A provider may decline while the request is still `REQUESTED`. Acceptance is
idempotent for the selected provider. The backend locks the request before
reserving inventory, so simultaneous acceptance calls cannot reserve the same
units twice. Delivery consumes reserved stock; eligible hospital cancellation
releases it.

## Frontend responsibilities

- `lib/api/provider-requests.ts` contains typed provider request calls.
- `lib/data/provider.ts` composes organization, request, and inventory reads.
- `app/actions/provider.ts` validates intents, handles expected errors, and
  revalidates every affected hospital/provider route.
- `features/requests/provider-request-detail.tsx` renders only actions legal for
  the current status and uses accessible confirmation dialogs.
- `features/requests/provider-data-poller.tsx` refreshes while the tab is visible.

## Inventory ownership

`unitsAvailable` is editable by the bank. `unitsReserved` is read-only because
only request lifecycle operations may change it. The table shows backend
`updatedAt`, validates non-negative whole units, prevents duplicate submissions,
and keeps 409 conflict messages beside the editor that caused them.

The provider dashboard derives its metrics from `GET /provider/requests` and
`GET /inventory` fetched in parallel; it does not need a separate analytics
endpoint.
