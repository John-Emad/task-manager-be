import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTaskDto {
  @ApiPropertyOptional({
    description: 'Filter by completion status',
    example: 'false',
    type: String,
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsString()
  isDone?: string;

  @ApiPropertyOptional({
    description: 'Filter tasks with due date from this date',
    example: '2026-02-16',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter tasks with due date until this date',
    example: '2026-02-28',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({
    description: 'Search in task title and description',
    example: 'project',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
