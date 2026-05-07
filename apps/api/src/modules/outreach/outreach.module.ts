import { Module } from '@nestjs/common';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';
import { DatabaseProvider } from '../../config/database.provider';

@Module({
  controllers: [OutreachController],
  providers: [OutreachService, DatabaseProvider],
  exports: [OutreachService],
})
export class OutreachModule {}
