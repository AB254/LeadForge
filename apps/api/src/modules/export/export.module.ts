import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { DatabaseProvider } from '../../config/database.provider';

@Module({
  controllers: [ExportController],
  providers: [ExportService, DatabaseProvider],
  exports: [ExportService],
})
export class ExportModule {}
