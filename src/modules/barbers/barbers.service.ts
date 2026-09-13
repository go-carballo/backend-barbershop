import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Barber } from './entities/barber.entity';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { ListBarbersQueryDto } from './dto/list-barbers.query.dto';

@Injectable()
export class BarbersService {
  constructor(
    @InjectRepository(Barber)
    private readonly barbersRepository: Repository<Barber>,
  ) {}

  async findAll(query: ListBarbersQueryDto): Promise<{
    data: Barber[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const { page = 1, perPage = 10, search, isActive } = query;

    const skip = (page - 1) * perPage;

    const queryBuilder = this.barbersRepository.createQueryBuilder('barber');

    if (search) {
      queryBuilder.andWhere(
        `(
        barber.name ILIKE :search
        OR barber.email ILIKE :search
        OR barber.phone ILIKE :search
        OR barber.specialty ILIKE :search
      )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (isActive) {
      queryBuilder.andWhere('barber.isActive = :isActive', {
        isActive: isActive === 'true',
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('barber.createdAt', 'DESC')
      .skip(skip)
      .take(perPage)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      perPage,
    };
  }

  async create(dto: CreateBarberDto): Promise<Barber> {
    const barber = this.barbersRepository.create({
      name: dto.name,
      email: dto.email ? dto.email.trim().toLowerCase() : null,
      phone: dto.phone ?? null,
      specialty: dto.specialty ?? null,
      isActive: dto.isActive ?? true,
    });

    return this.barbersRepository.save(barber);
  }

  async findOne(id: string): Promise<Barber> {
    const barber = await this.barbersRepository.findOne({
      where: { id },
    });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    return barber;
  }

  async update(id: string, dto: UpdateBarberDto): Promise<Barber> {
    const barber = await this.findOne(id);

    if (dto.name !== undefined) barber.name = dto.name;
    if (dto.email !== undefined) {
      barber.email = dto.email ? dto.email.trim().toLowerCase() : null;
    }
    if (dto.phone !== undefined) barber.phone = dto.phone ?? null;
    if (dto.specialty !== undefined) barber.specialty = dto.specialty ?? null;
    if (dto.isActive !== undefined) barber.isActive = dto.isActive;

    return this.barbersRepository.save(barber);
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.barbersRepository.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException('Barber not found.');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new ConflictException(
        'Barber cannot be deleted because it is being used by an appointment.',
      );
    }
  }
}
