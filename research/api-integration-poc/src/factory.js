import { FileTokenStore } from './token-store.js';
import { LinkedInProvider } from './providers/social/linkedin.js';
import { AyrshareProvider } from './providers/social/ayrshare.js';
import { MuxProvider } from './providers/video/mux.js';
import { GA4Provider } from './providers/analytics/ga4.js';
import { MeasurementProtocolClient } from './providers/analytics/measurement-protocol.js';

export function createProviders(config, logger, overrides = {}) {
  const tokenStore = overrides.tokenStore || new FileTokenStore(config.tokenDir);
  return {
    social: {
      linkedin:
        overrides.linkedin ||
        new LinkedInProvider({ mode: config.mode, config, tokenStore, logger }),
      ayrshare:
        overrides.ayrshare || new AyrshareProvider({ mode: config.mode, config, logger })
    },
    video: {
      mux: overrides.mux || new MuxProvider({ mode: config.mode, config, logger })
    },
    analytics: {
      ga4: overrides.ga4 || new GA4Provider({ mode: config.mode, config, logger }),
      mp: overrides.mp || new MeasurementProtocolClient({ mode: config.mode, config, logger })
    },
    tokenStore
  };
}
