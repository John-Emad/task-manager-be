import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('TaskService', () => {
  let service: TaskService;
  let prisma: PrismaService;

  // Mock data
  const mockUserId = 'user-123';
  const mockTaskId = 'task-123';

  const mockUser = {
    id: mockUserId,
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockTask = {
    id: mockTaskId,
    title: 'Test Task',
    description: 'Test Description',
    isDone: false,
    dueDate: new Date('2026-02-20T00:00:00.000Z'),
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaskWithUser = {
    ...mockTask,
    user: mockUser,
  };

  // Mock PrismaService
  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task successfully', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        isDone: false,
        dueDate: '2026-02-20',
      };

      mockPrismaService.task.create.mockResolvedValue(mockTaskWithUser);

      const result = await service.create(mockUserId, createTaskDto);

      expect(result).toEqual(mockTaskWithUser);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          isDone: false,
          dueDate: new Date('2026-02-20T00:00:00.000Z'),
          userId: mockUserId,
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
    });

    it('should create a task without optional fields', async () => {
      const createTaskDto = {
        title: 'Minimal Task',
      };

      const minimalTask = {
        ...mockTaskWithUser,
        description: null,
        dueDate: null,
        isDone: false,
      };

      mockPrismaService.task.create.mockResolvedValue(minimalTask);

      const result = await service.create(mockUserId, createTaskDto);

      expect(result).toEqual(minimalTask);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: undefined,
          isDone: false,
          dueDate: null,
          userId: mockUserId,
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
    });

    it('should handle isDone default value', async () => {
      const createTaskDto = {
        title: 'Task without isDone',
      };

      mockPrismaService.task.create.mockResolvedValue(mockTaskWithUser);

      await service.create(mockUserId, createTaskDto);

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDone: false,
          }),
        }),
      );
    });

    it('should throw ConflictException on duplicate task (P2002 error)', async () => {
      const createTaskDto = {
        title: 'Duplicate Task',
        dueDate: '2026-02-20',
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.task.create.mockRejectedValue(prismaError);

      await expect(service.create(mockUserId, createTaskDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(mockUserId, createTaskDto)).rejects.toThrow(
        'A task with this title and due date already exists',
      );
    });

    it('should rethrow other Prisma errors', async () => {
      const createTaskDto = {
        title: 'Test Task',
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Some other error',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.task.create.mockRejectedValue(prismaError);

      await expect(service.create(mockUserId, createTaskDto)).rejects.toThrow(
        prismaError,
      );
    });

    it('should rethrow non-Prisma errors', async () => {
      const createTaskDto = {
        title: 'Test Task',
      };

      const genericError = new Error('Database connection failed');
      mockPrismaService.task.create.mockRejectedValue(genericError);

      await expect(service.create(mockUserId, createTaskDto)).rejects.toThrow(
        genericError,
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all tasks for a user without filters', async () => {
      const tasks = [mockTaskWithUser];

      mockPrismaService.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual(tasks);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
    });

    it('should filter tasks by isDone status', async () => {
      const completedTasks = [{ ...mockTaskWithUser, isDone: true }];

      mockPrismaService.task.findMany.mockResolvedValue(completedTasks);

      const result = await service.findAllByUser(mockUserId, { isDone: true });

      expect(result).toEqual(completedTasks);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
            isDone: true,
          },
        }),
      );
    });

    it('should filter tasks by date range', async () => {
      const dueDateFrom = new Date('2026-02-01');
      const dueDateTo = new Date('2026-02-28');

      mockPrismaService.task.findMany.mockResolvedValue([mockTaskWithUser]);

      await service.findAllByUser(mockUserId, { dueDateFrom, dueDateTo });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
            dueDate: {
              gte: dueDateFrom,
              lte: dueDateTo,
            },
          },
        }),
      );
    });

    it('should filter tasks by search term', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([mockTaskWithUser]);

      await service.findAllByUser(mockUserId, { search: 'test' });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
            OR: [
              { title: { contains: 'test' } },
              { description: { contains: 'test' } },
            ],
          },
        }),
      );
    });

    it('should apply multiple filters together', async () => {
      const dueDateFrom = new Date('2026-02-01');

      mockPrismaService.task.findMany.mockResolvedValue([mockTaskWithUser]);

      await service.findAllByUser(mockUserId, {
        isDone: false,
        dueDateFrom,
        search: 'project',
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
            isDone: false,
            dueDate: {
              gte: dueDateFrom,
            },
            OR: [
              { title: { contains: 'project' } },
              { description: { contains: 'project' } },
            ],
          },
        }),
      );
    });

    it('should return empty array when no tasks found', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);

      const result = await service.findOne(mockTaskId);

      expect(result).toEqual(mockTaskWithUser);
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: mockTaskId },
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
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockTaskId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockTaskId)).rejects.toThrow(
        `Task with ID ${mockTaskId} not found`,
      );
    });

    it('should verify task ownership when userId is provided', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);

      const result = await service.findOne(mockTaskId, mockUserId);

      expect(result).toEqual(mockTaskWithUser);
    });

    it('should throw ForbiddenException when user does not own the task', async () => {
      const differentUserId = 'user-456';
      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);

      await expect(
        service.findOne(mockTaskId, differentUserId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne(mockTaskId, differentUserId),
      ).rejects.toThrow('You do not have access to this task');
    });

    it('should not verify ownership when userId is not provided', async () => {
      const taskWithDifferentUser = {
        ...mockTaskWithUser,
        userId: 'different-user',
      };
      mockPrismaService.task.findUnique.mockResolvedValue(
        taskWithDifferentUser,
      );

      const result = await service.findOne(mockTaskId);

      expect(result).toEqual(taskWithDifferentUser);
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const updateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
      };

      const updatedTask = { ...mockTaskWithUser, ...updateTaskDto };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(
        mockTaskId,
        mockUserId,
        updateTaskDto,
      );

      expect(result).toEqual(updatedTask);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: {
          title: updateTaskDto.title,
          description: updateTaskDto.description,
          isDone: undefined,
          dueDate: mockTask.dueDate,
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
    });

    it('should update task with new due date', async () => {
      const updateTaskDto = {
        dueDate: '2026-03-01',
      };

      const updatedTask = {
        ...mockTaskWithUser,
        dueDate: new Date('2026-03-01T00:00:00.000Z'),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(
        mockTaskId,
        mockUserId,
        updateTaskDto,
      );

      expect(result).toEqual(updatedTask);
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dueDate: new Date('2026-03-01T00:00:00.000Z'),
          }),
        }),
      );
    });

    it('should throw NotFoundException when task does not exist', async () => {
      const updateTaskDto = { title: 'Updated' };

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockTaskId, mockUserId, updateTaskDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the task', async () => {
      const updateTaskDto = { title: 'Updated' };
      const differentUserId = 'user-456';

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);

      await expect(
        service.update(mockTaskId, differentUserId, updateTaskDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException on duplicate task (P2002 error)', async () => {
      const updateTaskDto = {
        title: 'Duplicate Task',
        dueDate: '2026-02-20',
      };

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);
      mockPrismaService.task.update.mockRejectedValue(prismaError);

      await expect(
        service.update(mockTaskId, mockUserId, updateTaskDto),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update(mockTaskId, mockUserId, updateTaskDto),
      ).rejects.toThrow('A task with this title and due date already exists');
    });

    it('should rethrow other errors', async () => {
      const updateTaskDto = { title: 'Updated' };
      const genericError = new Error('Database error');

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);
      mockPrismaService.task.update.mockRejectedValue(genericError);

      await expect(
        service.update(mockTaskId, mockUserId, updateTaskDto),
      ).rejects.toThrow(genericError);
    });
  });

  describe('toggleComplete', () => {
    it('should toggle task from incomplete to complete', async () => {
      const toggledTask = { ...mockTaskWithUser, isDone: true };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);
      mockPrismaService.task.update.mockResolvedValue(toggledTask);

      const result = await service.toggleComplete(mockTaskId, mockUserId);

      expect(result).toEqual(toggledTask);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: { isDone: true },
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
    });

    it('should toggle task from complete to incomplete', async () => {
      const completedTask = { ...mockTaskWithUser, isDone: true };
      const toggledTask = { ...mockTaskWithUser, isDone: false };

      mockPrismaService.task.findUnique.mockResolvedValue(completedTask);
      mockPrismaService.task.update.mockResolvedValue(toggledTask);

      const result = await service.toggleComplete(mockTaskId, mockUserId);

      expect(result).toEqual(toggledTask);
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isDone: false },
        }),
      );
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleComplete(mockTaskId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the task', async () => {
      const differentUserId = 'user-456';

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);

      await expect(
        service.toggleComplete(mockTaskId, differentUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      const deletedTask = { ...mockTask };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);
      mockPrismaService.task.delete.mockResolvedValue(deletedTask);

      const result = await service.remove(mockTaskId, mockUserId);

      expect(result).toEqual(deletedTask);
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: mockTaskId },
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockTaskId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own the task', async () => {
      const differentUserId = 'user-456';

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);

      await expect(service.remove(mockTaskId, differentUserId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('should verify ownership before deleting', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      await service.remove(mockTaskId, mockUserId);

      // Verify both methods were called
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: mockTaskId },
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
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: mockTaskId },
      });
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      mockPrismaService.task.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(6) // completed
        .mockResolvedValueOnce(4) // pending
        .mockResolvedValueOnce(2); // overdue

      const result = await service.getStatistics(mockUserId);

      expect(result).toEqual({
        total: 10,
        completed: 6,
        pending: 4,
        overdue: 2,
        completionRate: 60,
      });

      expect(prisma.task.count).toHaveBeenCalledTimes(4);
      expect(prisma.task.count).toHaveBeenNthCalledWith(1, {
        where: { userId: mockUserId },
      });
      expect(prisma.task.count).toHaveBeenNthCalledWith(2, {
        where: { userId: mockUserId, isDone: true },
      });
      expect(prisma.task.count).toHaveBeenNthCalledWith(3, {
        where: { userId: mockUserId, isDone: false },
      });
      expect(prisma.task.count).toHaveBeenNthCalledWith(4, {
        where: {
          userId: mockUserId,
          isDone: false,
          dueDate: { lt: expect.any(Date) },
        },
      });
    });

    it('should return zero statistics when user has no tasks', async () => {
      mockPrismaService.task.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // completed
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(0); // overdue

      const result = await service.getStatistics(mockUserId);

      expect(result).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0,
      });
    });

    it('should calculate completion rate correctly', async () => {
      mockPrismaService.task.count
        .mockResolvedValueOnce(8) // total
        .mockResolvedValueOnce(2) // completed
        .mockResolvedValueOnce(6) // pending
        .mockResolvedValueOnce(3); // overdue

      const result = await service.getStatistics(mockUserId);

      expect(result.completionRate).toBe(25); // 2/8 * 100
    });

    it('should handle 100% completion rate', async () => {
      mockPrismaService.task.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(5) // completed
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(0); // overdue

      const result = await service.getStatistics(mockUserId);

      expect(result.completionRate).toBe(100);
    });
  });

  describe('getUpcomingTasks', () => {
    it('should return upcoming tasks with default 7 days', async () => {
      const upcomingTasks = [mockTaskWithUser];

      mockPrismaService.task.findMany.mockResolvedValue(upcomingTasks);

      const result = await service.getUpcomingTasks(mockUserId);

      expect(result).toEqual(upcomingTasks);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          isDone: false,
          dueDate: {
            gte: expect.any(Date),
            lte: expect.any(Date),
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

      // Verify the date range is approximately 7 days
      const callArgs = (prisma.task.findMany as jest.Mock).mock.calls[0][0];
      const gte = callArgs.where.dueDate.gte;
      const lte = callArgs.where.dueDate.lte;
      const daysDiff = Math.round((lte - gte) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it('should return upcoming tasks with custom days', async () => {
      const upcomingTasks = [mockTaskWithUser];

      mockPrismaService.task.findMany.mockResolvedValue(upcomingTasks);

      const result = await service.getUpcomingTasks(mockUserId, 14);

      expect(result).toEqual(upcomingTasks);

      // Verify the date range is approximately 14 days
      const callArgs = (prisma.task.findMany as jest.Mock).mock.calls[0][0];
      const gte = callArgs.where.dueDate.gte;
      const lte = callArgs.where.dueDate.lte;
      const daysDiff = Math.round((lte - gte) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(14);
    });

    it('should only return incomplete tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getUpcomingTasks(mockUserId);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDone: false,
          }),
        }),
      );
    });

    it('should return empty array when no upcoming tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getUpcomingTasks(mockUserId);

      expect(result).toEqual([]);
    });

    it('should order tasks by due date ascending', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getUpcomingTasks(mockUserId);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dueDate: 'asc' },
        }),
      );
    });
  });

  describe('getOverdueTasks', () => {
    it('should return overdue tasks', async () => {
      const overdueTasks = [
        {
          ...mockTaskWithUser,
          dueDate: new Date('2026-01-01T00:00:00.000Z'),
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(overdueTasks);

      const result = await service.getOverdueTasks(mockUserId);

      expect(result).toEqual(overdueTasks);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          isDone: false,
          dueDate: { lt: expect.any(Date) },
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
    });

    it('should only return incomplete tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getOverdueTasks(mockUserId);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDone: false,
          }),
        }),
      );
    });

    it('should filter by past due date', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getOverdueTasks(mockUserId);

      const callArgs = (prisma.task.findMany as jest.Mock).mock.calls[0][0];
      const dueDateFilter = callArgs.where.dueDate.lt;

      expect(dueDateFilter).toBeInstanceOf(Date);
      expect(dueDateFilter.getTime()).toBeLessThanOrEqual(new Date().getTime());
    });

    it('should return empty array when no overdue tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getOverdueTasks(mockUserId);

      expect(result).toEqual([]);
    });

    it('should order tasks by due date ascending', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getOverdueTasks(mockUserId);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dueDate: 'asc' },
        }),
      );
    });
  });
});
