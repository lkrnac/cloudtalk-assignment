import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './reviews.entity';
import { ProductsService } from "../products/products.service";

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private reviewsRepository: Repository<Review>,
        private readonly productsService: ProductsService
    ) {}

    readReviews(productId: number): Promise<Review[]> {
        return this.reviewsRepository.find({
            where: { product: { id: productId }},
            relations: { product: true }
        });
    }

    readReview(productId: number, id: number): Promise<Review | null> {
        return this.reviewsRepository.findOne({
            where: { id, product: { id: productId }},
            relations: { product: true }
        });
    }

    async deleteReview(productId: number, id: number): Promise<void> {
        await this.readReviewNullSafe(productId, id);
        await this.reviewsRepository.delete({ id, product: { id: productId }});
    }

    async createReview(productId: number, review: Review): Promise<Review> {
        review.product = await this.productsService.readProduct(productId);
        if (review.product === null) {
            throw new NotFoundException();
        }
        return this.reviewsRepository.save(review);
    }

    async updateReview(productId: number, review: Review) {
        await this.readReviewNullSafe(productId, review.id);
        await this.reviewsRepository.save(review);
        return this.reviewsRepository.findOne({
            where: { id: review.id, product: { id: productId }},
            relations: { product: true }
        });
    }

    private async readReviewNullSafe(productId: number, reviewId: number) {
        const existingReview = await this.readReview(productId, reviewId);
        if (existingReview === null) {
            throw new NotFoundException();
        }
    }
}
