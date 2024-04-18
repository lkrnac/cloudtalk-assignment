import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Review } from "../reviews/reviews.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    price: number;

    @Column('decimal', { precision: 6, scale: 2 })
    averageRating: number;

    @OneToMany(() => Review, review => review.product)
    reviews: Review[];
}