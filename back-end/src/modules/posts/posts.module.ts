import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../../entities/post.entity';
import { Hashtag } from '../../entities/hashtag.entity';
import { PostLike } from '../../entities/post-like.entity';
import { PostFavorite } from '../../entities/post-favorite.entity';
import { UserFollow } from '../../entities/user-follow.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Hashtag,
      PostLike,
      PostFavorite,
      UserFollow,
      User,
      Pet,
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
