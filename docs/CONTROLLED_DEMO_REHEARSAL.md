# Controlled hosted lifecycle rehearsal

Purpose: prove **hospital create → hospital select → bank accept/reserve → PREPARING → IN_TRANSIT → DELIVERED** against the shared **synthetic** Render demonstration database, rather than relying solely on the transaction-level Spring/PostgreSQL integration test.

## Safety and scope

- This does not use a real patient, donor or facility record.
- The scenario is tagged with the fixed reference `HG-SYNTHETIC-E2E-20261111-ONE-UNIT` and a note stating no patient exists.
- It uses a **ROUTINE** single-unit red-cell request so it does not add false emergencies to the coordinator's pending critical queue.
- It refuses to dispatch universal O-negative stock and requires a recorded cold-chain check, a suitable stock count and a verified, fully eligible exact-group candidate.
- One unit of synthetic stock is **actually consumed** on delivery. The script does not silently replenish it, because overwriting the current inventory could clobber another officer's changes. The before/after totals are logged.
- The script prevents another consumption with the same reference. Re-runs are read-only if the case is already `DELIVERED`. An incomplete case fails rather than applying a second mutation.
- During a failure before dispatch, the script attempts cancellation to release a reservation. After `IN_TRANSIT`, cleanup needs manual assessment and is not automated.
- The script only targets the predetermined hosted demo API; it refuses to run without an explicit synthetic-only opt-in environment variable.

## Run and evidence

A one-time GitHub Actions workflow runs on the first push to `main` containing the new lifecycle script. The same workflow can later be invoked manually through the GitHub Actions interface. Its concurrency group avoids overlapping runs.

The script requires:

~~~bash
HEMOGRID_ALLOW_SYNTHETIC_MUTATION=I_CONFIRM_SYNTHETIC_ONLY node scripts/controlled-live-lifecycle.mjs
~~~

The two known public demonstration accounts are used; override with the `HEMOGRID_DEMO_HOSPITAL_EMAIL`, `HEMOGRID_DEMO_HOSPITAL_PASSWORD`, `HEMOGRID_DEMO_BANK_EMAIL` and `HEMOGRID_DEMO_BANK_PASSWORD` environment variables if a different **synthetic** demo setup has been configured. Never pass real patient data or production credentials to this script.

Evidence in Actions includes the created request UUID, provider identity, state transitions, and the initial/accepted/delivered inventory balances. Passwords and JWTs are not written to logs.

A successful run establishes a **hosted synthetic transaction**. It does not prove clinical suitability, actual shipment, hospital authorisation, or calibrated time estimates.

## Separate presentation rehearsal

The full presentation should begin with a coordinator comparing two or more **staff-approved** seeded critical requests through the advisory joint planner. Then switch to a hospital officer choosing the bank, and that bank accepting and completing a request. The automated one-unit QA case itself is ROUTINE and is not included in coordinator previews. Human approval in the live demonstration must not be fabricated or silently bypassed.
