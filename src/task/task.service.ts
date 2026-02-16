import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new task for a user
   */
  async create(userId: string, createTaskDto: CreateTaskDto) {
    try {
      // Convert to Date object
      const dueDate = createTaskDto.dueDate
        ? new Date(`${createTaskDto.dueDate}T00:00:00.000Z`)
        : null;

      const task = await this.prisma.task.create({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          isDone: createTaskDto.isDone ?? false,
          dueDate: dueDate,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
            },
          },
        },
      });
      return task;
    } catch (error) {
      this.handlePrismaError(error, 'create task');
    }
  }

  /**
   * Find all tasks for a specific user with optional filtering
   */
  async findAllByUser(
    userId: string,
    filters?: {
      isDone?: boolean;
      dueDateFrom?: Date;
      dueDateTo?: Date;
      search?: string;
    },
  ) {
    try {
      const where: Prisma.TaskWhereInput = {
        userId,
      };

      if (filters?.isDone !== undefined) {
        where.isDone = filters.isDone;
      }

      if (filters?.dueDateFrom || filters?.dueDateTo) {
        where.dueDate = {};
        if (filters.dueDateFrom) {
          where.dueDate.gte = filters.dueDateFrom;
        }
        if (filters.dueDateTo) {
          where.dueDate.lte = filters.dueDateTo;
        }
      }

      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search } },
          { description: { contains: filters.search } },
        ];
      }

      return await this.prisma.task.findMany({
        where,
        orderBy: [{ isDone: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'fetch tasks');
    }
  }

  /**
   * Find a single task by ID
   */
  async findOne(id: string, userId?: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      // If userId is provided, verify ownership
      if (userId && task.userId !== userId) {
        throw new ForbiddenException('You do not have access to this task');
      }

      return task;
    } catch (error) {
      // Re-throw NestJS exceptions as-is
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.handlePrismaError(error, 'fetch task');
    }
  }

  /**
   * Update a task
   */
  async update(id: string, userId: string, updateTaskDto: UpdateTaskDto) {
    try {
      // First verify the task exists and belongs to the user
      const task = await this.findOne(id, userId);

      // If dueDate is provided, convert to Date object
      let dueDate = task.dueDate;
      if (updateTaskDto.dueDate !== undefined) {
        dueDate = updateTaskDto.dueDate
          ? new Date(`${updateTaskDto.dueDate}T00:00:00.000Z`)
          : null;
      }

      const updatedTask = await this.prisma.task.update({
        where: { id },
        data: {
          title: updateTaskDto.title,
          description: updateTaskDto.description,
          isDone: updateTaskDto.isDone,
          dueDate: dueDate,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
            },
          },
        },
      });
      return updatedTask;
    } catch (error) {
      // Re-throw NestJS exceptions from findOne
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.handlePrismaError(error, 'update task');
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleComplete(id: string, userId: string) {
    try {
      const task = await this.findOne(id, userId);

      return await this.prisma.task.update({
        where: { id },
        data: { isDone: !task.isDone },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      // Re-throw NestJS exceptions from findOne
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.handlePrismaError(error, 'toggle task completion');
    }
  }

  /**
   * Delete a task
   */
  async remove(id: string, userId: string) {
    try {
      // First verify the task exists and belongs to the user
      await this.findOne(id, userId);

      return await this.prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      // Re-throw NestJS exceptions from findOne
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.handlePrismaError(error, 'delete task');
    }
  }

  /**
   * Get task statistics for a user
   */
  async getStatistics(userId: string) {
    try {
      const [total, completed, pending, overdue] = await Promise.all([
        this.prisma.task.count({ where: { userId } }),
        this.prisma.task.count({ where: { userId, isDone: true } }),
        this.prisma.task.count({ where: { userId, isDone: false } }),
        this.prisma.task.count({
          where: {
            userId,
            isDone: false,
            dueDate: { lt: new Date() },
          },
        }),
      ]);

      return {
        total,
        completed,
        pending,
        overdue,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    } catch (error) {
      this.handlePrismaError(error, 'fetch task statistics');
    }
  }

  /**
   * Get upcoming tasks (due within next 7 days)
   */
  async getUpcomingTasks(userId: string, days: number = 7) {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      return await this.prisma.task.findMany({
        where: {
          userId,
          isDone: false,
          dueDate: {
            gte: today,
            lte: futureDate,
          },
        },
        orderBy: { dueDate: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'fetch upcoming tasks');
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string) {
    try {
      return await this.prisma.task.findMany({
        where: {
          userId,
          isDone: false,
          dueDate: { lt: new Date() },
        },
        orderBy: { dueDate: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'fetch overdue tasks');
    }
  }

  /**
   * Centralized Prisma error handler for task operations
   */
  private handlePrismaError(error: any, operation: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          // Unique constraint violation
          // The unique constraint is on [userId, title, dueDate]
          throw new ConflictException(
            'A task with this title and due date already exists for this user',
          );
        }

        case 'P2025':
          // Record not found
          throw new NotFoundException('Task not found');

        case 'P2003': {
          // Foreign key constraint violation
          const target = error.meta?.field_name as string | undefined;
          if (target?.includes('userId')) {
            throw new BadRequestException('Invalid user reference');
          }
          throw new BadRequestException(
            'Cannot perform operation due to related records',
          );
        }

        case 'P2014':
          // Relation violation
          throw new BadRequestException(
            'The change you are trying to make would violate a required relation',
          );

        default:
          throw new BadRequestException(
            `Failed to ${operation}: ${error.message}`,
          );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException('Invalid data provided');
    }

    // Re-throw if it's already a NestJS exception
    if (
      error instanceof ConflictException ||
      error instanceof NotFoundException ||
      error instanceof ForbiddenException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    // Unknown error
    throw new BadRequestException(`Failed to ${operation}`);
  }
}
