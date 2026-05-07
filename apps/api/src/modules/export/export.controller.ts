import { Controller, Post, Body, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ExportFilterDto } from './dto/export.dto';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('csv')
  async exportCsv(@Body() filters: ExportFilterDto, @Res() res: Response) {
    const csv = await this.exportService.exportCsv(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=leads-export-${Date.now()}.csv`,
    );
    res.send(csv);
  }

  @Post('xlsx')
  async exportXlsx(@Body() filters: ExportFilterDto, @Res() res: Response) {
    const buffer = await this.exportService.exportXlsx(filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=leads-export-${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Post('json')
  async exportJson(@Body() filters: ExportFilterDto) {
    return this.exportService.exportJson(filters);
  }
}
