export class CreateTenantDto {
  schoolName: string;
  subdomain: string;
  adminEmail: string;
  dbSchema: string;
  containerId?: string | null;
  logoUrl?: string | null;
  schoolConfig?: Record<string, unknown> | null;
}
