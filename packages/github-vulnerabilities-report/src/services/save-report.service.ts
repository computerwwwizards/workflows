import { writeFile } from 'fs/promises';
import Papa from 'papaparse';
import { RepositoryVulnerability } from './index';

export async function saveReport(repositoryVulnerabilities: RepositoryVulnerability[]): Promise<void> {
  // Collect all unique severities
  const severities = Array.from(
    new Set(
      repositoryVulnerabilities.flatMap(({ vulnerabilities }) =>
        vulnerabilities.map(({ severity }) => severity)
      )
    )
  );

  // Prepare data for CSV
  const data = repositoryVulnerabilities.map(({ repositoryName, vulnerabilities }) => {
    // Crear un objeto con las cantidades por severidad
    const severityCounts = Object.fromEntries(
      vulnerabilities.map(({ severity, quantity }) => [severity, quantity])
    );

    return [
      repositoryName,
      ...severities.map(severity => severityCounts[severity] || 0)
    ];
  });

  // Define fields for CSV
  const fields = ["nombre del repositorio", ...severities.map(severity => `Numero de vulnerabilidades ${severity}`)];

  const csv = Papa.unparse({ fields, data });

  await writeFile('report.csv', csv);
  console.log('Report written to report.csv');
}
