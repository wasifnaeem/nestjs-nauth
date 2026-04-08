## nauth-toolkit — NestJS quick start (minimal)

This project is a minimal NestJS backend wired up with `nauth-toolkit` for **signup**, **login**, **logout**, and a **protected profile** route.

Reference docs: `https://nauth.dev/docs/quick-start/nestjs`

### prerequisites

- node.js 22+
- a running postgresql or mysql database

### installation

This example uses **postgresql**. For mysql, replace `@nauth-toolkit/database-typeorm-postgres` with `@nauth-toolkit/database-typeorm-mysql` and `pg` with `mysql2`.

```bash
npm install @nauth-toolkit/core @nauth-toolkit/nestjs @nauth-toolkit/database-typeorm-postgres @nauth-toolkit/storage-database @nauth-toolkit/email-console @nauth-toolkit/sms-console cookie-parser dotenv
```

### configuration

Create `src/config/auth.config.ts`:

```ts
import { NAuthModuleConfig, createDatabaseStorageAdapter } from '@nauth-toolkit/nestjs';
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
    verificationMethod: 'none',
  },
} satisfies NAuthModuleConfig;
```

### bootstrap

`src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NAuthHttpExceptionFilter, NAuthValidationPipe } from '@nauth-toolkit/nestjs';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// load environment variables before importing appmodule
dotenv.config();

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());

  // required for cookie-based token delivery
  app.use(cookieParser());

  app.useGlobalFilters(new NAuthHttpExceptionFilter());
  app.useGlobalPipes(new NAuthValidationPipe());

  // adjust origins for your frontend — required for credential-bearing cross-origin requests
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'x-csrf-token', 'x-device-token'],
  });

  await app.listen(3000);
}
bootstrap();
```

`src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@nauth-toolkit/nestjs';
import { getNAuthEntities, getNAuthTransientStorageEntities } from '@nauth-toolkit/database-typeorm-postgres';
// for mysql: import { getNAuthEntities, getNAuthTransientStorageEntities } from '@nauth-toolkit/database-typeorm-mysql';
import { authConfig } from './config/auth.config';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres', // for mysql: 'mysql'
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'), // for mysql: '3306'
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // storage entities are required when using databasestorageadapter
      // if you use redisstorageadapter instead, you can omit getNAuthTransientStorageEntities()
      entities: [...getNAuthEntities(), ...getNAuthTransientStorageEntities()],
      synchronize: false, // nauth runs its own migration on startup
    }),
    AuthModule.forRoot(authConfig),
  ],
  controllers: [AuthController],
})
export class AppModule {}
```

### auth controller

`src/auth/auth.controller.ts`:

```ts
import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  AuthService,
  SignupDTO,
  LoginDTO,
  LogoutDTO,
  LogoutResponseDTO,
  UserResponseDTO,
  AuthGuard,
  CurrentUser,
  Public,
} from '@nauth-toolkit/nestjs';
import type { AuthResponseDTO, IUser } from '@nauth-toolkit/nestjs';

@UseGuards(AuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDTO): Promise<AuthResponseDTO> {
    return await this.authService.signup(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDTO): Promise<AuthResponseDTO> {
    return await this.authService.login(dto);
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Query() dto: LogoutDTO): Promise<LogoutResponseDTO> {
    return await this.authService.logout(dto);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: IUser): Promise<UserResponseDTO> {
    return UserResponseDTO.fromEntity(user);
  }
}
```

### environment variables

Create a `.env` file in the project root:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=myapp

JWT_SECRET=your-access-token-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
```

### verify the backend

Start the app:

```bash
npm run start
```

Test the endpoints:

```bash
# signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "MyPassword1!"}'

# login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "user@example.com", "password": "MyPassword1!"}'

# profile (use the accessToken from the login response)
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <accessToken>"
```
