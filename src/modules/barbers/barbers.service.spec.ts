import "reflect-metadata";
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BarbersService } from './barbers.service';
import { Barber } from './entities/barber.entity';

describe('BarbersService', () => {
  let service: BarbersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BarbersService,
        { provide: getRepositoryToken(Barber), useValue: {} },
      ],
    }).compile();

    service = module.get<BarbersService>(BarbersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
