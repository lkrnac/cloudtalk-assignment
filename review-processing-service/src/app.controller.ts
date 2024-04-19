import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from "@nestjs/microservices";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";

export interface CalculationMessage {
  productId: number;
  averageRating: number;
  originalCount: number;
  countChange: number;
  ratingChange: number;
}

@Controller()
export class AppController {
  constructor(private readonly httpService: HttpService) {}

  @MessagePattern('review-calculation')
  async testSub(calculationMessage: CalculationMessage) {
    const dividend = calculationMessage.averageRating * calculationMessage.originalCount + calculationMessage.ratingChange;
    const divisor = calculationMessage.originalCount +  calculationMessage.countChange;
    await firstValueFrom(
        this.httpService.put(
            `http://product-service:3000/private/products/${calculationMessage.productId}`,
            { averageRating: dividend / divisor }
        ).pipe()
    );
    return;
  }
}
