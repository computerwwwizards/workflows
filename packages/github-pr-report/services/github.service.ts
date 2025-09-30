import { getInformationReportOptions, GitHubTeamPRsResponse, UserActivity } from '../types';
import config from '../config.json';

function isToday(date: Date): boolean {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();

  const inputYear = date.getUTCFullYear();
  const inputMonth = date.getUTCMonth();
  const inputDay = date.getUTCDate();

  return [
    inputYear === utcYear,
    inputMonth === utcMonth,
    inputDay === utcDate
  ].every(Boolean);
}

export async function getInformationReport(options: getInformationReportOptions): Promise<UserActivity[]> {
  const { authToken, organization, team } = options;

  const query = `
            query {
                organization(login: "${organization}") {
                    team(slug: "${team}") {
                        members(first: 100) {
                            nodes {
                                login
                                name
                                pullRequests(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
                                    nodes {
                                      title
                                      url
                                      createdAt
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data: GitHubTeamPRsResponse = await response.json();

  const exclusions = new Set<string>(config.exclusions);

  return data.data.organization.team.members.nodes
    .filter(Boolean)
    .filter(({ login }) => !exclusions.has(login))
    .map(({ login, pullRequests }): UserActivity => ({
      username: login,
      hasActivityToday: !!pullRequests.nodes
        .filter(Boolean)
        .find(({ createdAt }) => isToday(new Date(createdAt)))
    }));
}
