import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class PhoneLoginDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: '验证码格式不正确' })
  code: string;
}
