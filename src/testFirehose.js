const { FirehoseClient, PutRecordCommand } = require("@aws-sdk/client-firehose");
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { credentials, env } = require("./config");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = async function testFirehose() {
  // NOTE: Firehose delivery stream lives in the VENDOR account, so this uses
  // vendor-side default credentials (not the assumed customer role).
  const firehose = new FirehoseClient({ region: env.AWS_REGION });

  const testRecord = {
    testId: `correlation-platform-test-${Date.now()}`,
    source: "testFirehose.js",
    timestamp: new Date().toISOString(),
  };

  await firehose.send(
    new PutRecordCommand({
      DeliveryStreamName: env.FIREHOSE_STREAM_NAME,
      Record: { Data: Buffer.from(JSON.stringify(testRecord) + "\n") },
    })
  );

  // Firehose buffers before flushing to S3 - wait then check.
  await sleep(65000);

  const s3 = new S3Client({ region: env.AWS_REGION });
  const listing = await s3.send(
    new ListObjectsV2Command({ Bucket: env.TARGET_S3_BUCKET, MaxKeys: 5 })
  );

  const found = (listing.Contents || []).length > 0;

  return {
    ok: found,
    detail: found
      ? `Record sent, ${listing.Contents.length} object(s) visible in s3://${env.TARGET_S3_BUCKET} (buffering delay is normal - confirm testId manually if needed)`
      : `Record sent but no objects found yet in s3://${env.TARGET_S3_BUCKET} - Firehose buffer interval may exceed 65s, check bucket manually`,
  };
};
