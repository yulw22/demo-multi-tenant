import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TenantStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  DEPLOYING = 'DEPLOYING',
  PROVISIONING = 'PROVISIONING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
}

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  schoolName: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  subdomain: string;

  @Column({ type: 'varchar', length: 255 })
  adminEmail: string;

  @Column({ type: 'varchar', length: 255 })
  dbSchema: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  schoolConfig: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  containerId: string | null;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PROVISIONING,
  })
  deploymentStatus: TenantStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
