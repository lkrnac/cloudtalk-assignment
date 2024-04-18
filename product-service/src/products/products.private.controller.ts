import { Body, Controller, Param, Put } from '@nestjs/common';
import { Product } from "./products.entity";
import { ProductsService } from "./products.service";

interface RatingDto {
    averageRating: number;
}

@Controller('private/products')
export class PrivateProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Put(':id')
    async updateAverageRating(@Param() id: number, @Body() ratingDto: RatingDto): Promise<Product> {
        const product = await this.productsService.readProduct(id);
        return this.productsService.updateProduct({ ...product, averageRating: ratingDto.averageRating });
    }
}