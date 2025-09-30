import { writeFile } from 'fs/promises';
import Papa from 'papaparse';
import { UserActivity } from '../types';

export async function saveReport(activities: UserActivity[]): Promise<void> {
  const data = activities.map(({ username, hasActivityToday }): [string, boolean] => [
    username,
    hasActivityToday
  ]);

  const csv = Papa.unparse({
    fields: ["Name", "Has made a pr"],
    data
  });

  await writeFile('report.csv', csv);
  console.log('Report written to report.csv');
}
