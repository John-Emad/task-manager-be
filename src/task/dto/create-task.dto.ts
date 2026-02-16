import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Title of the task',
    example: 'Complete project documentation',
    minLength: 3,
    maxLength: 40,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Task title must be at least 3 characters' })
  @MaxLength(40, { message: 'Cannot exceed 40 character task title' })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the task',
    example: 'Write comprehensive documentation for all API endpoints',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Cannot exceed 300 character task description' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Completion status of the task',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDone?: boolean;

  @ApiPropertyOptional({
    description: 'Due date for the task (ISO 8601 date format)',
    example: '2026-02-20',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate must be YYYY-MM-DD' })
  dueDate?: string;
}
