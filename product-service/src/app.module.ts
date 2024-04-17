import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./products/products.entity";
import { ProductsModule } from "./products/products.module";
import { Review } from "./reviews/reviews.entity";
import { ReviewsModule } from "./reviews/reviews.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'postgres',
      entities: [Product, Review],
      synchronize: true,
      autoLoadEntities: true,
    }),
    ProductsModule,
    ReviewsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
