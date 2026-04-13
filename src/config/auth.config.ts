import { NodemailerEmailProvider } from '@nauth-toolkit/email-nodemailer';
import {
  NAuthModuleConfig,
  createDatabaseStorageAdapter,
} from '@nauth-toolkit/nestjs';
import { ConsoleSMSProvider } from '@nauth-toolkit/sms-console';
import { Logger } from '@nestjs/common';

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
  tokenDelivery: {
    method: 'cookies',
  },
  logger: {
    instance: new Logger('NAuth'),
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // social login — shared routes delegate to SocialRedirectHandler (see social-redirect.controller.ts)
  social: {
    redirect: {
      frontendBaseUrl: process.env.FRONTEND_BASE_URL ?? 'http://localhost:4200',

      // Prevent open redirects — only allow relative returnTo paths
      allowAbsoluteReturnTo: false,
      allowedReturnToOrigins: ['http://localhost:4200'],
    },
    google: {
      enabled: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:3000/auth/social/google/callback',
      autoLink: true,
      allowSignup: true,
      scopes: ['openid', 'email', 'profile'],
    },
  },

  // uses your typeorm database for transient storage (rate limits, locks, etc.)
  // for multi-server production deployments, use createRedisStorageAdapter() instead
  storageAdapter: createDatabaseStorageAdapter(),

  // console providers log to stdout — replace with real providers for production
  emailProvider: new NodemailerEmailProvider({
    transport: {
      host: String(process.env.SMTP_HOST),
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      // keep timeouts low so requests don't hang on smtp issues
      connectionTimeout: 20000, // 20 seconds
      greetingTimeout: 20000, // 20 seconds
      socketTimeout: 20000, // 20 seconds
      auth: {
        user: String(process.env.SMTP_USER),
        pass: String(process.env.SMTP_PASS),
      },
    },
    defaults: {
      from:
        process.env.SMTP_USER ??
        `Nauth App <${String(process.env.SMTP_USER ?? '')}>`,
    },
  }),
  // emailProvider: new ConsoleEmailProvider(),
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
  auditLogs: {
    enabled: true,
  },
} satisfies NAuthModuleConfig;
