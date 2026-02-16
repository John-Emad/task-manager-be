import { ApiProperty } from '@nestjs/swagger';

export class Task {
  @ApiProperty({
    description: 'Unique identifier for the task',
    example: 'clxyz123abc',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the task',
    example: 'Complete project documentation',
    minLength: 3,
    maxLength: 40,
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the task',
    example: 'Write comprehensive documentation for the API endpoints',
    required: false,
    maxLength: 300,
  })
  description?: string;

  @ApiProperty({
    description: 'Completion status of the task',
    example: false,
    default: false,
  })
  isDone: boolean;

  @ApiProperty({
    description: 'Due date for the task',
    example: '2026-02-20',
    required: false,
    type: 'string',
    format: 'date',
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'ID of the user who owns this task',
    example: 'clxyz456def',
  })
  userId: string;

  @ApiProperty({
    description: 'Timestamp when the task was created',
    example: '2026-02-16T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the task was last updated',
    example: '2026-02-16T15:45:00.000Z',
  })
  updatedAt: Date;
}
