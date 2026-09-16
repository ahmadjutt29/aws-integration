require("../config"); // fails fast if env vars missing

const scripts = [
  { name: "All Resources (Tagging API)", fn: require("./resourcesAll") },
  { name: "EC2 Instances", fn: require("./ec2Instances") },
  { name: "EC2 Security Groups", fn: require("./ec2SecurityGroups") },
  { name: "VPCs", fn: require("./ec2Vpcs") },
  { name: "RDS Instances", fn: require("./rdsInstances") },
  { name: "S3 Buckets", fn: require("./s3Buckets") },
  { name: "Lambda Functions", fn: require("./lambdaFunctions") },
  { name: "ECS Clusters", fn: require("./ecsClusters") },
  { name: "EKS Clusters", fn: require("./eksClusters") },
  { name: "Load Balancers", fn: require("./loadBalancers") },
  { name: "IAM Roles", fn: require("./iamRoles") },
  { name: "IAM Users", fn: require("./iamUsers") },
  { name: "Metrics List", fn: require("./metricsList") },
  { name: "Metrics Data", fn: require("./metricsData") },
  { name: "Log Groups", fn: require("./logsGroups") },
  { name: "Cost Explorer", fn: require("./costExplorer") },
  { name: "Health Events", fn: require("./healthEvents") },
  { name: "Config Resources", fn: require("./configResources") },
  { name: "Security Hub Findings", fn: require("./securityHubFindings") },
  { name: "GuardDuty Findings", fn: require("./guarddutyFindings") },
  { name: "Tag Keys", fn: require("./tagsKeys") },
];

async function run() {
  const results = [];

  for (const s of scripts) {
    process.stdout.write(`Fetching: ${s.name} ... `);
    try {
      await s.fn();
      console.log("saved");
      results.push({ name: s.name, status: "OK" });
    } catch (err) {
      console.log("ERROR");
      results.push({ name: s.name, status: "ERROR", detail: err.message });
    }
  }

  console.log("\n=== SUMMARY ===\n");
  for (const r of results) {
    console.log(`${r.status.padEnd(6)} ${r.name}${r.detail ? " -> " + r.detail : ""}`);
  }
  console.log("\nAll raw responses saved in the results/ folder - open any .json file to see exact data shape.");
}

run();
