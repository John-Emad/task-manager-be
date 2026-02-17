import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Task } from './entities/task.entity';
import { TaskStatisticsDto } from './dto/task-statistics.dto';

@ApiTags('tasks')
@Controller('task')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    description: 'Task successfully created',
    type: Task,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - task with same title and due date already exists',
  })
  create(@CurrentUser() user: any, @Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(user.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of tasks',
    type: [Task],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  findAll(@CurrentUser() user: any, @Query() filters: FilterTaskDto) {
    // Convert string 'true'/'false' to boolean
    let isDoneBoolean: boolean | undefined = undefined;
    if (filters.isDone !== undefined) {
      isDoneBoolean = filters.isDone === 'true';
    }

    const filterOptions = {
      isDone: isDoneBoolean,
      dueDateFrom: filters.dueDateFrom
        ? new Date(filters.dueDateFrom)
        : undefined,
      dueDateTo: filters.dueDateTo ? new Date(filters.dueDateTo) : undefined,
      search: filters.search,
    };

    return this.taskService.findAllByUser(user.id, filterOptions);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get task statistics for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns task statistics',
    type: TaskStatisticsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  getStatistics(@CurrentUser() user: any) {
    return this.taskService.getStatistics(user.id);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming tasks (due within next 7 days by default)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of upcoming tasks',
    type: [Task],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  getUpcoming(@CurrentUser() user: any, @Query('days') days?: number) {
    return this.taskService.getUpcomingTasks(user.id, days);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of overdue tasks',
    type: [Task],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  getOverdue(@CurrentUser() user: any) {
    return this.taskService.getOverdueTasks(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID', example: 'clxyz123abc' })
  @ApiResponse({
    status: 200,
    description: 'Returns the task with the specified ID',
    type: Task,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access to this task',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.taskService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID', example: 'clxyz123abc' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({
    status: 200,
    description: 'Task successfully updated',
    type: Task,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access to this task',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - task with same title and due date already exists',
  })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, user.id, updateTaskDto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle task completion status' })
  @ApiParam({ name: 'id', description: 'Task ID', example: 'clxyz123abc' })
  @ApiResponse({
    status: 200,
    description: 'Task completion status toggled successfully',
    type: Task,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access to this task',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  toggleComplete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.taskService.toggleComplete(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID', example: 'clxyz123abc' })
  @ApiResponse({
    status: 200,
    description: 'Task successfully deleted',
    type: Task,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access to this task',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.taskService.remove(id, user.id);
  }
}
