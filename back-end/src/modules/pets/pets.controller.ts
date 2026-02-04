import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthRequest = ExpressRequest & { user: { userId: string } };

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  create(@Request() req: AuthRequest, @Body() createPetDto: CreatePetDto) {
    return this.petsService.create(req.user.userId, createPetDto);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.petsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.petsService.findByUserId(userId);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petsService.update(id, req.user.userId, updatePetDto);
  }

  @Delete(':id')
  async remove(@Request() req: AuthRequest, @Param('id') id: string) {
    await this.petsService.remove(id, req.user.userId);
    return { success: true };
  }
}
