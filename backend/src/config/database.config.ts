import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/auth/entities/user.entity';
import { DAO } from '../modules/dao/entities/dao.entity';
import { Reviewer } from '../modules/reviewer/entities/reviewer.entity';
import { Audit } from '../modules/audit/entities/audit.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'auditarmy',
  password: process.env.DATABASE_PASSWORD || 'auditarmy123',
  database: process.env.DATABASE_NAME || 'auditarmy',
  entities: [User, DAO, Reviewer, Audit],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
