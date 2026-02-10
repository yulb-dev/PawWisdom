import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../../entities/pet.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
  ) {}

  async create(ownerId: string, createPetDto: CreatePetDto): Promise<Pet> {
    try {
      const pet = this.petRepository.create({
        ...createPetDto,
        ownerId,
      });

      return await this.petRepository.save(pet);
    } catch {
      throw new InternalServerErrorException('Failed to create pet');
    }
  }

  async findAll(ownerId: string): Promise<Pet[]> {
    return this.petRepository.find({
      where: { ownerId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['owner'],
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }

  async findByUserId(userId: string): Promise<Pet[]> {
    return this.petRepository.find({
      where: { ownerId: userId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    ownerId: string,
    updatePetDto: UpdatePetDto,
  ): Promise<Pet> {
    const pet = await this.findOne(id);

    if (pet.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own pets');
    }

    Object.assign(pet, updatePetDto);

    try {
      return await this.petRepository.save(pet);
    } catch {
      throw new InternalServerErrorException('Failed to update pet');
    }
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const pet = await this.findOne(id);

    if (pet.ownerId !== ownerId) {
      throw new ForbiddenException('You can only delete your own pets');
    }

    pet.isDeleted = true;
    await this.petRepository.save(pet);
  }
}
