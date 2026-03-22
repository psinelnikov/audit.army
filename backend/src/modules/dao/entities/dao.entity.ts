import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('daos')
export class DAO {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chainId: number;

  @Column()
  contractAddress: string;

  @Column()
  name: string;

  @Column({ length: 32 })
  symbol: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'creator_wallet' })
  creatorWallet: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
