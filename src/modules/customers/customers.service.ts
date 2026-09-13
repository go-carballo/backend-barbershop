import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customer.query.dto';
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (dto.name !== undefined) customer.name = dto.name;
    if (dto.email !== undefined) {
      customer.email = dto.email ? dto.email.trim().toLowerCase() : null;
    }
    if (dto.phone !== undefined) customer.phone = dto.phone ?? null;
    if (dto.isActive !== undefined) customer.isActive = dto.isActive;
    return this.customersRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.customersRepository.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException('Customer not found.');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new ConflictException(
        'Customer cannot be deleted because it is being used by an appointment.',
      );
    }
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create({
      name: dto.name,
      email: dto.email ? dto.email.trim().toLowerCase() : null,
      phone: dto.phone ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.customersRepository.save(customer);
  }

  async findAll(query: ListCustomersQueryDto): Promise<{
    data: Customer[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const { page = 1, perPage = 10, search, isActive } = query;

    const skip = (page - 1) * perPage;

    const queryBuilder =
      this.customersRepository.createQueryBuilder('customer');

    if (search) {
      queryBuilder.andWhere(
        `(
        customer.name ILIKE :search
        OR customer.email ILIKE :search
        OR customer.phone ILIKE :search
      )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (isActive) {
      queryBuilder.andWhere('customer.isActive = :isActive', {
        isActive: isActive === 'true',
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('customer.createdAt', 'DESC')
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
}
