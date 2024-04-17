import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
    ) {}

    readProducts(): Promise<Product[]> {
        return this.productsRepository.find();
    }

    readProduct(id: number): Promise<Product | null> {
        return this.productsRepository.findOneBy({ id });
    }

    async deleteProduct(id: number): Promise<void> {
        await this.productsRepository.delete(id);
    }

    createProduct(product: Product): Promise<Product> {
        return this.productsRepository.save(product);
    }

    updateProduct(product: Product) {
        return this.productsRepository.save(product);
    }
}
