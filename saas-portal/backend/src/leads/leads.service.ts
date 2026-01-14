import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus } from './lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepo: Repository<Lead>,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadsRepo.create({
      ...createLeadDto,
      status: LeadStatus.NEW,
    });
    return this.leadsRepo.save(lead);
  }

  findAll(): Promise<Lead[]> {
    return this.leadsRepo.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<Lead | null> {
    return this.leadsRepo.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: LeadStatus): Promise<void> {
    await this.leadsRepo.update({ id }, { status });
  }
}
