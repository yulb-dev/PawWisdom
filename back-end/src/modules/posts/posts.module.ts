import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../../entities/post.entity';
import { Hashtag } from '../../entities/hashtag.entity';
import { PostLike } from '../../entities/post-like.entity';
import { PostFavorite } from '../../entities/post-favorite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Hashtag, PostLike, PostFavorite])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
