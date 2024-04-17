import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../products/products.entity";

@Entity()
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    reviewText: string;

    @Column()
    rating: number

    @ManyToOne(() => Product, product  => product.reviews)
    product: Product;
}