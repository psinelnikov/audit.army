import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reviewers')
export class Reviewer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ name: 'dao_id' })
  daoId: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 0 })
  reputationScore: number;

  @Column({ name: 'total_audits_completed', default: 0 })
  totalAuditsCompleted: number;

  @Column({ type: 'bigint', default: 0 })
  totalEarnings: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
