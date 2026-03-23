import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsModule } from './contracts/contracts.module';
import { CommonModule } from './common/common.module';
import { DAOModule } from './modules/dao/dao.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Temporarily disable database to test DAO search
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: () => databaseConfig,
    //   inject: [ConfigService],
    // }),
    ContractsModule,
    CommonModule,
    // DAOModule, // Temporarily disabled until database is set up
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
