import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./products.entity";
import { ProductsModule } from "./products.module";
import { Review } from "../reviews/reviews.entity";

const createTestingProduct = (index: number): Product => ({
  name: "car" + index,
  description: "some description " + index,
  price: 10000 * index
} as Product);

describe('ProductController', () => {
  let productsController: ProductsController;
  let testingModule: TestingModule;
  let productsService: ProductsService;

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
    productsController = testingModule.get<ProductsController>(ProductsController);
  });


  afterEach(async () => {
    await testingModule.close();
  });

  describe('createProduct', () => {
    it('should save new product', async () => {
      // GIVEN
      const product = createTestingProduct(1);

      // WHEN
      const savedProduct = await productsController.createProduct(product);

      // THEN
      const expectedProduct = { ...product, id: 1};
      expect(await productsService.readProduct(1)).toEqual(expectedProduct);
      expect(savedProduct).toEqual(expectedProduct);
    });

    it('should ignore id in body', async () => {
      // GIVEN
      const product = { ...createTestingProduct(3), id: 3 };

      // WHEN
      const savedProduct = await productsController.createProduct(product);

      // THEN
      expect(await productsService.readProduct(3)).toBeNull();
      const expectedProduct = { ...product, id: 1};
      expect(await productsService.readProduct(1)).toEqual(expectedProduct);
      expect(savedProduct).toEqual(expectedProduct);
    });
  });

  describe('readProducts', () => {
    it('should read all products', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(1));
      await productsController.createProduct(createTestingProduct(2));
      await productsController.createProduct(createTestingProduct(3));

      // WHEN
      const products = await productsController.readProducts();

      // THEN
      expect(products.length).toEqual(3);
      expect(products[0]).toEqual({ ...createTestingProduct(1), id: 1 });
      expect(products[1]).toEqual({ ...createTestingProduct(2), id: 2 });
    });
  });

  describe('readProduct', () => {
    it('should read single product', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(4));

      // WHEN
      const product = await productsController.readProduct(1);

      // THEN
      expect(product).toEqual({ ...createTestingProduct(4), id: 1 });
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(4));

      // WHEN
      await productsController.deleteProduct(1);

      // THEN
      const products = await productsService.readProducts();
      expect(products.length).toEqual(0);
    });
  });

  describe('updateProduct', () => {
    it('should update product', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(4));

      // WHEN
      const updatedProduct = await productsController.updateProduct(1, createTestingProduct(2));

      // THEN
      const savedProduct = await productsService.readProduct(1);
      expect(savedProduct).toEqual({ ...createTestingProduct(2), id: 1 });
      expect(updatedProduct).toEqual({ ...createTestingProduct(2), id: 1 });
    });

    it('should ignore id in body', async () => {
      // GIVEN
      await productsController.createProduct(createTestingProduct(4));
      const bodyToUpdate = { id: 5, ...createTestingProduct(2) };

      // WHEN
      const updatedProduct = await productsController.updateProduct(1, bodyToUpdate);

      // THEN
      expect(await productsService.readProduct(5)).toBeNull();
      const savedProduct = await productsService.readProduct(1);
      expect(savedProduct).toEqual({ ...createTestingProduct(2), id: 1 });
      expect(updatedProduct).toEqual({ ...createTestingProduct(2), id: 1 });
    });
  });
});
