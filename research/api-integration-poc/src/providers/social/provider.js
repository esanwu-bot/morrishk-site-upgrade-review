export class SocialProvider {
  constructor({ mode }) {
    this.mode = mode;
  }

  get evidenceStatus() {
    return this.mode === 'real' ? 'NOT_TESTED' : 'PASS_MOCK';
  }

  async connect() {
    throw new Error('connect() 未实现');
  }

  async handleCallback() {
    throw new Error('handleCallback() 未实现');
  }

  async listAccounts() {
    throw new Error('listAccounts() 未实现');
  }

  async getAccount() {
    throw new Error('getAccount() 未实现');
  }

  async publish() {
    throw new Error('publish() 未实现');
  }

  async getPost() {
    throw new Error('getPost() 未实现');
  }

  async fetchMetrics() {
    throw new Error('fetchMetrics() 未实现');
  }

  async disconnect() {
    throw new Error('disconnect() 未实现');
  }
}
