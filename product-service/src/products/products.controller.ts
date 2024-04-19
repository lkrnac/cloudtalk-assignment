import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from "./products.entity";

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Get()
    async readProducts(): Promise<Product[]> {
        return this.productsService.readProducts();
    }

    @Get(':id')
    async readProduct(@Param('id') id: number): Promise<Product> {
        return this.productsService.readProduct(id)
    }

    @Post()
    async createProduct(@Body() product: Product): Promise<Product> {
        delete product.id; // POST should create new product
        return this.productsService.createProduct(product);
    }

    @Delete(':id')
    async deleteProduct(@Param('id') id: number) {
        await this.productsService.deleteProduct(id);
    }

    @Put(':id')
    async updateProduct(@Param('id') id: number, @Body() product: Product): Promise<Product> {
        return this.productsService.updateProduct({ ...product, id });
    }
}