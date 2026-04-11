import { AuthGuard, MFAService, SetupMFADTO } from '@nauth-toolkit/nestjs';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

@UseGuards(AuthGuard)
@Controller('auth/mfa')
export class MfaController {
  constructor(
    @Inject(MFAService)
    private readonly mfaService: MFAService,
  ) { }

  @Get('status')
  async getStatus() {
    return await this.mfaService.getMfaStatus();
  }

  // Inside MfaController class:

  @Post('setup-data')
  @HttpCode(HttpStatus.OK)
  async setup(@Body() dto: SetupMFADTO) {
    return await this.mfaService.setup(dto);
  }

  @Post('verify-setup')
  @HttpCode(HttpStatus.OK)
  async verifySetup(@Body() dto: SetupMFADTO) {
    const provider = this.mfaService.getProvider(dto.methodName);
    const deviceId = await provider.verifySetup(dto.setupData);
    return { deviceId };
  }

  @Get('devices')
  async getDevices() {
    return await this.mfaService.getUserDevices({});
  }

  @Post('devices/:deviceId/preferred')
  @HttpCode(HttpStatus.OK)
  async setPreferred(@Param('deviceId') deviceId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.mfaService.setPreferredDevice({ deviceId } as any);
  }

  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  async removeDevice(@Param('deviceId') deviceId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.mfaService.removeDevice({ deviceId } as any);
  }
}
