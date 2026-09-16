# AWS Integration Test App

Demo/test app for the Correlation Platform's AWS integration. Mirrors
`testAllApis.js` on the Azure side: prove cross-account access works, then
pull real data from a customer AWS account through every relevant API.

---

## What we did

1. **Designed the auth model** — Cross-Account IAM Role + ExternalId, the AWS
   equivalent of Azure Lighthouse delegation. No access keys stored per
   customer, temporary credentials only.
2. **Built the customer onboarding template** — `cloudformation/customer-role-template.yaml`,
   the AWS equivalent of the ARM template. Customer deploys it once in their
   own account; it creates a role that trusts our vendor account, scoped with
   an ExternalId to prevent confused-deputy attacks.
3. **Confirmed the connection works** — `src/testAssumeRole.js` assumes that
   role and gets temporary credentials back. This was the first thing we
   validated, since nothing else works without it.
4. **Built a full data pipeline test suite** — 8 tests (`src/test*.js`)
   covering CloudFormation, metrics, metric streaming, Firehose delivery,
   log queries, resource config, and health events, matching the categories
   we already cover on the Azure side.
5. **Built a per-endpoint data explorer** — `src/explore/`, 22 standalone
   scripts, each hitting exactly one AWS API and saving the raw JSON response
   to `results/`. This is how we figured out what real data actually looks
   like before building anything on top of it — no guessing from docs.
6. **Documented every available data category** — `API-ENDPOINTS.md` maps
   every kind of customer data (resources, metrics, logs, cost, health,
   config, security findings) to the exact SDK call and CLI equivalent.
7. **Worked out the CPU/memory monitoring gap** — confirmed CPU/network/disk
   metrics are free and automatic, but memory requires the customer to
   install the CloudWatch Agent, which has its own cost (see below).

## How we did it

- **Language/runtime:** Node.js, AWS SDK v3 (`@aws-sdk/client-*` packages).
- **Credentials:** one shared `fromTemporaryCredentials` provider in
  `src/config.js`, built from `CUSTOMER_ROLE_ARN` + `EXTERNAL_ID` in `.env`.
  Every client in the project reuses this — the role is assumed once, the
  SDK auto-refreshes the temp credentials (1hr) behind the scenes.
- **Testing approach:** two AWS accounts — one plays "vendor" (us), one plays
  "customer" (simulated). The customer account runs the CloudFormation
  template exactly as a real customer would.
- **Data verification approach:** rather than trusting documentation, every
  API was actually called against a real (sandbox) account and the raw
  response saved to disk, so the dev team can see the real JSON shape,
  not an assumed one.

## Project structure

```
aws-integration-test/
  cloudformation/
    customer-role-template.yaml   -> what the customer deploys to grant access
  src/
    config.js                     -> shared credentials, used by everything
    index.js                      -> runs the 8 pipeline tests, prints summary
    test*.js                      -> one file per pipeline capability (CFN, metrics, Firehose, etc.)
    explore/
      _saveRaw.js                 -> shared helper, writes raw JSON to results/
      resourcesAll.js, ec2Instances.js, ... -> one file per data endpoint
      ec2AllMetrics.js            -> auto-discovers instances + every EC2 metric value
      runAll.js                   -> runs all 21 explore scripts, saves everything
  results/                        -> raw JSON output from explore scripts (gitignore this)
  API-ENDPOINTS.md                -> full reference: data type -> exact API call
  env.example.txt                 -> rename to .env, fill in your values
```

## How devs will use it

**To verify a new customer's access works:**
```
node -e "require('./src/testAssumeRole')().then(console.log).catch(console.error)"
```

**To see what a specific API actually returns, before building an endpoint on it:**
```
node src/explore/ec2Instances.js
```
then open `results/ec2-instances.json` — that's the exact shape the real
backend endpoint will need to parse.

**To sanity-check an entire customer account in one shot:**
```
node src/explore/runAll.js
```
Produces a pass/fail summary plus 21 raw JSON files — useful as a first
"data audit" whenever a new customer onboards.

**To look up which API to call for a given data type:** check
`API-ENDPOINTS.md` — organized by category (resources, metrics, logs, cost,
health, config, security), with the exact SDK client, action name, and CLI
equivalent for each.

**Before wiring any of this into the real backend:** read the "Notes for dev
team" and "CloudWatch costs" sections below — they call out behavior that
looks like a bug but isn't (buffering delays, expected empty results on
Basic support, etc.), and where AWS bills the customer directly.

---

## Setup checklist (do in order)

1. Second AWS account = customer simulation (same pattern as the second Azure account).
2. In customer-sim account, deploy `cloudformation/customer-role-template.yaml`
   manually via Console first time (CloudFormation > Create Stack > Upload template):
   - `VendorAccountId` = your vendor AWS account ID
   - `ExternalId` = any string 8+ chars, e.g. `test-ext-id-001`
   - Copy the `RoleArn` output.
3. Rename `env.example.txt` to `.env` and fill in:
   - `CUSTOMER_ROLE_ARN` = the RoleArn from step 2
   - `EXTERNAL_ID` = same value used in step 2
   - `VENDOR_ACCOUNT_ID`
4. In vendor account: create a Kinesis Firehose delivery stream -> S3 bucket.
   Fill in `FIREHOSE_STREAM_NAME`, `TARGET_S3_BUCKET`, `FIREHOSE_DELIVERY_STREAM_ARN`.
5. Confirm the customer-sim account's support plan tier. Basic support = AWS Health
   API test will report "expected, not a failure" — that's correct behavior, not a bug.
6. `npm install`
7. `npm start` (pipeline tests) or `node src/explore/runAll.js` (data explorer)

## Notes for dev team

- `CFN_DEPLOY=false` by default — only runs `ValidateTemplate`, creates nothing.
  Set `true` to actually deploy/describe/verify `CREATE_COMPLETE` status.
- Firehose test waits 65s for buffer flush before checking S3 — this is normal
  Firehose behavior, not a bug if it's slow.
- `testHealth.js` / `explore/healthEvents.js` treat `SubscriptionRequiredException`
  as a pass with a note, since Basic/Developer support plans don't get Health API
  data. Don't chase this as a real failure during customer onboarding — check
  their support plan first.
- `explore/securityHubFindings.js` and `explore/guarddutyFindings.js` will save a
  `{ note: ... }` file instead of data if the customer hasn't enabled those
  services — expected, not an error.
- Token/credential model: `fromTemporaryCredentials` in `src/config.js` handles
  auto-refresh. No access keys stored anywhere.

## CloudWatch costs — who pays, and where the money goes

CloudWatch metrics live inside the customer's own AWS account, so AWS bills the
**customer**, not us — even though we're the ones calling the API via the assumed
role. This mirrors why Event Hub sits in the vendor subscription on the Azure side
(to keep costs off the customer there); on AWS it's the opposite — cost naturally
lands on the customer no matter who queries it.

| What | Cost | Who pays |
|---|---|---|
| Basic EC2/RDS/Lambda/ELB metrics (CPU, network, disk, status checks, etc.) — everything `src/explore/` pulls today | **Free** | Nobody |
| Memory / custom metrics via CloudWatch Agent (`CWAgent` namespace) | **$0.30/metric/month** (first 10,000 metrics) | Customer |
| Our `GetMetricData` API calls | Free up to 1M requests/month, then **~$0.01 per 1,000 metrics requested** | Customer |
| 1-minute "detailed monitoring" (vs default 5-min) | **$3/instance/month** | Customer |

**Watch out for:** memory monitoring isn't one flat metric — it's billed *per
instance*. 50 EC2 instances with memory monitoring on = 50 custom metrics =
~$15/month just for memory, before anything else.

---

## Skipped parts (intentionally — not built yet)

These were identified during planning/testing but deliberately left out of
this demo app. Listed with why, so nothing gets assumed as "forgotten."

- **CloudWatch Agent install / memory & disk-% monitoring** — Skipped because
  it needs a customer-side install step (not just an API permission), plus a
  separate per-instance cost the customer must explicitly accept. Purpose
  when built: gives true OS-level visibility (memory, disk space) that AWS
  can't see from outside the instance. Should be a distinct, disclosed
  opt-in step during onboarding — same pattern as Diagnostic Settings being
  a second consent step on the Azure side, not bundled into the base role.
- **CloudWatch Metric Streams as the default pipeline** — Built and tested
  (`testMetricStreams.js`) but not wired in as the primary data path yet;
  the explorer scripts poll on demand instead. Purpose when built: continuous
  push-based ingestion instead of repeated polling, which is both faster and
  cheaper at scale ($0.003/metric update vs many `GetMetricData` calls).
- **Firehose -> S3 as the production ingestion pipeline** — Built and tested
  (`testFirehose.js`) but the explorer scripts bypass it and query APIs
  directly for now, per your instruction to skip data retention setup while
  validating what data is available. Purpose when built: durable, queryable
  storage of everything flowing in, instead of only fetching on demand.
- **Backend API endpoints (Express routes, etc.)** — None of this has been
  wired into the actual Node.js backend yet; everything here runs as
  standalone scripts. Purpose when built: turns each explore script into a
  real endpoint the frontend/other services can call.
- **1-minute detailed monitoring** — Left at default 5-minute resolution.
  Purpose if enabled later: finer-grained metrics for customers who need
  faster alerting, at $3/instance/month extra — should stay opt-in given the
  cost.
- **Security Hub / GuardDuty as a required data source** — Scripts exist
  (`explore/securityHubFindings.js`, `explore/guarddutyFindings.js`) but
  return empty notes unless the customer already has those services enabled.
  Purpose when built out further: security-findings view on the platform,
  but only meaningful once we decide whether to require/recommend customers
  turn these on during onboarding.