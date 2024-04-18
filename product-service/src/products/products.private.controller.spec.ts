import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from "./products.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./products.entity";
import { ProductsModule } from "./products.module";
import { Review } from "../reviews/reviews.entity";
import { PrivateProductsController } from "./products.private.controller";
import { ProductsController } from './products.controller';

const createTestingProduct = (index: number): Product => ({
  name: "car" + index,
  description: "some description " + index,
  price: 10000 * index,
  averageRating: index
} as Product);

describe('ProductController', () => {
  let privateProductsController: PrivateProductsController;
  let testingModule: TestingModule;
  let productsService: ProductsService;
  let productsController: ProductsController;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Product, Review],
          synchronize: true,
        }),
        ProductsModule
      ],
    }).compile();

    productsService = testingModule.get<ProductsService>(ProductsService);
    privateProductsController = testingModule.get<PrivateProductsController>(PrivateProductsController);
    productsController = testingModule.get<ProductsController>(ProductsController);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  describe('updateProduct', () => {
    it('should update average rating', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(2));

      // WHEN
      const updatedProduct = await privateProductsController.updateAverageRating(1, { averageRating: 3.3 });

      // THEN
      const savedProduct = await productsService.readProduct(1);
      expect(savedProduct).toEqual({ ...createTestingProduct(2), id: 1, averageRating: 3.3 });
      expect(updatedProduct).toEqual({ ...createTestingProduct(2), id: 1, averageRating: 3.3 });
    });
  });
});
