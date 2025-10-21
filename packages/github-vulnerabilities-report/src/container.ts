import { PrimitiveContainer } from '@computerwwwizards/dependency-injection';
import { getInformationReport } from './services/github-by-team.service';
import { saveReport } from './services/save-report.service';
import { Services } from './services/index';

export function createContainer() {
  const container = new PrimitiveContainer<Services>();

  container
    .bindTo('getInformationReport', () => getInformationReport, 'singleton')
    .bindTo('saveReport', () => saveReport, 'singleton');

  return container;
}
