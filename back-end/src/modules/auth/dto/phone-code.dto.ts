import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class PhoneCodeDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;
}
