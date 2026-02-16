import { IsOptional, IsBoolean, IsDateString, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTaskDto {
  @ApiPropertyOptional({
    description: 'Filter by completion status',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isDone?: boolean;

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

