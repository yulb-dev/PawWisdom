import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from './user.entity';
import { PetSpecies, PetGender } from '../common/enums/pet.enum';

@Entity('pets')
@Index(['ownerId', 'isDeleted'])
@Index(['species'])
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({
    type: 'enum',
    enum: PetSpecies,
    default: PetSpecies.OTHER,
  })
  species: PetSpecies;

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed?: string;

  @Column({ type: 'date', nullable: true })
  birthday?: Date;

  @Column({
    type: 'enum',
    enum: PetGender,
    default: PetGender.UNKNOWN,
  })
  gender: PetGender;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.pets, { eager: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeData() {
    this.name = this.name?.trim();
    if (this.breed) {
      this.breed = this.breed.trim();
    }
  }
}
