import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServicesQueryDto } from './dto/list-services.query.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    if (dto.name !== undefined) service.name = dto.name;
    if (dto.description !== undefined)
      service.description = dto.description ?? null;
    if (dto.durationMinutes !== undefined)
      service.durationMinutes = dto.durationMinutes;
    if (dto.price !== undefined) service.price = dto.price;
    if (dto.isActive !== undefined) service.isActive = dto.isActive;
    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<void> {
  try {
    const result = await this.servicesRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Service not found.');
    }
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    throw new ConflictException(
      'Service cannot be deleted because it is being used by an appointment.',
    );
  }
}

  async findAll(query: ListServicesQueryDto): Promise<{
    data: Service[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const { page = 1, perPage = 10, search, isActive } = query;
    const skip = (page - 1) * perPage;

    const queryBuilder = this.servicesRepository.createQueryBuilder('service');

    if (search) {
      queryBuilder.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isActive) {
      queryBuilder.andWhere('service.isActive = :isActive', {
        isActive: isActive === 'true',
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('service.createdAt', 'DESC')
      .skip(skip)
      .take(perPage)
      .getManyAndCount();

    return { data, total, page, perPage };
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    const service = this.servicesRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      durationMinutes: dto.durationMinutes,
      price: dto.price,
      isActive: dto.isActive ?? true,
    });
    return this.servicesRepository.save(service);
  }
}
