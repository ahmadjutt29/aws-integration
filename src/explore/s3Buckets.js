const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new S3Client({ region: env.AWS_REGION, credentials });
  const data = await client.send(new ListBucketsCommand({}));
  saveRaw("s3-buckets", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
