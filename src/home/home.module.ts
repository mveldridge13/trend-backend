import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';
import { IncomeSourcesModule } from '../income-sources/income-sources.module';

@Module({
  imports: [DatabaseModule, CommonModule, IncomeSourcesModule],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
