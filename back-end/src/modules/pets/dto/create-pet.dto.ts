import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { PetSpecies, PetGender } from '../../../common/enums/pet.enum';

export class CreatePetDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(PetSpecies)
  species: PetSpecies;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsEnum(PetGender)
  gender?: PetGender;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
