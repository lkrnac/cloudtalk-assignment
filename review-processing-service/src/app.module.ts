import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ClientsModule, Transport } from "@nestjs/microservices";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    ClientsModule.register([{
      name: 'MATH_SERVICE',
      transport: Transport.REDIS,
      options: { host: 'cache' },
    }]),
    HttpModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
