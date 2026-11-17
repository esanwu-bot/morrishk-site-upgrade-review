import { PocError, ErrorCode, blockedCredential } from '../../errors.js';
import { request, jsonHeaders } from '../../http.js';

const MP_URL = 'https://www.google-analytics.com/mp/collect';
const MP_DEBUG_URL = 'https://www.google-analytics.com/debug/mp/collect';

export class MeasurementProtocolClient {
  constructor({ mode, config, logger, mpUrl = MP_URL, debugUrl = MP_DEBUG_URL }) {
    this.mode = mode;
    this.config = config;
    this.logger = logger;
    this.mpUrl = mpUrl;
    this.debugUrl = debugUrl;
  }

  missingConfig() {
    const missing = [];
    if (!this.config.ga4.measurementId) missing.push('GA4_MEASUREMENT_ID');
    if (!this.config.ga4.apiSecret) missing.push('GA4_API_SECRET');
    return missing;
  }

  async send({ clientId, events, debug = false }) {
    if (!clientId) throw new PocError(ErrorCode.BAD_REQUEST, 'clientId 必填');
    if (!Array.isArray(events) || !events.length) {
      throw new PocError(ErrorCode.BAD_REQUEST, '至少一个事件');
    }

    if (this.mode === 'mock') {
      return {
        mode: 'mock',
        debug,
        endpoint: debug ? 'debug/mp/collect' : 'mp/collect',
        clientId,
        eventCount: events.length,
        validationMessages: debug ? [] : undefined,
        note: debug
          ? '示例校验结果；真实调用需 GA4_MEASUREMENT_ID 与 GA4_API_SECRET'
          : '示例发送结果；事件不会进入任何真实 GA4 报表'
      };
    }

    if (this.missingConfig().length) throw blockedCredential('ga4-mp', this.missingConfig());
    const url = new URL(debug ? this.debugUrl : this.mpUrl);
    url.searchParams.set('measurement_id', this.config.ga4.measurementId);
    url.searchParams.set('api_secret', this.config.ga4.apiSecret);

    const res = await request({
      provider: 'ga4-mp',
      url: url.toString(),
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ client_id: clientId, events }),
      logger: this.logger
    });
    return {
      mode: 'real',
      debug,
      status: res.status,
      validationMessages: debug ? res.body.validationMessages || [] : undefined
    };
  }
}
