# AWS Integration Test App

Mirrors `testAllApis.js` on the Azure side. Assumes the cross-account role
ONCE, reuses temp credentials across all 8 API tests, prints a pass/fail table.

## Setup checklist (do in order)

1. Second AWS account = customer simulation (same pattern as your second Azure account).
2. In customer-sim account, deploy `cloudformation/customer-role-template.yaml`
   manually via Console first time (CloudFormation > Create Stack > Upload template):
   - `VendorAccountId` = your vendor AWS account ID
   - `ExternalId` = any string 8+ chars, e.g. `test-ext-id-001`
   - Copy the `RoleArn` output.
3. `cp .env.example .env` and fill in:
   - `CUSTOMER_ROLE_ARN` = the RoleArn from step 2
   - `EXTERNAL_ID` = same value used in step 2
   - `VENDOR_ACCOUNT_ID`
4. In vendor account: create a Kinesis Firehose delivery stream -> S3 bucket.
   Fill in `FIREHOSE_STREAM_NAME`, `TARGET_S3_BUCKET`, `FIREHOSE_DELIVERY_STREAM_ARN`.
5. Confirm the customer-sim account's support plan tier. Basic support = AWS Health
   API test will report "expected, not a failure" — that's correct behavior, not a bug.
6. `npm install`
7. `npm start`

## Notes for dev team

- `CFN_DEPLOY=false` by default — only runs `ValidateTemplate`, creates nothing.
  Set `true` to actually deploy/describe/verify `CREATE_COMPLETE` status.
- Firehose test waits 65s for buffer flush before checking S3 — this is normal
  Firehose behavior, not a bug if it's slow.
- `testHealth.js` treats `SubscriptionRequiredException` as a pass with a note,
  since Basic/Developer support plans don't get Health API data. Don't chase this
  as a real failure during customer onboarding — check their support plan first.
- Token/credential model: `fromTemporaryCredentials` in `src/config.js` handles
  auto-refresh. No access keys stored anywhere.
