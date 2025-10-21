export interface GetInformationReportOptions {
  authToken: string;
  team: string;
  organization: string;
}

export interface VulnerabilityDetail {
  severity: string;
  quantity: number;
}

export interface RepositoryVulnerability {
  repositoryName: string;
  vulnerabilities: VulnerabilityDetail[];
}

export interface Services {
  getInformationReport(options: GetInformationReportOptions): Promise<RepositoryVulnerability[]>
  saveReport(report: RepositoryVulnerability[]): Promise<void>
}