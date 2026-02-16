import { ApiProperty } from '@nestjs/swagger';

export class TaskStatisticsDto {
  @ApiProperty({
    description: 'Total number of tasks',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Number of completed tasks',
    example: 15,
  })
  completed: number;

  @ApiProperty({
    description: 'Number of pending tasks',
    example: 10,
  })
  pending: number;

  @ApiProperty({
    description: 'Number of overdue tasks',
    example: 3,
  })
  overdue: number;

  @ApiProperty({
    description: 'Task completion rate as a percentage',
    example: 60.0,
  })
  completionRate: number;
}

