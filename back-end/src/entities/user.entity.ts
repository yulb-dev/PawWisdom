import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Pet } from './pet.entity';

@Entity('users')
@Index(['email'])
@Index(['phone'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Pet, (pet) => pet.owner)
  pets: Pet[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeData() {
    this.username = this.username?.trim();
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
    if (this.phone) {
      this.phone = this.phone.trim();
    }
  }
}
