import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AuditStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

@Entity('audits')
export class Audit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chainId: number;

  @Column({ name: 'dao_id' })
  daoId: number;

  @Column()
  contractAddress: string;

  @Column({ name: 'requester_wallet' })
  requesterWallet: string;

  @Column({ type: 'bigint' })
  amount: string;

  @Column({ name: 'ipfs_hash' })
  ipfsHash: string;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.PENDING,
  })
  status: AuditStatus;

  @Column({ name: 'assigned_reviewer_id', nullable: true })
  assignedReviewerId: number;

  @Column({ name: 'review_deadline', nullable: true })
  reviewDeadline: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}
