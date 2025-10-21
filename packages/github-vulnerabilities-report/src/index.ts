import "dotenv/config";
import { createContainer } from "./container";
import { generateEnhancedReport } from "./services/enhanced-report.service";

function getArgOrEnv(argName: string, envName: string): string | undefined {
  const argIdx = process.argv.findIndex((arg) => arg === `--${argName}`);
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    return process.argv[argIdx + 1];
  }
  return process.env[envName];
}

async function main() {
  const authToken = getArgOrEnv("token", "GITHUB_AUTH_TOKEN");
  const organization = getArgOrEnv("org", "ORGANIZATION");
  const team = getArgOrEnv("team", "TEAM");
  const reportType = getArgOrEnv("report", "REPORT_TYPE") || "original";

  if (!authToken || !organization || !team) {
    console.error("Missing required options: --token, --org, --team, or corresponding environment variables.");
    process.exit(1);
  }

  const container = createContainer();
  const getInformationReport = container.get("getInformationReport");
  const saveReport = container.get("saveReport");

  const repositoryVulnerabilities = await getInformationReport({
    authToken: authToken as string,
    organization: organization as string,
    team: team as string,
  });

  if (reportType === "enhanced") {
    await generateEnhancedReport(repositoryVulnerabilities);
  } else {
    await saveReport(repositoryVulnerabilities);
  }

  console.log(`Report generation (${reportType}) completed successfully.`);
}

main().catch((error) => {
  console.error("Error during report generation:", error);
  process.exit(1);
});
