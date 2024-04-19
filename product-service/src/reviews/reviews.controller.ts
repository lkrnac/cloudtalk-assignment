import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Review } from "./reviews.entity";

@Controller('products/:productId/reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @Get()
    async readReviews(@Param('productId') productId: number): Promise<Review[]> {
        return this.reviewsService.readReviews(productId);
    }

    @Get(':id')
    async readReview(
        @Param('productId') productId: number,
        @Param('id') id: number
    ): Promise<Review> {
        return this.reviewsService.readReview(productId, id);
    }

    @Post()
    async createReview(
        @Param('productId') productId: number,
        @Body() review: Review
    ): Promise<Review> {
        delete review.id; // POST should create new review
        return this.reviewsService.createReview(productId, review);
    }

    @Delete(':id')
    async deleteReview(
        @Param('productId') productId: number,
        @Param('id') id: number
    ) {
        await this.reviewsService.deleteReview(productId, id);
    }

    @Put(':id')
    async updateReview(
        @Param('productId') productId: number,
        @Param('id') id: number,
        @Body() product: Review
    ): Promise<Review> {
        return this.reviewsService.updateReview(productId,{ ...product, id });
    }
}