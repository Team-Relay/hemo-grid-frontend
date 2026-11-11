#!/usr/bin/env node
/**
 * ONE-TIME hosted synthetic transaction:
 * Hospital create -> eligible provider select -> bank accept/reserve ->
 * PREPARING -> IN_TRANSIT -> DELIVERED -> stock and status reconciliation.
 *
 * This intentionally changes a public SYNTHETIC demonstration database.
 * One dispatchable red-cell unit is consumed. It never touches patient data.
 * The fixed reference makes subsequent invocations read-only/idempotent.
 *
 * Required opt-in: HEMOGRID_ALLOW_SYNTHETIC_MUTATION=I_CONFIRM_SYNTHETIC_ONLY
 *
 * This must not run on live clinical data or on arbitrary hostnames.
 */
import assert from "node:assert/strict";

const API = "https://hemo-grid-backend.onrender.com/api/v1";
const CASE_REFERENCE = "HG-SYNTHETIC-E2E-20261111-ONE-UNIT";
const UNIT_QUANTITY = 1;
const PREFLIGHT_ONLY = process.argv.includes("--preflight");
const WAIT_MS = 45000;

const hospital = {
  email: process.env.HEMOGRID_DEMO_HOSPITAL_EMAIL || "hospital.demo@hemogrid.local",
  password: process.env.HEMOGRID_DEMO_HOSPITAL_PASSWORD || "HospitalDemo123!",
};
const bank = {
  email: process.env.HEMOGRID_DEMO_BANK_EMAIL || "bank.demo@hemogrid.local",
  password: process.env.HEMOGRID_DEMO_BANK_PASSWORD || "BankDemo123!",
};

let activeRequestId = null;
let hospitalToken = null;
let bankToken = null;
let lastKnownStatus = null;

function log(message) {
  process.stdout.write(message + "\n");
}

async function api(path, { method = "GET", bearer = null, body = undefined } = {}) {
  const headers = { Accept: "application/json" };
  if (bearer) headers.Authorization = "Bearer " + bearer;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(API + path, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(WAIT_MS),
    });
  } catch (error) {
    // Never retry non-idempotent operations automatically: commit may already have occurred.
    throw new Error(method + " " + path + " could not be confirmed (" + error.name + ")");
  }
  const raw = await response.text();
  let data = null;
  try { data = JSON.parse(raw); } catch { /* errors can be non-JSON */ }
  if (response.status < 200 || response.status >= 300) {
    const safeCode = data && typeof data.code === "string" ? data.code : "UNKNOWN";
    throw new Error(method + " " + path + " failed: HTTP " + response.status + " (" + safeCode + ")");
  }
  return { status: response.status, data };
}

async function login({ email, password }) {
  const response = await api("/auth/login", { method: "POST", body: { email, password } });
  assert.equal(response.data?.tokenType, "Bearer");
  assert.ok(response.data?.accessToken, "Synthetic login did not return an access token");
  return response.data;
}

async function findRow(id) {
  const response = await api("/inventory", { bearer: bankToken });
  assert.ok(Array.isArray(response.data), "Bank inventory endpoint must return an array");
  return response.data.find(row => row.id === id);
}

async function cancelIfSafe() {
  if (!activeRequestId || !hospitalToken) return;
  try {
    const existing = (await api("/blood-requests/" + activeRequestId, {
      bearer: hospitalToken,
    })).data;
    if (!["REQUESTED", "ACCEPTED", "PREPARING"].includes(existing.status)) {
      log("NOTE: synthetic request " + activeRequestId + " is " + existing.status +
        "; automated cleanup skipped. Inspect before retrying.");
      return;
    }
    const result = await api("/blood-requests/" + activeRequestId + "/cancel", {
      method: "POST", bearer: hospitalToken,
    });
    log("CLEANUP: controlled request cancelled: " + result.data.status);
  } catch (error) {
    log("WARNING: synthetic cleanup could not be confirmed: " + error.message);
  }
}

async function main() {
  if (!PREFLIGHT_ONLY && process.env.HEMOGRID_ALLOW_SYNTHETIC_MUTATION !== "I_CONFIRM_SYNTHETIC_ONLY") {
    throw new Error("Mutation disabled. Set HEMOGRID_ALLOW_SYNTHETIC_MUTATION=I_CONFIRM_SYNTHETIC_ONLY for synthetic-only testing.");
  }
  log("HemoGrid controlled hosted end-to-end rehearsal");
  log("Network: synthetic Kenyan demonstration dataset only");
  log("Case reference: " + CASE_REFERENCE);
  log("Maximum consumption: " + UNIT_QUANTITY + " synthetic red-cell unit");

  const [hLogin, bLogin] = await Promise.all([login(hospital), login(bank)]);
  assert.ok(["HOSPITAL_ADMIN", "HOSPITAL_STAFF"].includes(hLogin.user?.role));
  assert.ok(["BLOOD_BANK_ADMIN", "BLOOD_BANK_STAFF"].includes(bLogin.user?.role));
  assert.ok(bLogin.user?.organization?.id, "Demo bank identity has no organization");
  hospitalToken = hLogin.accessToken;
  bankToken = bLogin.accessToken;
  const bankId = bLogin.user.organization.id;

  // The fixed reference prevents multiple runs from consuming additional demo stock.
  const existingRequests = (await api("/blood-requests", { bearer: hospitalToken })).data;
  assert.ok(Array.isArray(existingRequests), "Hospital request listing is not an array");
  const previous = existingRequests.filter(r => r.clinicalReference === CASE_REFERENCE);
  if (previous.length > 0) {
    assert.equal(previous.length, 1, "More than one controlled demonstration request exists");
    activeRequestId = previous[0].id;
    lastKnownStatus = previous[0].status;
    if (previous[0].status !== "DELIVERED") {
      throw new Error("Existing controlled case " + activeRequestId + " is " + previous[0].status +
        "; inspect manually before proceeding. No additional mutation performed.");
    }
    assert.equal(previous[0].provider?.id, bankId);
    assert.equal(previous[0].unitsRequired, 1);
    assert.ok(previous[0].deliveredAt);
    log("PASS existing controlled case delivered (idempotent verification): " + activeRequestId);
    return;
  }

  const bankRows = (await api("/inventory", { bearer: bankToken })).data;
  assert.ok(Array.isArray(bankRows), "Bank inventory unavailable");

  // Do not use universal O-negative or an item with a recorded hold.
  // Prefer a common group with >=2 dispatchable units to leave demonstration stock.
  const preference = ["A_POSITIVE", "B_POSITIVE", "O_POSITIVE", "AB_POSITIVE", "A_NEGATIVE", "B_NEGATIVE", "AB_NEGATIVE"];
  const row = bankRows
    .filter(r =>
      r.component === "RED_CELLS" &&
      r.bloodGroup !== "O_NEGATIVE" &&
      r.coldChainVerified === true &&
      r.coldChainStatus === "VERIFIED_2_6C" &&
      typeof r.fridgeTempCelsius === "number" &&
      r.fridgeTempCelsius >= 2 && r.fridgeTempCelsius <= 6 &&
      r.dispatchableUnitsFree >= 2
    )
    .sort((a, b) =>
      preference.indexOf(a.bloodGroup) - preference.indexOf(b.bloodGroup) ||
      b.dispatchableUnitsFree - a.dispatchableUnitsFree
    )[0];
  assert.ok(row, "No eligible non-O-negative demo bank red-cell stock has at least two units. Aborting with no mutation.");
  const baseline = {
    unitsAvailable: row.unitsAvailable,
    unitsReserved: row.unitsReserved,
    dispatchableUnitsFree: row.dispatchableUnitsFree,
  };
  log("PREFLIGHT PASS: bank inventory row " + row.id + " (" + row.bloodGroup + ")");
  log("Recorded cold-chain check: " + row.coldChainStatus +
    "; initial dispatchable " + baseline.dispatchableUnitsFree);
  if (PREFLIGHT_ONLY) {
    log("PASS preflight: synthetic demo credentials, bank stock and source checks. No request created.");
    return;
  }

  const created = await api("/blood-requests", {
    method: "POST",
    bearer: hospitalToken,
    body: {
      bloodGroup: row.bloodGroup,
      component: "RED_CELLS",
      unitsRequired: UNIT_QUANTITY,
      urgency: "ROUTINE",
      unknownPatientBloodGroup: false,
      clinicalReference: CASE_REFERENCE,
      notes: "Automated controlled synthetic QA. No patient exists. One unit only. Reproducible workflow test.",
    },
  });
  assert.equal(created.status, 201);
  activeRequestId = created.data?.id;
  lastKnownStatus = created.data?.status;
  assert.ok(activeRequestId, "Hospital request creation did not return an id");
  assert.equal(lastKnownStatus, "REQUESTED");
  log("1/6 Hospital created synthetic request " + activeRequestId);

  try {
    const candidateList = (await api(
      "/blood-requests/" + activeRequestId + "/candidates",
      { bearer: hospitalToken },
    )).data;
    assert.ok(Array.isArray(candidateList?.candidates));
    const match = candidateList.candidates.find(c =>
      c.organizationId === bankId &&
      c.offeredBloodGroup === row.bloodGroup &&
      c.canFullyFulfil === true &&
      c.coldChainVerified === true &&
      c.matchType === "EXACT"
    );
    assert.ok(match, "Demo bank is not an eligible, exact-group, cold-chain-verified candidate. Stopping safely.");

    const selected = (await api(
      "/blood-requests/" + activeRequestId + "/select-provider",
      {
        method: "POST", bearer: hospitalToken,
        body: { providerOrganizationId: bankId },
      },
    )).data;
    assert.equal(selected?.status, "REQUESTED");
    assert.equal(selected?.provider?.id, bankId);
    lastKnownStatus = selected.status;
    log("2/6 Hospital selected eligible supplier " + bankId);

    const assigned = (await api("/provider/requests", { bearer: bankToken })).data;
    assert.ok(assigned.some(r => r.id === activeRequestId), "Bank cannot see its assigned controlled request");

    const accepted = (await api("/provider/requests/" + activeRequestId + "/accept", {
      method: "POST", bearer: bankToken,
    })).data;
    assert.equal(accepted?.status, "ACCEPTED");
    lastKnownStatus = accepted.status;
    const afterAcceptance = await findRow(row.id);
    assert.ok(afterAcceptance, "The reserved inventory row disappeared");
    assert.equal(afterAcceptance.unitsAvailable, baseline.unitsAvailable);
    assert.equal(afterAcceptance.unitsReserved, baseline.unitsReserved + UNIT_QUANTITY);
    assert.equal(afterAcceptance.dispatchableUnitsFree, baseline.dispatchableUnitsFree - UNIT_QUANTITY);
    log("3/6 Bank accepted; reservation increased by one; dispatchable stock decreased by one");

    for (const [i, step] of ["PREPARING", "IN_TRANSIT", "DELIVERED"].entries()) {
      const status = (await api("/provider/requests/" + activeRequestId + "/status", {
        method: "POST", bearer: bankToken,
        body: { status: step },
      })).data;
      assert.equal(status?.status, step);
      lastKnownStatus = step;
      log((i + 4) + "/6 Bank advanced to " + step);
    }

    const finalRequest = (await api("/blood-requests/" + activeRequestId, {
      bearer: hospitalToken,
    })).data;
    assert.equal(finalRequest?.status, "DELIVERED");
    assert.equal(finalRequest.provider?.id, bankId);
    assert.ok(finalRequest.deliveredAt, "Delivered timestamp missing");
    const afterDelivery = await findRow(row.id);
    assert.ok(afterDelivery);
    assert.equal(afterDelivery.unitsAvailable, baseline.unitsAvailable - UNIT_QUANTITY);
    assert.equal(afterDelivery.unitsReserved, baseline.unitsReserved);
    assert.equal(afterDelivery.dispatchableUnitsFree, baseline.dispatchableUnitsFree - UNIT_QUANTITY);

    log("PASS COMPLETE TRANSACTION");
    log("Hospital: created, selected, confirmed delivered");
    log("Bank: assigned, accepted, reserved, prepared, in transit, delivered");
    log("Stock: available " + baseline.unitsAvailable + " -> " + afterDelivery.unitsAvailable +
      "; reserved " + baseline.unitsReserved + " -> " + afterDelivery.unitsReserved);
    log("Case ID: " + activeRequestId);
    log("This is a synthetic workflow result, NOT a transfusion or live clinical delivery.");
  } catch (error) {
    log("ERROR during controlled test, request " + activeRequestId + " (" + lastKnownStatus + "): " + error.message);
    await cancelIfSafe();
    throw error;
  }
}

main().catch(error => {
  // Do not print any token, cookie, or credential.
  console.error("FAIL controlled synthetic workflow: " + error.message);
  process.exitCode = 1;
});
