import "dotenv/config";
import { getInformationReport } from "./services/github.service";
import { saveReport } from "./services/save-report.service";

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

  if (!authToken || !organization || !team) {
    console.error("Missing required options: --token, --org, --team, or corresponding environment variables.");
    process.exit(1);
  }

  const repositoryVulnerabilities = await getInformationReport({
    authToken: authToken as string,
    organization: organization as string,
    team: team as string,
  });


  await saveReport(repositoryVulnerabilities);

  console.log(`Report generation (original) completed successfully.`);
}

main().catch((error) => {
  console.error("Error during report generation:", error);
  process.exit(1);
});
