import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
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
    // Convert to Date object
    const dueDate = createTaskDto.dueDate
      ? new Date(`${createTaskDto.dueDate}T00:00:00.000Z`)
      : null;

    try {
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002: Unique constraint violation
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A task with this title and due date already exists',
          );
        }
      }
      throw error;
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

    return this.prisma.task.findMany({
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
  }

  /**
   * Find a single task by ID
   */
  async findOne(id: string, userId?: string) {
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
  }

  /**
   * Update a task
   */
  async update(id: string, userId: string, updateTaskDto: UpdateTaskDto) {
    // First verify the task exists and belongs to the user
    const task = await this.findOne(id, userId);

    // If dueDate is provided, convert to Date object
    let dueDate = task.dueDate;
    if (updateTaskDto.dueDate) {
      dueDate = updateTaskDto.dueDate
        ? new Date(`${updateTaskDto.dueDate}T00:00:00.000Z`)
        : null;
    }

    try {
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A task with this title and due date already exists',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleComplete(id: string, userId: string) {
    const task = await this.findOne(id, userId);

    return this.prisma.task.update({
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
  }

  /**
   * Delete a task
   */
  async remove(id: string, userId: string) {
    // First verify the task exists and belongs to the user
    await this.findOne(id, userId);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  /**
   * Get task statistics for a user
   */
  async getStatistics(userId: string) {
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
  }

  /**
   * Get upcoming tasks (due within next 7 days)
   */
  async getUpcomingTasks(userId: string, days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.prisma.task.findMany({
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
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string) {
    return this.prisma.task.findMany({
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
  }
}
