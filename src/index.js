require("./config"); // fails fast if env vars missing

const tests = [
  { name: "AssumeRole (STS)", fn: require("./testAssumeRole") },
  { name: "CloudFormation Validate/Deploy", fn: require("./testCloudFormation") },
  { name: "GetMetricData", fn: require("./testMetrics") },
  { name: "Metric Streams (PutMetricStream)", fn: require("./testMetricStreams") },
  { name: "Firehose PutRecord -> S3", fn: require("./testFirehose") },
  { name: "CloudWatch Logs Insights", fn: require("./testLogsInsights") },
  { name: "Config Aggregator / Tagging API", fn: require("./testConfig") },
  { name: "AWS Health API", fn: require("./testHealth") },
];

async function run() {
  const results = [];

  for (const test of tests) {
    process.stdout.write(`Running: ${test.name} ... `);
    const start = Date.now();
    try {
      const { ok, detail } = await test.fn();
      const ms = Date.now() - start;
      console.log(ok ? "PASS" : "FAIL");
      results.push({ name: test.name, status: ok ? "PASS" : "FAIL", detail, ms });
    } catch (err) {
      const ms = Date.now() - start;
      console.log("ERROR");
      results.push({ name: test.name, status: "ERROR", detail: err.message, ms });
    }
  }

  console.log("\n=== SUMMARY ===\n");
  const nameWidth = Math.max(...results.map((r) => r.name.length)) + 2;
  for (const r of results) {
    console.log(
      `${r.name.padEnd(nameWidth)} ${r.status.padEnd(6)} (${r.ms}ms)\n  -> ${r.detail}\n`
    );
  }

  const failed = results.filter((r) => r.status !== "PASS");
  console.log(failed.length === 0 ? "ALL TESTS PASSED" : `${failed.length} TEST(S) NEED ATTENTION`);
  process.exit(failed.length === 0 ? 0 : 1);
}

run();
