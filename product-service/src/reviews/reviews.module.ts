import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './reviews.entity';
import { Product } from "../products/products.entity";
import { ProductsService } from "../products/products.service";

@Module({
    imports: [TypeOrmModule.forFeature([Product, Review])],
    providers: [ProductsService, ReviewsService],
    controllers: [ReviewsController],
})
export class ReviewsModule {}
