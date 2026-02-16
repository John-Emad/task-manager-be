import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  // Mock user object
  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  // Mock task object
  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    isDone: false,
    dueDate: new Date('2026-02-20T00:00:00.000Z'),
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-123',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
    },
  };

  // Mock TaskService
  const mockTaskService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    toggleComplete: jest.fn(),
    remove: jest.fn(),
    getStatistics: jest.fn(),
    getUpcomingTasks: jest.fn(),
    getOverdueTasks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        isDone: false,
        dueDate: '2026-02-20',
      };

      mockTaskService.create.mockResolvedValue(mockTask);

      const result = await controller.create(mockUser, createTaskDto);

      expect(result).toEqual(mockTask);
      expect(service.create).toHaveBeenCalledWith(mockUser.id, createTaskDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should create a task without optional fields', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Minimal Task',
      };

      const minimalTask = { ...mockTask, description: null, dueDate: null };
      mockTaskService.create.mockResolvedValue(minimalTask);

      const result = await controller.create(mockUser, createTaskDto);

      expect(result).toEqual(minimalTask);
      expect(service.create).toHaveBeenCalledWith(mockUser.id, createTaskDto);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a user without filters', async () => {
      const tasks = [mockTask];
      const filters: FilterTaskDto = {};

      mockTaskService.findAllByUser.mockResolvedValue(tasks);

      const result = await controller.findAll(mockUser, filters);

      expect(result).toEqual(tasks);
      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser.id, {
        isDone: undefined,
        dueDateFrom: undefined,
        dueDateTo: undefined,
        search: undefined,
      });
    });

    it('should return tasks filtered by isDone', async () => {
      const filters: FilterTaskDto = { isDone: true };
      const completedTasks = [{ ...mockTask, isDone: true }];

      mockTaskService.findAllByUser.mockResolvedValue(completedTasks);

      const result = await controller.findAll(mockUser, filters);

      expect(result).toEqual(completedTasks);
      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser.id, {
        isDone: true,
        dueDateFrom: undefined,
        dueDateTo: undefined,
        search: undefined,
      });
    });

    it('should return tasks filtered by date range', async () => {
      const filters: FilterTaskDto = {
        dueDateFrom: '2026-02-01',
        dueDateTo: '2026-02-28',
      };

      mockTaskService.findAllByUser.mockResolvedValue([mockTask]);

      const result = await controller.findAll(mockUser, filters);

      expect(result).toEqual([mockTask]);
      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser.id, {
        isDone: undefined,
        dueDateFrom: new Date('2026-02-01'),
        dueDateTo: new Date('2026-02-28'),
        search: undefined,
      });
    });

    it('should return tasks filtered by search term', async () => {
      const filters: FilterTaskDto = { search: 'test' };

      mockTaskService.findAllByUser.mockResolvedValue([mockTask]);

      const result = await controller.findAll(mockUser, filters);

      expect(result).toEqual([mockTask]);
      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser.id, {
        isDone: undefined,
        dueDateFrom: undefined,
        dueDateTo: undefined,
        search: 'test',
      });
    });

    it('should return tasks with multiple filters', async () => {
      const filters: FilterTaskDto = {
        isDone: false,
        dueDateFrom: '2026-02-01',
        search: 'project',
      };

      mockTaskService.findAllByUser.mockResolvedValue([mockTask]);

      const result = await controller.findAll(mockUser, filters);

      expect(result).toEqual([mockTask]);
      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser.id, {
        isDone: false,
        dueDateFrom: new Date('2026-02-01'),
        dueDateTo: undefined,
        search: 'project',
      });
    });
  });

  describe('getStatistics', () => {
    it('should return task statistics for the user', async () => {
      const mockStats = {
        total: 10,
        completed: 6,
        pending: 4,
        overdue: 2,
        completionRate: 60,
      };

      mockTaskService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics(mockUser);

      expect(result).toEqual(mockStats);
      expect(service.getStatistics).toHaveBeenCalledWith(mockUser.id);
      expect(service.getStatistics).toHaveBeenCalledTimes(1);
    });

    it('should return zero statistics for user with no tasks', async () => {
      const emptyStats = {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0,
      };

      mockTaskService.getStatistics.mockResolvedValue(emptyStats);

      const result = await controller.getStatistics(mockUser);

      expect(result).toEqual(emptyStats);
      expect(service.getStatistics).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming tasks with default days (7)', async () => {
      const upcomingTasks = [mockTask];

      mockTaskService.getUpcomingTasks.mockResolvedValue(upcomingTasks);

      const result = await controller.getUpcoming(mockUser);

      expect(result).toEqual(upcomingTasks);
      expect(service.getUpcomingTasks).toHaveBeenCalledWith(
        mockUser.id,
        undefined,
      );
    });

    it('should return upcoming tasks with custom days', async () => {
      const upcomingTasks = [mockTask];

      mockTaskService.getUpcomingTasks.mockResolvedValue(upcomingTasks);

      const result = await controller.getUpcoming(mockUser, 14);

      expect(result).toEqual(upcomingTasks);
      expect(service.getUpcomingTasks).toHaveBeenCalledWith(mockUser.id, 14);
    });

    it('should return empty array when no upcoming tasks', async () => {
      mockTaskService.getUpcomingTasks.mockResolvedValue([]);

      const result = await controller.getUpcoming(mockUser);

      expect(result).toEqual([]);
      expect(service.getUpcomingTasks).toHaveBeenCalledWith(
        mockUser.id,
        undefined,
      );
    });
  });

  describe('getOverdue', () => {
    it('should return overdue tasks', async () => {
      const overdueTasks = [
        { ...mockTask, dueDate: new Date('2026-01-01T00:00:00.000Z') },
      ];

      mockTaskService.getOverdueTasks.mockResolvedValue(overdueTasks);

      const result = await controller.getOverdue(mockUser);

      expect(result).toEqual(overdueTasks);
      expect(service.getOverdueTasks).toHaveBeenCalledWith(mockUser.id);
      expect(service.getOverdueTasks).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no overdue tasks', async () => {
      mockTaskService.getOverdueTasks.mockResolvedValue([]);

      const result = await controller.getOverdue(mockUser);

      expect(result).toEqual([]);
      expect(service.getOverdueTasks).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should return a single task by id', async () => {
      const taskId = 'task-123';

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(mockUser, taskId);

      expect(result).toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith(taskId, mockUser.id);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should pass user id for ownership verification', async () => {
      const taskId = 'task-456';

      mockTaskService.findOne.mockResolvedValue(mockTask);

      await controller.findOne(mockUser, taskId);

      expect(service.findOne).toHaveBeenCalledWith(taskId, mockUser.id);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
      };

      const updatedTask = { ...mockTask, ...updateTaskDto };
      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(mockUser, taskId, updateTaskDto);

      expect(result).toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith(
        taskId,
        mockUser.id,
        updateTaskDto,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should update only specified fields', async () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        isDone: true,
      };

      const updatedTask = { ...mockTask, isDone: true };
      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(mockUser, taskId, updateTaskDto);

      expect(result).toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith(
        taskId,
        mockUser.id,
        updateTaskDto,
      );
    });

    it('should update task with new due date', async () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        dueDate: '2026-03-01',
      };

      const updatedTask = {
        ...mockTask,
        dueDate: new Date('2026-03-01T00:00:00.000Z'),
      };
      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(mockUser, taskId, updateTaskDto);

      expect(result).toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith(
        taskId,
        mockUser.id,
        updateTaskDto,
      );
    });
  });

  describe('toggleComplete', () => {
    it('should toggle task completion status from false to true', async () => {
      const taskId = 'task-123';
      const toggledTask = { ...mockTask, isDone: true };

      mockTaskService.toggleComplete.mockResolvedValue(toggledTask);

      const result = await controller.toggleComplete(mockUser, taskId);

      expect(result).toEqual(toggledTask);
      expect(service.toggleComplete).toHaveBeenCalledWith(taskId, mockUser.id);
      expect(service.toggleComplete).toHaveBeenCalledTimes(1);
    });

    it('should toggle task completion status from true to false', async () => {
      const taskId = 'task-123';
      const toggledTask = { ...mockTask, isDone: false };

      mockTaskService.toggleComplete.mockResolvedValue(toggledTask);

      const result = await controller.toggleComplete(mockUser, taskId);

      expect(result).toEqual(toggledTask);
      expect(service.toggleComplete).toHaveBeenCalledWith(taskId, mockUser.id);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const taskId = 'task-123';
      const deletedTask = { ...mockTask };

      mockTaskService.remove.mockResolvedValue(deletedTask);

      const result = await controller.remove(mockUser, taskId);

      expect(result).toEqual(deletedTask);
      expect(service.remove).toHaveBeenCalledWith(taskId, mockUser.id);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should pass correct user id for ownership verification', async () => {
      const taskId = 'task-456';

      mockTaskService.remove.mockResolvedValue(mockTask);

      await controller.remove(mockUser, taskId);

      expect(service.remove).toHaveBeenCalledWith(taskId, mockUser.id);
    });
  });
});
