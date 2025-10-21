import { calculateMean, calculateStandardDeviation, calculateGiniCoefficient } from "./statistics";
import { writeFile } from "fs/promises";
import Papa from "papaparse";
import { RepositoryVulnerability } from "./index";

export async function generateEnhancedReport(repositoryVulnerabilities: RepositoryVulnerability[]): Promise<void> {
  if (repositoryVulnerabilities.length === 0) {
    await writeFile("enhanced-report.csv", "");
    console.log("No repositories found. Generated an empty enhanced-report.csv");
    return;
  }

  const enhancedData = repositoryVulnerabilities.map((repo) => {
    const vulnerabilities = repo.vulnerabilities.map((v) => v.quantity);
    const mean = calculateMean(vulnerabilities);
    const stdDev = calculateStandardDeviation(vulnerabilities);
    const gini = calculateGiniCoefficient(vulnerabilities);

    return {
      repositoryName: repo.repositoryName,
      mean,
      stdDev,
      gini,
      vulnerabilities: repo.vulnerabilities,
    };
  });

  // Prepare data for CSV
  const data = enhancedData.map(({ repositoryName, mean, stdDev, gini, vulnerabilities }) => {
    const severityCounts = Object.fromEntries(
      vulnerabilities.map(({ severity, quantity }) => [severity, quantity])
    );

    return {
      repositoryName,
      mean,
      stdDev,
      gini,
      ...severityCounts,
    };
  });

  if (data.length === 0) {
    await writeFile("enhanced-report.csv", "");
    console.log("No vulnerability data to report. Generated an empty enhanced-report.csv");
    return;
  }

  const fields = Object.keys(data[0]);
  const csv = Papa.unparse({ fields, data });

  await writeFile("enhanced-report.csv", csv);
  console.log("Enhanced report written to enhanced-report.csv");
}
