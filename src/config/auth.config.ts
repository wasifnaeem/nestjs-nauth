import {
  NAuthModuleConfig,
  createDatabaseStorageAdapter,
} from '@nauth-toolkit/nestjs';
import { ConsoleEmailProvider } from '@nauth-toolkit/email-console';
import { ConsoleSMSProvider } from '@nauth-toolkit/sms-console';

export const authConfig: NAuthModuleConfig = {
  jwt: {
    algorithm: 'HS256',
    accessToken: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '15m',
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: '7d',
      rotation: true,
    },
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // uses your typeorm database for transient storage (rate limits, locks, etc.)
  // for multi-server production deployments, use createRedisStorageAdapter() instead
  storageAdapter: createDatabaseStorageAdapter(),

  // console providers log to stdout — replace with real providers for production
  emailProvider: new ConsoleEmailProvider(),
  smsProvider: new ConsoleSMSProvider(),

  signup: {
    enabled: true,
    // set to 'email', 'phone', or 'both' to require verification via the challenge system
    verificationMethod: 'email',
    emailVerification: {
      expiresIn: 3600, // 1 hour
      resendDelay: 60, // 1 minute between resends
      rateLimitMax: 3,
      rateLimitWindow: 3600,
    },
  },
} satisfies NAuthModuleConfig;
