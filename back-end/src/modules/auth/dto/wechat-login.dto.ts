import { IsNotEmpty, IsString } from 'class-validator';

export class WechatLoginDto {
  @IsNotEmpty()
  @IsString()
  openId: string;
}

export class WechatCodeDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
