import { GetInformationReportOptions, RepositoryVulnerability } from './index';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

interface GitHubResponse {
  data?: {
    organization?: {
      team?: {
        name: string;
        repositories: {
          totalCount: number;
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
          nodes?: Repository[];
        };
      };
    };
  };
  errors?: Array<{
    message: string;
    locations: Array<{
      line: number;
      column: number;
    }>;
  }>;
}

interface Repository {
  name: string;
  nameWithOwner: string;
  url: string;
  vulnerabilityAlerts?: {
    totalCount: number;
    nodes?: VulnerabilityAlert[];
  };
}

interface VulnerabilityAlert {
  number: number;
  state: string;
  securityVulnerability: {
    package: {
      name: string;
      ecosystem: string;
    };
    severity: string;
  };
  securityAdvisory: {
    ghsaId: string;
    summary: string;
    severity: string;
  };
}

interface BatchingOptions {
  batchSize: number;
  delayBetweenBatches: number; // in milliseconds
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
  limit?: number; // límite máximo de repositorios a obtener
}

interface FetchRepositoriesOptions extends GetInformationReportOptions {
  batchingOptions?: BatchingOptions;
}

const DEFAULT_BATCHING_OPTIONS: BatchingOptions = {
  batchSize: 10,
  delayBetweenBatches: 1000, // 1 second
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRepositoriesBatch(
  options: FetchRepositoriesOptions,
  cursor: string | null,
  batchSize: number
): Promise<{ repositories: Repository[]; hasNextPage: boolean; endCursor: string | null; totalCount: number }> {
  const { authToken, organization, team } = options;

  const query = `
    query GetTeamReposWithVulnerabilities($orgLogin: String!, $teamSlug: String!, $cursor: String, $batchSize: Int!) {
      organization(login: $orgLogin) {
        team(slug: $teamSlug) {
          name
          repositories(first: $batchSize, after: $cursor) {
            totalCount
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              nameWithOwner
              url
              vulnerabilityAlerts(first: 30) {
                totalCount
                nodes {
                  number
                  state
                  securityVulnerability {
                    package {
                      name
                      ecosystem
                    }
                    severity
                  }
                  securityAdvisory {
                    ghsaId
                    summary
                    severity
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    orgLogin: organization,
    teamSlug: team,
    cursor,
    batchSize
  };

  let retries = 0;
  const maxRetries = options.batchingOptions?.maxRetries ?? DEFAULT_BATCHING_OPTIONS.maxRetries!;
  const retryDelay = options.batchingOptions?.retryDelay ?? DEFAULT_BATCHING_OPTIONS.retryDelay!;

  while (true) {
    try {
      const response = await fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (response.status === 403 || response.status === 429) {
        throw new Error('Rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(`GitHub API request failed with status ${response.status}`);
      }

      const result = await response.json() as GitHubResponse;

      if (result.errors?.length) {
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      const repositories = result.data?.organization?.team?.repositories;
      if (!repositories) {
        throw new Error('No repository data found in response');
      }

      return {
        repositories: repositories.nodes || [],
        hasNextPage: repositories.pageInfo?.hasNextPage || false,
        endCursor: repositories.pageInfo?.endCursor || null,
        totalCount: repositories.totalCount
      };
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }

      console.warn(`Batch request failed, retrying in ${retryDelay}ms... (${retries + 1}/${maxRetries})`);
      await sleep(retryDelay);
      retries++;
    }
  }
}

async function fetchAllRepositoriesWithBatching(options: FetchRepositoriesOptions): Promise<Repository[]> {
  const batchingOptions = {
    ...DEFAULT_BATCHING_OPTIONS,
    ...options.batchingOptions
  };

  const allRepositories: Repository[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  let processedCount = 0;
  let totalRepositories = 0;

  while (hasNextPage) {
    // Si hay un límite y ya lo alcanzamos, terminamos
    if (batchingOptions.limit && processedCount >= batchingOptions.limit) {
      console.log(`\nLímite de ${batchingOptions.limit} repositorios alcanzado. Deteniendo consultas...`);
      break;
    }

    // Ajustar el tamaño del batch si estamos cerca del límite
    let currentBatchSize = batchingOptions.batchSize;
    if (batchingOptions.limit) {
      const remaining = batchingOptions.limit - processedCount;
      currentBatchSize = Math.min(currentBatchSize, remaining);
    }

    const result = await fetchRepositoriesBatch(options, cursor, currentBatchSize);

    if (totalRepositories === 0) {
      totalRepositories = batchingOptions.limit || result.totalCount;
    }

    processedCount += result.repositories.length;
    console.log(`\nConsulta ${processedCount} de ${totalRepositories} repositorios...`);

    allRepositories.push(...result.repositories);
    hasNextPage = result.hasNextPage;
    cursor = result.endCursor;

    if (hasNextPage) {
      await sleep(batchingOptions.delayBetweenBatches);
    }
  }

  return allRepositories;
}

export async function getInformationReport(
  options: GetInformationReportOptions,
  batchingOptions?: BatchingOptions
): Promise<RepositoryVulnerability[]> {
  const repositories = await fetchAllRepositoriesWithBatching({
    ...options,
    batchingOptions
  });

  if (!repositories.length) {
    return [];
  }

  // Filtrar repositorios sin vulnerabilidades, que comienzan con "ms" y agrupar por severidad
  return repositories
    .filter(repo => !repo.name.toLowerCase().startsWith('ms'))
    .map(repo => {
      const vulnerabilitiesBySeverity = new Map<string, number>();

      // Contar vulnerabilidades por severidad
      (repo.vulnerabilityAlerts?.nodes || []).forEach(alert => {
        const severity = alert.securityVulnerability.severity;
        vulnerabilitiesBySeverity.set(
          severity,
          (vulnerabilitiesBySeverity.get(severity) || 0) + 1
        );
      });

      // Transformar al formato requerido
      return {
        repositoryName: repo.name,
        vulnerabilities: Array.from(vulnerabilitiesBySeverity.entries()).map(([severity, quantity]) => ({
          severity,
          quantity
        }))
      };
    });
}