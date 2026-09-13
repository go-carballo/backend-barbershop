import { Module } from '@nestjs/common';
import { BarbersController } from './barbers.controller';
import { BarbersService } from './barbers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barber } from './entities/barber.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Barber])],
  controllers: [BarbersController],
  providers: [BarbersService]
})
export class BarbersModule {}
