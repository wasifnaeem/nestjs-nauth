import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Optional,
  Param,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import {
  AuthResponseDTO,
  Public,
  SocialCallbackFormDTO,
  SocialCallbackQueryDTO,
  SocialExchangeDTO,
  SocialRedirectHandler,
  StartSocialRedirectQueryDTO,
  TokenDelivery,
  VerifyTokenDTO,
} from '@nauth-toolkit/nestjs';
import { GoogleSocialAuthService } from '@nauth-toolkit/social-google/nestjs';

/**
 * Delegates to nauth SocialRedirectHandler — routes are not registered by AuthModule alone.
 * @see https://nauth.dev/docs/guides/social/how-social-login-works#web-oauth-routes
 */
@Controller('auth/social')
export class SocialRedirectController {
  constructor(
    private readonly socialRedirect: SocialRedirectHandler,
    @Optional()
    @Inject(GoogleSocialAuthService)
    private readonly googleAuth?: GoogleSocialAuthService,
  ) {}

  @Public()
  @Redirect()
  @Get(':provider/redirect')
  async start(
    @Param('provider') provider: string,
    @Query() dto: StartSocialRedirectQueryDTO,
  ): Promise<{ url: string }> {
    return this.socialRedirect.start(provider, dto);
  }

  @Public()
  @Redirect()
  @Get(':provider/callback')
  async callbackGet(
    @Param('provider') provider: string,
    @Query() dto: SocialCallbackQueryDTO,
  ): Promise<{ url: string }> {
    return this.socialRedirect.callback(provider, dto);
  }

  // apple uses form_post
  @Public()
  @Redirect()
  @Post(':provider/callback')
  async callbackPost(
    @Param('provider') provider: string,
    @Body() dto: SocialCallbackFormDTO,
  ): Promise<{ url: string }> {
    return this.socialRedirect.callback(provider, dto);
  }

  @Public()
  @Post('exchange')
  @TokenDelivery('json')
  async exchange(@Body() dto: SocialExchangeDTO): Promise<AuthResponseDTO> {
    return this.socialRedirect.exchange(dto.exchangeToken);
  }

  @Public()
  @Post(':provider/verify')
  async verifyNative(@Body() dto: VerifyTokenDTO): Promise<AuthResponseDTO> {
    const provider = dto.provider;
    if (provider === 'google') {
      if (!this.googleAuth) {
        throw new BadRequestException('Google OAuth is not configured');
      }
      return this.googleAuth.verifyToken(dto);
    }
    throw new BadRequestException(`Unsupported provider: ${provider}`);
  }
}
