import { PrimitiveContainer } from '@computerwwwizards/dependency-injection';
import { getInformationReport } from './services/github.service';
import { saveReport } from './services/save-report.service';
import { Services } from './types';

export function createContainer() {
  const container = new PrimitiveContainer<Services>();

  container
    .bindTo('getInformationReport', () => getInformationReport, 'singleton')
    .bindTo('saveReport', () => saveReport, 'singleton');

  return container;
}
