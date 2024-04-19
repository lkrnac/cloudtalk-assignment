import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './reviews.entity';
import { ProductsService } from "../products/products.service";
import Redis from "ioredis";

export interface CalculationMessage {
    productId: number;
    averageRating: number;
    originalCount: number;
    countChange: number;
    ratingChange: number;
}

@Injectable()
export class ReviewsService {
    private client: Redis;
    constructor(
        @InjectRepository(Review)
        private reviewsRepository: Repository<Review>,
        private readonly productsService: ProductsService
    ) {
        this.client = new Redis(process.env.REDIS_URL);
    }

    readReviews(productId: number): Promise<Review[]> {
        return this.reviewsRepository.find({
            where: { product: { id: productId }},
            relations: { product: true }
        });
    }

    readReview(productId: number, id: number, readProduct = false): Promise<Review | null> {
        return this.reviewsRepository.findOne({
            where: { id, product: { id: productId }},
            relations: { product: readProduct }
        });
    }

    async deleteReview(productId: number, id: number): Promise<void> {
        const review = await this.readReviewNullSafe(productId, id);
        await this.sendCalculationMessage(review, -1, -review.rating);
        await this.reviewsRepository.delete({ id, product: { id: productId }});
    }

    async createReview(productId: number, review: Review): Promise<Review> {
        review.product = await this.productsService.readProduct(productId);
        if (review.product === null) {
            throw new NotFoundException();
        }
        await this.sendCalculationMessage(review, 1, review.rating);
        return this.reviewsRepository.save(review);
    }

    async updateReview(productId: number, review: Review) {
        const existingReview = await this.readReviewNullSafe(productId, review.id, false);
        await this.sendCalculationMessage(existingReview, 0, review.rating - existingReview.rating);
        await this.reviewsRepository.save({ ...review, id: existingReview.id });
        return this.readReviewNullSafe(productId, review.id);
    }

    private async readReviewNullSafe(productId: number, reviewId: number, readProduct = false) {
        const existingReview = await this.readReview(productId, reviewId, readProduct);
        if (existingReview === null) {
            throw new NotFoundException();
        }
        return existingReview;
    }

    private async readReviewsCount(productId: number) {
        return this.reviewsRepository.createQueryBuilder("review")
            .where("review.product.id = :productId", { productId })
            .getCount();
    }

    private async sendCalculationMessage(review: Review, countChange: number, ratingChange: number) {
        const reviewsCount = await this.readReviewsCount(review.product.id);
        this.client.publish("review-calculation", JSON.stringify({
            productId: review.product.id,
            averageRating: review.product.averageRating,
            originalCount: reviewsCount,
            countChange,
            ratingChange
        }))
    }
}
