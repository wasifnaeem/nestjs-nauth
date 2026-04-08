import {
  getNAuthEntities,
  getNAuthTransientStorageEntities,
} from '@nauth-toolkit/database-typeorm-mysql';
import { AuthModule } from '@nauth-toolkit/nestjs';
import { GoogleSocialAuthModule } from '@nauth-toolkit/social-google/nestjs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { authConfig } from './config/auth.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // storage entities are required when using the database storage adapter.
      // if you use the redis storage adapter instead, you can omit getNAuthTransientStorageEntities().
      entities: [...getNAuthEntities(), ...getNAuthTransientStorageEntities()],
      synchronize: false, // nauth runs its own migration on startup
    }),
    AuthModule.forRoot(authConfig),
    GoogleSocialAuthModule,
  ],
  controllers: [AuthController],
})
export class AppModule { }
