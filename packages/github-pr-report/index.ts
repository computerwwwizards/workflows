
import 'dotenv/config';
import { createContainer } from './container';

function getArgOrEnv(argName: string, envName: string): string | undefined {
  const argIdx = process.argv.findIndex(a => a === `--${argName}`);
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    return process.argv[argIdx + 1];
  }
  return process.env[envName];
}

const authToken = getArgOrEnv('token', 'GH_TOKEN');
const organization = getArgOrEnv('org', 'ORGANIZATION');
const team = getArgOrEnv('team', 'TEAM');

if (!authToken || !organization || !team) {
  console.error('Missing required options: --token, --org, --team or corresponding envs');
  process.exit(1);
}

const container = createContainer();

const getInformationReport = container.get('getInformationReport');
const saveReport = container.get('saveReport');

const activities = await getInformationReport({
  authToken,
  organization,
  team
});

await saveReport(activities);
