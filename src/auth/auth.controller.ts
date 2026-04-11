import {
  AuthResponseDTO,
  ChangePasswordDTO,
  ChangePasswordResponseDTO,
  ConfirmForgotPasswordDTO,
  ConfirmForgotPasswordResponseDTO,
  ForgotPasswordDTO,
  ForgotPasswordResponseDTO,
  GetSetupDataDTO,
  GetSetupDataResponseDTO,
  GetUserSessionsResponseDTO,
  type IUser,
  LoginDTO,
  LogoutDTO,
  LogoutResponseDTO,
  MFAService,
  RefreshTokenDTO,
  ResendCodeDTO,
  ResendCodeResponseDTO,
  RespondChallengeDTO,
  SignupDTO,
  TokenResponse,
} from '@nauth-toolkit/nestjs';
import {
  AuthGuard,
  AuthService,
  CurrentUser,
  Public,
  UserResponseDTO,
} from '@nauth-toolkit/nestjs';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

@UseGuards(AuthGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(MFAService)
    private readonly mfaService?: MFAService,
  ) { }

  @Get('profile')
  getProfile(@CurrentUser() user: IUser): UserResponseDTO {
    return UserResponseDTO.fromEntity(user);
  }

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
    const result = await this.authService.login(dto);

    // Check if challenge is required
    if (result.challengeName) {
      return {
        challengeName: result.challengeName,
        session: result.session,
        challengeParameters: result.challengeParameters,
      };
    }

    // Return tokens if no challenge
    return result;
  }

  @Public()
  @Post('respond-challenge')
  @HttpCode(HttpStatus.OK)
  // eslint-disable-next-line prettier/prettier
  async respondToChallenge(@Body() dto: RespondChallengeDTO): Promise<AuthResponseDTO> {
    return await this.authService.respondToChallenge(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDTO,
    @Req() req: Request,
  ): Promise<TokenResponse> {
    return await this.authService.refreshToken({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      refreshToken: dto?.refreshToken || req.cookies?.['nauth_refresh_token'],
    });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDTO,
  ): Promise<ForgotPasswordResponseDTO> {
    // baseUrl constructs a clickable link in the email: ${baseUrl}?code=${code}
    dto.baseUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:4200'}/auth/reset-password`;
    return await this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('challenge/challenge-data')
  @HttpCode(HttpStatus.OK)
  async getChallengeData(@Body() dto: any) {
    if (!this.mfaService)
      throw new BadRequestException('MFA service is not available');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.mfaService.getChallengeData(dto);
  }

  @Public()
  @Post('challenge/setup-data')
  @HttpCode(HttpStatus.OK)
  async getSetupData(
    @Body() dto: GetSetupDataDTO,
  ): Promise<GetSetupDataResponseDTO> {
    if (!this.mfaService) {
      throw new BadRequestException('MFA service is not available');
    }
    return await this.mfaService.getSetupData(dto);
  }

  @Public()
  @Post('forgot-password/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmForgotPassword(
    @Body() dto: ConfirmForgotPasswordDTO,
  ): Promise<ConfirmForgotPasswordResponseDTO> {
    return await this.authService.confirmForgotPassword(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDTO,
  ): Promise<ChangePasswordResponseDTO> {
    return await this.authService.changePassword(dto);
  }

  @Public()
  @Post('challenge/resend')
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() dto: ResendCodeDTO): Promise<ResendCodeResponseDTO> {
    return await this.authService.resendCode(dto);
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Query() dto: LogoutDTO): Promise<LogoutResponseDTO> {
    return await this.authService.logout(dto);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getUserSessions(): Promise<GetUserSessionsResponseDTO> {
    return await this.authService.getUserSessions();
  }
}
