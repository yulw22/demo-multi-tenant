import { Controller, NotFoundException, Param, Post, Body } from '@nestjs/common';
import { LeadsService } from '../leads/leads.service';
import { LeadStatus } from '../leads/lead.entity';
import { TenantsService } from '../tenants/tenants.service';

const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50);

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post('convert-lead/:leadId')
  async convertLead(
    @Param('leadId') leadId: string,
    @Body('subdomain') subdomain?: string,
  ) {
    const lead = await this.leadsService.findOne(leadId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const desiredSubdomain =
      subdomain?.trim() ||
      slugify(lead.schoolName || lead.contactName || lead.email);
    const dbSchema = `schema_${desiredSubdomain}`;

    const tenant = await this.tenantsService.createDraft({
      schoolName: lead.schoolName,
      subdomain: desiredSubdomain,
      adminEmail: lead.email,
      dbSchema,
      logoUrl: null,
      schoolConfig: null,
    });

    await this.leadsService.updateStatus(lead.id, LeadStatus.CONVERTED);
    return tenant;
  }
}
