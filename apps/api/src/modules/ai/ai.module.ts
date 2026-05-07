import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DatabaseProvider } from '../../config/database.provider';

@Module({
  controllers: [AiController],
  providers: [AiService, DatabaseProvider],
  exports: [AiService],
})
export class AiModule {}
