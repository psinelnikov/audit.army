import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DAO } from './entities/dao.entity';
import { DAOService } from './dao.service';
import { DAOController } from './dao.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DAO])],
  controllers: [DAOController],
  providers: [DAOService],
  exports: [DAOService],
})
export class DAOModule {}
