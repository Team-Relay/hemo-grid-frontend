# Backend-to-frontend API mapping

Transport DTOs remain separate from UI view models so either side can evolve
without forcing markup changes throughout the application.

| Backend field    | Frontend field   |
| ---------------- | ---------------- |
| `unitsRequired`  | `units`          |
| `unitsAvailable` | `availableUnits` |
| `unitsReserved`  | `reservedUnits`  |
| `requester.id`   | `hospitalId`     |
| `requester.name` | `hospitalName`   |
| `provider.id`    | `providerId`     |
| `provider.name`  | `providerName`   |
| `requestedAt`    | `createdAt`      |
| `updatedAt`      | `updatedAt`      |
| lifecycle dates  | `timeline`       |

The backend UUID is the canonical request identifier used in URLs. Because the
current API does not return a separate human-readable reference, the UI derives
a stable display-only reference from the first eight UUID characters, prefixed
with `HG-`. It is never sent back to the API.

`reservedUnits` is derived as `unitsRequired` only while the request is in
`ACCEPTED`, `PREPARING`, or `IN_TRANSIT`, matching the current backend inventory
lifecycle. It is zero for unreserved and terminal states.

Request timeline entries will be derived from `requestedAt`, `acceptedAt`,
`preparingAt`, `dispatchedAt`, `deliveredAt`, and `cancelledAt`.

Candidate location, fulfilment estimate, and map coordinates are not returned by
the current backend. Those view-model fields must remain optional unless the API
contract is expanded.

Candidate mappings:

| Backend candidate field | Frontend candidate field |
| ----------------------- | ------------------------ |
| `organizationId`        | `organizationId`         |
| `organizationName`      | `organizationName`       |
| `bloodGroup`            | `bloodGroup`             |
| `component`             | `component`              |
| `unitsFree`             | `unitsFree`              |
| `distanceKm`            | `distanceKm`             |
| `canFullyFulfil`        | `canFullyFulfil`         |
| `rank`                  | `rank`                   |

Only candidates with `canFullyFulfil === true` are selectable. Spring Boot also
rechecks current free inventory during selection because the candidate response
is a snapshot and may become stale.

Request creator, provider location, provider contact details, and transfer
distance are also absent from `BloodRequestResponse`. The detail UI explicitly
shows those values as unavailable instead of displaying mock data.
