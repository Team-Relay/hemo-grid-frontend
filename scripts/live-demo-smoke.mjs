/**
 * Read-only hosted HemoGrid smoke. All credentials belong to public synthetic
 * demonstration accounts. No blood requests or inventory records are changed.
 *
 * Run: node scripts/live-demo-smoke.mjs
 * Override hosts with HEMOGRID_LIVE_API and HEMOGRID_LIVE_FRONTEND.
 */
import assert from "node:assert/strict";

const api = (process.env.HEMOGRID_LIVE_API || "https://hemo-grid-backend.onrender.com").replace(/\/+$/, "");
const web = (process.env.HEMOGRID_LIVE_FRONTEND || "https://hemogrid-eight.vercel.app").replace(/\/+$/, "");

for (const host of [api, web]) {
  const url = new URL(host);
  assert.equal(url.protocol, "https:", "Hosted demo checks require HTTPS");
  assert.ok(!url.username && !url.password, "No credentials in host URLs");
}

const accounts = [
  {
    name: "hospital",
    email: process.env.HEMOGRID_DEMO_HOSPITAL_EMAIL || "hospital.demo@hemogrid.local",
    password: process.env.HEMOGRID_DEMO_HOSPITAL_PASSWORD || "HospitalDemo123!",
    roles: ["HOSPITAL_ADMIN", "HOSPITAL_STAFF"],
    path: "/api/v1/blood-requests",
  },
  {
    name: "blood bank",
    email: process.env.HEMOGRID_DEMO_BANK_EMAIL || "bank.demo@hemogrid.local",
    password: process.env.HEMOGRID_DEMO_BANK_PASSWORD || "BankDemo123!",
    roles: ["BLOOD_BANK_ADMIN", "BLOOD_BANK_STAFF"],
    path: "/api/v1/provider/requests",
  },
  {
    name: "coordinator",
    email: process.env.HEMOGRID_DEMO_ADMIN_EMAIL || "admin.demo@hemogrid.local",
    password: process.env.HEMOGRID_DEMO_ADMIN_PASSWORD || "AdminDemo123!",
    roles: ["PLATFORM_ADMIN"],
    path: "/api/v1/dispatch-plans/requests",
  },
];

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function call(url, { method = "GET", body, token, retries = 0 } = {}) {
  let cause;
  for (let n = 0; n <= retries; n++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(85000),
      });
      if (n < retries && [429, 502, 503, 504].includes(response.status)) {
        await response.body?.cancel();
        await pause(5000 * (n + 1));
        continue;
      }
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch { data = null; }
      return { status: response.status, data };
    } catch (error) {
      cause = error;
      if (n < retries) await pause(5000 * (n + 1));
    }
  }
  throw Error("Network unavailable at " + new URL(url).host + ": " + (cause?.name ?? "unknown"));
}

async function check(label, url, expected, opts) {
  const result = await call(url, opts);
  assert.equal(result.status, expected, label + ": expected HTTP " + expected + " but got " + result.status);
  console.log("PASS " + label + " HTTP " + result.status);
  return result.data;
}

async function main() {
  console.log("Checking public frontend " + web + " and backend " + api + " (read-only)");
  await check("frontend login", web + "/login", 200, { retries: 2 });
  const health = await check("backend health", api + "/actuator/health", 200, { retries: 2 });
  assert.equal(health?.status, "UP");
  // Check readiness, but continue collecting role diagnostics if it is blocked.
  const readiness = await call(api + "/actuator/health/readiness", { retries: 1 });
  if (readiness.status !== 200 || readiness.data?.status !== "UP") {
    console.log("WARN readiness HTTP " + readiness.status + "; continuing role checks before failing");
  } else {
    console.log("PASS backend readiness HTTP 200");
  }
  const spec = await check("OpenAPI", api + "/v3/api-docs", 200);
  const paths = [
    "/api/v1/auth/login", "/api/v1/auth/me", "/api/v1/blood-requests",
    "/api/v1/inventory", "/api/v1/provider/requests",
    "/api/v1/dispatch-plans/requests", "/api/v1/dispatch-plans/preview",
  ];
  for (const path of paths) assert.ok(spec?.paths?.[path], "Missing deployed API route " + path);
  console.log("PASS deployed OpenAPI has " + paths.length + " required paths");
  await check("unauthenticated access rejected", api + "/api/v1/blood-requests", 401);

  for (const account of accounts) {
    const login = await check(account.name + " login", api + "/api/v1/auth/login", 200, {
      method: "POST", body: { email: account.email, password: account.password }, retries: 1,
    });
    assert.equal(login?.tokenType, "Bearer");
    assert.ok(login?.accessToken && account.roles.includes(login?.user?.role), account.name + " identity mismatch");
    const token = login.accessToken;
    const me = await check(account.name + " identity", api + "/api/v1/auth/me", 200, { token });
    assert.equal(me?.id, login.user.id);
    const records = await check(account.name + " authorized list", api + account.path, 200, { token });
    assert.ok(Array.isArray(records), account.name + " list should be an array");
    console.log("PASS " + account.name + " list size " + records.length);

    if (account.name === "hospital") {
      await check("hospital coordinator restriction", api + "/api/v1/dispatch-plans/requests", 403, { token });
      if (records.length > 0) {
        await check("hospital owned request read", api + "/api/v1/blood-requests/" + encodeURIComponent(records[0].id), 200, { token });
      }
    }
    if (account.name === "blood bank") {
      const rows = await check("bank inventory", api + "/api/v1/inventory", 200, { token });
      assert.ok(Array.isArray(rows) && rows.length > 0, "Missing demo bank inventory");
      assert.ok(rows.every(row => typeof row.dispatchableUnitsFree === "number"), "Deployed inventory DTO is stale");
      await check("bank hospital access restriction", api + "/api/v1/blood-requests", 403, { token });
    }
  }
  console.log("PASS all three roles and authorization. No requests, stock, or dispatch plans modified.");
  assert.equal(readiness.status, 200, "Backend readiness remains inaccessible");
  assert.equal(readiness.data?.status, "UP", "Backend readiness must be UP");
}

main().catch(error => {
  console.error("FAIL hosted smoke: " + error.message);
  process.exitCode = 1;
});
