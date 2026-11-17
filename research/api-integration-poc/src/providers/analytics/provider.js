export class AnalyticsProvider {
  constructor({ mode }) {
    this.mode = mode;
  }

  get evidenceStatus() {
    return this.mode === 'real' ? 'NOT_TESTED' : 'PASS_MOCK';
  }
}
