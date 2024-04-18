import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from "./reviews.controller";
import { CalculationMessage, ReviewsService } from "./reviews.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Review } from "./reviews.entity";
import { ReviewsModule } from "./reviews.module";
import { Product } from "../products/products.entity";
import { ProductsModule } from "../products/products.module";
import { ProductsController } from "../products/products.controller";
import { NotFoundException } from "@nestjs/common";
import Redis from "ioredis";
jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

const createTestingProduct = (index: number): Product => ({
  name: "car" + index,
  description: "some description " + index,
  price: 10000 * index,
  averageRating: index
} as Product);

const createTestingReview = (index: number): Review => ({
  firstName: "John" + index,
  lastName: "Doe" + index,
  reviewText: "someTest" + index,
  rating: index
} as Review);

const verifyNotFoundException = async (createReviewAction: Promise<unknown>) => {
  try{
    await createReviewAction;
    fail('Should throw NotFoundException');
  } catch (error) {
    expect(error).toEqual(new NotFoundException());
  }
}

describe('ReviewController', () => {
  let reviewsController: ReviewsController;
  let testingModule: TestingModule;
  let reviewsService: ReviewsService;
  let productsController: ProductsController;
  let client: Redis;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Product, Review],
          synchronize: true,
        }),
        ProductsModule,
        ReviewsModule
      ],
    }).compile();

    reviewsService = testingModule.get<ReviewsService>(ReviewsService);
    reviewsController = testingModule.get<ReviewsController>(ReviewsController);
    productsController = testingModule.get<ProductsController>(ProductsController);

    client = new Redis(process.env.REDIS_URL);
    client.subscribe("review-calculation");
  });

  afterEach(async () => {
    await testingModule.close();
    client.unsubscribe("review-calculation");
  });

  describe('createReview', () => {
    it('should save new review', async () => {
      // GIVEN
      const product = await productsController.createProduct(createTestingProduct(1));
      const review = createTestingReview(1);

      // WHEN
      const savedReview = await reviewsController.createReview(1, review);

      // THEN
      const expectedReview = { ...createTestingReview(1), id: 1, product };
      expect(await reviewsService.readReview(1,1)).toEqual(expectedReview);
      expect(savedReview).toEqual(expectedReview);
    });

    it('should ignore id in body', async () => {
      // GIVEN
      const product = await productsController.createProduct(createTestingProduct(1));
      const review = { ...createTestingReview(1), id: 3 };

      // WHEN
      const savedReview = await reviewsController.createReview(1, review);

      // THEN
      const expectedReview = { ...createTestingReview(1), id: 1, product };
      expect(await reviewsService.readReview(1,1)).toEqual(expectedReview);
      expect(savedReview).toEqual(expectedReview);
    });

    it('should throw NotFoundException if product ID is not matched', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(1));
      const review = createTestingReview(1);

      // WHEN
      const createReviewPromise = reviewsController.createReview(3, review);

      // THEN
      await verifyNotFoundException(createReviewPromise);
    });

    it('should send message to review calculation queue', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(1));
      const review = createTestingReview(4);
      const messages: CalculationMessage[] = [];
      client.on('message', (channel, message) => {
        expect(channel).toEqual("review-calculation");
        messages.push(JSON.parse(message));
      });

      // WHEN
      await reviewsController.createReview(1, review);
      await reviewsController.createReview(1, review);
      await reviewsController.createReview(1, review);

      // THEN
      // setTimeout(() => {
        expect(messages.length).toEqual(3);
        expect(messages[0]).toEqual({ count: 1, averageRating: 1, change: 4, productId: 1 });
        expect(messages[1]).toEqual({ count: 2, averageRating: 1, change: 4, productId: 1 });
        expect(messages[2]).toEqual({ count: 3, averageRating: 1, change: 4, productId: 1 });
      //   done();
      // }, 100);
    });
  });

  describe('readReviews', () => {
    it('should read all reviews for product', async () => {
      // GIVEN
      const product = await productsController.createProduct(createTestingProduct(1));
      await reviewsController.createReview(1, createTestingReview(1));
      await reviewsController.createReview(1, createTestingReview(2));
      await reviewsController.createReview(1, createTestingReview(3));

      // WHEN
      const reviews = await reviewsController.readReviews(1);

      // THEN
      expect(reviews.length).toEqual(3);
      expect(reviews[0]).toEqual({ ...createTestingReview(1), id: 1, product });
      expect(reviews[1]).toEqual({ ...createTestingReview(2), id: 2, product });
    });

    it('should return empty array if product ID doesnt exist', async () => {
      // WHEN
      const reviews = await reviewsController.readReviews(1);

      // THEN
      expect(reviews).toEqual([]);
    });
  });

  describe('readReview', () => {
    it('should read single review', async () => {
      // GIVEN
      const product = await productsController.createProduct(createTestingProduct(1));
      await reviewsController.createReview(1, createTestingReview(4));

      // WHEN
      const review = await reviewsController.readReview(1, 1);

      // THEN
      expect(review).toEqual({ ...createTestingReview(4), id: 1, product });
    });

    it('should return null if product doesnt exist', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(1));
      await reviewsController.createReview(1, createTestingReview(4));

      // WHEN
      const review = await reviewsController.readReview(3, 1);

      // THEN
      expect(review).toBeNull();
    });
  });

  describe('deleteReview', () => {
    it('should delete review', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(1));
      await reviewsController.createReview(1, createTestingReview(4));

      // WHEN
      await reviewsController.deleteReview(1, 1);

      // THEN
      const products = await reviewsService.readReviews(1);
      expect(products.length).toEqual(0);
    });

    it('should throw NotFoundException if product ID is not matched', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(1));
      await reviewsController.createReview(1, createTestingReview(4));

      // WHEN
      const deletePromise = reviewsController.deleteReview(3, 1);

      // THEN
      await verifyNotFoundException(deletePromise);
      const reviews = await reviewsService.readReviews(1);
      expect(reviews.length).toEqual(1);
    });

    it('should send message to review calculation queue', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(1));
      const review = createTestingReview(4);
      await reviewsController.createReview(1, review);
      await reviewsController.createReview(1, review);
      await reviewsController.createReview(1, review);

      const messages: CalculationMessage[] = [];
      client.on('message', (channel, message) => {
        expect(channel).toEqual("review-calculation");
        messages.push(JSON.parse(message));
      });

      // WHEN
      await reviewsController.deleteReview(1, 1);
      await reviewsController.deleteReview(1, 2);
      await reviewsController.deleteReview(1, 3);

      // THEN
      expect(messages.length).toEqual(3);
      expect(messages[0]).toEqual({ count: 2, averageRating: 1, change: -4, productId: 1 });
      expect(messages[1]).toEqual({ count: 1, averageRating: 1, change: -4, productId: 1 });
      expect(messages[2]).toEqual({ count: 0, averageRating: 1, change: -4, productId: 1 });
    });
  });

  describe('updateReview', () => {
    it('should update review', async () => {
      // GIVEN
      const product= await productsController.createProduct(createTestingProduct(1));
      await reviewsController.createReview(1, createTestingReview(4));

      // WHEN
      const updatedReview = await reviewsController.updateReview(1, 1, createTestingReview(2));

      // THEN
      const savedReview = await reviewsService.readReview(1, 1);
      let expectedReview = { ...createTestingReview(2), id: 1, product };
      expect(savedReview).toEqual(expectedReview);
      expect(updatedReview).toEqual(expectedReview);
    });

    it('should ignore id in body', async () => {
      // GIVEN
      const product = await productsController.createProduct(createTestingProduct(1));
      await reviewsController.createReview(1, createTestingReview(4));
      const bodyToUpdate = { id: 5, ...createTestingReview(2) };

      // WHEN
      const updatedReview = await reviewsController.updateReview(1, 1, bodyToUpdate);

      // THEN
      expect(await reviewsService.readReview(1, 5)).toBeNull();
      const savedReview = await reviewsService.readReview(1, 1);
      let expectedReview = { ...createTestingReview(2), id: 1, product };
      expect(savedReview).toEqual(expectedReview);
      expect(updatedReview).toEqual(expectedReview);
    });

    it('should throw NorFoundException if product ID is not matched', async () => {
      // GIVEN
      const product= await productsController.createProduct(createTestingProduct(1));
      await reviewsController.createReview(1, createTestingReview(4));

      // WHEN
      const updatedReviewPromise = reviewsController.updateReview(3, 1, createTestingReview(2));

      // THEN
      await verifyNotFoundException(updatedReviewPromise);
      const savedReview = await reviewsService.readReview(1, 1);
      let expectedReview = { ...createTestingReview(4), id: 1, product };
      expect(savedReview).toEqual(expectedReview);
    });

    it('should send message to review calculation queue', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(1));
      const review = createTestingReview(4);
      await reviewsController.createReview(1, review);
      await reviewsController.createReview(1, review);
      await reviewsController.createReview(1, review);

      const messages: CalculationMessage[] = [];
      client.on('message', (channel, message) => {
        expect(channel).toEqual("review-calculation");
        messages.push(JSON.parse(message));
      });

      // WHEN
      await reviewsController.updateReview(1, 1, createTestingReview(2));
      await reviewsController.updateReview(1, 2, createTestingReview(2));
      await reviewsController.updateReview(1, 3, createTestingReview(2));

      // THEN
      expect(messages.length).toEqual(3);
      expect(messages[0]).toEqual({ count: 3, averageRating: 1, change: -2, productId: 1 });
      expect(messages[1]).toEqual({ count: 3, averageRating: 1, change: -2, productId: 1 });
      expect(messages[2]).toEqual({ count: 3, averageRating: 1, change: -2, productId: 1 });
    });
  });
});
