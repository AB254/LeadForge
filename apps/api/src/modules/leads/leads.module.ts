import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { DatabaseProvider } from '../../config/database.provider';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, DatabaseProvider],
  exports: [LeadsService],
})
export class LeadsModule {}
