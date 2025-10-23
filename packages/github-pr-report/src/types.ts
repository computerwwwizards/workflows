export interface getInformationReportOptions {
  authToken: string;
  team: string;
  organization: string;
}

export interface UserActivity {
  username: string;
  email: string | null;
  hasActivityToday: boolean;
}

export interface Services {
  getInformationReport(options: getInformationReportOptions): Promise<UserActivity[]>
  saveReport(report: UserActivity[]): Promise<void>
}

// GitHub-specific types (used internally by github.service.ts)
export interface GitHubTeamPRsResponse {
  data: {
    organization: {
      team: {
        members: {
          nodes: Array<{
            login: string;
            name?: string;
            email: string | null;
            pullRequests: {
              nodes: Array<{
                title: string;
                url: string;
                createdAt: string; // ISO date string
              }>;
            };
          }>;
        };
      };
    };
  };
}
