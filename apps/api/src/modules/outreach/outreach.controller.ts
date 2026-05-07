import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { OutreachService } from './outreach.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  GenerateOutreachDto,
  CreateMessageDto,
  ListMessagesDto,
} from './dto/outreach.dto';

@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  // ─── Templates ───────────────────────────────────────────────────────

  @Get('templates')
  listTemplates() {
    return this.outreachService.listTemplates();
  }

  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.outreachService.createTemplate(dto);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.outreachService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.outreachService.deleteTemplate(id);
  }

  // ─── Generation ──────────────────────────────────────────────────────

  @Post('generate')
  generateOutreach(@Body() dto: GenerateOutreachDto) {
    return this.outreachService.generateOutreach(dto);
  }

  // ─── Messages ────────────────────────────────────────────────────────

  @Get('messages')
  listMessages(@Query() query: ListMessagesDto) {
    return this.outreachService.listMessages(query);
  }

  @Post('messages')
  createMessage(@Body() dto: CreateMessageDto) {
    return this.outreachService.createMessage(dto);
  }
}
